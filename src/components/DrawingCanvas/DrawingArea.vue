<script setup lang="ts">
import { ref, onMounted, watch, computed, onUnmounted } from 'vue';
import type { Shape, ShapeType, Point, Rectangle, Circle, Polygon, GridSettings } from '../../types/shapes';
import { canvasToGridPoint, mathToCanvas, snapToGrid, formatPoint } from '../../utils/coordinates';

const props = defineProps<{
  width: number;
  height: number;
  gridSettings: GridSettings;
  initialShape?: Shape;
  initialShapeType?: ShapeType;
}>();

const emit = defineEmits<{
  (e: 'shapeUpdated', shape: Shape, type: ShapeType): void;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const isDrawing = ref(false);
const isDragging = ref(false);
const selectedShape = ref<ShapeType>(props.initialShapeType || 'rectangle');
const isDrawingPolygon = ref(false);
const lastMousePosition = ref<Point>({ x: 0, y: 0 });

// Current shapes being drawn
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

// Initialize shape from props if available
onMounted(() => {
  if (props.initialShape && props.initialShapeType) {
    selectedShape.value = props.initialShapeType;

    if (props.initialShapeType === 'rectangle') {
      currentRectangle.value = props.initialShape as Rectangle;
    } else if (props.initialShapeType === 'circle') {
      currentCircle.value = props.initialShape as Circle;
    } else if (props.initialShapeType === 'polygon') {
      currentPolygon.value = props.initialShape as Polygon;
    }

    requestAnimationFrame(() => {
      drawShape();
    });
  }
});

// Watch for prop changes to update shape
watch(() => props.initialShape, (newVal) => {
  if (newVal && props.initialShapeType) {
    selectedShape.value = props.initialShapeType;

    if (props.initialShapeType === 'rectangle') {
      currentRectangle.value = newVal as Rectangle;
    } else if (props.initialShapeType === 'circle') {
      currentCircle.value = newVal as Circle;
    } else if (props.initialShapeType === 'polygon') {
      currentPolygon.value = newVal as Polygon;
      isDrawingPolygon.value = false;
    }

    requestAnimationFrame(() => {
      drawShape();
    });
  }
}, { deep: true });

// Watch for shape type changes
watch(() => props.initialShapeType, (newVal) => {
  if (newVal) {
    selectedShape.value = newVal;

    // Ensure polygon drawing mode is reset if shape type changes
    if (newVal !== 'polygon') {
      isDrawingPolygon.value = false;
    }

    requestAnimationFrame(() => {
      drawShape();
    });
  }
});

// Start drawing when the mouse is pressed
function startDrawing(event: MouseEvent) {
  if (!canvasRef.value) return;

  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  // Save last mouse position
  lastMousePosition.value = { x, y };

  // Convert to grid coordinates
  const mathPoint = canvasToGridPoint(
    x, y, props.width, props.height, props.gridSettings
  );

  if (selectedShape.value === 'rectangle') {
    isDrawing.value = true;
    currentRectangle.value = {
      top_left: { x: mathPoint.x, y: mathPoint.y },
      bottom_right: { x: mathPoint.x, y: mathPoint.y }
    };
  } else if (selectedShape.value === 'circle') {
    isDrawing.value = true;
    currentCircle.value = {
      center: { x: mathPoint.x, y: mathPoint.y },
      radius: 0
    };
  } else if (selectedShape.value === 'polygon') {
    if (!isDrawingPolygon.value) {
      // Start a new polygon
      isDrawingPolygon.value = true;
      currentPolygon.value = { points: [{ x: mathPoint.x, y: mathPoint.y }] };

      // Add a temporary second point for dragging
      currentPolygon.value.points.push({ x: mathPoint.x, y: mathPoint.y });
      isDragging.value = true;
    } else {
      // Add a new fixed point to the polygon
      if (currentPolygon.value.points.length > 0) {
        // If we already have a temporary drag point, replace it
        if (isDragging.value) {
          // Replace the last point (which was a temp drag point) with the fixed point
          currentPolygon.value.points[currentPolygon.value.points.length - 1] = { x: mathPoint.x, y: mathPoint.y };
        } else {
          // Otherwise, add a new fixed point
          currentPolygon.value.points.push({ x: mathPoint.x, y: mathPoint.y });
        }

        // Add a new temporary point for dragging the next segment
        currentPolygon.value.points.push({ x: mathPoint.x, y: mathPoint.y });
        isDragging.value = true;
      }
    }
  }

  // Redraw the canvas
  drawShape();
}

// Update the shape as the mouse moves
function updateDrawing(event: MouseEvent) {
  if (!canvasRef.value) return;

  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  // Update last mouse position
  lastMousePosition.value = { x, y };

  // Convert to grid coordinates
  const mathPoint = canvasToGridPoint(
    x, y, props.width, props.height, props.gridSettings
  );

  if (isDrawing.value) {
    if (selectedShape.value === 'rectangle') {
      currentRectangle.value.bottom_right = { x: mathPoint.x, y: mathPoint.y };
    } else if (selectedShape.value === 'circle') {
      // Calculate radius as distance from center to current point
      const dx = mathPoint.x - currentCircle.value.center.x;
      const dy = mathPoint.y - currentCircle.value.center.y;
      currentCircle.value.radius = Math.sqrt(dx * dx + dy * dy);
    }
  }

  // For polygon, update the last point during dragging
  if (selectedShape.value === 'polygon' && isDrawingPolygon.value && isDragging.value) {
    if (currentPolygon.value.points.length > 0) {
      const lastIndex = currentPolygon.value.points.length - 1;
      currentPolygon.value.points[lastIndex] = { x: mathPoint.x, y: mathPoint.y };
    }
  }

  // Redraw
  drawShape();
}

// Finish drawing when the mouse is released
function finishDrawing() {
  if (selectedShape.value === 'rectangle' && isDrawing.value) {
    isDrawing.value = false;
    normalizeRectangle();
    emit('shapeUpdated', currentRectangle.value, 'rectangle');
  } else if (selectedShape.value === 'circle' && isDrawing.value) {
    isDrawing.value = false;
    emit('shapeUpdated', currentCircle.value, 'circle');
  }

  // Note: We're NOT ending polygon drawing on mouse up - the polygon continues
  // until the user double-clicks or presses Enter

  // Just emit the current polygon state to keep the UI updated
  if (selectedShape.value === 'polygon' && isDrawingPolygon.value) {
    emit('shapeUpdated', currentPolygon.value, 'polygon');
  }
}

// Double click to finish polygon
function handleDoubleClick() {
  if (selectedShape.value === 'polygon' && isDrawingPolygon.value) {
    // Complete the polygon - remove the last point if it's a temporary drag point
    if (isDragging.value && currentPolygon.value.points.length > 0) {
      currentPolygon.value.points.pop();
    }

    // Only finalize if we have at least 3 points
    if (currentPolygon.value.points.length >= 3) {
      isDrawingPolygon.value = false;
      isDragging.value = false;
      emit('shapeUpdated', currentPolygon.value, 'polygon');
    }
  }
}

// Key press handler
function handleKeyDown(event: KeyboardEvent) {
  // Escape key cancels current drawing
  if (event.key === 'Escape') {
    if (selectedShape.value === 'polygon' && isDrawingPolygon.value) {
      isDrawingPolygon.value = false;
      isDragging.value = false;
      currentPolygon.value = { points: [] };
      drawShape();
      emit('shapeUpdated', currentPolygon.value, 'polygon');
    }
  }

  // Enter key finishes polygon
  if (event.key === 'Enter') {
    handleDoubleClick();
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

// Draw the current shape on the canvas
function drawShape() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear the canvas
  clearCanvas();

  if (selectedShape.value === 'rectangle') {
    const { top_left, bottom_right } = currentRectangle.value;

    // Convert grid coordinates to canvas coordinates
    const canvasTopLeft = mathToCanvas(
      top_left.x, top_left.y, props.width, props.height
    );
    const canvasBottomRight = mathToCanvas(
      bottom_right.x, bottom_right.y, props.width, props.height
    );

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
    ctx.fillText(formatPoint(top_left, props.gridSettings), canvasTopLeft.x, canvasTopLeft.y - 5);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(formatPoint(bottom_right, props.gridSettings), canvasBottomRight.x, canvasBottomRight.y + 5);
  } else if (selectedShape.value === 'circle') {
    const { center, radius } = currentCircle.value;

    // Convert grid coordinates to canvas coordinates
    const canvasCenter = mathToCanvas(
      center.x, center.y, props.width, props.height
    );

    // Draw circle
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(canvasCenter.x, canvasCenter.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw semi-transparent fill
    ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
    ctx.beginPath();
    ctx.arc(canvasCenter.x, canvasCenter.y, radius, 0, Math.PI * 2);
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
    ctx.fillText(`Center: ${formatPoint(center, props.gridSettings)}`, canvasCenter.x + 10, canvasCenter.y);
    ctx.fillText(`Radius: ${(radius / props.gridSettings.gridSize).toFixed(1)} units`, canvasCenter.x + 10, canvasCenter.y + 15);
  } else if (selectedShape.value === 'polygon') {
    const { points } = currentPolygon.value;

    if (points.length < 1) return;

    // Draw polygon
    ctx.strokeStyle = '#9C27B0';
    ctx.lineWidth = 2;
    ctx.beginPath();

    // Convert first point from grid to canvas coordinates
    const firstCanvasPoint = mathToCanvas(
      points[0].x, points[0].y, props.width, props.height
    );
    ctx.moveTo(firstCanvasPoint.x, firstCanvasPoint.y);

    // Draw lines between points
    for (let i = 1; i < points.length; i++) {
      const canvasPoint = mathToCanvas(
        points[i].x, points[i].y, props.width, props.height
      );
      ctx.lineTo(canvasPoint.x, canvasPoint.y);
    }

    // If not in drag mode and we have 3+ points, close the polygon
    if (!isDragging.value && !isDrawingPolygon.value && points.length >= 3) {
      ctx.closePath();
    }

    ctx.stroke();

    // Fill with semi-transparent color if polygon is closed and not in drawing mode
    if (!isDrawingPolygon.value && points.length >= 3) {
      ctx.fillStyle = 'rgba(156, 39, 176, 0.3)';
      ctx.fill();
    }

    // Draw points
    ctx.fillStyle = '#FF5722';
    points.forEach((point, index) => {
      // Draw the temp point differently if it's the last one during drag
      const isLastPointDuringDrag = isDragging.value && index === points.length - 1;

      const canvasPoint = mathToCanvas(
        point.x, point.y, props.width, props.height
      );

      ctx.beginPath();
      ctx.arc(canvasPoint.x, canvasPoint.y, 4, 0, Math.PI * 2);

      // Different color for the drag point
      if (isLastPointDuringDrag) {
        ctx.fillStyle = 'rgba(255, 87, 34, 0.5)';
      } else {
        ctx.fillStyle = '#FF5722';
      }

      ctx.fill();

      // Reset fill style
      ctx.fillStyle = '#FF5722';

      // Show coordinates for non-drag points
      if (!isLastPointDuringDrag || !isDragging.value) {
        ctx.fillStyle = '#000';
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`${index + 1}: ${formatPoint(point, props.gridSettings)}`, canvasPoint.x + 5, canvasPoint.y - 5);
      }
    });

    // If we're in polygon drawing mode, show instructions
    if (isDrawingPolygon.value) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, 10, 280, 40);
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('Click to add points, double-click to finish', 15, 15);
      ctx.fillText('Press Esc to cancel, Enter to complete', 15, 35);
    }
  }
}

