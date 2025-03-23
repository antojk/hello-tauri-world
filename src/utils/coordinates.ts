import type { Point, GridSettings } from '../types/shapes';
import { pixelsToUnit, unitToPixels } from './measurementUnits';

/**
 * Converts from canvas coordinates (origin at top-left, Y down) to
 * mathematical coordinates (origin at center, Y up)
 */
export function canvasToMath(
  x: number, 
  y: number, 
  canvasWidth: number, 
  canvasHeight: number
): Point {
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  
  return {
    x: x - centerX,
    y: -(y - centerY), // Flip Y axis
  };
}

/**
 * Converts from mathematical coordinates (origin at center, Y up) to
 * canvas coordinates (origin at top-left, Y down)
 */
export function mathToCanvas(
  x: number, 
  y: number, 
  canvasWidth: number, 
  canvasHeight: number
): Point {
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  
  return {
    x: x + centerX,
    y: -y + centerY, // Flip Y axis
  };
}

/**
 * Snaps a coordinate to the nearest grid line
 */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Converts from canvas coordinates to grid-snapped mathematical coordinates
 */
export function canvasToGridPoint(
  x: number, 
  y: number, 
  canvasWidth: number, 
  canvasHeight: number,
  gridSettings: GridSettings
): Point {
  // First convert to math coordinates
  const mathPoint = canvasToMath(x, y, canvasWidth, canvasHeight);
  
  // Snap to grid if enabled
  if (gridSettings.snapToGrid) {
    return {
      x: snapToGrid(mathPoint.x, gridSettings.gridSize),
      y: snapToGrid(mathPoint.y, gridSettings.gridSize),
    };
  }
  
  return mathPoint;
}

/**
 * Converts from mathematical grid coordinates to display units
 */
export function gridToUnitCoordinates(
  point: Point, 
  gridSettings: GridSettings
): Point {
  return {
    x: pixelsToUnit(point.x, gridSettings.unit),
    y: pixelsToUnit(point.y, gridSettings.unit),
  };
}

/**
 * Converts from display unit coordinates to mathematical grid coordinates
 */
export function unitToGridCoordinates(
  point: Point, 
  gridSettings: GridSettings
): Point {
  return {
    x: unitToPixels(point.x, gridSettings.unit),
    y: unitToPixels(point.y, gridSettings.unit),
  };
}

/**
 * Format a point as a string with proper units
 */
export function formatPoint(
  point: Point,
  gridSettings: GridSettings,
  precision: number = 2
): string {
  const unitPoint = gridToUnitCoordinates(point, gridSettings);
  return `(${unitPoint.x.toFixed(precision)} ${gridSettings.unit}, ${unitPoint.y.toFixed(precision)} ${gridSettings.unit})`;
}

/**
 * Calculate distance between two points
 */
export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}
