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
}

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface QuotationData {
  panelCount: number;
  systemSizeKw: number;
  annualGenerationKwh: number;
  annualSavings: number;
  totalCost: number;
  subsidy: number;
  finalAmount: number;
  orientation: number; // 0-360
  efficiencyFactor: number;
  breakdown: {
    panels: number;
    inverter: number;
    structure: number;
    installation: number;
  };
}
