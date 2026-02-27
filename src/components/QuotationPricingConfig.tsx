import React, { useState } from 'react';
import { ChevronDown, DollarSign } from 'lucide-react';

interface QuotationPricingConfigProps {
  panelCapacityWatts: number;
  costPerWatt: number;
  panelGstPercent: number;
  netMeterCost: number;
  netMeterGstPercent: number;
  subsidyCharges: number;
  subsidyGstPercent: number;
  onUpdate: (config: {
    panelCapacityWatts: number;
    costPerWatt: number;
    panelGstPercent: number;
    netMeterCost: number;
    netMeterGstPercent: number;
    subsidyCharges: number;
    subsidyGstPercent: number;
  }) => void;
}

const QuotationPricingConfig: React.FC<QuotationPricingConfigProps> = ({
  panelCapacityWatts,
  costPerWatt,
  panelGstPercent,
  netMeterCost,
  netMeterGstPercent,
  subsidyCharges,
  subsidyGstPercent,
  onUpdate,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleChange = (field: string, value: number) => {
    onUpdate({
      panelCapacityWatts: field === 'panelCapacityWatts' ? value : panelCapacityWatts,
      costPerWatt: field === 'costPerWatt' ? value : costPerWatt,
      panelGstPercent: field === 'panelGstPercent' ? value : panelGstPercent,
      netMeterCost: field === 'netMeterCost' ? value : netMeterCost,
      netMeterGstPercent: field === 'netMeterGstPercent' ? value : netMeterGstPercent,
      subsidyCharges: field === 'subsidyCharges' ? value : subsidyCharges,
      subsidyGstPercent: field === 'subsidyGstPercent' ? value : subsidyGstPercent,
    });
  };

  const panelCostTotal = panelCapacityWatts * costPerWatt;
  const panelCostWithGst = panelCostTotal * (1 + panelGstPercent / 100);
  const netMeterWithGst = netMeterCost * (1 + netMeterGstPercent / 100);
  const subsidyWithGst = subsidyCharges * (1 + subsidyGstPercent / 100);

  return (
    <div className="space-y-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-all"
      >
        <div className="flex items-center gap-2">
          <DollarSign size={16} className="text-blue-600" />
          <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">Quotation Pricing Config</span>
        </div>
        <ChevronDown
          size={16}
          className={`text-blue-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {isExpanded && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-4">
          {/* Solar Panel Pricing Section */}
          <div className="border-b border-blue-200 pb-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Solar Panel Pricing</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-600 w-32">Panel Capacity (Watts)</label>
                <input
                  type="number"
                  value={panelCapacityWatts}
                  onChange={(e) => handleChange('panelCapacityWatts', parseFloat(e.target.value) || 0)}
                  className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
                <span className="text-[10px] text-slate-500 font-medium">W</span>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-600 w-32">Cost per Watt</label>
                <input
                  type="number"
                  value={costPerWatt}
                  onChange={(e) => handleChange('costPerWatt', parseFloat(e.target.value) || 0)}
                  step="0.1"
                  className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
                <span className="text-[10px] text-slate-500 font-medium">₹/W</span>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-600 w-32">Panel GST %</label>
                <input
                  type="number"
                  value={panelGstPercent}
                  onChange={(e) => handleChange('panelGstPercent', parseFloat(e.target.value) || 0)}
                  step="0.1"
                  className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
                <span className="text-[10px] text-slate-500 font-medium">%</span>
              </div>

              <div className="pt-2 bg-white p-3 rounded-lg border border-blue-100">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-slate-600">Panel Cost (Base)</span>
                  <span className="text-xs font-bold text-slate-900">₹{panelCostTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-medium text-blue-600">Panel Cost (with GST)</span>
                  <span className="text-xs font-bold text-blue-600">₹{panelCostWithGst.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Meter Cost Section */}
          <div className="border-b border-blue-200 pb-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Net Meter Cost</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-600 w-32">Net Meter Cost</label>
                <input
                  type="number"
                  value={netMeterCost}
                  onChange={(e) => handleChange('netMeterCost', parseFloat(e.target.value) || 0)}
                  className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
                <span className="text-[10px] text-slate-500 font-medium">₹</span>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-600 w-32">Net Meter GST %</label>
                <input
                  type="number"
                  value={netMeterGstPercent}
                  onChange={(e) => handleChange('netMeterGstPercent', parseFloat(e.target.value) || 0)}
                  step="0.1"
                  className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
                <span className="text-[10px] text-slate-500 font-medium">%</span>
              </div>

              <div className="pt-2 bg-white p-3 rounded-lg border border-blue-100">
                <div className="flex justify-between">
                  <span className="text-xs font-medium text-blue-600">Net Meter Cost (with GST)</span>
                  <span className="text-xs font-bold text-blue-600">₹{netMeterWithGst.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Subsidy Charges Section */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Subsidy Charges</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-600 w-32">Subsidy Charges</label>
                <input
                  type="number"
                  value={subsidyCharges}
                  onChange={(e) => handleChange('subsidyCharges', parseFloat(e.target.value) || 0)}
                  className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
                <span className="text-[10px] text-slate-500 font-medium">₹</span>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-600 w-32">Subsidy GST %</label>
                <input
                  type="number"
                  value={subsidyGstPercent}
                  onChange={(e) => handleChange('subsidyGstPercent', parseFloat(e.target.value) || 0)}
                  step="0.1"
                  className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
                <span className="text-[10px] text-slate-500 font-medium">%</span>
              </div>

              <div className="pt-2 bg-white p-3 rounded-lg border border-blue-100">
                <div className="flex justify-between">
                  <span className="text-xs font-medium text-blue-600">Subsidy Cost (with GST)</span>
                  <span className="text-xs font-bold text-blue-600">₹{subsidyWithGst.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationPricingConfig;
