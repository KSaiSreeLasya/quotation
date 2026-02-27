export interface Point {
  x: number;
  y: number;
}

export interface Panel {
  id: string;
  x: number;
  y: number;
  rotation: number;
  isLandscape: boolean;
  isValid: boolean;
  lat: number;
  lng: number;
}

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface QuotationData {
  customerName: string;
  customerContact: string;
  panelCount: number;
  systemSizeKw: number;
  annualGenerationKwh: number;
  annualSavings: number;
  totalCost: number;
  subsidy: number;
  finalAmount: number;
  orientation: number; // 0-360
  efficiencyFactor: number;
  shadeFactor: number; // 0-1
  designImage?: string; // Base64 data URL
  breakdown: {
    panels: number;
    inverter: number;
    structure: number;
    installation: number;
  };
  // Pricing Configuration
  panelCapacityWatts?: number;
  costPerWatt?: number;
  panelGstPercent?: number;
  netMeterCost?: number;
  netMeterGstPercent?: number;
  subsidyCharges?: number;
  subsidyGstPercent?: number;
  // Calculated pricing
  panelCost?: number;
  panelCostWithGst?: number;
  netMeterCostWithGst?: number;
  subsidyCostWithGst?: number;
}
