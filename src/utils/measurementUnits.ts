import type { MeasurementUnit } from '../types/shapes';

// Define pixel density (dots per inch)
// Standard screen is typically 96 DPI, but could vary
const DPI = 96;

// Conversion factors to internal pixels
export const UNIT_CONVERSION_FACTORS: Record<MeasurementUnit, number> = {
  'px': 1,               // 1 pixel = 1 internal unit
  'cm': DPI / 2.54,      // 1 centimeter = 37.8 pixels (at 96 DPI)
  'mm': DPI / 25.4,      // 1 millimeter = 3.78 pixels (at 96 DPI)
  'in': DPI,             // 1 inch = 96 pixels (at 96 DPI)
};

// Convert from pixels to specified unit
export function pixelsToUnit(pixels: number, unit: MeasurementUnit): number {
  return pixels / UNIT_CONVERSION_FACTORS[unit];
}

// Convert from specified unit to pixels
export function unitToPixels(value: number, unit: MeasurementUnit): number {
  return value * UNIT_CONVERSION_FACTORS[unit];
}

// Format value with unit for display
export function formatWithUnit(value: number, unit: MeasurementUnit, precision: number = 2): string {
  return `${value.toFixed(precision)} ${unit}`;
}

// Get next appropriate grid size based on zoom level
export function getAppropriateGridSize(zoomLevel: number, unit: MeasurementUnit): number {
  // Base grid sizes in the respective units
  const baseGridSizes: Record<MeasurementUnit, number[]> = {
    'px': [1, 5, 10, 20, 50, 100],
    'cm': [0.1, 0.5, 1, 2, 5, 10],
    'mm': [1, 2, 5, 10, 20, 50],
    'in': [0.125, 0.25, 0.5, 1, 2, 5], // 1/8", 1/4", 1/2", etc.
  };
  
  // Select a grid size based on the zoom level
  const sizes = baseGridSizes[unit];
  const index = Math.max(0, Math.min(Math.floor(zoomLevel / 0.5), sizes.length - 1));
  
  // Convert to pixels for internal use
  return unitToPixels(sizes[index], unit);
}

// Get appropriate major grid lines (every n grid lines)
export function getMajorGridInterval(unit: MeasurementUnit): number {
  const majorIntervals: Record<MeasurementUnit, number> = {
    'px': 5,   // Every 5 pixel lines
    'cm': 1,   // Every 1 cm line
    'mm': 10,  // Every 10 mm line (1 cm)
    'in': 1,   // Every 1 inch line
  };
  
  return majorIntervals[unit];
}

// Get unit label
export function getUnitLabel(unit: MeasurementUnit): string {
  const unitLabels: Record<MeasurementUnit, string> = {
    'px': 'pixels',
    'cm': 'centimeters',
    'mm': 'millimeters',
    'in': 'inches',
  };
  
  return unitLabels[unit];
}
