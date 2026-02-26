/**
 * Solar energy calculations for optimal panel placement
 * Based on latitude, orientation, and environmental factors
 */

export interface SolarOptimization {
  optimalTiltAngle: number;
  summerTiltAngle: number;
  winterTiltAngle: number;
  optimalAzimuth: number;
  seasonalVariation: number;
  solarNoon: string;
  sunriseTime: string;
  sunsetTime: string;
}

export interface DirectionEfficiency {
  direction: string;
  azimuth: number;
  efficiencyFactor: number; // 0-1
  annualGeneration: number; // kWh
  seasonalScore: number; // 0-1, varies by season
}

export interface AreaAnalysis {
  totalRoofArea: number; // m²
  usableArea: number; // m² after shading/clearance
  estimatedPanels: number;
  coveragePercentage: number;
  shadingFactor: number; // 0-1
}

/**
 * Calculate optimal tilt angle based on latitude
 * Year-round optimal: tilt angle ≈ latitude
 * For southern hemisphere, use negative values
 */
export function calculateOptimalTiltAngle(latitude: number): SolarOptimization {
  // Year-round optimal tilt (minimizes annual losses)
  const optimalTilt = Math.abs(latitude);
  
  // Seasonal adjustments for maximum generation
  // Summer: reduce tilt angle by ~15° for higher sun angles
  // Winter: increase tilt angle by ~15° to catch lower sun
  const summerTilt = Math.max(0, optimalTilt - 15);
  const winterTilt = Math.min(90, optimalTilt + 15);
  
  // Calculate solar noon and sunrise/sunset (approximate)
  // Real calculation would need full sun position algorithm
  const solarNoonHour = 12; // Local solar noon
  const sunriseHour = 6; // Approximate
  const sunsetHour = 18; // Approximate
  
  return {
    optimalTiltAngle: Math.round(optimalTilt * 10) / 10,
    summerTiltAngle: Math.round(summerTilt * 10) / 10,
    winterTiltAngle: Math.round(winterTilt * 10) / 10,
    optimalAzimuth: latitude >= 0 ? 180 : 0, // South for Northern Hemisphere, North for Southern
    seasonalVariation: 15, // ±15° for seasonal optimization
    solarNoon: `${solarNoonHour}:00`,
    sunriseTime: `${sunriseHour}:00`,
    sunsetTime: `${sunsetHour}:00`,
  };
}

/**
 * Get efficiency factor for a given compass direction (azimuth)
 * Azimuth: 0° = North, 90° = East, 180° = South, 270° = West
 * 
 * Returns efficiency relative to optimal south-facing (Northern Hemisphere)
 */
export function getDirectionEfficiency(azimuth: number, latitude: number): number {
  // Normalize azimuth to 0-360
  const normalizedAzimuth = ((azimuth % 360) + 360) % 360;
  
  // Optimal direction varies by hemisphere
  const optimalAzimuth = latitude >= 0 ? 180 : 0; // South for Northern, North for Southern
  
  // Calculate angle difference from optimal
  let angleDiff = Math.abs(normalizedAzimuth - optimalAzimuth);
  if (angleDiff > 180) {
    angleDiff = 360 - angleDiff;
  }
  
  // Efficiency curve (cosine-based, peaks at 0° difference)
  // At 0° difference: 1.0 (100% efficiency)
  // At 90° difference: ~0.0 (east or west)
  // At 180° difference: 0.3 (opposite direction)
  const efficiencyFactor = Math.max(0.2, Math.cos((angleDiff * Math.PI) / 180));
  
  return Math.round(efficiencyFactor * 100) / 100;
}

/**
 * Calculate efficiency for all cardinal and intercardinal directions
 */
export function getAllDirectionEfficiencies(latitude: number): DirectionEfficiency[] {
  const directions = [
    { name: 'North', azimuth: 0 },
    { name: 'NE', azimuth: 45 },
    { name: 'East', azimuth: 90 },
    { name: 'SE', azimuth: 135 },
    { name: 'South', azimuth: 180 },
    { name: 'SW', azimuth: 225 },
    { name: 'West', azimuth: 270 },
    { name: 'NW', azimuth: 315 },
  ];

  return directions.map(({ name, azimuth }) => {
    const efficiencyFactor = getDirectionEfficiency(azimuth, latitude);
    
    // Average annual generation (will be multiplied by system size in UI)
    // Base calculation: 5.5 kWh/day/kW in optimal conditions
    const baseGeneration = 5.5 * 365; // ~2007.5 kWh/year per kW
    
    return {
      direction: name,
      azimuth,
      efficiencyFactor,
      annualGeneration: Math.round(baseGeneration * efficiencyFactor),
      seasonalScore: efficiencyFactor, // Will be refined with seasonal data
    };
  });
}

/**
 * Calculate efficiency loss due to tilt angle deviation
 * Returns factor to multiply with generation (1.0 = optimal angle)
 */
