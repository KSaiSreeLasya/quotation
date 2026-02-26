/**
 * Analyze building orientation and provide direction-specific recommendations
 */

import { Point } from '../types';

export interface BuildingAnalysis {
  mainFacingDirection: number; // 0-360° azimuth
  mainFacingName: string; // "South", "Southeast", etc.
  secondaryDirection?: number;
  roofPitch: number; // approximate angle in degrees
  roofLength: number; // longest dimension in meters
  roofWidth: number; // shortest dimension in meters
  roofArea: number; // total area in square meters
  aspectRatio: number; // length/width ratio
  confidence: number; // 0-1, how confident is the direction detection
}

export interface DirectionRecommendation {
  optimalDirection: string;
  optimalAzimuth: number;
  secondBestDirection: string;
  secondBestAzimuth: number;
  thirdBestDirection: string;
  thirdBestAzimuth: number;
  reason: string;
  expectedEfficiencyIncrease: number; // percentage above current
}

/**
 * Convert pixels to meters given the scale factor
 */
function pixelsToMeters(pixels: number, pixelsPerMeter: number): number {
  return pixels / pixelsPerMeter;
}

/**
 * Calculate distance between two points
 */
function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate angle between two points (0-360°)
 * 0° = East, 90° = South, 180° = West, 270° = North
 * Convert to compass bearing (0° = North)
 */
function calculateAzimuth(from: Point, to: Point): number {
  const angle = Math.atan2(to.y - from.y, to.x - from.x) * (180 / Math.PI);
  // Convert math angle to compass bearing
  // Math: 0° = East, increases counterclockwise
  // Compass: 0° = North, increases clockwise
  let bearing = 90 - angle;
  if (bearing < 0) bearing += 360;
  return bearing % 360;
}

/**
 * Find the two longest edges of the roof polygon (likely the main sides)
 */
function findLongestEdges(points: Point[]): { edge1: [Point, Point]; edge2: [Point, Point]; lengths: [number, number] } {
  const edges: { points: [Point, Point]; length: number; index: number }[] = [];
  
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    const len = distance(p1, p2);
    edges.push({ points: [p1, p2], length: len, index: i });
  }
  
  // Sort by length
  edges.sort((a, b) => b.length - a.length);
  
  return {
    edge1: edges[0].points,
    edge2: edges[1].points,
    lengths: [edges[0].length, edges[1].length] as [number, number],
  };
}

/**
 * Analyze roof shape and orientation from boundary polygon
 */
