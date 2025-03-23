\<script setup lang="ts">
import { ref, onMounted, reactive, watch, onUnmounted, computed } from 'vue';
import ShapeMenu from './ShapeMenu.vue';
import GraphGrid from './GraphGrid.vue';
import DrawingArea from './DrawingArea.vue';
import PropertiesPanel from './PropertiesPanel.vue';
import ResizablePanel from '../ResizablePanel.vue';
import type { Shape, ShapeType, GridSettings, Rectangle, Circle, Polygon } from '../../types/shapes';
import { UNIT_CONVERSION_FACTORS } from '../../utils/measurementUnits';

const props = defineProps<{
  initialShape?: Shape;
  initialShapeType?: ShapeType;
}>();

const emit = defineEmits<{
  (e: 'shapeUpdated', shape: Shape, type: ShapeType): void;
}>();

// Refs for component instances
const drawingAreaRef = ref<InstanceType<typeof DrawingArea> | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);

// Reactive state
const canvasWidth = ref(800);
const canvasHeight = ref(600);
const currentShape = ref<Shape>(props.initialShape || {
  top_left: { x: 0, y: 0 },
  bottom_right: { x: 0, y: 0 }
});
const currentShapeType = ref<ShapeType>(props.initialShapeType || 'rectangle');
const showPropertiesPanel = ref(true);

// Grid settings
const gridSettings = reactive<GridSettings>({
  gridSize: 20,
  unit: 'px',
  showGrid: true,
  snapToGrid: true,
  conversionFactor: UNIT_CONVERSION_FACTORS['px']
});

// Calculate area based on current shape
const area = computed(() => {
  if (currentShapeType.value === 'rectangle') {
    const rect = currentShape.value as Rectangle;
    const width = Math.abs(rect.bottom_right.x - rect.top_left.x);
    const height = Math.abs(rect.bottom_right.y - rect.top_left.y);
    return width * height / (gridSettings.gridSize * gridSettings.gridSize);
  } 
  else if (currentShapeType.value === 'circle') {
    const circle = currentShape.value as Circle;
    return Math.PI * Math.pow(circle.radius / gridSettings.gridSize, 2);
  } 
  else if (currentShapeType.value === 'polygon') {
    const polygon = currentShape.value as Polygon;
    if (polygon.points.length < 3) return 0;
    
    // Calculate polygon area using Shoelace formula
    let polygonArea = 0;
    const points = polygon.points;
    const n = points.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      polygonArea += points[i].x * points[j].y;
      polygonArea -= points[j].x * points[i].y;
    }
    
    return Math.abs(polygonArea) / 2 / (gridSettings.gridSize * gridSettings.gridSize);
  }
  
  return 0;
});

// Update canvas size when container size changes
function updateCanvasSize() {
  if (!containerRef.value) return;
  
  // Get available width and height
  const containerRect = containerRef.value.getBoundingClientRect();
  canvasWidth.value = containerRect.width;
  canvasHeight.value = containerRect.height;
}

// Handle window resize events
function handleResize() {
  updateCanvasSize();
}

// Handle shape selection from menu
function handleSelectShape(shape: ShapeType) {
  if (drawingAreaRef.value) {
    drawingAreaRef.value.setShapeType(shape);
    currentShapeType.value = shape;
  }
}

// Handle shape updates from drawing area
function handleShapeUpdate(shape: Shape, type: ShapeType) {
  currentShape.value = shape;
  currentShapeType.value = type;
  
  // Forward the event to parent
  emit('shapeUpdated', shape, type);
}

// Handle reset canvas
function handleResetCanvas() {
  if (drawingAreaRef.value) {
    drawingAreaRef.value.resetDrawing();
  }
}

// Handle grid settings updates
function handleUpdateGridSettings(settings: Partial<GridSettings>) {
  Object.assign(gridSettings, settings);
}

// Toggle properties panel
function togglePropertiesPanel() {
  showPropertiesPanel.value = !showPropertiesPanel.value;
}

// Initialize and set up event listeners
onMounted(() => {
  window.addEventListener('resize', handleResize);
  updateCanvasSize();
});

// Clean up event listeners
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

// Watch for changes in initial shape
watch(() => props.initialShape, (newVal) => {
  if (newVal) {
    currentShape.value = newVal;
  }
}, { deep: true });

// Watch for changes in initial shape type
watch(() => props.initialShapeType, (newVal) => {
  if (newVal) {
    currentShapeType.value = newVal;
    handleSelectShape(newVal);
  }
});
</script>

<template>
  <div class="drawing-canvas-container" ref="containerRef">
    <div class="canvas-layout">
      <!-- Shape Menu (Left Side) -->
      <ShapeMenu
        :selected-shape="currentShapeType"
        @select-shape="handleSelectShape"
        @reset-canvas="handleResetCanvas"
      />
      
      <!-- Main Canvas Area (Center) -->
      <div class="canvas-area">
        <!-- Canvas Wrapper (maintains position context for overlays) -->
        <div class="canvas-wrapper">
          <!-- Graph Grid Layer -->
          <GraphGrid
            :canvas-width="canvasWidth"
            :canvas-height="canvasHeight"
            :grid-settings="gridSettings"
          />
          
          <!-- Drawing Area Layer -->
          <DrawingArea
            ref="drawingAreaRef"
            :width="canvasWidth"
            :height="canvasHeight"
            :grid-settings="gridSettings"
            :initial-shape="currentShape"
            :initial-shape-type="currentShapeType"
            @shape-updated="handleShapeUpdate"
          />
        </div>
      </div>
      
      <!-- Properties Panel (Right Side) -->
      <div class="properties-container" v-if="showPropertiesPanel">
        <ResizablePanel
          position="left"
          resize-direction="horizontal"
          :initial-width="250"
          :min-width="200"
          :max-width="400"
        >
          <PropertiesPanel
            :grid-settings="gridSettings"
            :current-shape="currentShape"
            :current-shape-type="currentShapeType"
            :area="area"
            @update-grid-settings="handleUpdateGridSettings"
          />
        </ResizablePanel>
      </div>
      
      <!-- Toggle Button for Properties Panel -->
      <button 
        class="toggle-properties-btn" 
        @click="togglePropertiesPanel"
        :title="showPropertiesPanel ? 'Hide Properties' : 'Show Properties'"
      >
        {{ showPropertiesPanel ? '›' : '‹' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.drawing-canvas-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.canvas-layout {
  display: flex;
  width: 100%;
  height: 100%;
}

.canvas-area {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.canvas-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.properties-container {
  height: 100%;
}

.toggle-properties-btn {
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  background-color: #f5f5f5;
  border: 1px solid #ccc;
  border-right: none;
  border-radius: 4px 0 0 4px;
  width: 20px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  z-index: 100;
}

.toggle-properties-btn:hover {
  background-color: #e0e0e0;
}

@media (prefers-color-scheme: dark) {
  .toggle-properties-btn {
    background-color: #333;
    border-color: #444;
    color: #eee;
  }
  
  .toggle-properties-btn:hover {
    background-color: #444;
  }
}
</style>