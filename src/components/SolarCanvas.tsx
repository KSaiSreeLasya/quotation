import React, { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Stage, Layer, Rect, Group, Transformer, Line, Circle } from 'react-konva';
import { PANEL_WIDTH, PANEL_HEIGHT } from '../constants';
import { Panel, Point } from '../types';
import { isPointInPolygon, getPanelCorners, doPolygonsIntersect } from '../utils/geometry';

export interface SolarCanvasHandle {
  toDataURL: () => string;
}

interface SolarCanvasProps {
  panels: Panel[];
  setPanels: React.Dispatch<React.SetStateAction<Panel[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  width: number;
  height: number;
  boundary: Point[];
  setBoundary: React.Dispatch<React.SetStateAction<Point[]>>;
  isDrawingMode: boolean;
}

const SolarCanvas = forwardRef<SolarCanvasHandle, SolarCanvasProps>(({
  panels,
  setPanels,
  selectedId,
  setSelectedId,
  width,
  height,
  boundary,
  setBoundary,
  isDrawingMode,
}, ref) => {
  const stageRef = React.useRef<any>(null);
  const trRef = React.useRef<any>(null);

  useImperativeHandle(ref, () => ({
    toDataURL: () => {
      if (stageRef.current) {
        // Temporarily hide transformer for clean capture
        const oldSelected = selectedId;
        setSelectedId(null);
        const dataUrl = stageRef.current.toDataURL();
        setSelectedId(oldSelected);
        return dataUrl;
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
  }, [boundary, setPanels]);

  useEffect(() => {
    validatePanels();
  }, [panels.length, boundary, validatePanels]);

  const handleStageMouseDown = (e: any) => {
    if (isDrawingMode) {
      const pos = e.target.getStage().getPointerPosition();
      setBoundary(prev => [...prev, pos]);
      return;
    }

    if (e.target === e.target.getStage()) {
      setSelectedId(null);
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
    setSelectedId(id);
  };

  const toggleOrientation = (panel: Panel) => {
    updatePanel(panel.id, { isLandscape: !panel.isLandscape });
  };

  React.useEffect(() => {
    if (selectedId && trRef.current) {
      const stage = trRef.current.getStage();
      const selectedNode = stage.findOne('#' + selectedId);
      if (selectedNode) {
        trRef.current.nodes([selectedNode]);
        trRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedId]);

  return (
    <div className="absolute inset-0 pointer-events-auto z-20">
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        onMouseDown={handleStageMouseDown}
        onTouchStart={handleStageMouseDown}
      >
        <Layer>
          {/* Boundary Line */}
          {boundary.length > 0 && (
            <Line
              points={boundary.flatMap(p => [p.x, p.y])}
              stroke="#fbbf24"
              strokeWidth={3}
              closed={!isDrawingMode}
              fill="rgba(251, 191, 36, 0.1)"
              dash={isDrawingMode ? [10, 5] : []}
            />
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
                onDragEnd={(e) => {
                  updatePanel(panel.id, {
                    x: e.target.x(),
                    y: e.target.y(),
                  });
                  validatePanels();
                }}
                onClick={() => setSelectedId(panel.id)}
                onTap={() => setSelectedId(panel.id)}
                onTransformEnd={(e) => {
                  const node = e.target;
                  updatePanel(panel.id, {
                    x: node.x(),
                    y: node.y(),
                    rotation: node.rotation(),
                  });
                  validatePanels();
                }}
              >
                <Rect
                  width={pWidth}
                  height={pHeight}
                  fill={panel.isValid ? "#1e293b" : "rgba(225, 29, 72, 0.8)"}
                  stroke={panel.isValid ? (selectedId === panel.id ? "#38bdf8" : "#334155") : "#e11d48"}
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

                {selectedId === panel.id && (
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
          {selectedId && !isDrawingMode && (
            <Transformer
              ref={trRef}
              rotateEnabled={true}
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
