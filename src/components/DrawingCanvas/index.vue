<script setup lang="ts">
import { ref, onMounted, reactive, watch, onUnmounted, computed } from 'vue';
import ShapeMenu from './ShapeMenu.vue';
import GraphGrid from './GraphGrid.vue';
import DrawingArea from './DrawingArea.vue';
import PropertiesPanel from './PropertiesPanel.vue';
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
  unit: 'cm',
  showGrid: true,
  snapToGrid: true,
  conversionFactor: UNIT_CONVERSION_FACTORS['cm']
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

// Watch for changes in grid settings and make sure the grid is updated
watch(gridSettings, () => {
  // This will force a redraw by causing the component to update
  // No direct action needed here, as the reactive binding will handle it
}, { deep: true });
</script>

<template>
  <div class="relative h-full w-full overflow-hidden" ref="containerRef">
    <div class="flex h-full w-full">
      <!-- Shape Menu (Left Side) -->
      <ShapeMenu :selected-shape="currentShapeType" @select-shape="handleSelectShape" @reset-canvas="handleResetCanvas"
        class="h-full" />

      <!-- Main Canvas Area (Center) -->
      <div class="flex-1 relative">
        <!-- Canvas Wrapper (maintains position context for overlays) -->
        <div class="relative w-full h-full">
          <!-- Graph Grid Layer -->
          <GraphGrid :canvas-width="canvasWidth" :canvas-height="canvasHeight" :grid-settings="gridSettings" />

          <!-- Drawing Area Layer -->
          <DrawingArea ref="drawingAreaRef" :width="canvasWidth" :height="canvasHeight" :grid-settings="gridSettings"
            :initial-shape="currentShape" :initial-shape-type="currentShapeType" @shape-updated="handleShapeUpdate" />
        </div>
      </div>

      <!-- Properties Panel Overlay (Right Side) -->
      <div class="absolute top-0 right-0 h-full transition-transform duration-300 ease-in-out transform z-10"
        :class="showPropertiesPanel ? 'translate-x-0' : 'translate-x-full'">
        <PropertiesPanel :grid-settings="gridSettings" :current-shape="currentShape"
          :current-shape-type="currentShapeType" :area="area" @update-grid-settings="handleUpdateGridSettings"
          class="h-full w-64 bg-white dark:bg-gray-800 shadow-lg border-l border-gray-300 dark:border-gray-700" />
      </div>

      <!-- Toggle Button for Properties Panel -->
      <button class="absolute top-1/2 right-0 transform -translate-y-1/2 bg-gray-100 dark:bg-gray-800 
               border border-gray-300 dark:border-gray-700 border-r-0 rounded-l-md
               w-6 h-16 flex items-center justify-center cursor-pointer z-20
               text-lg font-bold transition-all duration-300" :class="showPropertiesPanel ? 'right-64' : 'right-0'"
        @click="togglePropertiesPanel" :title="showPropertiesPanel ? 'Hide Properties' : 'Show Properties'">
        {{ showPropertiesPanel ? '›' : '‹' }}
      </button>
    </div>
  </div>
</template>