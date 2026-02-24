export const PANEL_WIDTH = 40; // portrait width
export const PANEL_HEIGHT = 65; // portrait height

export const PANEL_WATTAGE = 550; // 550W per panel
export const PANEL_KW = PANEL_WATTAGE / 1000; 
export const PANEL_COST = 450; // $ per panel
export const STRUCTURE_COST_PER_PANEL = 80;
export const INVERTER_BASE_COST = 1500;
export const INVERTER_KW_COST = 300;
export const INSTALLATION_BASE_COST = 3000;
export const SUBSIDY_PERCENTAGE = 0.30; // 30% federal credit

export const AVG_SUN_HOURS_PER_DAY = 4.5;
export const ELECTRICITY_RATE = 0.18; // $ per kWh

export const DEFAULT_LOCATION = {
  lat: 37.7749,
  lng: -122.4194,
  address: "San Francisco, CA"
};

export const ORIENTATION_EFFICIENCY = {
  SOUTH: 1.0,
  EAST_WEST: 0.88,
  NORTH: 0.65
};
