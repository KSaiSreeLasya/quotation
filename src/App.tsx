import React, { useState, useCallback, useRef, useEffect } from 'react';
import MapContainer from './components/MapContainer';
import SolarCanvas, { SolarCanvasHandle } from './components/SolarCanvas';
import ControlPanel from './components/ControlPanel';
import QuotationPreview from './components/QuotationPreview';
import { Location, Panel, QuotationData, Point } from './types';
import { DEFAULT_LOCATION } from './constants';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

export default function App() {
  const [location, setLocation] = useState<Location>(DEFAULT_LOCATION);
  const [panels, setPanels] = useState<Panel[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quotation, setQuotation] = useState<QuotationData | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [boundary, setBoundary] = useState<Point[]>([]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<SolarCanvasHandle>(null);

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
    const newPanel: Panel = {
      id,
      x: dimensions.width / 2,
      y: dimensions.height / 2,
      rotation: 0,
      isLandscape: false,
      isValid: true,
    };
    setPanels((prev) => [...prev, newPanel]);
    setSelectedId(id);
  }, [dimensions]);

  const removeSelected = useCallback(() => {
    if (selectedId) {
      setPanels((prev) => prev.filter((p) => p.id !== selectedId));
      setSelectedId(null);
    }
  }, [selectedId]);

  const handleGenerateQuotation = (data: QuotationData) => {
    const designImage = canvasRef.current?.toDataURL();
    setQuotation({ ...data, designImage });
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#fbbf24', '#10b981']
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
        hasSelected={!!selectedId}
        isDrawingMode={isDrawingMode}
        setIsDrawingMode={setIsDrawingMode}
        onClearBoundary={() => setBoundary([])}
      />

      <main className="flex-1 relative" ref={containerRef}>
        <MapContainer
          lat={location.lat}
          lng={location.lng}
          onMapLoad={() => {}}
        />
        
        {dimensions.width > 0 && (
          <SolarCanvas
            ref={canvasRef}
            panels={panels}
            setPanels={setPanels}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            width={dimensions.width}
            height={dimensions.height}
            boundary={boundary}
            setBoundary={setBoundary}
            isDrawingMode={isDrawingMode}
          />
        )}

        {/* Overlay Instructions */}
        <div className="absolute bottom-6 right-6 z-30 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-2xl flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {isDrawingMode ? 'Drawing Roof Boundary' : 'Panel Design Mode'}
              </p>
            </div>
            <ul className="text-[11px] text-slate-600 space-y-1">
              {isDrawingMode ? (
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
