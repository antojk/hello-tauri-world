<script setup lang="ts">
import { ref, onMounted, watch, computed, onUnmounted } from 'vue';

interface Point {
  x: number,
  y: number
}

interface Rectangle {
  top_left: Point,
  bottom_right: Point
}

interface Circle {
  center: Point,
  radius: number
}

interface Polygon {
  points: Point[]
}

type ShapeType = 'rectangle' | 'circle' | 'polygon';

const props = defineProps<{
  initialShape?: Rectangle | Circle | Polygon,
  gridSize?: number
}>();

const emit = defineEmits<{
  (e: 'shapeUpdated', shape: Rectangle | Circle | Polygon, type: ShapeType): void
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const canvasContainer = ref<HTMLDivElement | null>(null);
const canvasWidth = ref(800);
const canvasHeight = ref(600);
const isDrawing = ref(false);
const selectedShape = ref<ShapeType>('rectangle');
const currentPoints = ref<Point[]>([]);
const isDrawingPolygon = ref(false);

// This will store our current shape being drawn
const currentRectangle = ref<Rectangle>({
  top_left: { x: 0, y: 0 },
  bottom_right: { x: 0, y: 0 }
});

const currentCircle = ref<Circle>({
  center: { x: 0, y: 0 },
  radius: 0
});

const currentPolygon = ref<Polygon>({
  points: []
});

// Grid configuration
const gridSize = computed(() => props.gridSize || 20);
const offsetX = computed(() => Math.floor(canvasWidth.value / 2));
const offsetY = computed(() => Math.floor(canvasHeight.value / 2));

// Responsive canvas handling
function resizeCanvas() {
  if (!canvasContainer.value) return;
  
  const containerWidth = canvasContainer.value.clientWidth;
  const containerHeight = window.innerHeight * 0.7; // 70% of window height
  
  canvasWidth.value = containerWidth;
  canvasHeight.value = containerHeight;
  
  if (canvasRef.value) {
    canvasRef.value.width = canvasWidth.value;
    canvasRef.value.height = canvasHeight.value;
    drawGrid();
    drawShape();
  }
}

// Set up the canvas when the component is mounted
onMounted(() => {
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  
  if (props.initialShape) {
    if ('top_left' in props.initialShape) {
      currentRectangle.value = props.initialShape as Rectangle;
      selectedShape.value = 'rectangle';
    } else if ('center' in props.initialShape) {
      currentCircle.value = props.initialShape as Circle;
      selectedShape.value = 'circle';
    } else if ('points' in props.initialShape) {
      currentPolygon.value = props.initialShape as Polygon;
      selectedShape.value = 'polygon';
    }
    drawShape();
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas);
});

// Watch for changes in the initialShape prop
watch(() => props.initialShape, (newVal) => {
  if (newVal) {
    if ('top_left' in newVal) {
      currentRectangle.value = newVal as Rectangle;
      selectedShape.value = 'rectangle';
    } else if ('center' in newVal) {
      currentCircle.value = newVal as Circle;
      selectedShape.value = 'circle';
    } else if ('points' in newVal) {
      currentPolygon.value = newVal as Polygon;
      selectedShape.value = 'polygon';
    }
    drawShape();
  }
}, { deep: true });

// Convert from canvas coordinates to grid coordinates
function canvasToGrid(x: number, y: number): Point {
  return {
    x: Math.round((x - offsetX.value) / gridSize.value) * gridSize.value,
    y: Math.round((y - offsetY.value) / gridSize.value) * gridSize.value
  };
}

// Convert from grid coordinates to canvas coordinates
function gridToCanvas(x: number, y: number): Point {
  return {
    x: x + offsetX.value,
    y: y + offsetY.value
  };
}

// Start drawing when the mouse is pressed
function startDrawing(event: MouseEvent) {
  if (!canvasRef.value) return;
  
  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();
  let x = event.clientX - rect.left;
  let y = event.clientY - rect.top;
  
  // Convert to grid coordinates
  const gridPoint = canvasToGrid(x, y);
  x = gridPoint.x;
  y = gridPoint.y;
  
  isDrawing.value = true;
  
  if (selectedShape.value === 'rectangle') {
    currentRectangle.value = {
      top_left: { x, y },
      bottom_right: { x, y }
    };
  } else if (selectedShape.value === 'circle') {
    currentCircle.value = {
      center: { x, y },
      radius: 0
    };
  } else if (selectedShape.value === 'polygon') {
    if (!isDrawingPolygon.value) {
      // Start a new polygon
      currentPolygon.value = { points: [{ x, y }] };
      currentPoints.value = [{ x, y }];
      isDrawingPolygon.value = true;
    } else {
      // Add a point to existing polygon
      currentPolygon.value.points.push({ x, y });
      currentPoints.value.push({ x, y });
    }
  }
  
  // Redraw the canvas
  drawShape();
}

// Update the shape as the mouse moves
function updateDrawing(event: MouseEvent) {
  if (!isDrawing.value || !canvasRef.value) return;
  
  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();
  let x = event.clientX - rect.left;
  let y = event.clientY - rect.top;
  
  // Convert to grid coordinates
  const gridPoint = canvasToGrid(x, y);
  x = gridPoint.x;
  y = gridPoint.y;
  
  if (selectedShape.value === 'rectangle') {
    currentRectangle.value.bottom_right = { x, y };
  } else if (selectedShape.value === 'circle') {
    // Calculate radius as distance from center to current point
    const dx = x - currentCircle.value.center.x;
    const dy = y - currentCircle.value.center.y;
    currentCircle.value.radius = Math.sqrt(dx * dx + dy * dy);
  } else if (selectedShape.value === 'polygon' && isDrawingPolygon.value) {
    // Update the last point for visual feedback while dragging
    if (currentPoints.value.length > 0) {
      const tempPoints = [...currentPoints.value];
      tempPoints[tempPoints.length - 1] = { x, y };
      currentPolygon.value.points = tempPoints;
    }
  }
  
  // Redraw
  drawShape();
}

// Finish drawing when the mouse is released
function finishDrawing(event: MouseEvent) {
  if (!isDrawing.value) return;
  
  if (selectedShape.value === 'rectangle') {
    isDrawing.value = false;
    normalizeRectangle();
    emit('shapeUpdated', currentRectangle.value, 'rectangle');
  } else if (selectedShape.value === 'circle') {
    isDrawing.value = false;
    emit('shapeUpdated', currentCircle.value, 'circle');
  } else if (selectedShape.value === 'polygon') {
    // For polygon, we don't finish drawing until double-click
    const canvas = canvasRef.value;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    
    // Convert to grid coordinates
    const gridPoint = canvasToGrid(x, y);
    x = gridPoint.x;
    y = gridPoint.y;
    
    // Update the current point position
    if (currentPolygon.value.points.length > 0) {
      currentPolygon.value.points[currentPolygon.value.points.length - 1] = { x, y };
      currentPoints.value[currentPoints.value.length - 1] = { x, y };
    }
    
    isDrawing.value = false;
    drawShape();
  }
}

// Double click to finish polygon
function handleDoubleClick() {
  if (selectedShape.value === 'polygon' && isDrawingPolygon.value) {
    if (currentPolygon.value.points.length >= 3) {
      isDrawingPolygon.value = false;
      emit('shapeUpdated', currentPolygon.value, 'polygon');
    }
  }
}

// Ensure the rectangle has proper coordinates (top_left is actually top-left)
function normalizeRectangle() {
  const { top_left, bottom_right } = currentRectangle.value;
  
  const normalized: Rectangle = {
    top_left: {
      x: Math.min(top_left.x, bottom_right.x),
      y: Math.min(top_left.y, bottom_right.y)
    },
    bottom_right: {
      x: Math.max(top_left.x, bottom_right.x),
      y: Math.max(top_left.y, bottom_right.y)
    }
  };
  
  currentRectangle.value = normalized;
}

// Clear the canvas
function clearCanvas() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Draw the grid with 0,0 at center
function drawGrid() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  clearCanvas();
  
  const width = canvas.width;
  const height = canvas.height;
  
  // Set line style for grid
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 0.5;
  
  // Draw vertical grid lines
  for (let x = offsetX.value % gridSize.value; x < width; x += gridSize.value) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  
  // Draw horizontal grid lines
  for (let y = offsetY.value % gridSize.value; y < height; y += gridSize.value) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  
  // Draw x and y axis with thicker lines
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 1;
  
  // X-axis
  ctx.beginPath();
  ctx.moveTo(0, offsetY.value);
  ctx.lineTo(width, offsetY.value);
  ctx.stroke();
  
  // Y-axis
  ctx.beginPath();
  ctx.moveTo(offsetX.value, 0);
  ctx.lineTo(offsetX.value, height);
  ctx.stroke();
  
  // Draw ticks and labels on axes
  ctx.fillStyle = '#666';
  ctx.font = '10px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  
  // X-axis ticks and labels
  for (let x = gridSize.value; x < width / 2; x += gridSize.value) {
    // Positive X
    ctx.beginPath();
    ctx.moveTo(offsetX.value + x, offsetY.value - 3);
    ctx.lineTo(offsetX.value + x, offsetY.value + 3);
    ctx.stroke();
    
    if (x % (gridSize.value * 5) === 0) {
      ctx.fillText(String(x / gridSize.value), offsetX.value + x, offsetY.value + 5);
    }
    
    // Negative X
    ctx.beginPath();
    ctx.moveTo(offsetX.value - x, offsetY.value - 3);
    ctx.lineTo(offsetX.value - x, offsetY.value + 3);
    ctx.stroke();
    
    if (x % (gridSize.value * 5) === 0) {
      ctx.fillText(String(-x / gridSize.value), offsetX.value - x, offsetY.value + 5);
    }
  }
  
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  
  // Y-axis ticks and labels
  for (let y = gridSize.value; y < height / 2; y += gridSize.value) {
    // Positive Y (going down in canvas coordinates)
    ctx.beginPath();
    ctx.moveTo(offsetX.value - 3, offsetY.value + y);
    ctx.lineTo(offsetX.value + 3, offsetY.value + y);
    ctx.stroke();
    
    if (y % (gridSize.value * 5) === 0) {
      ctx.fillText(String(-y / gridSize.value), offsetX.value - 5, offsetY.value + y);
    }
    
    // Negative Y (going up in canvas coordinates)
    ctx.beginPath();
    ctx.moveTo(offsetX.value - 3, offsetY.value - y);
    ctx.lineTo(offsetX.value + 3, offsetY.value - y);
    ctx.stroke();
    
    if (y % (gridSize.value * 5) === 0) {
      ctx.fillText(String(y / gridSize.value), offsetX.value - 5, offsetY.value - y);
    }
  }
  
  // Label for origin (0,0)
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('(0,0)', offsetX.value + 5, offsetY.value + 5);
}

