import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { Panel, Point } from '../types';
import {
  analyzePlacementStrategy,
  validatePanelPlacement,
  getPanelQualityIndicator,
} from '../utils/panelPlacementValidator';

interface PlacementAdvisorProps {
  panels: Panel[];
  latitude: number;
  boundaryPoints: Point[];
  pixelsPerMeter: number;
  selectedIds: string[];
  onPanelSelect?: (panelId: string) => void;
}

const PlacementAdvisor: React.FC<PlacementAdvisorProps> = ({
  panels,
  latitude,
  boundaryPoints,
  pixelsPerMeter,
  selectedIds,
  onPanelSelect,
}) => {
  const optimalAzimuth = latitude >= 0 ? 180 : 0;

  // Analyze overall strategy
  const strategyAnalysis = useMemo(() => {
    return analyzePlacementStrategy(panels, latitude, boundaryPoints, pixelsPerMeter);
  }, [panels, latitude, boundaryPoints, pixelsPerMeter]);

  // Validate individual panels
  const panelValidations = useMemo(() => {
    return panels.map(p => validatePanelPlacement(p, latitude, optimalAzimuth));
  }, [panels, latitude, optimalAzimuth]);

  // Separate panels by quality
  const goodPanels = panelValidations.filter(v => v.severityLevel === 'good');
  const fairPanels = panelValidations.filter(v => v.severityLevel === 'fair');
  const poorPanels = panelValidations.filter(v => v.severityLevel === 'poor');

  if (panels.length === 0) {
    return (
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-500">
        <p>Start placing panels to see placement recommendations</p>
      </div>
    );
  }

  const optimalPercentage = Math.round((goodPanels.length / panels.length) * 100);
  const scoreColor =
    optimalPercentage === 100
      ? 'emerald'
      : optimalPercentage >= 80
      ? 'amber'
      : 'rose';

  return (
    <div className="space-y-4">
      {/* Overall Strategy */}
      <div className={`p-4 border-2 rounded-lg bg-${scoreColor}-50 border-${scoreColor}-200`}>
        <div className="flex items-start gap-3">
          {optimalPercentage === 100 ? (
            <CheckCircle2 className={`text-${scoreColor}-600 flex-shrink-0 mt-0.5`} size={20} />
          ) : optimalPercentage >= 50 ? (
            <AlertCircle className={`text-${scoreColor}-600 flex-shrink-0 mt-0.5`} size={20} />
          ) : (
            <AlertTriangle className={`text-${scoreColor}-600 flex-shrink-0 mt-0.5`} size={20} />
          )}
          <div className="text-xs">
            <p className={`font-bold text-${scoreColor}-900`}>{strategyAnalysis.recommendation}</p>
            {strategyAnalysis.optimizedEfficiencyGain > 0 && (
              <p className={`text-${scoreColor}-700 mt-1`}>
                Potential gain: <span className="font-bold">+{strategyAnalysis.optimizedEfficiencyGain}%</span> annual generation
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Placement Summary */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className={`p-3 rounded-lg border bg-emerald-50 border-emerald-200`}>
          <p className="text-emerald-600 font-bold">{goodPanels.length}</p>
          <p className="text-emerald-700">Optimal</p>
        </div>
        {fairPanels.length > 0 && (
          <div className={`p-3 rounded-lg border bg-amber-50 border-amber-200`}>
            <p className="text-amber-600 font-bold">{fairPanels.length}</p>
            <p className="text-amber-700">Fair</p>
          </div>
        )}
        {poorPanels.length > 0 && (
          <div className={`p-3 rounded-lg border bg-rose-50 border-rose-200`}>
            <p className="text-rose-600 font-bold">{poorPanels.length}</p>
            <p className="text-rose-700">Suboptimal</p>
          </div>
        )}
      </div>

      {/* Best Areas to Place Panels */}
      {strategyAnalysis.bestAreas.length > 0 && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs space-y-2">
          <p className="font-bold text-indigo-900 flex items-center gap-2">
            <Zap size={14} />
            Best Areas to Place Panels
          </p>
          <div className="space-y-1">
            {strategyAnalysis.bestAreas.map((area, idx) => (
              <p key={idx} className="text-indigo-700">
                ✓ {area}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Panel Details */}
      {(fairPanels.length > 0 || poorPanels.length > 0) && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-700 uppercase">Panel Details</p>

          {/* Suboptimal Panels */}
          {poorPanels.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-rose-700 uppercase">
                ⚠ Move These Panels
              </p>
              {poorPanels.map(panel => (
                <div
                  key={panel.panelId}
                  onClick={() => onPanelSelect?.(panel.panelId)}
                  className="p-2 bg-rose-50 border border-rose-200 rounded-lg cursor-pointer hover:bg-rose-100 transition-all text-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-rose-900">{panel.direction}</p>
                      <p className="text-rose-700 text-[10px]">
                        {panel.azimuth}° · {Math.round(panel.efficiency * 100)}% efficiency
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-rose-600">Poor</p>
                    </div>
                  </div>
                  {panel.suggestion && (
                    <p className="text-rose-700 mt-1 text-[10px]">💡 {panel.suggestion}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Fair Panels */}
          {fairPanels.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-amber-700 uppercase">
                ~ Can Be Improved
              </p>
              {fairPanels.map(panel => (
                <div
                  key={panel.panelId}
                  onClick={() => onPanelSelect?.(panel.panelId)}
                  className="p-2 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer hover:bg-amber-100 transition-all text-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-amber-900">{panel.direction}</p>
                      <p className="text-amber-700 text-[10px]">
                        {panel.azimuth}° · {Math.round(panel.efficiency * 100)}% efficiency
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-amber-600">Fair</p>
                    </div>
                  </div>
                  {panel.suggestion && (
                    <p className="text-amber-700 mt-1 text-[10px]">💡 {panel.suggestion}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Good Panels */}
          {goodPanels.length > 0 && optimalPercentage < 100 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-emerald-700 uppercase">
                ✓ Optimal Placement
              </p>
              {goodPanels.map(panel => (
                <div
                  key={panel.panelId}
                  className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-emerald-900">{panel.direction}</p>
                      <p className="text-emerald-700 text-[10px]">
                        {panel.azimuth}° · {Math.round(panel.efficiency * 100)}% efficiency
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-emerald-600">Good</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Tips */}
      {(fairPanels.length > 0 || poorPanels.length > 0) && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs space-y-2">
          <p className="font-bold text-blue-900">💡 Action Plan</p>
          <ol className="list-decimal list-inside text-blue-700 space-y-1">
            <li>Select suboptimal panels from the list above</li>
            <li>Drag them to the {latitude >= 0 ? 'South' : 'North'}-facing area</li>
            <li>Watch efficiency improve in real-time</li>
            <li>Aim for all panels in "Optimal" category</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default PlacementAdvisor;
