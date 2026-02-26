import React, { useMemo } from 'react';
import { Cloud, AlertTriangle, Info } from 'lucide-react';
import { calculateShadingFactor } from '../utils/solarCalculations';

interface ShadingAnalysisProps {
  shadingPercentage: number;
  onShadingChange: (percentage: number) => void;
  latitude: number;
}

interface ShadingScenario {
  type: string;
  percentage: number;
  description: string;
  impact: string;
  recommendation: string;
}

const ShadingAnalysis: React.FC<ShadingAnalysisProps> = ({
  shadingPercentage,
  onShadingChange,
  latitude,
}) => {
  // Pre-defined shading scenarios
  const shadingScenarios: ShadingScenario[] = useMemo(
    () => [
      {
        type: 'Clear Sky',
        percentage: 0,
        description: 'No obstructions - full sun exposure all day',
        impact: '+0% energy loss',
        recommendation: 'Ideal for solar - proceed with full array placement',
      },
      {
        type: 'Partial Morning Shade',
        percentage: 10,
        description: 'Light shade before 10 AM (trees, buildings)',
        impact: '-5-10% energy generation',
        recommendation: 'Still excellent - orient panels south for midday/afternoon sun',
      },
      {
        type: 'Morning & Late Afternoon Shade',
        percentage: 20,
        description: 'Shading in early morning and after 4 PM',
        impact: '-15-20% energy generation',
        recommendation: 'Good - focus on 10 AM - 4 PM peak hours. Consider trimming trees.',
      },
      {
        type: 'Significant Daily Shading',
        percentage: 30,
        description: 'Multiple obstructions affecting 4-6 hours/day',
        impact: '-25-30% energy generation',
        recommendation: 'Fair - investigate removal of obstacles or reposition panels',
      },
      {
        type: 'Heavy Shading',
        percentage: 50,
        description: 'Major obstacles casting shade 6+ hours/day',
        impact: '-40-50% energy generation',
        recommendation: 'Poor - strongly consider clearing obstacles or alternative mounting',
      },
      {
        type: 'Very Heavy Shading',
        percentage: 70,
        description: 'Severe obstruction - tree coverage, tall buildings',
        impact: '-60-70% energy generation',
        recommendation: 'Not recommended - clear obstructions or consider wall mounting',
      },
    ],
    []
  );

  // Find current scenario
  const currentScenario = useMemo(() => {
    let closest = shadingScenarios[0];
    let minDiff = Math.abs(shadingScenarios[0].percentage - shadingPercentage);

    for (const scenario of shadingScenarios) {
      const diff = Math.abs(scenario.percentage - shadingPercentage);
      if (diff < minDiff) {
        minDiff = diff;
        closest = scenario;
      }
    }
    return closest;
  }, [shadingPercentage, shadingScenarios]);

  // Estimate sun hours lost due to shading
  const peakSunHours = 5.5; // Average peak sun hours
  const effectiveSunHours = peakSunHours * (1 - shadingPercentage / 100);

  // Get shading severity level
  const getShadingSeverity = () => {
    if (shadingPercentage === 0) return { level: 'none', color: 'emerald' };
    if (shadingPercentage < 15) return { level: 'minimal', color: 'emerald' };
    if (shadingPercentage < 30) return { level: 'moderate', color: 'amber' };
    if (shadingPercentage < 50) return { level: 'significant', color: 'orange' };
    return { level: 'severe', color: 'rose' };
  };

  const severity = getShadingSeverity();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Cloud className={`text-${severity.color}-600`} size={18} />
        <h3 className="text-sm font-bold text-slate-900">Shading Analysis</h3>
      </div>

      {/* Current Shading Level */}
      <div
        className={`p-4 border-2 rounded-lg bg-${severity.color}-50 border-${severity.color}-200`}
      >
        <div className="flex items-center justify-between mb-3">
          <p className={`text-xs font-semibold text-${severity.color}-700 uppercase`}>
            Estimated Shading
          </p>
          <p className={`text-2xl font-bold text-${severity.color}-900`}>{shadingPercentage}%</p>
        </div>

        {/* Shading Slider */}
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={shadingPercentage}
          onChange={(e) => onShadingChange(parseInt(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500 mb-3"
        />

        {/* Labels */}
        <div className="flex justify-between text-[10px] text-slate-500 font-bold">
          <span>Clear</span>
          <span>Light</span>
          <span>Moderate</span>
          <span>Heavy</span>
          <span>Severe</span>
        </div>
      </div>

      {/* Current Scenario */}
      <div className={`p-3 border rounded-lg bg-blue-50 border-blue-100`}>
        <p className="text-xs font-semibold text-blue-900 mb-1">Current Condition</p>
        <p className="text-sm text-blue-700 mb-2">
          <span className="font-bold">{currentScenario.type}</span>
        </p>
        <p className="text-xs text-blue-600 mb-2">{currentScenario.description}</p>
        <div className="flex items-center gap-2 text-xs text-blue-700">
          <span className="font-bold text-blue-900">{currentScenario.impact}</span>
        </div>
      </div>

      {/* Sun Hours Impact */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
        <p className="text-xs font-semibold text-slate-700 uppercase">Solar Exposure Impact</p>
        <div className="space-y-2">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-600">Peak Sun Hours/Day</span>
              <span className="text-sm font-bold text-slate-900">{effectiveSunHours.toFixed(1)} hrs</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${(effectiveSunHours / peakSunHours) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {peakSunHours.toFixed(1)} hrs available
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs mt-3">
            <div>
              <p className="text-slate-500">Daily Loss</p>
              <p className="font-bold text-slate-900">
                {(peakSunHours - effectiveSunHours).toFixed(1)} hrs
              </p>
            </div>
            <div>
              <p className="text-slate-500">Annual Loss</p>
              <p className="font-bold text-slate-900">
                {((peakSunHours - effectiveSunHours) * 365).toFixed(0)} hrs
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div
        className={`p-3 border rounded-lg flex gap-2 ${
          shadingPercentage >= 50
            ? 'bg-rose-50 border-rose-200'
            : shadingPercentage >= 30
            ? 'bg-orange-50 border-orange-200'
            : shadingPercentage >= 15
            ? 'bg-amber-50 border-amber-200'
            : 'bg-emerald-50 border-emerald-200'
        }`}
      >
        {shadingPercentage >= 50 ? (
          <AlertTriangle
            className={`flex-shrink-0 mt-0.5 ${
              shadingPercentage >= 50
                ? 'text-rose-600'
                : shadingPercentage >= 30
                ? 'text-orange-600'
                : shadingPercentage >= 15
                ? 'text-amber-600'
                : 'text-emerald-600'
            }`}
            size={16}
          />
        ) : (
          <Info
            className={`flex-shrink-0 mt-0.5 ${
              shadingPercentage >= 30
                ? 'text-orange-600'
                : shadingPercentage >= 15
                ? 'text-amber-600'
                : 'text-emerald-600'
            }`}
            size={16}
          />
        )}
        <div className="text-xs">
          <p
            className={`font-bold ${
              shadingPercentage >= 50
                ? 'text-rose-900'
                : shadingPercentage >= 30
                ? 'text-orange-900'
                : shadingPercentage >= 15
                ? 'text-amber-900'
                : 'text-emerald-900'
            }`}
          >
            {currentScenario.type}
          </p>
          <p
            className={
              shadingPercentage >= 50
                ? 'text-rose-700'
                : shadingPercentage >= 30
                ? 'text-orange-700'
                : shadingPercentage >= 15
                ? 'text-amber-700'
                : 'text-emerald-700'
            }
          >
            {currentScenario.recommendation}
          </p>
        </div>
      </div>

      {/* Obstruction Types */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
        <p className="text-xs font-semibold text-slate-700 uppercase">Common Obstacles</p>
        <div className="space-y-2 text-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded" />
            <span className="text-slate-600">Nearby trees (seasonal leaf coverage)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded" />
            <span className="text-slate-600">Taller neighboring buildings</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded" />
            <span className="text-slate-600">Roof parapets or HVAC equipment</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded" />
            <span className="text-slate-600">Utility lines or other infrastructure</span>
          </label>
        </div>
      </div>

      {/* Shading Solutions */}
      {shadingPercentage > 15 && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg space-y-2">
          <p className="text-xs font-semibold text-indigo-900 uppercase">Solutions</p>
          <ul className="space-y-1 text-xs text-indigo-700 list-disc list-inside">
            {shadingPercentage < 30 && (
              <li>Trim tree branches to maximize afternoon sun</li>
            )}
            {shadingPercentage >= 30 && shadingPercentage < 50 && (
              <>
                <li>Remove or significantly trim blocking trees</li>
                <li>Mount panels on south-facing wall instead</li>
              </>
            )}
            {shadingPercentage >= 50 && (
              <>
                <li>Clear obstructions or remove trees entirely</li>
                <li>Consider ground-mount installation if roof is unsuitable</li>
                <li>Explore wall mounting on unshaded sides</li>
              </>
            )}
          </ul>
        </div>
      )}

      {/* Seasonal Variations */}
      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs space-y-2">
        <p className="font-semibold text-purple-900">Seasonal Considerations</p>
        <p className="text-purple-700">
          {latitude > 40 || latitude < -40
            ? 'High latitude: Winter shadows extend far - plan placement accordingly'
            : 'Moderate latitude: Seasonal shadow changes are moderate'}
        </p>
        <p className="text-purple-700">
          Tree foliage: Full shade in summer, partial in winter (if deciduous)
        </p>
      </div>
    </div>
  );
};

export default ShadingAnalysis;
