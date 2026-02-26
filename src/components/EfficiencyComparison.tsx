import React, { useMemo } from 'react';
import { BarChart3, Info } from 'lucide-react';
import { 
  calculateOptimalTiltAngle,
  getDirectionEfficiency,
  getTiltEfficiency,
  calculateSystemEfficiency
} from '../utils/solarCalculations';

interface EfficiencyComparisonProps {
  latitude: number;
  systemSizeKw: number;
  currentAzimuth: number;
  currentTiltAngle?: number;
  shadingFactor: number; // 0-1
}

interface EnergyScenario {
  name: string;
  azimuth: number;
  tiltAngle: number;
  efficiency: number;
  annualKwh: number;
  isCurrent: boolean;
  isOptimal: boolean;
}

const EfficiencyComparison: React.FC<EfficiencyComparisonProps> = ({
  latitude,
  systemSizeKw,
  currentAzimuth,
  currentTiltAngle = 30,
  shadingFactor,
}) => {
  const solarOptimization = useMemo(
    () => calculateOptimalTiltAngle(latitude),
    [latitude]
  );

  // Generate comparison scenarios
  const scenarios = useMemo(() => {
    const results: EnergyScenario[] = [];
    const shadeFactor = 1 - (shadingFactor / 100);

    // Current setup
    const currentEfficiency = calculateSystemEfficiency(
      currentAzimuth,
      currentTiltAngle,
      shadeFactor,
      latitude
    );
    const currentGeneration = currentEfficiency * 5.5 * 365 * systemSizeKw; // 5.5 kWh/day/kW base

    results.push({
      name: 'Current Setup',
      azimuth: currentAzimuth,
      tiltAngle: currentTiltAngle,
      efficiency: currentEfficiency,
      annualKwh: Math.round(currentGeneration),
      isCurrent: true,
      isOptimal: false,
    });

    // Optimal setup (south/north facing with optimal tilt)
    const optimalAzimuth = latitude >= 0 ? 180 : 0;
    const optimalEfficiency = calculateSystemEfficiency(
      optimalAzimuth,
      solarOptimization.optimalTiltAngle,
      shadeFactor,
      latitude
    );
    const optimalGeneration = optimalEfficiency * 5.5 * 365 * systemSizeKw;

    results.push({
      name: 'Optimal Direction & Tilt',
      azimuth: optimalAzimuth,
      tiltAngle: solarOptimization.optimalTiltAngle,
      efficiency: optimalEfficiency,
      annualKwh: Math.round(optimalGeneration),
      isCurrent: false,
      isOptimal: true,
    });

    // Alternative 1: Keep current direction, optimize tilt
    const altTilt1Efficiency = calculateSystemEfficiency(
      currentAzimuth,
      solarOptimization.optimalTiltAngle,
      shadeFactor,
      latitude
    );
    const altTilt1Generation = altTilt1Efficiency * 5.5 * 365 * systemSizeKw;

    results.push({
      name: 'Keep Direction, Optimize Tilt',
      azimuth: currentAzimuth,
      tiltAngle: solarOptimization.optimalTiltAngle,
      efficiency: altTilt1Efficiency,
      annualKwh: Math.round(altTilt1Generation),
      isCurrent: false,
      isOptimal: false,
    });

    // Alternative 2: East facing (morning sun)
    const eastAzimuth = latitude >= 0 ? 90 : 270;
    const eastEfficiency = calculateSystemEfficiency(
      eastAzimuth,
      solarOptimization.optimalTiltAngle,
      shadeFactor,
      latitude
    );
    const eastGeneration = eastEfficiency * 5.5 * 365 * systemSizeKw;

    results.push({
      name: `${latitude >= 0 ? 'East' : 'West'}-Facing (Morning Sun)`,
      azimuth: eastAzimuth,
      tiltAngle: solarOptimization.optimalTiltAngle,
      efficiency: eastEfficiency,
      annualKwh: Math.round(eastGeneration),
      isCurrent: false,
      isOptimal: false,
    });

    // Alternative 3: West facing (afternoon sun)
    const westAzimuth = latitude >= 0 ? 270 : 90;
    const westEfficiency = calculateSystemEfficiency(
      westAzimuth,
      solarOptimization.optimalTiltAngle,
      shadeFactor,
      latitude
    );
    const westGeneration = westEfficiency * 5.5 * 365 * systemSizeKw;

    results.push({
      name: `${latitude >= 0 ? 'West' : 'East'}-Facing (Afternoon Sun)`,
      azimuth: westAzimuth,
      tiltAngle: solarOptimization.optimalTiltAngle,
      efficiency: westEfficiency,
      annualKwh: Math.round(westGeneration),
      isCurrent: false,
      isOptimal: false,
    });

    return results;
  }, [latitude, currentAzimuth, currentTiltAngle, systemSizeKw, shadingFactor, solarOptimization]);

  // Find max annual generation for scaling
  const maxAnnual = Math.max(...scenarios.map(s => s.annualKwh));
  const minAnnual = Math.min(...scenarios.map(s => s.annualKwh));
  const range = maxAnnual - minAnnual || 1;

  const getBarColor = (scenario: EnergyScenario) => {
    if (scenario.isOptimal) return 'bg-emerald-500';
    if (scenario.isCurrent) return 'bg-amber-500';
    return 'bg-slate-400';
  };

  const getTextColor = (scenario: EnergyScenario) => {
    if (scenario.isOptimal) return 'text-emerald-700';
    if (scenario.isCurrent) return 'text-amber-700';
    return 'text-slate-700';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="text-amber-600" size={18} />
        <h3 className="text-sm font-bold text-slate-900">Annual Energy Generation Comparison</h3>
      </div>

      {/* Info box */}
      <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex gap-2">
        <Info size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          Comparing annual kWh generation for a {systemSizeKw.toFixed(2)} kW system with {Math.round((1 - (shadingFactor / 100)) * 100)}% sun exposure
        </p>
      </div>

      {/* Chart */}
      <div className="space-y-3">
        {scenarios.map((scenario, idx) => {
          const barWidth = ((scenario.annualKwh - minAnnual) / range) * 100;
          const percentageVsOptimal = scenario.isOptimal
            ? 100
            : (scenario.annualKwh / scenarios.find(s => s.isOptimal)!.annualKwh) * 100;

          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-900">{scenario.name}</p>
                  <p className="text-[10px] text-slate-500">
                    {Math.round(scenario.azimuth)}° | Tilt: {Math.round(scenario.tiltAngle)}°
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${getTextColor(scenario)}`}>
                    {scenario.annualKwh.toLocaleString()} kWh
                  </p>
                  <p className="text-xs text-slate-500">
                    {Math.round(percentageVsOptimal)}% of optimal
                  </p>
                </div>
              </div>
              <div className="relative w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getBarColor(scenario)}`}
                  style={{
                    width: `${Math.max(5, barWidth)}%`,
                    opacity: scenario.isCurrent || scenario.isOptimal ? 1 : 0.7,
                  }}
                />
                {scenario.isCurrent && (
                  <div className="absolute inset-0 border-2 border-amber-500 rounded-full" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Efficiency Breakdown for Current Setup */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
        <p className="text-xs font-semibold text-slate-700 uppercase">Current Setup Breakdown</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-slate-500">Direction Factor</p>
            <p className="font-bold text-slate-900">
              {Math.round(getDirectionEfficiency(currentAzimuth, latitude) * 100)}%
            </p>
          </div>
          <div>
            <p className="text-slate-500">Tilt Factor</p>
            <p className="font-bold text-slate-900">
              {Math.round(getTiltEfficiency(currentTiltAngle, solarOptimization.optimalTiltAngle) * 100)}%
            </p>
          </div>
          <div>
            <p className="text-slate-500">Shading Factor</p>
            <p className="font-bold text-slate-900">
              {Math.round((1 - (shadingFactor / 100)) * 100)}%
            </p>
          </div>
          <div>
            <p className="text-slate-500">Combined</p>
            <p className="font-bold text-slate-900">
              {Math.round(scenarios[0].efficiency * 100)}%
            </p>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      {scenarios[1].annualKwh > scenarios[0].annualKwh * 1.1 && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="text-xs font-bold text-emerald-900 mb-1">💡 Opportunity</p>
          <p className="text-xs text-emerald-700">
            Moving to optimal direction & tilt could increase annual generation by{' '}
            <span className="font-bold">
              {Math.round(((scenarios[1].annualKwh / scenarios[0].annualKwh) - 1) * 100)}%
            </span>
            , generating an additional{' '}
            <span className="font-bold">
              {(scenarios[1].annualKwh - scenarios[0].annualKwh).toLocaleString()} kWh
            </span>
            /year.
          </p>
        </div>
      )}
    </div>
  );
};

export default EfficiencyComparison;
