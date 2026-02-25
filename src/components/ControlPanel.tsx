import React, { useState } from 'react';
import { Search, Plus, Trash2, FileText, Zap, DollarSign, Sun, MousePointer2, PenTool, RotateCw, Move, Loader2 } from 'lucide-react';
import { Location, QuotationData } from '../types';
import { PANEL_KW, ELECTRICITY_RATE, AVG_SUN_HOURS_PER_DAY, PANEL_COST, INVERTER_BASE_COST, INVERTER_KW_COST, INSTALLATION_BASE_COST, SUBSIDY_PERCENTAGE, ORIENTATION_EFFICIENCY, STRUCTURE_COST_PER_PANEL } from '../constants';

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
  isGenerating: boolean;
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
  isGenerating,
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
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');

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

  const calculateQuotation = () => {
    const panelsCost = panelCount * PANEL_COST;
    const structureCost = panelCount * STRUCTURE_COST_PER_PANEL;
    const inverterCost = INVERTER_BASE_COST + (systemSizeKw * INVERTER_KW_COST);
    const installationCost = INSTALLATION_BASE_COST;
    const totalCost = panelsCost + structureCost + inverterCost + installationCost;
    const subsidy = totalCost * SUBSIDY_PERCENTAGE;
    const finalAmount = totalCost - subsidy;

    onGenerateQuotation({
      customerName,
      customerContact,
      panelCount,
      systemSizeKw,
      annualGenerationKwh,
      annualSavings,
      totalCost,
      subsidy,
      finalAmount,
      orientation,
      efficiencyFactor,
      shadeFactor: actualShadeFactor,
      breakdown: {
        panels: panelsCost,
        inverter: inverterCost,
        structure: structureCost,
        installation: installationCost,
      }
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

        {/* Orientation Selector */}
        <section>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Roof Orientation
          </label>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 font-medium">Facing Direction</span>
              <span className="text-sm font-bold text-slate-900">{orientation}° ({orientation >= 135 && orientation <= 225 ? 'South' : orientation >= 315 || orientation <= 45 ? 'North' : 'East/West'})</span>
            </div>
            <input
              type="range"
              min="0"
              max="359"
              value={orientation}
              onChange={(e) => setOrientation(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>N</span>
              <span>E</span>
              <span>S</span>
              <span>W</span>
              <span>N</span>
            </div>
          </div>
        </section>

        {/* Shading Selector */}
        <section>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Shading Analysis
          </label>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 font-medium">Est. Shading</span>
              <span className="text-sm font-bold text-slate-900">{shadeFactor}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={shadeFactor}
              onChange={(e) => setShadeFactor(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <p className="text-[10px] text-slate-400">
              {shadeFactor === 0 ? 'Full sun exposure' : shadeFactor < 30 ? 'Partial shading (trees/buildings)' : 'Significant shading'}
            </p>
          </div>
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
        </section>

        {/* Real-time Stats */}
        <section className="space-y-4">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            System Estimates
          </label>
          
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
                <p className="text-xl font-bold text-slate-900">${annualSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                <p className="text-[10px] text-emerald-600">Efficiency: {(efficiencyFactor * 100).toFixed(0)}%</p>
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
