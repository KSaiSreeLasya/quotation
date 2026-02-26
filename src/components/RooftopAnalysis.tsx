import React, { useMemo } from 'react';
import { Grid3x3, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import { 
  analyzeBuilding,
  suggestBestPanelArea,
  azimuthToCardinal
} from '../utils/directionAnalyzer';
import { analyzeRoofArea } from '../utils/solarCalculations';
import { Point } from '../types';
import { PANEL_WIDTH_METERS, PANEL_HEIGHT_METERS, PANEL_SPACING_METERS, ROW_SPACING_METERS } from '../constants';

interface RooftopAnalysisProps {
  boundaryPoints: Point[];
  pixelsPerMeter: number;
  latitude: number;
  currentOrientation: number;
  currentPanelCount: number;
  shadingPercentage: number;
}

const RooftopAnalysis: React.FC<RooftopAnalysisProps> = ({
  boundaryPoints,
  pixelsPerMeter,
  latitude,
  currentOrientation,
  currentPanelCount,
  shadingPercentage,
}) => {
  // Analyze building dimensions and orientation
  const buildingAnalysis = useMemo(() => {
    return analyzeBuilding(boundaryPoints, pixelsPerMeter);
  }, [boundaryPoints, pixelsPerMeter]);

  // Get area analysis
  const areaAnalysis = useMemo(() => {
    return analyzeRoofArea(
      buildingAnalysis.roofArea,
      PANEL_WIDTH_METERS,
      PANEL_HEIGHT_METERS,
      PANEL_SPACING_METERS,
      ROW_SPACING_METERS,
      shadingPercentage
    );
  }, [buildingAnalysis.roofArea, shadingPercentage]);

  // Get placement recommendation
  const placementRecommendation = useMemo(() => {
    return suggestBestPanelArea(buildingAnalysis, latitude);
  }, [buildingAnalysis, latitude]);

  // Calculate efficiency potential
  const utilizationPercentage = Math.round(
    (currentPanelCount / areaAnalysis.estimatedPanels) * 100
  );

  const getShadingWarning = () => {
    if (shadingPercentage === 0) return null;
    if (shadingPercentage < 15)
      return { level: 'low', message: 'Minimal shading - good for solar' };
    if (shadingPercentage < 30)
      return { level: 'medium', message: 'Moderate shading - consider trimming obstacles' };
    return {
      level: 'high',
      message: 'Significant shading - may need to clear trees or relocate panels',
    };
  };

  const shadowWarning = getShadingWarning();

  const recommendedPanel = `${(currentPanelCount / areaAnalysis.estimatedPanels).toFixed(2)}x`;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Grid3x3 className="text-indigo-600" size={18} />
        <h3 className="text-sm font-bold text-slate-900">Rooftop Area Analysis</h3>
      </div>

      {buildingAnalysis.confidence > 0 ? (
        <>
          {/* Roof Dimensions */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <p className="text-xs font-semibold text-slate-600 uppercase">Roof Dimensions</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] text-slate-500 font-medium">Total Area</p>
                <p className="text-lg font-bold text-slate-900">{areaAnalysis.totalRoofArea}m²</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-medium">Usable Area</p>
                <p className="text-lg font-bold text-slate-900">{areaAnalysis.usableArea}m²</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-medium">Orientation</p>
                <p className="text-sm font-bold text-slate-900">
                  {azimuthToCardinal(currentOrientation)}
                </p>
              </div>
            </div>
          </div>

          {/* Shading Analysis */}
          {shadowWarning && (
            <div
              className={`p-3 border rounded-lg flex gap-3 ${
                shadowWarning.level === 'high'
                  ? 'bg-rose-50 border-rose-200'
                  : shadowWarning.level === 'medium'
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-emerald-50 border-emerald-200'
              }`}
            >
              {shadowWarning.level === 'high' ? (
                <AlertCircle
                  className={`flex-shrink-0 mt-0.5 ${
                    shadowWarning.level === 'high'
                      ? 'text-rose-600'
                      : shadowWarning.level === 'medium'
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                  }`}
                  size={16}
                />
              ) : (
                <CheckCircle2
                  className={`flex-shrink-0 mt-0.5 ${
                    shadowWarning.level === 'high'
                      ? 'text-rose-600'
                      : shadowWarning.level === 'medium'
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                  }`}
                  size={16}
                />
              )}
              <div className="text-xs">
                <p
                  className={`font-bold ${
                    shadowWarning.level === 'high'
                      ? 'text-rose-900'
                      : shadowWarning.level === 'medium'
                      ? 'text-amber-900'
                      : 'text-emerald-900'
                  }`}
                >
                  Shading: {shadingPercentage}%
                </p>
                <p
                  className={
                    shadowWarning.level === 'high'
                      ? 'text-rose-700'
                      : shadowWarning.level === 'medium'
                      ? 'text-amber-700'
                      : 'text-emerald-700'
                  }
                >
                  {shadowWarning.message}
                </p>
              </div>
            </div>
          )}

          {/* Capacity Analysis */}
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg space-y-3">
            <p className="text-xs font-semibold text-indigo-600 uppercase">Panel Capacity</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-indigo-700">Maximum Panels</span>
                <span className="text-lg font-bold text-indigo-900">
                  {areaAnalysis.estimatedPanels} panels
                </span>
              </div>
              <div className="w-full bg-indigo-100 rounded-full h-3">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, utilizationPercentage)}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-indigo-700">
                  <span className="font-bold text-indigo-900">{currentPanelCount}</span> panels
                  placed
                </span>
                <span className="text-indigo-700">
                  <span className="font-bold text-indigo-900">{utilizationPercentage}%</span> of
                  capacity
                </span>
              </div>
            </div>
          </div>

          {/* Coverage Information */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
            <p className="font-semibold text-slate-700">Coverage Details</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-slate-500">Panel Size</p>
                <p className="font-bold text-slate-900">
                  {(PANEL_WIDTH_METERS * PANEL_HEIGHT_METERS).toFixed(2)}m²
                </p>
              </div>
              <div>
                <p className="text-slate-500">Area per Panel</p>
                <p className="font-bold text-slate-900">
                  {(
                    (PANEL_WIDTH_METERS + PANEL_SPACING_METERS) *
                    (PANEL_HEIGHT_METERS + ROW_SPACING_METERS)
                  ).toFixed(2)}
                  m²
                </p>
              </div>
              <div>
                <p className="text-slate-500">Roof Coverage</p>
                <p className="font-bold text-slate-900">{areaAnalysis.coveragePercentage}%</p>
              </div>
              <div>
                <p className="text-slate-500">Available Space</p>
                <p className="font-bold text-slate-900">
                  {areaAnalysis.estimatedPanels - currentPanelCount} more panels
                </p>
              </div>
            </div>
          </div>

          {/* Placement Recommendation */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
            <div className="flex items-start gap-2">
              <TrendingUp className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
              <div className="text-xs">
                <p className="font-bold text-blue-900">Best Placement Area</p>
                <p className="text-blue-700 mt-1">
                  <span className="font-bold">{placementRecommendation.area}</span>
                </p>
                <p className="text-blue-600 text-[11px] mt-1.5 leading-relaxed">
                  {placementRecommendation.reason}
                </p>
                <p className="text-blue-700 font-semibold mt-2">
                  Estimated: {placementRecommendation.estimatedPanels} panels for this area
                </p>
              </div>
            </div>
          </div>

          {/* Optimization Suggestions */}
          {utilizationPercentage < 80 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-2">
              <p className="font-bold text-amber-900">💡 Expansion Opportunity</p>
              <p className="text-amber-700">
                You have {areaAnalysis.estimatedPanels - currentPanelCount} more panel spaces available.
                Consider expanding to maximize your solar investment and increase annual savings.
              </p>
            </div>
          )}

          {/* Multi-direction Setup Suggestion */}
          {buildingAnalysis.secondaryDirection && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs space-y-2">
              <p className="font-bold text-purple-900">Secondary Roof Face</p>
              <p className="text-purple-700">
                Your home has a secondary{' '}
                <span className="font-bold">
                  {azimuthToCardinal(buildingAnalysis.secondaryDirection)}
                </span>
                -facing side. Placing panels here provides{' '}
                {buildingAnalysis.secondaryDirection >= 45 &&
                buildingAnalysis.secondaryDirection <= 135
                  ? 'good morning generation'
                  : 'good afternoon generation'}
                . This is ideal for maximizing daily output.
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center text-sm text-slate-500">
          <p>Draw a roof boundary first to analyze dimensions and placement</p>
        </div>
      )}
    </div>
  );
};

export default RooftopAnalysis;
