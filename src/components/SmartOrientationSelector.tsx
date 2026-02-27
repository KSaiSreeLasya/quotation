import React, { useMemo, useState } from 'react';
import { Compass, TrendingUp, AlertCircle, AlertTriangle, Zap, Info } from 'lucide-react';
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
import {
  getEfficiencyMetrics,
  getEfficiencyColor,
  getEfficiencyBgColor,
  getEfficiencyBorderColor,
  getEfficiencyWarning,
  getEfficiencyRecommendation,
  calculateEfficiencyLoss,
  getSeverityColor,
} from '../utils/efficiencyUtils';
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
  const [hoveredDirection, setHoveredDirection] = useState<string | null>(null);

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

  // Calculate efficiency loss compared to optimal
  const efficiencyLoss = useMemo(() => {
    return calculateEfficiencyLoss(currentEfficiency, bestDirection.efficiencyFactor);
  }, [currentEfficiency, bestDirection]);

  const currentMetrics = useMemo(() => {
    return getEfficiencyMetrics(currentEfficiency);
  }, [currentEfficiency]);

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
      <div className={`p-3 rounded-xl border-2 flex items-center justify-between ${getEfficiencyBgColor(currentEfficiency)} ${getEfficiencyBorderColor(currentEfficiency)}`}>
        <div className="flex-1">
          <p className="text-xs font-semibold text-slate-600 uppercase">Current Setup Efficiency</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className={`text-2xl font-bold ${getEfficiencyColor(currentEfficiency)}`}>
              {Math.round(currentEfficiency * 100)}%
            </p>
            <span className={`text-xs font-semibold px-2 py-1 rounded ${getEfficiencyBgColor(currentEfficiency)}`}>
              {currentMetrics.description}
            </span>
          </div>
          {efficiencyLoss > 5 && (
            <p className="text-xs text-slate-600 mt-2 flex items-center gap-1">
              <AlertCircle size={12} className="text-orange-600" />
              Potential gain: +{efficiencyLoss}% by optimizing orientation
            </p>
          )}
        </div>
        <div className={`text-4xl font-bold ${getEfficiencyColor(currentEfficiency)} opacity-20 ml-2`}>
          {currentMetrics.icon}
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

      {/* Efficiency Comparison Visualization */}
      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
        <p className="text-xs font-semibold text-slate-600 uppercase">Efficiency Comparison</p>
        <div className="space-y-3">
          {/* Current Setup Bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-700">Current ({azimuthToCardinal(currentOrientation)})</span>
              <span className={`text-xs font-bold ${getEfficiencyColor(currentEfficiency)}`}>
                {Math.round(currentEfficiency * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${getSeverityColor(currentMetrics.severity)}`}
                style={{ width: `${currentEfficiency * 100}%` }}
              />
            </div>
          </div>

          {/* Optimal Setup Bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-700">Optimal ({bestDirection.direction})</span>
              <span className="text-xs font-bold text-emerald-600">
                {Math.round(bestDirection.efficiencyFactor * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${bestDirection.efficiencyFactor * 100}%` }}
              />
            </div>
          </div>

          {/* Efficiency Gain */}
          <div className={`p-2 rounded-lg ${efficiencyLoss > 0 ? 'bg-blue-50 border border-blue-200' : 'bg-emerald-50 border border-emerald-200'}`}>
            <p className="text-xs text-slate-600 mb-1">
              {efficiencyLoss > 0 ? (
                <>
                  <span className="font-semibold">Efficiency Loss: </span>
                  <span className={`font-bold ${efficiencyLoss > 20 ? 'text-rose-600' : efficiencyLoss > 10 ? 'text-orange-600' : 'text-amber-600'}`}>
                    -{efficiencyLoss}%
                  </span>
                  <span className="text-slate-500 ml-1">
                    ({Math.round(currentEfficiency * 100)} → {Math.round(bestDirection.efficiencyFactor * 100)}%)
                  </span>
                </>
              ) : (
                <>
                  <span className="font-semibold text-emerald-700">✓ Optimal Setup Achieved! </span>
                  <span className="text-slate-600">No efficiency loss detected.</span>
                </>
              )}
            </p>
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
            const metrics = getEfficiencyMetrics(dir.efficiencyFactor);
            const isHovered = hoveredDirection === dir.direction;

            return (
              <div
                key={dir.direction}
                onMouseEnter={() => setHoveredDirection(dir.direction)}
                onMouseLeave={() => setHoveredDirection(null)}
                onClick={() => onOrientationChange(dir.azimuth)}
                className={`p-3 rounded-lg cursor-pointer transition-all border-2 relative group ${
                  isOptimal
                    ? 'border-emerald-300 bg-emerald-50'
                    : isCurrent
                    ? 'border-amber-300 bg-amber-50'
                    : metrics.severity === 'poor'
                    ? 'border-rose-200 bg-rose-50 hover:bg-rose-100'
                    : metrics.severity === 'fair'
                    ? 'border-orange-200 bg-orange-50 hover:bg-orange-100'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 min-w-12">{dir.direction}</span>
                    <div className="flex gap-1">
                      {isOptimal && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">BEST</span>}
                      {isCurrent && <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded">CURRENT</span>}
                      {!isOptimal && metrics.severity === 'poor' && <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded flex items-center gap-1"><AlertTriangle size={8} /> WARN</span>}
                    </div>
                  </div>
                  <span className={`text-xs font-bold ${getEfficiencyColor(dir.efficiencyFactor)}`}>
                    {Math.round(dir.efficiencyFactor * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getSeverityColor(metrics.severity)}`}
                    style={{ width: `${dir.efficiencyFactor * 100}%` }}
                  />
                </div>
                {isHovered && (
                  <div className="mt-2 p-2 bg-white bg-opacity-90 rounded text-xs text-slate-700 border border-slate-200">
                    <p className="font-semibold mb-1">Why {dir.direction}?</p>
                    <p>Efficiency: {Math.round(dir.efficiencyFactor * 100)}% • Annual generation: ~{(dir.efficiencyFactor * 2008).toFixed(0)} kWh/kW</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Setup Guidance */}
      <div className={`p-4 rounded-xl border-2 ${getEfficiencyBgColor(currentEfficiency)} ${getEfficiencyBorderColor(currentEfficiency)}`}>
        <div className="flex items-start gap-2 mb-3">
          {currentMetrics.severity === 'excellent' ? (
            <Zap className="text-emerald-600 flex-shrink-0 mt-0.5" size={18} />
          ) : currentMetrics.severity === 'good' ? (
            <TrendingUp className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
          ) : (
            <AlertTriangle className="text-rose-600 flex-shrink-0 mt-0.5" size={18} />
          )}
          <div className="flex-1">
            <p className={`text-sm font-bold uppercase ${getEfficiencyColor(currentEfficiency)}`}>
              {currentMetrics.severity === 'excellent'
                ? '✓ Optimal Setup'
                : currentMetrics.severity === 'good'
                ? '→ Good Setup'
                : currentMetrics.severity === 'fair'
                ? '~ Fair Setup - Room for Improvement'
                : '⚠ Suboptimal Setup - Action Needed'}
            </p>
            <p className={`text-xs ${getEfficiencyColor(currentEfficiency)} mt-1 leading-relaxed`}>
              {getEfficiencyRecommendation(
                currentEfficiency,
                azimuthToCardinal(currentOrientation),
                azimuthToCardinal(bestDirection.azimuth)
              )}
            </p>
          </div>
        </div>

        {efficiencyLoss > 0 && (
          <div className="mt-3 pt-3 border-t border-current border-opacity-20 space-y-2">
            <div className="flex items-start gap-2">
              <Info size={14} className={`${getEfficiencyColor(currentEfficiency)} flex-shrink-0 mt-0.5`} />
              <div className="text-xs">
                <p className="font-semibold mb-1">Efficiency Comparison:</p>
                <div className="space-y-1">
                  <p><span className="font-semibold">Current:</span> {Math.round(currentEfficiency * 100)}%</p>
                  <p><span className="font-semibold">Optimal:</span> {Math.round(bestDirection.efficiencyFactor * 100)}%</p>
                  <p className={`font-bold ${efficiencyLoss > 20 ? 'text-rose-600' : efficiencyLoss > 10 ? 'text-orange-600' : 'text-amber-600'}`}>
                    Potential gain: +{efficiencyLoss}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartOrientationSelector;
