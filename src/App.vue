<script setup lang="ts">
import { ref } from "vue";
import { invoke } from "@tauri-apps/api/core";
import DrawingCanvas from "./components/DrawingCanvas/index.vue";
import DebugPanel from "./components/DebugPanel.vue";
import type { Shape, ShapeType, Rectangle, Polygon } from './types/shapes';

// Check if we're in development mode
const isDev = import.meta.env.DEV || false;

const area = ref(0);
const errMessage = ref("");
const currentShape = ref<Shape>({
  top_left: { x: 0, y: 0 },
  bottom_right: { x: 0, y: 0 }
});
const currentShapeType = ref<ShapeType>('rectangle');

// Reference to the debug panel component
const debugPanelRef = ref<InstanceType<typeof DebugPanel> | null>(null);

async function calc_area() {
  try {
    const calledApi = `calc_${currentShapeType.value}_area`;
    if (isDev && debugPanelRef.value) {
      debugPanelRef.value.addMessage(`Calling: ${calledApi}`);
    }
    switch (currentShapeType.value) {
      case 'rectangle':
        const rect = currentShape.value as Rectangle;
        // Convert grid coordinates to coordinate system units for Rust backend
        // Note: We're no longer normalizing here - just handling the Y-axis flip
        const normalized: Rectangle = {
          top_left: {
            x: Math.round(rect.top_left.x),
            y: Math.round(-rect.top_left.y) // Flip Y axis for Rust backend
          },
          bottom_right: {
            x: Math.round(rect.bottom_right.x),
            y: Math.round(-rect.bottom_right.y) // Flip Y axis for Rust backend
          }
        };
        area.value = await invoke(calledApi, { shape: normalized });
        break;
      default:
        area.value = await invoke(calledApi, { shape: currentShape.value });

    }
    if (isDev && debugPanelRef.value) {
      debugPanelRef.value.addMessage(`Calculated ${currentShapeType.value} area: ${area.value}`);
    }

    errMessage.value = ""; // Clear any previous error
  } catch (e) {
    errMessage.value = e instanceof Error ? e.message : JSON.stringify(e);

    // Log error to debug panel if in dev mode
    if (isDev && debugPanelRef.value) {
      debugPanelRef.value.addMessage(`Error: ${errMessage.value}`);
    }
  }
}

function handleShapeUpdate(shape: Shape, type: ShapeType) {
  currentShape.value = shape;
  currentShapeType.value = type;

  // Log shape update to debug panel if in dev mode
  if (isDev && debugPanelRef.value) {
    debugPanelRef.value.addMessage(`Shape updated: ${type}`);

    if (type === 'polygon') {
      const polygon = shape as Polygon;
      debugPanelRef.value.addMessage(`Polygon now has ${polygon.points.length} points`);
    }
  }

  // Automatically calculate area when shape changes
  calc_area();
}
</script>

<template>
  <main class="app-container">
    <h1 class="text-center mt-0 mb-4">Shape Drawing & Area Calculator</h1>

    <!-- Drawing Canvas -->
    <div class="canvas-section">
      <DrawingCanvas :initial-shape="currentShape" :initial-shape-type="currentShapeType"
        @shape-updated="handleShapeUpdate" />
    </div>

    <div class="result-section">
      <h3>Results:</h3>
      <p class="result">Area: <span class="highlight">{{ area.toFixed(2) }}</span> square units</p>
      <p v-if="errMessage" class="error">{{ errMessage }}</p>
      <p class="note">Note: Rectangle calculations are performed by the Rust backend. Circle and polygon calculations
        are currently done in the frontend.</p>
    </div>

    <!-- Debug Panel - Only shown in development mode -->
    <DebugPanel ref="debugPanelRef" :current-shape="currentShape" :current-shape-type="currentShapeType"
      :debug-mode="isDev" />
  </main>
</template>