// Set up event listeners on component mount
onMounted(() => {
  window.addEventListener('resize', updateCanvasSize);
  window.addEventListener('keydown', handleKeyDown);
  updateCanvasSize();
});

// Clean up event listeners on component unmount
onUnmounted(() => {
  window.removeEventListener('resize', updateCanvasSize);
  window.removeEventListener('keydown', handleKeyDown);
});

// Update canvas size when window is resized
function updateCanvasSize() {
  if (canvasRef.value) {
    canvasRef.value.width = props.width;
    canvasRef.value.height = props.height;
    drawShape();
  }
}

// Update shape type from external source
function setShapeType(type: ShapeType) {
  // If we're currently drawing a polygon, finish it or cancel it
  if (selectedShape.value === 'polygon' && isDrawingPolygon.value) {
    if (currentPolygon.value.points.length >= 3) {
      // Remove the last point if it's just a temporary drag point
      if (isDragging.value) {
        currentPolygon.value.points.pop();
      }
      isDrawingPolygon.value = false;
      isDragging.value = false;
      emit('shapeUpdated', currentPolygon.value, 'polygon');
    } else {
      // Cancel the polygon if not enough points
      isDrawingPolygon.value = false;
      isDragging.value = false;
      currentPolygon.value = { points: [] };
    }
  }

  selectedShape.value = type;
}

// Reset the drawing to a clean state
function resetDrawing() {
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
    isDrawingPolygon.value = false;
    isDragging.value = false;
    emit('shapeUpdated', currentPolygon.value, 'polygon');
  }

  drawShape();
}

// Expose methods to parent component
defineExpose({
  setShapeType,
  resetDrawing
});
</script>

<template>
  <canvas ref="canvasRef" class="drawing-area-canvas" :width="width" :height="height" @mousedown="startDrawing"
    @mousemove="updateDrawing" @mouseup="finishDrawing" @mouseleave="finishDrawing"
    @dblclick="handleDoubleClick"></canvas>
</template>

<style scoped>
.drawing-area-canvas {
  cursor: crosshair;
  position: relative;
  z-index: 2;
}
</style>