export function analyzeBuilding(
  boundaryPoints: Point[],
  pixelsPerMeter: number
): BuildingAnalysis {
  if (boundaryPoints.length < 3) {
    return {
      mainFacingDirection: 180, // Default South
      mainFacingName: 'Unknown - Draw boundary first',
      roofPitch: 0,
      roofLength: 0,
      roofWidth: 0,
      roofArea: 0,
      aspectRatio: 1,
      confidence: 0,
    };
  }

  // Find bounding box
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  boundaryPoints.forEach(p => {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  });

  const boxWidth = maxX - minX;
  const boxHeight = maxY - minY;

  // Find longest edges (likely the main roof sides)
  const { edge1, edge2, lengths } = findLongestEdges(boundaryPoints);
  
  const azimuth1 = calculateAzimuth(edge1[0], edge1[1]);
  const azimuth2 = calculateAzimuth(edge2[0], edge2[1]);

  // Choose the longest edge as primary direction
  const mainAzimuth = lengths[0] >= lengths[1] ? azimuth1 : azimuth2;
  const secondaryAzimuth = lengths[0] >= lengths[1] ? azimuth2 : azimuth1;

  // Calculate area (simple shoelace formula)
  let area = 0;
  for (let i = 0; i < boundaryPoints.length; i++) {
    const j = (i + 1) % boundaryPoints.length;
    area += boundaryPoints[i].x * boundaryPoints[j].y;
    area -= boundaryPoints[j].x * boundaryPoints[i].y;
  }
  area = Math.abs(area) / 2;

  // Convert to actual meters
  const roofLength = pixelsToMeters(lengths[0], pixelsPerMeter);
  const roofWidth = pixelsToMeters(lengths[1], pixelsPerMeter);
  const roofAreaM2 = pixelsToMeters(area, pixelsPerMeter * pixelsPerMeter);

  // Determine cardinal direction name
  const directionName = azimuthToCardinal(mainAzimuth);

  // Confidence increases with aspect ratio (more rectangular = more confident)
  // and with area (bigger = better measurement)
  const aspectRatio = Math.max(roofLength, roofWidth) / Math.min(roofLength, roofWidth);
  const confidence = Math.min(0.95, (aspectRatio / 3) * (Math.min(roofAreaM2, 300) / 300));

  return {
    mainFacingDirection: mainAzimuth,
    mainFacingName: directionName,
    secondaryDirection: secondaryAzimuth,
    roofPitch: estimateRoofPitch(lengths[0], roofLength), // Rough estimate
    roofLength: Math.round(roofLength * 100) / 100,
    roofWidth: Math.round(roofWidth * 100) / 100,
    roofArea: Math.round(roofAreaM2 * 100) / 100,
    aspectRatio: Math.round(aspectRatio * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
  };
}

/**
 * Convert azimuth (0-360°) to cardinal direction name
 */
export function azimuthToCardinal(azimuth: number): string {
  const normalized = ((azimuth % 360) + 360) % 360;
  
  const directions = [
    { min: 348.75, max: 360, name: 'North' },
    { min: 0, max: 11.25, name: 'North' },
    { min: 11.25, max: 33.75, name: 'North-Northeast' },
    { min: 33.75, max: 56.25, name: 'Northeast' },
    { min: 56.25, max: 78.75, name: 'East-Northeast' },
    { min: 78.75, max: 101.25, name: 'East' },
    { min: 101.25, max: 123.75, name: 'East-Southeast' },
    { min: 123.75, max: 146.25, name: 'Southeast' },
    { min: 146.25, max: 168.75, name: 'South-Southeast' },
    { min: 168.75, max: 191.25, name: 'South' },
    { min: 191.25, max: 213.75, name: 'South-Southwest' },
    { min: 213.75, max: 236.25, name: 'Southwest' },
    { min: 236.25, max: 258.75, name: 'West-Southwest' },
    { min: 258.75, max: 281.25, name: 'West' },
    { min: 281.25, max: 303.75, name: 'West-Northwest' },
    { min: 303.75, max: 326.25, name: 'Northwest' },
    { min: 326.25, max: 348.75, name: 'North-Northwest' },
  ];

  const direction = directions.find(d => {
    if (d.max >= d.min) {
      return normalized >= d.min && normalized < d.max;
    } else {
      return normalized >= d.min || normalized < d.max;
    }
  });

  return direction?.name || 'North';
}

/**
 * Rough roof pitch estimation (would need actual building data for accuracy)
 */
function estimateRoofPitch(edgeLength: number, actualLength: number): number {
  // Standard residential roofs are 4:12 to 12:12 pitch (18° to 45°)
  // Without 3D data, assume middle value
  return 30; // Default 30° pitch
}

/**
 * Get recommendations based on current building and location
 */
export function getDirectionRecommendations(
  building: BuildingAnalysis,
  latitude: number,
  currentAzimuth: number
): DirectionRecommendation {
  // For Northern Hemisphere, South is optimal (180°)
  // For Southern Hemisphere, North is optimal (0°)
  const optimalAzimuth = latitude >= 0 ? 180 : 0;
  
  // Get second best: East or West (90° or 270°)
  const secondBest = latitude >= 0 ? 90 : 270; // East for Northern
  const thirdBest = latitude >= 0 ? 270 : 90; // West for Northern

  // Calculate efficiency increase if moved to optimal
  const currentDiff = Math.abs(currentAzimuth - optimalAzimuth);
  const optimalDiff = 0;
  
  // Rough estimate: lose ~5% efficiency per 10° from optimal
  const currentEfficiency = Math.max(0.2, 1 - (Math.min(currentDiff, 180) / 180) * 0.8);
  const optimalEfficiency = 1.0;
  const expectedIncrease = Math.round((optimalEfficiency - currentEfficiency) * 100);

  return {
    optimalDirection: latitude >= 0 ? 'South' : 'North',
    optimalAzimuth: optimalAzimuth,
    secondBestDirection: latitude >= 0 ? 'East' : 'West',
    secondBestAzimuth: secondBest,
    thirdBestDirection: latitude >= 0 ? 'West' : 'East',
    thirdBestAzimuth: thirdBest,
    reason: `For latitude ${Math.abs(latitude).toFixed(1)}°, a ${latitude >= 0 ? 'South' : 'North'}-facing installation gets maximum sun exposure year-round. Your current ${azimuthToCardinal(currentAzimuth)}-facing roof (${Math.round(currentAzimuth)}°) can still generate power effectively.`,
    expectedEfficiencyIncrease: Math.max(0, expectedIncrease),
  };
}

/**
 * Suggest best area on roof for panels given current layout
 */
export function suggestBestPanelArea(
  building: BuildingAnalysis,
  latitude: number
): { area: string; reason: string; estimatedPanels: number } {
  const recommendation = getDirectionRecommendations(building, latitude, building.mainFacingDirection);
  
  if (recommendation.expectedEfficiencyIncrease > 20) {
    return {
      area: recommendation.secondBestDirection + '-facing area',
      reason: `While not optimal, ${recommendation.secondBestDirection}-facing surfaces provide good afternoon/morning generation. Estimate: ${building.roofArea}m² available`,
      estimatedPanels: Math.floor(building.roofArea / 3), // ~3m² per panel
    };
  } else {
    return {
      area: building.mainFacingName + '-facing area (BEST)',
      reason: `This ${building.mainFacingName}-facing roof is well-suited for solar. Full roof area recommended.`,
      estimatedPanels: Math.floor(building.roofArea / 3),
    };
  }
}
