export interface Point {
  x: number;
  y: number;
}

export interface Rectangle {
  top_left: Point;
  bottom_right: Point;
}

export interface Circle {
  center: Point;
  radius: number;
}

export interface Polygon {
  points: Point[];
}

export type Shape = Rectangle | Circle | Polygon;

export type ShapeType = 'rectangle' | 'circle' | 'polygon';

export type MeasurementUnit = 'px' | 'cm' | 'mm' | 'in';

export interface GridSettings {
  gridSize: number;         // Grid cell size in internal units
  unit: MeasurementUnit;    // User-facing measurement unit
  showGrid: boolean;        // Whether to display the grid
  snapToGrid: boolean;      // Whether to snap points to grid
  conversionFactor: number; // Conversion factor from internal units to selected unit
}
