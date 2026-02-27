import React, { useState, useCallback, useRef, useEffect } from 'react';
import MapContainer from './components/MapContainer';
import SolarCanvas, { SolarCanvasHandle } from './components/SolarCanvas';
import ControlPanel from './components/ControlPanel';
import QuotationPreview from './components/QuotationPreview';
import { Location, Panel, QuotationData, Point } from './types';
import { DEFAULT_LOCATION, PANEL_WIDTH_METERS, PANEL_HEIGHT_METERS, PANEL_SPACING_METERS, ROW_SPACING_METERS } from './constants';
import { motion, AnimatePresence } from 'motion/react';
import { autoFillPanels } from './utils/geometry';
import confetti from 'canvas-confetti';

export default function App() {
  const [location, setLocation] = useState<Location>(DEFAULT_LOCATION);
  const [panels, setPanels] = useState<Panel[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [quotation, setQuotation] = useState<QuotationData | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [boundary, setBoundary] = useState<Point[]>([]);
  const [boundaryLatLng, setBoundaryLatLng] = useState<google.maps.LatLng[]>([]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isPanningMode, setIsPanningMode] = useState(false);
  const [pixelsPerMeter, setPixelsPerMeter] = useState(1);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<SolarCanvasHandle>(null);

  const screenToLatLng = useCallback((x: number, y: number) => {
    if (!mapInstance.current) return null;
    const projection = mapInstance.current.getProjection();
    if (!projection) return null;
    
    const bounds = mapInstance.current.getBounds();
    if (!bounds) return null;

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const topRight = projection.fromLatLngToPoint(ne)!;
    const bottomLeft = projection.fromLatLngToPoint(sw)!;
    const scale = Math.pow(2, mapInstance.current.getZoom()!);

    const worldPoint = new google.maps.Point(
      x / scale + bottomLeft.x,
      y / scale + topRight.y
    );
    return projection.fromPointToLatLng(worldPoint);
  }, []);

  const latLngToScreen = useCallback((lat: number, lng: number) => {
    if (!mapInstance.current) return { x: 0, y: 0 };
    const projection = mapInstance.current.getProjection();
    if (!projection) return { x: 0, y: 0 };

    const bounds = mapInstance.current.getBounds();
    if (!bounds) return { x: 0, y: 0 };

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const topRight = projection.fromLatLngToPoint(ne)!;
    const bottomLeft = projection.fromLatLngToPoint(sw)!;
    const scale = Math.pow(2, mapInstance.current.getZoom()!);

    const worldPoint = projection.fromLatLngToPoint(new google.maps.LatLng(lat, lng))!;
    return {
      x: (worldPoint.x - bottomLeft.x) * scale,
      y: (worldPoint.y - topRight.y) * scale
    };
  }, []);

  // Update canvas dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const addPanel = useCallback(() => {
    const id = `panel-${Date.now()}`;
    const x = dimensions.width / 2;
    const y = dimensions.height / 2;
    
    // Default lat/lng if map not loaded
    let lat = location.lat;
    let lng = location.lng;

    if (mapInstance.current) {
      const center = mapInstance.current.getCenter();
      if (center) {
        lat = center.lat();
        lng = center.lng();
      }
    }

    const newPanel: Panel = {
      id,
      x,
      y,
      rotation: 0,
      isLandscape: false,
      isValid: true,
      lat,
      lng,
    };
    setPanels((prev) => [...prev, newPanel]);
    setSelectedIds([id]);
  }, [dimensions, location]);

  const removeSelected = useCallback(() => {
    if (selectedIds.length > 0) {
      setPanels((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
      setSelectedIds([]);
    }
  }, [selectedIds]);

  const handleAutoFill = useCallback((orientation: number, targetKw?: number) => {
    if (boundary.length < 3) {
      alert("Please draw a roof boundary first!");
      return;
    }

    const pWidth = PANEL_WIDTH_METERS * pixelsPerMeter;
    const pHeight = PANEL_HEIGHT_METERS * pixelsPerMeter;
    const spacing = PANEL_SPACING_METERS * pixelsPerMeter;
    const rowSpacing = ROW_SPACING_METERS * pixelsPerMeter;

    let positions = autoFillPanels(
      boundary,
      pWidth,
      pHeight,
      spacing,
      rowSpacing,
      orientation,
      false // default to portrait for auto-fill
    );

    if (positions.length === 0) {
      alert("No panels could fit in the current boundary.");
      return;
    }

    // Limit based on targetKw if provided
    if (targetKw && targetKw > 0) {
      const maxPanels = Math.ceil(targetKw / 0.55); // 550W = 0.55kW
      positions = positions.slice(0, maxPanels);
    }

    const newPanels: Panel[] = positions.map((pos, index) => {
      const latLng = screenToLatLng(pos.x, pos.y);
      return {
        id: `panel-auto-${Date.now()}-${index}`,
        x: pos.x,
        y: pos.y,
        rotation: orientation,
        isLandscape: false,
        isValid: true,
        lat: latLng ? latLng.lat() : location.lat,
        lng: latLng ? latLng.lng() : location.lng,
      };
    });

    setPanels(prev => [...prev, ...newPanels]);
  }, [boundary, pixelsPerMeter, screenToLatLng, location]);

  const handleGenerateQuotation = async (data: QuotationData) => {
    setIsGenerating(true);
    
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (mapInstance.current && apiKey) {
        const center = mapInstance.current.getCenter();
        const zoom = mapInstance.current.getZoom();
        
        if (center && zoom) {
          // Calculate aspect ratio for static map to match canvas
          const aspectRatio = dimensions.height / dimensions.width;
          const staticWidth = 640;
          const staticHeight = Math.round(640 * aspectRatio);
          
          // Construct Static Map URL
          const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${center.lat()},${center.lng()}&zoom=${zoom}&size=${staticWidth}x${Math.min(640, staticHeight)}&scale=2&maptype=satellite&key=${apiKey}`;
          
          setBackgroundImageUrl(staticMapUrl);
          console.log("Static map URL set:", staticMapUrl);
          
          // Wait for image to load and Konva to re-render
          // Increased to 5s to be safe for satellite images
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          console.log("Capturing design image...");
          const designImage = canvasRef.current?.toDataURL();
          console.log("Design image captured length:", designImage?.length);
          
          setQuotation({ 
            ...data, 
            designImage,
            customerName: data.customerName,
            customerContact: data.customerContact
          });
          
          // Clear background after capture to avoid showing it in live view
          setBackgroundImageUrl(null);
          
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#f59e0b', '#fbbf24', '#10b981']
          });
        }
      }
    } catch (error) {
      console.error("Error generating quotation:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMapLoad = (map: google.maps.Map) => {
    mapInstance.current = map;
    
    const updatePositions = () => {
      const zoom = map.getZoom() || 20;
      const center = map.getCenter();
      if (center) {
        const lat = center.lat();
        // Calculate pixels per meter at this latitude and zoom
        const ppm = Math.pow(2, zoom) / (156543.03392 * Math.cos(lat * Math.PI / 180));
        setPixelsPerMeter(ppm);
      }

      setPanels(prev => prev.map(panel => {
        const screenPos = latLngToScreen(panel.lat, panel.lng);
        return { ...panel, x: screenPos.x, y: screenPos.y };
      }));
      
      setBoundaryLatLng(prev => {
        setBoundary(prev.map(ll => latLngToScreen(ll.lat(), ll.lng())));
        return prev;
      });
    };

    map.addListener('center_changed', updatePositions);
    map.addListener('zoom_changed', updatePositions);
    map.addListener('heading_changed', updatePositions);
    map.addListener('tilt_changed', updatePositions);

    map.addListener('idle', () => {
      const center = map.getCenter();
      if (center) {
        const newLat = center.lat();
        const newLng = center.lng();
        
        setLocation(prev => {
          // Only update if significantly different to avoid loops
          if (Math.abs(newLat - prev.lat) > 0.000001 || Math.abs(newLng - prev.lng) > 0.000001) {
            return {
              ...prev,
              lat: newLat,
              lng: newLng,
              address: prev.address.startsWith('Coordinates:') 
                ? `Coordinates: ${newLat.toFixed(6)}, ${newLng.toFixed(6)}`
                : prev.address
            };
          }
          return prev;
        });
      }
    });
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans overflow-hidden">
      <ControlPanel
        location={location}
        setLocation={setLocation}
        panelCount={panels.length}
        onAddPanel={addPanel}
        onRemoveSelected={removeSelected}
        onGenerateQuotation={handleGenerateQuotation}
        hasSelected={selectedIds.length > 0}
        isDrawingMode={isDrawingMode}
        setIsDrawingMode={setIsDrawingMode}
        isPanningMode={isPanningMode}
        setIsPanningMode={setIsPanningMode}
        onClearBoundary={() => {
          setBoundary([]);
          setBoundaryLatLng([]);
        }}
        onAutoFill={handleAutoFill}
        isGenerating={isGenerating}
        boundary={boundary}
        pixelsPerMeter={pixelsPerMeter}
        panels={panels}
        selectedIds={selectedIds}
        onPanelSelect={(panelId) => setSelectedIds([panelId])}
      />

      <main className="flex-1 relative" ref={containerRef}>
        <MapContainer
          lat={location.lat}
          lng={location.lng}
          onMapLoad={handleMapLoad}
        />
        
        {dimensions.width > 0 && (
          <SolarCanvas
            ref={canvasRef}
            panels={panels}
            setPanels={setPanels}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            width={dimensions.width}
            height={dimensions.height}
            boundary={boundary}
            setBoundary={setBoundary}
            setBoundaryLatLng={setBoundaryLatLng}
            isDrawingMode={isDrawingMode}
            isPanningMode={isPanningMode}
            screenToLatLng={screenToLatLng}
            pixelsPerMeter={pixelsPerMeter}
            backgroundImageUrl={backgroundImageUrl}
            latitude={location.lat}
          />
        )}

        {/* Overlay Instructions */}
        <div className="absolute bottom-6 right-6 z-30 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-2xl flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {isPanningMode ? 'Map Panning Mode' : isDrawingMode ? 'Drawing Roof Boundary' : 'Panel Design Mode'}
              </p>
            </div>
            <ul className="text-[11px] text-slate-600 space-y-1">
              {isPanningMode ? (
                <>
                  <li>• Drag map to move view</li>
                  <li>• Use mouse wheel to zoom in/out</li>
                  <li>• Switch back to Design mode to place panels</li>
                </>
              ) : isDrawingMode ? (
                <>
                  <li>• Click on map to add roof corners</li>
                  <li>• Click "Finish" to close the polygon</li>
                </>
              ) : (
                <>
                  <li>• Drag panels to position on roof</li>
                  <li>• Panels turn <span className="text-rose-500 font-bold">RED</span> if outside boundary or overlapping</li>
                  <li>• Use rotation handle to align with roof pitch</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {quotation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <QuotationPreview
              data={quotation}
              address={location.address}
              onClose={() => setQuotation(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
