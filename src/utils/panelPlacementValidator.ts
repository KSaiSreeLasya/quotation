/**
 * Validates solar panel placement and provides placement recommendations
 */

import { Panel, Point } from '../types';
import { getDirectionEfficiency } from './solarCalculations';
import { analyzeBuilding, azimuthToCardinal } from './directionAnalyzer';

export interface PanelPlacementResult {
  panelId: string;
  isOptimal: boolean;
  efficiency: number;
  direction: string;
  azimuth: number;
  warning: string | null;
  suggestion: string | null;
  severityLevel: 'good' | 'fair' | 'poor'; // good: >85%, fair: 60-85%, poor: <60%
}

export interface PlacementSuggestion {
  totalPanels: number;
  optimalPanels: number;
  suboptimalPanels: number;
  optimizedEfficiencyGain: number; // percentage
  recommendation: string;
  bestAreas: string[];
  areasToAvoid: string[];
}

/**
 * Analyze individual panel placement
 */
export function validatePanelPlacement(
  panel: Panel,
  latitude: number,
  optimalAzimuth: number
): PanelPlacementResult {
  const efficiency = getDirectionEfficiency(panel.rotation, latitude);
  const direction = azimuthToCardinal(panel.rotation);
  
  // Determine severity
  let severityLevel: 'good' | 'fair' | 'poor' = 'fair';
  if (efficiency >= 0.85) severityLevel = 'good';
  else if (efficiency < 0.6) severityLevel = 'poor';

  // Generate warning/suggestion
  let warning: string | null = null;
  let suggestion: string | null = null;
  const angleDiff = Math.abs(panel.rotation - optimalAzimuth);
  const normalizedDiff = angleDiff > 180 ? 360 - angleDiff : angleDiff;

  if (severityLevel === 'poor') {
    warning = `⚠ Panel direction is suboptimal (${direction}, ${Math.round(panel.rotation)}°)`;
    suggestion = `Move to ${azimuthToCardinal(optimalAzimuth)}-facing area for +${Math.round((1 - efficiency) * 100)}% more output`;
  } else if (severityLevel === 'fair') {
    warning = `~ Panel could be optimized (${direction}, ${Math.round(panel.rotation)}°)`;
    suggestion = `Reposition to better direction for improved generation`;
  }

  return {
    panelId: panel.id,
    isOptimal: severityLevel === 'good',
    efficiency: Math.round(efficiency * 100) / 100,
    direction,
    azimuth: panel.rotation,
    warning,
    suggestion,
    severityLevel,
  };
}

/**
 * Analyze all panels and provide overall placement suggestions
 */
export function analyzePlacementStrategy(
  panels: Panel[],
  latitude: number,
  boundaryPoints: Point[],
  pixelsPerMeter: number
): PlacementSuggestion {
  if (panels.length === 0) {
    return {
      totalPanels: 0,
      optimalPanels: 0,
      suboptimalPanels: 0,
      optimizedEfficiencyGain: 0,
      recommendation: 'Start placing panels on the optimal direction',
      bestAreas: [],
      areasToAvoid: [],
    };
  }

  // Analyze building to understand layout
  const buildingAnalysis = analyzeBuilding(boundaryPoints, pixelsPerMeter);
  const optimalAzimuth = latitude >= 0 ? 180 : 0;

  // Validate each panel
  const validations = panels.map(p => validatePanelPlacement(p, latitude, optimalAzimuth));

  const optimalPanels = validations.filter(v => v.severityLevel === 'good').length;
  const suboptimalPanels = validations.filter(v => v.severityLevel !== 'good').length;
  
  // Calculate potential efficiency gain if all moved to optimal
  const currentAvgEfficiency = 
    validations.reduce((sum, v) => sum + v.efficiency, 0) / panels.length;
  const optimalAvgEfficiency = 1.0;
  const optimizedEfficiencyGain = Math.round((optimalAvgEfficiency - currentAvgEfficiency) * 100);

  // Build recommendations
  const bestAreas: string[] = [];
  const areasToAvoid: string[] = [];

  if (buildingAnalysis.confidence > 0) {
    bestAreas.push(
      `${azimuthToCardinal(optimalAzimuth)}-facing area (${buildingAnalysis.roofArea}m²)`
    );
    
    if (buildingAnalysis.secondaryDirection) {
      const secondaryName = azimuthToCardinal(buildingAnalysis.secondaryDirection);
      areasToAvoid.push(`${azimuthToCardinal(latitude >= 0 ? 0 : 180)}-facing (${secondaryName})`);
    }
  }

  let recommendation = '';
  const percentageOptimal = Math.round((optimalPanels / panels.length) * 100);

  if (percentageOptimal === 100) {
    recommendation = `✓ Perfect! All ${panels.length} panels are in optimal ${azimuthToCardinal(optimalAzimuth)}-facing positions`;
  } else if (percentageOptimal >= 80) {
    recommendation = `Good placement: ${optimalPanels}/${panels.length} panels well-positioned. Move ${suboptimalPanels} panel(s) to ${azimuthToCardinal(optimalAzimuth)}-facing area for maximum efficiency`;
  } else if (percentageOptimal >= 50) {
    recommendation = `Fair placement: ${optimalPanels}/${panels.length} panels optimally placed. Relocate ${suboptimalPanels} panels to improve overall system generation by ~${optimizedEfficiencyGain}%`;
  } else {
    recommendation = `⚠ Suboptimal layout: Most panels should be repositioned to ${azimuthToCardinal(optimalAzimuth)}-facing direction. Moving them could increase output by ${optimizedEfficiencyGain}%`;
  }

  return {
    totalPanels: panels.length,
    optimalPanels,
    suboptimalPanels,
    optimizedEfficiencyGain,
    recommendation,
    bestAreas,
    areasToAvoid,
  };
}

/**
 * Get panel position quality color and icon
 */
export function getPanelQualityIndicator(severityLevel: 'good' | 'fair' | 'poor'): {
  bgColor: string;
  borderColor: string;
  textColor: string;
  icon: string;
} {
  switch (severityLevel) {
    case 'good':
      return {
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-300',
        textColor: 'text-emerald-700',
        icon: '✓',
      };
    case 'fair':
      return {
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-300',
        textColor: 'text-amber-700',
        icon: '~',
      };
    case 'poor':
      return {
        bgColor: 'bg-rose-50',
        borderColor: 'border-rose-300',
        textColor: 'text-rose-700',
        icon: '⚠',
      };
  }
}
