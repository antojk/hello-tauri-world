<script setup lang="ts">
import { computed } from 'vue';
import type { GridSettings, Shape, ShapeType, Rectangle, Circle, Polygon, MeasurementUnit } from '../../types/shapes';
import { UNIT_CONVERSION_FACTORS, pixelsToUnit, formatWithUnit } from '../../utils/measurementUnits';
import { formatPoint } from '../../utils/coordinates';

const props = defineProps<{
  gridSettings: GridSettings;
  currentShape: Shape;
  currentShapeType: ShapeType;
  area: number;
}>();

const emit = defineEmits<{
  (e: 'updateGridSettings', settings: Partial<GridSettings>): void;
  (e: 'updateShape', shape: Shape, type: ShapeType): void;
}>();

// Available measurement units
const measurementUnits: MeasurementUnit[] = ['px', 'cm', 'mm', 'in'];

// Format area value with the current unit
const formattedArea = computed(() => {
  return formatWithUnit(props.area, props.gridSettings.unit, 2);
});

// Type guards for shape types
function isRectangle(shape: Shape): shape is Rectangle {
  return 'top_left' in shape && 'bottom_right' in shape;
}

function isCircle(shape: Shape): shape is Circle {
  return 'center' in shape && 'radius' in shape;
}

function isPolygon(shape: Shape): shape is Polygon {
  return 'points' in shape;
}

// Computed properties for rectangle dimensions - only when current shape is rectangle
const rectangleDimensions = computed(() => {
  if (props.currentShapeType !== 'rectangle' || !isRectangle(props.currentShape)) {
    return null;
  }
  
  const rect = props.currentShape;
  const width = Math.abs(rect.bottom_right.x - rect.top_left.x);
  const height = Math.abs(rect.bottom_right.y - rect.top_left.y);
  
  return {
    width: pixelsToUnit(width, props.gridSettings.unit),
    height: pixelsToUnit(height, props.gridSettings.unit),
    perimeter: pixelsToUnit(2 * (width + height), props.gridSettings.unit)
  };
});

// Computed properties for circle dimensions - only when current shape is circle
const circleDimensions = computed(() => {
  if (props.currentShapeType !== 'circle' || !isCircle(props.currentShape)) {
    return null;
  }
  
  const circle = props.currentShape;
  const radius = circle.radius;
  
  return {
    radius: pixelsToUnit(radius, props.gridSettings.unit),
    diameter: pixelsToUnit(2 * radius, props.gridSettings.unit),
    circumference: pixelsToUnit(2 * Math.PI * radius, props.gridSettings.unit)
  };
});

// Computed properties for polygon dimensions - only when current shape is polygon
const polygonDimensions = computed(() => {
  if (props.currentShapeType !== 'polygon' || !isPolygon(props.currentShape)) {
    return null;
  }
  
  const polygon = props.currentShape;
  const points = polygon.points;
  
  if (points.length < 3) {
    return { sides: points.length, perimeter: undefined };
  }
  
  // Calculate perimeter (sum of all sides)
  let perimeter = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const dx = points[j].x - points[i].x;
    const dy = points[j].y - points[i].y;
    perimeter += Math.sqrt(dx * dx + dy * dy);
  }
  
  return {
    sides: points.length,
    perimeter: pixelsToUnit(perimeter, props.gridSettings.unit)
  };
});

// Change measurement unit
function changeUnit(unit: MeasurementUnit) {
  emit('updateGridSettings', { 
    unit,
    conversionFactor: UNIT_CONVERSION_FACTORS[unit]
  });
}

// Toggle grid visibility
function toggleGrid() {
  emit('updateGridSettings', { showGrid: !props.gridSettings.showGrid });
}

// Toggle snap to grid
function toggleSnapToGrid() {
  emit('updateGridSettings', { snapToGrid: !props.gridSettings.snapToGrid });
}

// Change grid size
function changeGridSize(event: Event) {
  const input = event.target as HTMLInputElement;
  const value = parseFloat(input.value);
  
  if (!isNaN(value) && value > 0) {
    emit('updateGridSettings', { gridSize: value });
  }
}
</script>

