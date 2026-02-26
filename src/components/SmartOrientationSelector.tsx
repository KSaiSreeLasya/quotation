import React, { useMemo } from 'react';
import { Compass, TrendingUp, AlertCircle } from 'lucide-react';
import { 
  calculateOptimalTiltAngle,
  getDirectionEfficiency,
  getAllDirectionEfficiencies,
  calculateSystemEfficiency
} from '../utils/solarCalculations';
import { 
  analyzeBuilding,
  getDirectionRecommendations,
  azimuthToCardinal
} from '../utils/directionAnalyzer';
import { Point } from '../types';

interface SmartOrientationSelectorProps {
  latitude: number;
  currentOrientation: number;
  onOrientationChange: (orientation: number) => void;
  boundaryPoints: Point[];
  pixelsPerMeter: number;
  shadeFactor: number;
}

const SmartOrientationSelector: React.FC<SmartOrientationSelectorProps> = ({
  latitude,
  currentOrientation,
  onOrientationChange,
  boundaryPoints,
  pixelsPerMeter,
  shadeFactor,
}) => {
  // Analyze building from boundary
  const buildingAnalysis = useMemo(() => {
    return analyzeBuilding(boundaryPoints, pixelsPerMeter);
  }, [boundaryPoints, pixelsPerMeter]);

  // Get solar calculations
  const solarOptimization = useMemo(() => {
    return calculateOptimalTiltAngle(latitude);
  }, [latitude]);

  // Get all direction efficiencies
  const directionEfficiencies = useMemo(() => {
    return getAllDirectionEfficiencies(latitude);
  }, [latitude]);

  // Get recommendations
  const recommendation = useMemo(() => {
    return getDirectionRecommendations(buildingAnalysis, latitude, currentOrientation);
  }, [buildingAnalysis, latitude, currentOrientation]);

  // Calculate current system efficiency
  const currentEfficiency = useMemo(() => {
    const shadingFactor = 1 - (shadeFactor / 100);
    return calculateSystemEfficiency(
      currentOrientation,
      solarOptimization.optimalTiltAngle,
      shadingFactor,
      latitude
    );
  }, [currentOrientation, shadeFactor, latitude, solarOptimization]);

  // Find the most efficient direction
  const bestDirection = useMemo(() => {
    return directionEfficiencies.reduce((best, current) => 
      current.efficiencyFactor > best.efficiencyFactor ? current : best
    );
  }, [directionEfficiencies]);

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 0.9) return 'text-emerald-600';
    if (efficiency >= 0.75) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getEfficiencyBg = (efficiency: number) => {
    if (efficiency >= 0.9) return 'bg-emerald-50';
    if (efficiency >= 0.75) return 'bg-amber-50';
    return 'bg-rose-50';
  };

  return (
    <div className="space-y-4">
      {/* Header with Building Info */}
      {buildingAnalysis.confidence > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
          <div className="flex items-start gap-2">
            <Compass className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
            <div className="text-xs">
              <p className="font-bold text-blue-900">Detected Roof Direction</p>
              <p className="text-blue-700 mt-1">
                Your roof faces <span className="font-bold">{buildingAnalysis.mainFacingName}</span> ({Math.round(buildingAnalysis.mainFacingDirection)}°)
                <br />
                Area: {buildingAnalysis.roofArea}m² | Confidence: {Math.round(buildingAnalysis.confidence * 100)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current Efficiency Badge */}
      <div className={`p-3 rounded-xl border-2 flex items-center justify-between ${getEfficiencyBg(currentEfficiency)} border-current`}>
        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase">Current Setup Efficiency</p>
          <p className={`text-xl font-bold ${getEfficiencyColor(currentEfficiency)}`}>
            {Math.round(currentEfficiency * 100)}%
          </p>
        </div>
        <div className={`text-3xl font-bold ${getEfficiencyColor(currentEfficiency)} opacity-20`}>
          {currentEfficiency >= 0.9 ? '✓' : currentEfficiency >= 0.75 ? '→' : '!'}
        </div>
      </div>

      {/* Orientation Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-600">Roof Facing Direction</label>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">{currentOrientation}°</span>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
              {azimuthToCardinal(currentOrientation)}
            </span>
          </div>
        </div>
        <input
          type="range"
          min="0"
          max="359"
          value={currentOrientation}
          onChange={(e) => onOrientationChange(parseInt(e.target.value))}
          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
        <div className="flex justify-between text-xs text-slate-400 font-bold">
          <span>N</span>
          <span>E</span>
          <span>S</span>
          <span>W</span>
          <span>N</span>
        </div>
      </div>

      {/* Recommendation */}
      {recommendation.expectedEfficiencyIncrease > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-2">
            <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
            <div className="text-xs">
              <p className="font-bold text-amber-900">
                Potential +{recommendation.expectedEfficiencyIncrease}% efficiency
              </p>
              <p className="text-amber-700 mt-1">
                Rotating toward <span className="font-bold">{recommendation.optimalDirection}</span> ({recommendation.optimalAzimuth}°) would optimize output
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Solar Angle Info */}
      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
        <p className="text-xs font-semibold text-slate-600 uppercase mb-2">Optimal Solar Angles</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-slate-500">Year-Round Tilt</p>
            <p className="font-bold text-slate-900">{solarOptimization.optimalTiltAngle}°</p>
          </div>
          <div>
            <p className="text-slate-500">Summer / Winter</p>
            <p className="font-bold text-slate-900">{solarOptimization.summerTiltAngle}° / {solarOptimization.winterTiltAngle}°</p>
          </div>
        </div>
      </div>

      {/* Direction Efficiency Comparison */}
      <div>
        <p className="text-xs font-semibold text-slate-600 uppercase mb-3">Efficiency by Direction</p>
        <div className="space-y-2">
          {directionEfficiencies.map((dir) => {
            const isOptimal = dir.azimuth === bestDirection.azimuth;
            const isCurrent = Math.abs(dir.azimuth - currentOrientation) < 25;
            
            return (
              <div
                key={dir.direction}
                onClick={() => onOrientationChange(dir.azimuth)}
                className={`p-2 rounded-lg cursor-pointer transition-all border ${
                  isOptimal
                    ? 'border-emerald-300 bg-emerald-50'
                    : isCurrent
                    ? 'border-amber-300 bg-amber-50'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 min-w-12">{dir.direction}</span>
                    {isOptimal && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">BEST</span>}
                    {isCurrent && <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded">CURRENT</span>}
                  </div>
                  <span className={`text-xs font-bold ${getEfficiencyColor(dir.efficiencyFactor)}`}>
                    {Math.round(dir.efficiencyFactor * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isOptimal
                        ? 'bg-emerald-500'
                        : isCurrent
                        ? 'bg-amber-500'
                        : 'bg-slate-400'
                    }`}
                    style={{ width: `${dir.efficiencyFactor * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Installation Guidance */}
      <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
        <p className="text-xs font-semibold text-indigo-900 uppercase mb-2 flex items-center gap-2">
          <TrendingUp size={14} />
          Setup Guidance for Your Home
        </p>
        <p className="text-xs text-indigo-700 leading-relaxed">
          {currentOrientation >= 135 && currentOrientation <= 225
            ? '✓ Your south-facing roof is ideal. Maximize panel coverage here.'
            : currentOrientation >= 45 && currentOrientation <= 135
            ? 'Good: East-facing gets strong morning sun. Use secondary roof if available.'
            : currentOrientation >= 225 && currentOrientation <= 315
            ? 'Good: West-facing gets strong afternoon sun. Pair with morning-facing area if possible.'
            : '⚠ North-facing only works with clear sky. Consider south-facing wall space.'}
        </p>
      </div>
    </div>
  );
};

export default SmartOrientationSelector;
