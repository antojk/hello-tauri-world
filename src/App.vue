<script setup lang="ts">
import { ref } from "vue";
import { invoke } from "@tauri-apps/api/core";
import DrawingCanvas from "./components/DrawingCanvas/index.vue";
import DebugPanel from "./components/DebugPanel.vue";
import type { Shape, ShapeType, Rectangle, Circle, Polygon } from './types/shapes';

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
    if (currentShapeType.value === 'rectangle') {
      const rect = currentShape.value as Rectangle;

      // Convert grid coordinates to coordinate system units for Rust backend
      const normalizedRect: Rectangle = {
        top_left: {
          x: Math.round(rect.top_left.x),
          y: Math.round(-rect.top_left.y) // Flip Y axis
        },
        bottom_right: {
          x: Math.round(rect.bottom_right.x),
          y: Math.round(-rect.bottom_right.y) // Flip Y axis
        }
      };

      // Call Rust backend for rectangle area calculation
      area.value = await invoke('calc_area', { target: normalizedRect });

      // Log to debug panel if in dev mode
      if (isDev && debugPanelRef.value) {
        debugPanelRef.value.addMessage(`Calculated rectangle area: ${area.value}`);
      }
    } else if (currentShapeType.value === 'circle') {
      // Currently calculated in frontend, but can be replaced with Rust backend call
      const circle = currentShape.value as Circle;
      area.value = Math.PI * Math.pow(circle.radius, 2);

      // Log to debug panel if in dev mode
      if (isDev && debugPanelRef.value) {
        debugPanelRef.value.addMessage(`Calculated circle area: ${area.value}`);
      }
    } else if (currentShapeType.value === 'polygon') {
      // Currently calculated in frontend, but can be replaced with Rust backend call
      const polygon = currentShape.value as Polygon;
      if (polygon.points.length < 3) {
        throw new Error("A polygon needs at least 3 points");
      }

      // Calculate polygon area using Shoelace formula
      let polygonArea = 0;
      const points = polygon.points;
      const n = points.length;

      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        polygonArea += points[i].x * points[j].y;
        polygonArea -= points[j].x * points[i].y;
      }

      area.value = Math.abs(polygonArea) / 2;

      // Log to debug panel if in dev mode
      if (isDev && debugPanelRef.value) {
        debugPanelRef.value.addMessage(`Calculated polygon area: ${area.value}`);
        debugPanelRef.value.addMessage(`Polygon has ${n} points`);
      }
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