export function getTiltEfficiency(tiltAngle: number, optimalTilt: number): number {
  const angleDiff = Math.abs(tiltAngle - optimalTilt);
  
  // For every 15° deviation from optimal, lose ~3% efficiency
  // Formula: efficiency = 1 - (angleDiff / 90) * 0.2
  const efficiency = Math.max(0.7, 1 - (angleDiff / 90) * 0.2);
  
  return Math.round(efficiency * 100) / 100;
}

/**
 * Calculate shading factor based on obstruction height and location
 * Returns factor 0-1 (1 = no shading, 0 = complete shade)
 */
export function calculateShadingFactor(
  obstacleHeight: number, // meters
  distanceToObstacle: number, // meters
  sunAltitudeAngle: number // degrees (0-90)
): number {
  if (sunAltitudeAngle <= 0) return 0; // Sun below horizon
  
  // Calculate shadow angle
  const shadowAngle = Math.atan(obstacleHeight / distanceToObstacle) * (180 / Math.PI);
  
  // If sun is higher than shadow angle, no shading
  if (sunAltitudeAngle > shadowAngle) {
    return 1.0;
  }
  
  // Partial shading: interpolate
  const shadingPercentage = (shadowAngle - sunAltitudeAngle) / shadowAngle;
  return Math.max(0, 1 - shadingPercentage);
}

/**
 * Analyze roof area for solar panel placement
 */
export function analyzeRoofArea(
  roofAreaM2: number,
  panelWidthM: number = 1.134,
  panelHeightM: number = 2.278,
  spacingM: number = 0.05,
  rowSpacingM: number = 0.5,
  shadingPercentage: number = 0
): AreaAnalysis {
  // Account for shading
  const usableArea = roofAreaM2 * (1 - shadingPercentage / 100);
  
  // Account for clearance from edges (0.3m)
  const clearanceM = 0.3;
  const adjustedArea = Math.max(0, usableArea - (clearanceM * 2 * Math.sqrt(usableArea)));
  
  // Calculate panels that can fit (simplified grid approach)
  const panelAreaWithSpacing = (panelWidthM + spacingM) * (panelHeightM + rowSpacingM);
  const estimatedPanels = Math.floor(adjustedArea / panelAreaWithSpacing);
  
  const coveragePercentage = (estimatedPanels * panelWidthM * panelHeightM) / roofAreaM2;

  return {
    totalRoofArea: Math.round(roofAreaM2 * 100) / 100,
    usableArea: Math.round(adjustedArea * 100) / 100,
    estimatedPanels,
    coveragePercentage: Math.round(coveragePercentage * 100),
    shadingFactor: 1 - shadingPercentage / 100,
  };
}

/**
 * Get recommendation text based on latitude and orientation
 */
export function getRecommendation(latitude: number, currentAzimuth: number): string {
  const optimalTilt = calculateOptimalTiltAngle(latitude);
  const currentEfficiency = getDirectionEfficiency(currentAzimuth, latitude);
  const maxEfficiency = latitude >= 0 ? 1.0 : 1.0; // South/North facing is always 1.0
  
  const efficiencyPercentage = Math.round(currentEfficiency * 100);
  
  if (efficiencyPercentage >= 95) {
    return `✓ Optimal orientation! Your roof faces the best direction for solar generation (${efficiencyPercentage}% efficiency). Recommended tilt: ${optimalTilt.optimalTiltAngle}°`;
  } else if (efficiencyPercentage >= 85) {
    return `Good orientation. This direction provides ${efficiencyPercentage}% efficiency. Recommended tilt: ${optimalTilt.optimalTiltAngle}° for maximum output.`;
  } else if (efficiencyPercentage >= 70) {
    return `Fair orientation at ${efficiencyPercentage}% efficiency. Consider rotating panels if possible. Optimal tilt: ${optimalTilt.optimalTiltAngle}°`;
  } else {
    return `Suboptimal direction (${efficiencyPercentage}% efficiency). If possible, prioritize southern-facing areas. Tilt angle: ${optimalTilt.optimalTiltAngle}°`;
  }
}

/**
 * Calculate complete system efficiency considering all factors
 */
export function calculateSystemEfficiency(
  azimuth: number,
  tiltAngle: number,
  shadingFactor: number, // 0-1
  latitude: number
): number {
  const directionFactor = getDirectionEfficiency(azimuth, latitude);
  const optimalTilt = calculateOptimalTiltAngle(latitude);
  const tiltFactor = getTiltEfficiency(tiltAngle, optimalTilt.optimalTiltAngle);
  
  // Combine factors: direction × tilt × shading
  // Direction is most important (0.6 weight), then shading (0.25), then tilt (0.15)
  const combinedEfficiency = 
    (directionFactor * 0.6) + 
    (tiltFactor * 0.15) + 
    (shadingFactor * 0.25);
  
  return Math.round(Math.min(1.0, combinedEfficiency) * 100) / 100;
}