// Draw the current shape on the canvas
function drawShape() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // Clear and redraw grid
  drawGrid();
  
  if (selectedShape.value === 'rectangle') {
    const { top_left, bottom_right } = currentRectangle.value;
    
    // Convert grid coordinates to canvas coordinates
    const canvasTopLeft = gridToCanvas(top_left.x, top_left.y);
    const canvasBottomRight = gridToCanvas(bottom_right.x, bottom_right.y);
    
    // Calculate width and height
    const width = canvasBottomRight.x - canvasTopLeft.x;
    const height = canvasBottomRight.y - canvasTopLeft.y;
    
    // Draw rectangle outline
    ctx.strokeStyle = '#2196F3';
    ctx.lineWidth = 2;
    ctx.strokeRect(canvasTopLeft.x, canvasTopLeft.y, width, height);
    
    // Draw semi-transparent fill
    ctx.fillStyle = 'rgba(33, 150, 243, 0.3)';
    ctx.fillRect(canvasTopLeft.x, canvasTopLeft.y, width, height);
    
    // Draw corner points
    ctx.fillStyle = '#FF5722';
    
    // Top-left corner
    ctx.beginPath();
    ctx.arc(canvasTopLeft.x, canvasTopLeft.y, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Bottom-right corner
    ctx.beginPath();
    ctx.arc(canvasBottomRight.x, canvasBottomRight.y, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Show coordinates
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`(${top_left.x / gridSize.value},${-top_left.y / gridSize.value})`, canvasTopLeft.x, canvasTopLeft.y - 5);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`(${bottom_right.x / gridSize.value},${-bottom_right.y / gridSize.value})`, canvasBottomRight.x, canvasBottomRight.y + 5);
  } else if (selectedShape.value === 'circle') {
    const { center, radius } = currentCircle.value;
    
    // Convert grid coordinates to canvas coordinates
    const canvasCenter = gridToCanvas(center.x, center.y);
    const canvasRadius = radius;
    
    // Draw circle
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(canvasCenter.x, canvasCenter.y, canvasRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw semi-transparent fill
    ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
    ctx.beginPath();
    ctx.arc(canvasCenter.x, canvasCenter.y, canvasRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw center point
    ctx.fillStyle = '#FF5722';
    ctx.beginPath();
    ctx.arc(canvasCenter.x, canvasCenter.y, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Show coordinates and radius
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`Center: (${center.x / gridSize.value},${-center.y / gridSize.value})`, canvasCenter.x + 10, canvasCenter.y);
    ctx.fillText(`Radius: ${(radius / gridSize.value).toFixed(1)}`, canvasCenter.x + 10, canvasCenter.y + 15);
  } else if (selectedShape.value === 'polygon') {
    const { points } = currentPolygon.value;
    
    if (points.length < 1) return;
    
    // Draw polygon
    ctx.strokeStyle = '#9C27B0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    // Convert first point from grid to canvas coordinates
    const firstPoint = gridToCanvas(points[0].x, points[0].y);
    ctx.moveTo(firstPoint.x, firstPoint.y);
    
    // Draw lines between points
    for (let i = 1; i < points.length; i++) {
      const canvasPoint = gridToCanvas(points[i].x, points[i].y);
      ctx.lineTo(canvasPoint.x, canvasPoint.y);
    }
    
    // Close the polygon if we're not actively drawing it
    if (!isDrawingPolygon.value && points.length > 2) {
      ctx.closePath();
    }
    
    ctx.stroke();
    
    // Fill with semi-transparent color if polygon is closed
    if (!isDrawingPolygon.value && points.length > 2) {
      ctx.fillStyle = 'rgba(156, 39, 176, 0.3)';
      ctx.fill();
    }
    
    // Draw points
    ctx.fillStyle = '#FF5722';
    points.forEach(point => {
      const canvasPoint = gridToCanvas(point.x, point.y);
      ctx.beginPath();
      ctx.arc(canvasPoint.x, canvasPoint.y, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Show coordinates
      ctx.fillStyle = '#000';
      ctx.font = '10px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`(${point.x / gridSize.value},${-point.y / gridSize.value})`, canvasPoint.x + 5, canvasPoint.y - 5);
    });
  }
}

// Reset the canvas and current shape
function resetCanvas() {
  clearCanvas();
  drawGrid();
  
  if (selectedShape.value === 'rectangle') {
    currentRectangle.value = {
      top_left: { x: 0, y: 0 },
      bottom_right: { x: 0, y: 0 }
    };
    emit('shapeUpdated', currentRectangle.value, 'rectangle');
  } else if (selectedShape.value === 'circle') {
    currentCircle.value = {
      center: { x: 0, y: 0 },
      radius: 0
    };
    emit('shapeUpdated', currentCircle.value, 'circle');
  } else if (selectedShape.value === 'polygon') {
    currentPolygon.value = {
      points: []
    };
    currentPoints.value = [];
    isDrawingPolygon.value = false;
    emit('shapeUpdated', currentPolygon.value, 'polygon');
  }
}

// Change the selected shape type
function changeShape(shape: ShapeType) {
  // Finish any in-progress drawing
  if (isDrawingPolygon.value && selectedShape.value === 'polygon') {
    isDrawingPolygon.value = false;
    if (currentPolygon.value.points.length >= 3) {
      emit('shapeUpdated', currentPolygon.value, 'polygon');
    }
  }
  
  selectedShape.value = shape;
  resetCanvas();
}

// Get grid coordinates of a point
function getGridCoordinates(point: Point): string {
  return `(${point.x / gridSize.value}, ${-point.y / gridSize.value})`;
}

// Convert from actual coordinate system to the way we store them in the canvas
// (canvas has 0,0 at top-left with Y increasing downward)
function formatCoordinates(point: Point): string {
  return `(${point.x / gridSize.value}, ${-point.y / gridSize.value})`;
}

// Calculate polygon area using Shoelace formula
function calculatePolygonArea(points: Point[]): number {
  if (points.length < 3) return 0;
  
  let area = 0;
  const n = points.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  
  return Math.abs(area) / 2 / (gridSize.value * gridSize.value);
}
</script>

<template>
  <div class="drawing-canvas-container">
    <div class="canvas-with-controls">
      <div class="shape-controls">
        <button 
          @click="changeShape('rectangle')" 
          :class="{ active: selectedShape === 'rectangle' }"
          title="Rectangle"
        >
          □
        </button>
        <button 
          @click="changeShape('circle')" 
          :class="{ active: selectedShape === 'circle' }"
          title="Circle"
        >
          ○
        </button>
        <button 
          @click="changeShape('polygon')" 
          :class="{ active: selectedShape === 'polygon' }"
          title="Polygon"
        >
          ⭐
        </button>
        <button @click="resetCanvas" class="reset-btn" title="Reset Canvas">
          ↺
        </button>
      </div>
      
      <div ref="canvasContainer" class="canvas-container">
        <canvas
          ref="canvasRef"
          :width="canvasWidth"
          :height="canvasHeight"
          @mousedown="startDrawing"
          @mousemove="updateDrawing"
          @mouseup="finishDrawing"
          @mouseleave="finishDrawing"
          @dblclick="handleDoubleClick"
        ></canvas>
      </div>
    </div>
    
    <div class="coordinates-display">
      <div v-if="selectedShape === 'rectangle'">
        <p>Top-left: {{ formatCoordinates(currentRectangle.top_left) }}</p>
        <p>Bottom-right: {{ formatCoordinates(currentRectangle.bottom_right) }}</p>
        <p v-if="currentRectangle.top_left.x !== currentRectangle.bottom_right.x">
          Width: {{ Math.abs((currentRectangle.bottom_right.x - currentRectangle.top_left.x) / gridSize) }} units
        </p>
        <p v-if="currentRectangle.top_left.y !== currentRectangle.bottom_right.y">
          Height: {{ Math.abs((currentRectangle.bottom_right.y - currentRectangle.top_left.y) / gridSize) }} units
        </p>
      </div>
      
      <div v-else-if="selectedShape === 'circle'">
        <p>Center: {{ formatCoordinates(currentCircle.center) }}</p>
        <p>Radius: {{ (currentCircle.radius / gridSize).toFixed(1) }} units</p>
        <p v-if="currentCircle.radius > 0">
          Area: {{ (Math.PI * Math.pow(currentCircle.radius / gridSize, 2)).toFixed(2) }} square units
        </p>
      </div>
      
      <div v-else-if="selectedShape === 'polygon'">
        <p>Points: {{ currentPolygon.points.length }}</p>
        <p v-if="isDrawingPolygon">Double-click to finish polygon</p>
        <p v-if="currentPolygon.points.length >= 3">
          Area: {{ calculatePolygonArea(currentPolygon.points).toFixed(2) }} square units
        </p>
      </div>
    </div>
    
    <div class="instructions">
      <p v-if="selectedShape === 'rectangle'">Click and drag to create a rectangle</p>
      <p v-else-if="selectedShape === 'circle'">Click to set center, drag to set radius</p>
      <p v-else-if="selectedShape === 'polygon' && !isDrawingPolygon">Click to start drawing a polygon</p>
      <p v-else-if="selectedShape === 'polygon' && isDrawingPolygon">Click to add points, double-click to finish</p>
    </div>
  </div>
</template>

<style scoped>
.drawing-canvas-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
}

.canvas-with-controls {
  display: flex;
  width: 100%;
  height: 100%;
}

.shape-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  background-color: #f5f5f5;
  border-right: 1px solid #ccc;
}