<template>
  <div class="h-full overflow-y-auto p-4">
    <h3 class="text-lg font-semibold mb-4 pb-2 border-b border-gray-300 dark:border-gray-700">Properties</h3>
    
    <!-- Grid Settings Section -->
    <div class="mb-6">
      <h4 class="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Grid Settings</h4>
      
      <div class="flex justify-between items-center mb-2">
        <label class="font-medium">Units:</label>
        <div class="flex gap-1">
          <button 
            v-for="unit in measurementUnits" 
            :key="unit"
            class="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-700
                   bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            :class="{ 'bg-primary-500 text-white border-primary-600': gridSettings.unit === unit }"
            @click="changeUnit(unit)"
          >
            {{ unit }}
          </button>
        </div>
      </div>
      
      <div class="flex justify-between items-center mb-2">
        <label class="font-medium">Grid Size:</label>
        <input 
          type="number" 
          min="1" 
          max="100" 
          step="1" 
          :value="gridSettings.gridSize" 
          @change="changeGridSize"
          class="w-20 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 
                 bg-white dark:bg-gray-800 text-right"
        />
      </div>
      
      <div class="flex justify-between items-center mb-2">
        <label class="font-medium">Show Grid:</label>
        <input 
          type="checkbox" 
          :checked="gridSettings.showGrid" 
          @change="toggleGrid"
          class="h-4 w-4 text-primary-600 rounded"
        />
      </div>
      
      <div class="flex justify-between items-center mb-2">
        <label class="font-medium">Snap to Grid:</label>
        <input 
          type="checkbox" 
          :checked="gridSettings.snapToGrid" 
          @change="toggleSnapToGrid"
          class="h-4 w-4 text-primary-600 rounded"
        />
      </div>
    </div>
    
    <!-- Shape Properties Section -->
    <div class="mb-6">
      <h4 class="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Shape Properties</h4>
      
      <!-- Rectangle Properties -->
      <template v-if="currentShapeType === 'rectangle' && isRectangle(currentShape) && rectangleDimensions">
        <div class="flex justify-between items-center mb-2">
          <label class="font-medium">Type:</label>
          <span>Rectangle</span>
        </div>
        
        <div class="flex justify-between items-center mb-2">
          <label class="font-medium">Top-Left:</label>
          <span class="text-right">{{ formatPoint(currentShape.top_left, gridSettings) }}</span>
        </div>
        
        <div class="flex justify-between items-center mb-2">
          <label class="font-medium">Bottom-Right:</label>
          <span class="text-right">{{ formatPoint(currentShape.bottom_right, gridSettings) }}</span>
        </div>
        
        <div class="flex justify-between items-center mb-2">
          <label class="font-medium">Width:</label>
          <span>{{ rectangleDimensions.width.toFixed(2) }} {{ gridSettings.unit }}</span>
        </div>
        
        <div class="flex justify-between items-center mb-2">
          <label class="font-medium">Height:</label>
          <span>{{ rectangleDimensions.height.toFixed(2) }} {{ gridSettings.unit }}</span>
        </div>
        
        <div class="flex justify-between items-center mb-2">
          <label class="font-medium">Perimeter:</label>
          <span>{{ rectangleDimensions.perimeter.toFixed(2) }} {{ gridSettings.unit }}</span>
        </div>
      </template>
      
      <!-- Circle Properties -->
      <template v-else-if="currentShapeType === 'circle' && isCircle(currentShape) && circleDimensions">
        <div class="flex justify-between items-center mb-2">
          <label class="font-medium">Type:</label>
          <span>Circle</span>
        </div>
        
        <div class="flex justify-between items-center mb-2">
          <label class="font-medium">Center:</label>
          <span class="text-right">{{ formatPoint(currentShape.center, gridSettings) }}</span>
        </div>
        
        <div class="flex justify-between items-center mb-2">
          <label class="font-medium">Radius:</label>
          <span>{{ circleDimensions.radius.toFixed(2) }} {{ gridSettings.unit }}</span>
        </div>
        
        <div class="flex justify-between items-center mb-2">
          <label class="font-medium">Diameter:</label>
          <span>{{ circleDimensions.diameter.toFixed(2) }} {{ gridSettings.unit }}</span>
        </div>
        
        <div class="flex justify-between items-center mb-2">
          <label class="font-medium">Circumference:</label>
          <span>{{ circleDimensions.circumference.toFixed(2) }} {{ gridSettings.unit }}</span>
        </div>
      </template>
      
      <!-- Polygon Properties -->
      <template v-else-if="currentShapeType === 'polygon' && isPolygon(currentShape) && polygonDimensions">
        <div class="flex justify-between items-center mb-2">
          <label class="font-medium">Type:</label>
          <span>Polygon</span>
        </div>
        
        <div class="flex justify-between items-center mb-2">
          <label class="font-medium">Sides:</label>
          <span>{{ polygonDimensions.sides }}</span>
        </div>
        
        <template v-if="polygonDimensions.sides >= 3 && polygonDimensions.perimeter !== undefined">
          <div class="flex justify-between items-center mb-2">
            <label class="font-medium">Perimeter:</label>
            <span>{{ polygonDimensions.perimeter.toFixed(2) }} {{ gridSettings.unit }}</span>
          </div>
        </template>
        
        <div 
          v-for="(point, index) in currentShape.points" 
          :key="index" 
          class="flex justify-between items-center mb-2"
        >
          <label class="font-medium">Point {{ index + 1 }}:</label>
          <span class="text-right text-sm">{{ formatPoint(point, gridSettings) }}</span>
        </div>
      </template>
      
      <!-- No shape or invalid state -->
      <template v-else>
        <div class="flex justify-between items-center mb-2">
          <label class="font-medium">Type:</label>
          <span>{{ currentShapeType }}</span>
        </div>
        <div class="flex justify-center items-center mb-2 py-2">
          <span class="text-gray-500 dark:text-gray-400 italic">Draw a shape to see its properties</span>
        </div>
      </template>
    </div>
    
    <!-- Measurement Results Section -->
    <div class="mb-6">
      <h4 class="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Measurements</h4>
      
      <div class="flex justify-between items-center mb-2 font-semibold">
        <label class="font-medium">Area:</label>
        <span class="text-green-700 dark:text-green-400">{{ formattedArea }}</span>
      </div>
    </div>
  </div>
</template>