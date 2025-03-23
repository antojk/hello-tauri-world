<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import type { GridSettings } from '../../types/shapes';
import { getMajorGridInterval } from '../../utils/measurementUnits';

const props = defineProps<{
  canvasWidth: number;
  canvasHeight: number;
  gridSettings: GridSettings;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);

// Calculate offsets to center the grid
const offsetX = props.canvasWidth / 2;
const offsetY = props.canvasHeight / 2;

// Draw the grid with axes and labels
function drawGrid() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear the canvas first
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!props.gridSettings.showGrid) {
    // Only draw axes if grid is disabled
    drawAxes(ctx);
    return;
  }

  const { gridSize, unit } = props.gridSettings;
  const majorInterval = getMajorGridInterval(unit);

  // Set line style for minor grid lines
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 0.5;

  // Draw vertical grid lines
  for (let x = offsetX % gridSize; x < canvas.width; x += gridSize) {
    const isMajor = Math.round((x - offsetX) / gridSize) % majorInterval === 0;

    if (isMajor) {
      // Skip major lines here, will draw them later
      continue;
    }

    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  // Draw horizontal grid lines
  for (let y = offsetY % gridSize; y < canvas.height; y += gridSize) {
    const isMajor = Math.round((y - offsetY) / gridSize) % majorInterval === 0;

    if (isMajor) {
      // Skip major lines here, will draw them later
      continue;
    }

    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Draw major grid lines
  ctx.strokeStyle = '#aaa';
  ctx.lineWidth = 0.8;

  // Draw vertical major grid lines
  for (let x = offsetX % (gridSize * majorInterval); x < canvas.width; x += gridSize * majorInterval) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  // Draw horizontal major grid lines
  for (let y = offsetY % (gridSize * majorInterval); y < canvas.height; y += gridSize * majorInterval) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Draw axes on top
  drawAxes(ctx);
}

// Draw the X and Y axes with labels
function drawAxes(ctx: CanvasRenderingContext2D) {
  const { gridSize, unit } = props.gridSettings;
  const majorInterval = getMajorGridInterval(unit);

  // Draw x and y axis with thicker lines
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 1.5;

  // X-axis
  ctx.beginPath();
  ctx.moveTo(0, offsetY);
  ctx.lineTo(props.canvasWidth, offsetY);
  ctx.stroke();

  // Y-axis
  ctx.beginPath();
  ctx.moveTo(offsetX, 0);
  ctx.lineTo(offsetX, props.canvasHeight);
  ctx.stroke();

  // Draw ticks and labels on axes
  ctx.fillStyle = '#666';
  ctx.font = '10px Arial';

  // X-axis ticks and labels
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  for (let x = offsetX + gridSize * majorInterval; x < props.canvasWidth; x += gridSize * majorInterval) {
    // Positive X
    const value = (x - offsetX) / gridSize / props.gridSettings.conversionFactor;

    // Draw tick
    ctx.beginPath();
    ctx.moveTo(x, offsetY - 5);
    ctx.lineTo(x, offsetY + 5);
    ctx.stroke();

    // Draw label
    ctx.fillText(value.toFixed(0), x, offsetY + 6);
  }

  for (let x = offsetX - gridSize * majorInterval; x > 0; x -= gridSize * majorInterval) {
    // Negative X
    const value = (x - offsetX) / gridSize / props.gridSettings.conversionFactor;

    // Draw tick
    ctx.beginPath();
    ctx.moveTo(x, offsetY - 5);
    ctx.lineTo(x, offsetY + 5);
    ctx.stroke();

    // Draw label
    ctx.fillText(value.toFixed(0), x, offsetY + 6);
  }

  // Y-axis ticks and labels
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  for (let y = offsetY + gridSize * majorInterval; y < props.canvasHeight; y += gridSize * majorInterval) {
    // Negative Y (canvas Y increases downward, but our math Y increases upward)
    const value = -((y - offsetY) / gridSize) / props.gridSettings.conversionFactor;

    // Draw tick
    ctx.beginPath();
    ctx.moveTo(offsetX - 5, y);
    ctx.lineTo(offsetX + 5, y);
    ctx.stroke();

    // Draw label
    ctx.fillText(value.toFixed(0), offsetX - 6, y);
  }

  for (let y = offsetY - gridSize * majorInterval; y > 0; y -= gridSize * majorInterval) {
    // Positive Y
    const value = -((y - offsetY) / gridSize) / props.gridSettings.conversionFactor;

    // Draw tick
    ctx.beginPath();
    ctx.moveTo(offsetX - 5, y);
    ctx.lineTo(offsetX + 5, y);
    ctx.stroke();

    // Draw label
    ctx.fillText(value.toFixed(0), offsetX - 6, y);
  }

  // Origin label
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('0', offsetX + 6, offsetY + 6);

  // Unit labels
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`${unit}`, props.canvasWidth - 10, props.canvasHeight - 10);
}

// Ensure the grid is drawn initially and on changes
onMounted(() => {
  nextTick(() => {
    if (canvasRef.value) {
      canvasRef.value.width = props.canvasWidth;
      canvasRef.value.height = props.canvasHeight;
      drawGrid();
    }
  });
});

// Watch for prop changes and redraw the grid
watch([() => props.canvasWidth, () => props.canvasHeight], () => {
  nextTick(() => {
    if (canvasRef.value) {
      canvasRef.value.width = props.canvasWidth;
      canvasRef.value.height = props.canvasHeight;
      drawGrid();
    }
  });
});

// Watch for grid settings changes
watch(() => props.gridSettings, () => {
  nextTick(() => drawGrid());
}, { deep: true });
</script>

<template>
  <canvas ref="canvasRef" class="graph-grid-canvas" :width="canvasWidth" :height="canvasHeight"></canvas>
</template>

<style scoped>
.graph-grid-canvas {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  /* Allow clicks to pass through to the drawing canvas */
  z-index: 1;
}
</style>