.canvas-container {
  flex: 1;
  overflow: hidden;
  min-height: 400px;
}

canvas {
  cursor: crosshair;
  background-color: #f8f8f8;
}

.shape-controls button {
  width: 40px;
  height: 40px;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.shape-controls button:hover {
  background-color: #e0e0e0;
}

.shape-controls button.active {
  background-color: #2196F3;
  color: white;
  border-color: #1976D2;
}

.shape-controls button.reset-btn {
  background-color: #f44336;
  color: white;
  border-color: #d32f2f;
  margin-top: auto;
}

.shape-controls button.reset-btn:hover {
  background-color: #d32f2f;
}

.coordinates-display {
  margin-top: 10px;
  font-family: monospace;
  text-align: center;
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  width: 100%;
  max-width: 400px;
}

.coordinates-display p {
  margin: 5px 0;
}

.instructions {
  margin-top: 15px;
  font-style: italic;
  color: #666;
}

@media (prefers-color-scheme: dark) {
  canvas {
    background-color: #2d2d2d;
    border-color: #444;
  }
  
  .shape-controls {
    background-color: #333;
    border-color: #444;
  }
  
  .shape-controls button {
    background-color: #333;
    border-color: #555;
    color: #eee;
  }
  
  .shape-controls button:hover {
    background-color: #444;
  }
  
  .shape-controls button.active {
    background-color: #2196F3;
    color: white;
  }
  
  .coordinates-display {
    background-color: #333;
    color: #eee;
  }
  
  .instructions {
    color: #aaa;
  }
}
</style>