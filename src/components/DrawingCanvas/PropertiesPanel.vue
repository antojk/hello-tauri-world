<script setup lang="ts">
import { computed } from 'vue';
import type { GridSettings, Shape, ShapeType, Point, Rectangle, Circle, Polygon, MeasurementUnit } from '../../types/shapes';
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
    return { sides: points.length };
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
  <div class="properties-panel">
    <h3 class="panel-title">Properties</h3>
    
    <!-- Grid Settings Section -->
    <div class="panel-section">
      <h4 class="section-title">Grid Settings</h4>
      
      <div class="setting-row">
        <label>Units:</label>
        <div class="unit-selector">
          <button 
            v-for="unit in measurementUnits" 
            :key="unit"
            :class="{ active: gridSettings.unit === unit }"
            @click="changeUnit(unit)"
          >
            {{ unit }}
          </button>
        </div>
      </div>
      
      <div class="setting-row">
        <label>Grid Size:</label>
        <input 
          type="number" 
          min="1" 
          max="100" 
          step="1" 
          :value="gridSettings.gridSize" 
          @change="changeGridSize"
        />
      </div>
      
      <div class="setting-row checkbox-row">
        <label>Show Grid:</label>
        <input 
          type="checkbox" 
          :checked="gridSettings.showGrid" 
          @change="toggleGrid"
        />
      </div>
      
      <div class="setting-row checkbox-row">
        <label>Snap to Grid:</label>
        <input 
          type="checkbox" 
          :checked="gridSettings.snapToGrid" 
          @change="toggleSnapToGrid"
        />
      </div>
    </div>
    
    <!-- Shape Properties Section -->
    <div class="panel-section">
      <h4 class="section-title">Shape Properties</h4>
      
      <!-- Rectangle Properties -->
      <template v-if="currentShapeType === 'rectangle' && isRectangle(currentShape) && rectangleDimensions">
        <div class="setting-row">
          <label>Type:</label>
          <span>Rectangle</span>
        </div>
        
        <div class="setting-row">
          <label>Top-Left:</label>
          <span>{{ formatPoint(currentShape.top_left, gridSettings) }}</span>
        </div>
        
        <div class="setting-row">
          <label>Bottom-Right:</label>
          <span>{{ formatPoint(currentShape.bottom_right, gridSettings) }}</span>
        </div>
        
        <div class="setting-row">
          <label>Width:</label>
          <span>{{ rectangleDimensions.width.toFixed(2) }} {{ gridSettings.unit }}</span>
        </div>
        
        <div class="setting-row">
          <label>Height:</label>
          <span>{{ rectangleDimensions.height.toFixed(2) }} {{ gridSettings.unit }}</span>
        </div>
        
        <div class="setting-row">
          <label>Perimeter:</label>
          <span>{{ rectangleDimensions.perimeter.toFixed(2) }} {{ gridSettings.unit }}</span>
        </div>
      </template>
      
      <!-- Circle Properties -->
      <template v-else-if="currentShapeType === 'circle' && isCircle(currentShape) && circleDimensions">
        <div class="setting-row">
          <label>Type:</label>
          <span>Circle</span>
        </div>
        
        <div class="setting-row">
          <label>Center:</label>
          <span>{{ formatPoint(currentShape.center, gridSettings) }}</span>
        </div>
        
        <div class="setting-row">
          <label>Radius:</label>
          <span>{{ circleDimensions.radius.toFixed(2) }} {{ gridSettings.unit }}</span>
        </div>
        
        <div class="setting-row">
          <label>Diameter:</label>
          <span>{{ circleDimensions.diameter.toFixed(2) }} {{ gridSettings.unit }}</span>
        </div>
        
        <div class="setting-row">
          <label>Circumference:</label>
          <span>{{ circleDimensions.circumference.toFixed(2) }} {{ gridSettings.unit }}</span>
        </div>
      </template>
      
      <!-- Polygon Properties -->
      <template v-else-if="currentShapeType === 'polygon' && isPolygon(currentShape) && polygonDimensions">
        <div class="setting-row">
          <label>Type:</label>
          <span>Polygon</span>
        </div>
        
        <div class="setting-row">
          <label>Sides:</label>
          <span>{{ polygonDimensions.sides }}</span>
        </div>
        
        <template v-if="polygonDimensions.sides >= 3 && 'perimeter' in polygonDimensions">
          <div class="setting-row">
            <label>Perimeter:</label>
            <span>{{ polygonDimensions.perimeter.toFixed(2) }} {{ gridSettings.unit }}</span>
          </div>
        </template>
        
        <div 
          v-for="(point, index) in currentShape.points" 
          :key="index" 
          class="setting-row"
        >
          <label>Point {{ index + 1 }}:</label>
          <span>{{ formatPoint(point, gridSettings) }}</span>
        </div>
      </template>
      
      <!-- No shape or invalid state -->
      <template v-else>
        <div class="setting-row">
          <label>Type:</label>
          <span>{{ currentShapeType }}</span>
        </div>
        <div class="setting-row">
          <span class="info-text">Draw a shape to see its properties</span>
        </div>
      </template>
    </div>
    
    <!-- Measurement Results Section -->
    <div class="panel-section">
      <h4 class="section-title">Measurements</h4>
      
      <div class="setting-row result-row">
        <label>Area:</label>
        <span class="area-value">{{ formattedArea }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.properties-panel {
  background-color: #f5f5f5;
  border-left: 1px solid #ccc;
  font-size: 0.9rem;
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  width: 100%;
}

.panel-title {
  border-bottom: 1px solid #ccc;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 16px;
  padding-bottom: 8px;
  text-align: center;
}

.panel-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0 0 12px;
  color: #666;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  align-items: center;
}

.checkbox-row {
  align-items: center;
}

.setting-row label {
  flex: 0 0 40%;
  font-weight: 500;
}

.setting-row span {
  flex: 0 0 60%;
  text-align: right;
}

.info-text {
  color: #777;
  font-style: italic;
  text-align: center;
  width: 100%;
  padding: 8px 0;
}

.unit-selector {
  display: flex;
  gap: 4px;
}

.unit-selector button {
  background-color: #e0e0e0;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 4px 8px;
  transition: all 0.2s;
}

.unit-selector button.active {
  background-color: #2196F3;
  color: white;
  border-color: #1976D2;
}

input[type="number"] {
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 4px 8px;
  width: 80px;
  text-align: right;
}

.result-row {
  font-weight: 600;
}

.area-value {
  color: #2e7d32;
}

@media (prefers-color-scheme: dark) {
  .properties-panel {
    background-color: #333;
    border-color: #444;
    color: #eee;
  }
  
  .panel-title {
    border-color: #555;
  }
  
  .section-title {
    color: #aaa;
  }
  
  .info-text {
    color: #aaa;
  }
  
  .unit-selector button {
    background-color: #444;
    border-color: #555;
    color: #eee;
  }
  
  input[type="number"] {
    background-color: #444;
    border-color: #555;
    color: #eee;
  }
  
  .area-value {
    color: #81c784;
  }
}
</style>