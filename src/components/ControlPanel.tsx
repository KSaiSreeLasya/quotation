import React, { useState } from 'react';
import { Search, Plus, Trash2, FileText, Zap, DollarSign, Sun, MousePointer2, PenTool, RotateCw, Move, Loader2, Sparkles, TrendingUp, ChevronDown } from 'lucide-react';
import { Location, QuotationData, Point } from '../types';
import { PANEL_KW, ELECTRICITY_RATE, AVG_SUN_HOURS_PER_DAY, PANEL_COST, INVERTER_BASE_COST, INVERTER_KW_COST, INSTALLATION_BASE_COST, SUBSIDY_PERCENTAGE, ORIENTATION_EFFICIENCY, STRUCTURE_COST_PER_PANEL, ANNUAL_DEGRADATION, MAINTENANCE_COST_YEARLY } from '../constants';
import SmartOrientationSelector from './SmartOrientationSelector';
import EfficiencyComparison from './EfficiencyComparison';
import RooftopAnalysis from './RooftopAnalysis';
import ShadingAnalysis from './ShadingAnalysis';
import PlacementAdvisor from './PlacementAdvisor';
import QuotationPricingConfig from './QuotationPricingConfig';
import { Panel } from '../types';

interface ControlPanelProps {
  location: Location;
  setLocation: (loc: Location) => void;
  panelCount: number;
  onAddPanel: () => void;
  onRemoveSelected: () => void;
  onGenerateQuotation: (data: QuotationData) => void;
  hasSelected: boolean;
  isDrawingMode: boolean;
  setIsDrawingMode: (mode: boolean) => void;
  isPanningMode: boolean;
  setIsPanningMode: (mode: boolean) => void;
  onClearBoundary: () => void;
  onAutoFill: (orientation: number, targetKw?: number) => void;
  isGenerating: boolean;
  boundary?: Point[];
  pixelsPerMeter?: number;
  panels?: Panel[];
  selectedIds?: string[];
  onPanelSelect?: (panelId: string) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  location,
  setLocation,
  panelCount,
  onAddPanel,
  onRemoveSelected,
  onGenerateQuotation,
  hasSelected,
  isDrawingMode,
  setIsDrawingMode,
  isPanningMode,
  setIsPanningMode,
  onClearBoundary,
  onAutoFill,
  isGenerating,
  boundary = [],
  pixelsPerMeter = 1,
  panels = [],
  selectedIds = [],
  onPanelSelect,
}) => {
  const [addressInput, setAddressInput] = useState(location.address);
  const [latInput, setLatInput] = useState(location.lat.toString());
  const [lngInput, setLngInput] = useState(location.lng.toString());

  // Sync inputs when location prop changes (e.g. from address search)
  React.useEffect(() => {
    setLatInput(location.lat.toString());
    setLngInput(location.lng.toString());
    setAddressInput(location.address);
  }, [location]);

  const [orientation, setOrientation] = useState(180); // Default South
  const [shadeFactor, setShadeFactor] = useState(0); // 0% shading = 1.0 factor
  const [targetKw, setTargetKw] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [showAdvancedAnalysis, setShowAdvancedAnalysis] = useState(false);

  // Pricing Configuration
  const [panelCapacityWatts, setPanelCapacityWatts] = useState(550); // Default 550W
  const [costPerWatt, setCostPerWatt] = useState(53.5); // Default ₹53.5/watt
  const [panelGstPercent, setPanelGstPercent] = useState(8.9);
  const [netMeterCost, setNetMeterCost] = useState(1500);
  const [netMeterGstPercent, setNetMeterGstPercent] = useState(18);
  const [subsidyCharges, setSubsidyCharges] = useState(1500);
  const [subsidyGstPercent, setSubsidyGstPercent] = useState(18);
  const [isSubsidyEligible, setIsSubsidyEligible] = useState(false); // Checkbox for subsidy eligibility
  const [subsidyAmount, setSubsidyAmount] = useState(78000); // Subsidy amount when eligible

  const getEfficiencyFactor = (deg: number) => {
    if (deg >= 135 && deg <= 225) return ORIENTATION_EFFICIENCY.SOUTH;
    if (deg >= 315 || deg <= 45) return ORIENTATION_EFFICIENCY.NORTH;
    return ORIENTATION_EFFICIENCY.EAST_WEST;
  };

  const efficiencyFactor = getEfficiencyFactor(orientation);
  const actualShadeFactor = 1 - (shadeFactor / 100);
  const systemSizeKw = panelCount * PANEL_KW;
  const annualGenerationKwh = systemSizeKw * AVG_SUN_HOURS_PER_DAY * 365 * efficiencyFactor * actualShadeFactor;
  const annualSavings = annualGenerationKwh * ELECTRICITY_RATE;

  const efficiencyScore = efficiencyFactor * actualShadeFactor;
  const getEfficiencyLabel = (score: number) => {
    if (score >= 0.9) return { label: 'Excellent', color: 'text-emerald-500', bg: 'bg-emerald-50' };
    if (score >= 0.75) return { label: 'Good', color: 'text-amber-500', bg: 'bg-amber-50' };
    return { label: 'Average', color: 'text-rose-500', bg: 'bg-rose-50' };
  };
  const scoreData = getEfficiencyLabel(efficiencyScore);

  const panelsCost = panelCount * PANEL_COST;
  const structureCost = panelCount * STRUCTURE_COST_PER_PANEL;
  const inverterCost = INVERTER_BASE_COST + (systemSizeKw * INVERTER_KW_COST);
  const installationCost = INSTALLATION_BASE_COST;
  const totalCost = panelsCost + structureCost + inverterCost + installationCost;
  const subsidy = isSubsidyEligible ? subsidyAmount : 0; // Apply subsidy only if eligible
  const finalAmount = totalCost - subsidy;

  // Calculate pricing based on configuration
  const panelCostByConfig = panelCapacityWatts * costPerWatt * panelCount;
  const panelCostByConfigWithGst = panelCostByConfig * (1 + panelGstPercent / 100);
  const netMeterWithGst = netMeterCost * (1 + netMeterGstPercent / 100);
  const subsidyWithGst = subsidyCharges * (1 + subsidyGstPercent / 100);

  const calculateQuotation = () => {
    onGenerateQuotation({
      customerName,
      customerContact,
      panelCount,
      systemSizeKw,
      annualGenerationKwh,
      annualSavings,
      totalCost,
      subsidy: isSubsidyEligible ? subsidyAmount : 0,
      finalAmount: totalCost - (isSubsidyEligible ? subsidyAmount : 0),
      orientation,
      efficiencyFactor,
      shadeFactor: actualShadeFactor,
      breakdown: {
        panels: panelsCost,
        inverter: inverterCost,
        structure: structureCost,
        installation: installationCost,
      },
      // Pricing Configuration
      panelCapacityWatts,
      costPerWatt,
      panelGstPercent,
      netMeterCost,
      netMeterGstPercent,
      subsidyCharges,
      subsidyGstPercent,
      // Calculated pricing
      panelCost: panelCostByConfig,
      panelCostWithGst: panelCostByConfigWithGst,
      netMeterCostWithGst: netMeterWithGst,
      subsidyCostWithGst: subsidyWithGst,
      // Electricity and Profit Analysis
      monthlyUnitsConsumedBefore: 360,
      monthlyUnitsConsumedAfter: 50,
      monthlyBillBefore: 2330,
      monthlyBillAfter: 97.5,
      tariffIncrement: 2,
    });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressInput) return;

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      alert("Please provide a Google Maps API Key in .env");
      return;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressInput)}&key=${apiKey}`
      );
      const data = await response.json();
      if (data.results && data.results[0]) {
        const { lat, lng } = data.results[0].geometry.location;
        setLocation({
          lat,
          lng,
          address: data.results[0].formatted_address,
        });
      } else {
        alert("Address not found");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }
  };

  const handleCoordinateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (!isNaN(lat) && !isNaN(lng)) {
      setLocation({
        lat,
        lng,
        address: `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      });
    }
  };

  return (
    <div className="w-96 h-full bg-white border-r border-slate-200 flex flex-col shadow-xl z-30">
      <div className="p-6 border-b border-slate-100">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Sun className="text-amber-500" />
          SolarRoof
        </h1>
        <p className="text-sm text-slate-500 mt-1">Plan your solar future today.</p>
      </div>

      <div className="p-6 flex-1 overflow-y-auto space-y-8">
        {/* Customer Details */}
        <section className="space-y-4">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Customer Details
          </label>
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer Name"
                className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm transition-all"
              />
            </div>
            <div className="relative">
              <input
                type="text"
                value={customerContact}
                onChange={(e) => setCustomerContact(e.target.value)}
                placeholder="Contact Number"
                className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm transition-all"
              />
            </div>
          </div>
        </section>

        {/* Address Search */}
        <section>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Property Address
          </label>
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="Enter your address..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none text-sm"
            />
            <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
          </form>
        </section>

        {/* Coordinates Search */}
        <section>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Exact Coordinates
          </label>
          <form onSubmit={handleCoordinateSubmit} className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={latInput}
                  onChange={(e) => setLatInput(e.target.value)}
                  placeholder="Latitude"
                  className="w-full pl-3 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none text-sm"
                />
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={lngInput}
                  onChange={(e) => setLngInput(e.target.value)}
                  placeholder="Longitude"
                  className="w-full pl-3 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all"
            >
              Go to Coordinates
            </button>
          </form>
        </section>

        {/* Roof Boundary Controls */}
        {/* Design Tools */}
        <section>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Design Tools
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setIsDrawingMode(!isDrawingMode);
                if (!isDrawingMode) setIsPanningMode(false);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all ${
                isDrawingMode 
                ? 'bg-amber-500 text-white border-amber-600 shadow-lg shadow-amber-100' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {isDrawingMode ? <MousePointer2 size={16} /> : <PenTool size={16} />}
              <span className="text-sm font-medium">{isDrawingMode ? 'Finish' : 'Draw Roof'}</span>
            </button>
            <button
              onClick={() => {
                setIsPanningMode(!isPanningMode);
                if (!isPanningMode) setIsDrawingMode(false);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all ${
                isPanningMode 
                ? 'bg-slate-900 text-white border-slate-950 shadow-lg shadow-slate-200' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Move size={16} />
              <span className="text-sm font-medium">{isPanningMode ? 'Stop Pan' : 'Pan Map'}</span>
            </button>
          </div>
          {isDrawingMode && (
            <button
              onClick={onClearBoundary}
              className="w-full mt-2 py-2 text-[10px] font-bold text-rose-500 uppercase tracking-wider hover:bg-rose-50 rounded-lg transition-colors"
            >
              Clear Boundary
            </button>
          )}
        </section>

        {/* Quotation Pricing Configuration */}
        <section>
          <QuotationPricingConfig
            panelCapacityWatts={panelCapacityWatts}
            costPerWatt={costPerWatt}
            panelGstPercent={panelGstPercent}
            netMeterCost={netMeterCost}
            netMeterGstPercent={netMeterGstPercent}
            subsidyCharges={subsidyCharges}
            subsidyGstPercent={subsidyGstPercent}
            onUpdate={(config) => {
              setPanelCapacityWatts(config.panelCapacityWatts);
              setCostPerWatt(config.costPerWatt);
              setPanelGstPercent(config.panelGstPercent);
              setNetMeterCost(config.netMeterCost);
              setNetMeterGstPercent(config.netMeterGstPercent);
              setSubsidyCharges(config.subsidyCharges);
              setSubsidyGstPercent(config.subsidyGstPercent);
            }}
          />
        </section>

        {/* Smart Analysis Tools */}
        <section>
          <button
            onClick={() => setShowAdvancedAnalysis(!showAdvancedAnalysis)}
            className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-all"
          >
            <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Smart Solar Analysis</span>
            <ChevronDown
              size={16}
              className={`text-indigo-600 transition-transform ${showAdvancedAnalysis ? 'rotate-180' : ''}`}
            />
          </button>

          {showAdvancedAnalysis && (
            <div className="mt-3 space-y-6 pb-4">
              {/* Smart Orientation Selector */}
              <div className="border-t-2 border-indigo-100 pt-4">
                <SmartOrientationSelector
                  latitude={location.lat}
                  currentOrientation={orientation}
                  onOrientationChange={setOrientation}
                  boundaryPoints={boundary}
                  pixelsPerMeter={pixelsPerMeter}
                  shadeFactor={shadeFactor}
                />
              </div>

              {/* Efficiency Comparison */}
              <div className="border-t-2 border-indigo-100 pt-4">
                <EfficiencyComparison
                  latitude={location.lat}
                  systemSizeKw={panelCount * PANEL_KW}
                  currentAzimuth={orientation}
                  currentTiltAngle={30}
                  shadingFactor={shadeFactor}
                />
              </div>

              {/* Rooftop Analysis */}
              <div className="border-t-2 border-indigo-100 pt-4">
                <RooftopAnalysis
                  boundaryPoints={boundary}
                  pixelsPerMeter={pixelsPerMeter}
                  latitude={location.lat}
                  currentOrientation={orientation}
                  currentPanelCount={panelCount}
                  shadingPercentage={shadeFactor}
                />
              </div>

              {/* Shading Analysis */}
              <div className="border-t-2 border-indigo-100 pt-4">
                <ShadingAnalysis
                  shadingPercentage={shadeFactor}
                  onShadingChange={setShadeFactor}
                  latitude={location.lat}
                />
              </div>

              {/* Panel Placement Advisor */}
              {panels.length > 0 && (
                <div className="border-t-2 border-indigo-100 pt-4">
                  <PlacementAdvisor
                    panels={panels}
                    latitude={location.lat}
                    boundaryPoints={boundary}
                    pixelsPerMeter={pixelsPerMeter}
                    selectedIds={selectedIds}
                    onPanelSelect={onPanelSelect}
                  />
                </div>
              )}
            </div>
          )}
        </section>

        {/* Panel Controls */}
        <section>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Panel Management
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onAddPanel}
              disabled={isDrawingMode}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all shadow-lg ${
                isDrawingMode
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200'
              }`}
            >
              <Plus size={18} />
              <span className="font-medium">Add Panel</span>
            </button>
            <button
              onClick={onRemoveSelected}
              disabled={!hasSelected || isDrawingMode}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
                hasSelected && !isDrawingMode
                ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200' 
                : 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed'
              }`}
            >
              <Trash2 size={18} />
              <span className="font-medium">Remove</span>
            </button>
          </div>
          <button
            onClick={() => onAutoFill(orientation, targetKw ? parseFloat(targetKw) : undefined)}
            disabled={isDrawingMode}
            className={`w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-xl transition-all border-2 border-dashed ${
              isDrawingMode
              ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
              : 'bg-white text-amber-600 border-amber-200 hover:bg-amber-50 hover:border-amber-300'
            }`}
          >
            <Sparkles size={18} />
            <span className="font-bold">Auto-Fill Roof</span>
          </button>
          <div className="mt-3 relative">
            <input
              type="number"
              value={targetKw}
              onChange={(e) => setTargetKw(e.target.value)}
              placeholder="Target kW (Optional)"
              className="w-full pl-4 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs transition-all"
            />
            <div className="absolute right-3 top-2 text-[10px] font-bold text-slate-400 uppercase">kW</div>
          </div>
        </section>

        {/* Subsidy Configuration */}
        <section className="space-y-3">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Government Subsidy
          </label>
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
            <input
              type="checkbox"
              id="subsidy-eligible"
              checked={isSubsidyEligible}
              onChange={(e) => setIsSubsidyEligible(e.target.checked)}
              className="w-5 h-5 text-emerald-600 rounded cursor-pointer"
            />
            <label htmlFor="subsidy-eligible" className="flex-1 text-sm font-semibold text-slate-700 cursor-pointer">
              Customer is eligible for subsidy
            </label>
          </div>

          {isSubsidyEligible && (
            <div className="space-y-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <label className="text-xs font-semibold text-emerald-900 uppercase tracking-wider">
                Subsidy Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={subsidyAmount}
                  onChange={(e) => setSubsidyAmount(parseFloat(e.target.value) || 0)}
                  placeholder="Enter subsidy amount"
                  className="w-full pl-4 pr-4 py-3 bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-all"
                />
                <span className="absolute right-4 top-3 text-[10px] font-bold text-emerald-600 uppercase">₹</span>
              </div>
              <p className="text-xs text-emerald-700 font-medium">Subsidy to be credited: ₹{subsidyAmount.toLocaleString()}</p>
            </div>
          )}

          {!isSubsidyEligible && (
            <p className="text-xs text-slate-500 italic">Customer will not receive subsidy benefits</p>
          )}
        </section>

        {/* Real-time Stats */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              System Estimates
            </label>
            <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${scoreData.bg} ${scoreData.color}`}>
              {scoreData.label} Efficiency
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white">
                <Zap size={20} />
              </div>
              <div>
                <p className="text-xs text-amber-700 font-medium uppercase">System Size</p>
                <p className="text-xl font-bold text-slate-900">{systemSizeKw.toFixed(2)} kW</p>
                <p className="text-[10px] text-amber-600">{panelCount} panels @ 550W</p>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                <DollarSign size={20} />
              </div>
              <div>
                <p className="text-xs text-emerald-700 font-medium uppercase">Est. Annual Savings</p>
                <p className="text-xl font-bold text-slate-900">₹{annualSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                <p className="text-[10px] text-emerald-600">ROI: ~{(finalAmount / annualSavings).toFixed(1)} years</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase">25-Year Savings</p>
                <p className="text-xl font-bold text-slate-900">₹{(annualSavings * 25 * 0.9).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                <p className="text-[10px] text-slate-400">Incl. degradation & maintenance</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="p-6 border-top border-slate-100 bg-slate-50">
        <button
          onClick={calculateQuotation}
          disabled={panelCount === 0 || isDrawingMode || isGenerating}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl ${
            panelCount > 0 && !isDrawingMode && !isGenerating
            ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-200' 
            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Generating...
            </>
          ) : (
            <>
              <FileText size={20} />
              Generate Quotation
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
