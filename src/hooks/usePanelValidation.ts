import { useMemo } from 'react';
import { Panel, Point } from '../types';
import { validatePanelPlacement, PanelPlacementResult } from '../utils/panelPlacementValidator';

/**
 * Hook that computes real-time validation for all panels
 * Returns a map of panel IDs to their validation results for quick lookup
 */
export function usePanelValidation(
  panels: Panel[],
  latitude: number,
  boundaryPoints: Point[],
  pixelsPerMeter: number
): Map<string, PanelPlacementResult> {
  const optimalAzimuth = latitude >= 0 ? 180 : 0;

  return useMemo(() => {
    const validationMap = new Map<string, PanelPlacementResult>();
    
    panels.forEach(panel => {
      const validation = validatePanelPlacement(panel, latitude, optimalAzimuth);
      validationMap.set(panel.id, validation);
    });
    
    return validationMap;
  }, [panels, latitude, optimalAzimuth]);
}
