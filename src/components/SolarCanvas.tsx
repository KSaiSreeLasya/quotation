import React, { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Stage, Layer, Rect, Group, Transformer, Line, Circle, Image as KonvaImage } from 'react-konva';
import { PANEL_WIDTH_METERS, PANEL_HEIGHT_METERS } from '../constants';
import { Panel, Point } from '../types';
import { isPointInPolygon, getPanelCorners, doPolygonsIntersect } from '../utils/geometry';
import useImage from 'use-image';

export interface SolarCanvasHandle {
  toDataURL: () => string;
}

interface SolarCanvasProps {
  panels: Panel[];
  setPanels: React.Dispatch<React.SetStateAction<Panel[]>>;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  width: number;
  height: number;
  boundary: Point[];
  setBoundary: React.Dispatch<React.SetStateAction<Point[]>>;
  setBoundaryLatLng: React.Dispatch<React.SetStateAction<google.maps.LatLng[]>>;
  isDrawingMode: boolean;
  isPanningMode: boolean;
  screenToLatLng: (x: number, y: number) => google.maps.LatLng | null;
  pixelsPerMeter: number;
  backgroundImageUrl?: string | null;
}

const SolarCanvas = forwardRef<SolarCanvasHandle, SolarCanvasProps>(({
  panels,
  setPanels,
  selectedIds,
  setSelectedIds,
  width,
  height,
  boundary,
  setBoundary,
  setBoundaryLatLng,
  isDrawingMode,
  isPanningMode,
  screenToLatLng,
  pixelsPerMeter,
  backgroundImageUrl,
}, ref) => {
  const stageRef = React.useRef<any>(null);
  const trRef = React.useRef<any>(null);
  const [bgImage] = useImage(backgroundImageUrl || '', 'anonymous');

  useEffect(() => {
    if (bgImage && stageRef.current) {
      stageRef.current.getLayer().batchDraw();
    }
  }, [bgImage]);

  const PANEL_WIDTH = PANEL_WIDTH_METERS * pixelsPerMeter;
  const PANEL_HEIGHT = PANEL_HEIGHT_METERS * pixelsPerMeter;

  useImperativeHandle(ref, () => ({
    toDataURL: () => {
      if (stageRef.current) {
        try {
          // Temporarily hide transformer for clean capture
          const oldSelected = [...selectedIds];
          setSelectedIds([]);
          
          // Force a redraw to ensure everything is up to date
          stageRef.current.batchDraw();
          
          const dataUrl = stageRef.current.toDataURL({
            pixelRatio: 2,
            mimeType: 'image/png',
            quality: 1
          });
          
          setSelectedIds(oldSelected);
          return dataUrl;
        } catch (err) {
          console.error("Error in toDataURL:", err);
          return stageRef.current.toDataURL();
        }
      }
      return '';
    }
  }));

  const validatePanels = useCallback(() => {
    setPanels(prev => prev.map(panel => {
      const pWidth = panel.isLandscape ? PANEL_HEIGHT : PANEL_WIDTH;
      const pHeight = panel.isLandscape ? PANEL_WIDTH : PANEL_HEIGHT;
      const corners = getPanelCorners({ ...panel, width: pWidth, height: pHeight });
      
      // Check if all corners are inside boundary
      const isInside = corners.every(c => isPointInPolygon(c, boundary));
      
      // Check for collisions with other panels
      let hasCollision = false;
      for (const other of prev) {
        if (other.id === panel.id) continue;
        const oWidth = other.isLandscape ? PANEL_HEIGHT : PANEL_WIDTH;
        const oHeight = other.isLandscape ? PANEL_WIDTH : PANEL_HEIGHT;
        const otherCorners = getPanelCorners({ ...other, width: oWidth, height: oHeight });
        if (doPolygonsIntersect(corners, otherCorners)) {
          hasCollision = true;
          break;
        }
      }
      
      return { ...panel, isValid: isInside && !hasCollision };
    }));
  }, [boundary, setPanels, PANEL_WIDTH, PANEL_HEIGHT]);

  useEffect(() => {
    validatePanels();
  }, [panels.length, boundary, validatePanels]);

  const handleStageMouseDown = (e: any) => {
    if (isDrawingMode) {
      const pos = e.target.getStage().getPointerPosition();
      const latLng = screenToLatLng(pos.x, pos.y);
      if (latLng) {
        setBoundaryLatLng(prev => [...prev, latLng]);
        setBoundary(prev => [...prev, pos]);
      }
      return;
    }

    if (e.target === e.target.getStage()) {
      setSelectedIds([]);
      return;
    }
  };

  const updatePanel = (id: string, newAttrs: Partial<Panel>) => {
    setPanels((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...newAttrs } : p))
    );
  };

  const duplicatePanel = (panel: Panel) => {
    const id = `panel-${Date.now()}`;
    setPanels(prev => [...prev, { ...panel, id, x: panel.x + 20, y: panel.y + 20 }]);
    setSelectedIds([id]);
  };

  const toggleOrientation = (panel: Panel) => {
    updatePanel(panel.id, { isLandscape: !panel.isLandscape });
  };

  React.useEffect(() => {
    if (selectedIds.length > 0 && trRef.current) {
      const stage = trRef.current.getStage();
      const selectedNodes = selectedIds.map(id => stage.findOne('#' + id)).filter(Boolean);
      trRef.current.nodes(selectedNodes);
      trRef.current.getLayer().batchDraw();
    } else if (trRef.current) {
      trRef.current.nodes([]);
      trRef.current.getLayer().batchDraw();
    }
  }, [selectedIds]);

  const handlePanelClick = (e: any, id: string) => {
    const isShiftPressed = e.evt.shiftKey;
    if (isShiftPressed) {
      if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter(sid => sid !== id));
      } else {
        setSelectedIds([...selectedIds, id]);
      }
    } else {
      setSelectedIds([id]);
    }
  };

  return (
    <div className={`absolute inset-0 z-20 ${isPanningMode ? 'pointer-events-none' : 'pointer-events-auto'}`}>
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        onMouseDown={handleStageMouseDown}
        onTouchStart={handleStageMouseDown}
      >
        <Layer>
          {/* Background Image for Export */}
          {bgImage && (
            <KonvaImage
              image={bgImage}
              width={width}
              height={height}
              opacity={1}
              imageSmoothingEnabled={true}
            />
          )}
          
          {/* Boundary Line */}
          {boundary.length > 0 && (
            <Line
              points={boundary.flatMap(p => [p.x, p.y])}
              stroke={isDrawingMode ? "#fbbf24" : "#10b981"}
              strokeWidth={3}
              closed={!isDrawingMode}
              fill={backgroundImageUrl ? "transparent" : (isDrawingMode ? "rgba(251, 191, 36, 0.1)" : "rgba(16, 185, 129, 0.05)")}
              dash={isDrawingMode ? [10, 5] : []}
            />
          )}
          
          {/* North Indicator */}
          {!isDrawingMode && (
            <Group x={width - 60} y={60}>
              <Circle radius={25} fill="white" shadowBlur={5} opacity={0.8} />
              <Line
                points={[0, -15, 0, 15]}
                stroke="#ef4444"
                strokeWidth={3}
                lineCap="round"
              />
              <Line
                points={[-8, -5, 0, -15, 8, -5]}
                stroke="#ef4444"
                strokeWidth={3}
                lineCap="round"
              />
              <Rect x={-5} y={18} width={10} height={10} fill="transparent" />
              {/* Text "N" is hard to do in Konva without Text component, skipping for now or using lines */}
              <Line points={[-4, 25, -4, 15, 4, 25, 4, 15]} stroke="#475569" strokeWidth={2} />
            </Group>
          )}
          {isDrawingMode && boundary.map((p, i) => (
            <Circle key={i} x={p.x} y={p.y} radius={5} fill="#fbbf24" />
          ))}

          {panels.map((panel) => {
            const pWidth = panel.isLandscape ? PANEL_HEIGHT : PANEL_WIDTH;
            const pHeight = panel.isLandscape ? PANEL_WIDTH : PANEL_HEIGHT;

            return (
              <Group
                key={panel.id}
                id={panel.id}
                x={panel.x}
                y={panel.y}
                rotation={panel.rotation}
                draggable={!isDrawingMode}
                onDragStart={(e) => {
                  const id = panel.id;
                  const isSelected = selectedIds.includes(id);
                  if (!isSelected) {
                    setSelectedIds([id]);
                  }
                }}
                onDragMove={(e) => {
                  if (selectedIds.length <= 1) return;
                  
                  const id = panel.id;
                  const stage = e.target.getStage();
                  const dx = e.target.x() - panel.x;
                  const dy = e.target.y() - panel.y;

                  // Move all other selected panels by the same delta
                  setPanels(prev => prev.map(p => {
                    if (selectedIds.includes(p.id) && p.id !== id) {
                      return {
                        ...p,
                        x: p.x + dx,
                        y: p.y + dy
                      };
                    }
                    return p;
                  }));
                }}
                onDragEnd={(e) => {
                  const x = e.target.x();
                  const y = e.target.y();
                  const latLng = screenToLatLng(x, y);
                  updatePanel(panel.id, {
                    x,
                    y,
                    lat: latLng ? latLng.lat() : panel.lat,
                    lng: latLng ? latLng.lng() : panel.lng,
                  });
                  
                  // Update all other selected panels' lat/lng
                  if (selectedIds.length > 1) {
                    setPanels(prev => prev.map(p => {
                      if (selectedIds.includes(p.id)) {
                        const pLatLng = screenToLatLng(p.x, p.y);
                        return {
                          ...p,
                          lat: pLatLng ? pLatLng.lat() : p.lat,
                          lng: pLatLng ? pLatLng.lng() : p.lng,
                        };
                      }
                      return p;
                    }));
                  }
                  validatePanels();
                }}
                onClick={(e) => handlePanelClick(e, panel.id)}
                onTap={(e) => handlePanelClick(e, panel.id)}
                onTransformEnd={(e) => {
                  const node = e.target;
                  const x = node.x();
                  const y = node.y();
                  const latLng = screenToLatLng(x, y);
                  updatePanel(panel.id, {
                    x,
                    y,
                    rotation: node.rotation(),
                    lat: latLng ? latLng.lat() : panel.lat,
                    lng: latLng ? latLng.lng() : panel.lng,
                  });
                  validatePanels();
                }}
              >
                <Rect
                  width={pWidth}
                  height={pHeight}
                  fill={panel.isValid ? "#1e293b" : "rgba(225, 29, 72, 0.8)"}
                  stroke={panel.isValid ? (selectedIds.includes(panel.id) ? "#38bdf8" : "#334155") : "#e11d48"}
                  strokeWidth={2}
                  cornerRadius={2}
                  opacity={0.9}
                  shadowBlur={panel.isValid ? 5 : 10}
                  shadowColor={panel.isValid ? "black" : "#e11d48"}
                  offsetX={pWidth / 2}
                  offsetY={pHeight / 2}
                />
                
                {/* Panel Details */}
                <Line
                  points={[-pWidth/2 + 5, -pHeight/2 + 5, pWidth/2 - 5, -pHeight/2 + 5]}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth={1}
                />

                {selectedIds.length === 1 && selectedIds[0] === panel.id && (
                  <Group y={pHeight / 2 + 25}>
                    <Rect
                      x={-40}
                      width={80}
                      height={24}
                      fill="white"
                      cornerRadius={12}
                      shadowBlur={5}
                    />
                    <Group x={-25} y={12} onClick={() => duplicatePanel(panel)}>
                      <Circle radius={10} fill="#f1f5f9" />
                      <Rect x={-5} y={-1} width={10} height={2} fill="#64748b" />
                      <Rect x={-1} y={-5} width={2} height={10} fill="#64748b" />
                    </Group>
                    <Group x={25} y={12} onClick={() => toggleOrientation(panel)}>
                      <Circle radius={10} fill="#f1f5f9" />
                      <Rect x={-6} y={-3} width={12} height={6} fill="#64748b" strokeWidth={1} />
                    </Group>
                  </Group>
                )}
              </Group>
            );
          })}
          {selectedIds.length > 0 && !isDrawingMode && (
            <Transformer
              ref={trRef}
              rotateEnabled={selectedIds.length === 1}
              enabledAnchors={[]}
              boundBoxFunc={(oldBox, newBox) => newBox}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
});

export default SolarCanvas;
