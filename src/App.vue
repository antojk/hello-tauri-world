<script setup lang="ts">
import { ref } from "vue";
import { invoke } from "@tauri-apps/api/core";
import DrawingCanvas from "./components/DrawingCanvas.vue";

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

const area = ref(0);
const errMessage = ref("");
const currentShape = ref<Rectangle | Circle | Polygon>({
  top_left: { x: 0, y: 0 },
  bottom_right: { x: 0, y: 0 }
});
const currentShapeType = ref<ShapeType>('rectangle');
const gridSize = ref(20); // Size of grid cells

async function calc_area() {
  try {
    if (currentShapeType.value === 'rectangle') {
      const rect = currentShape.value as Rectangle;
      // Convert grid coordinates to coordinate system units
      const normalizedRect: Rectangle = {
        top_left: {
          x: Math.round(rect.top_left.x / gridSize.value),
          y: Math.round(-rect.top_left.y / gridSize.value) // Flip Y axis
        },
        bottom_right: {
          x: Math.round(rect.bottom_right.x / gridSize.value),
          y: Math.round(-rect.bottom_right.y / gridSize.value) // Flip Y axis
        }
      };
      
      // Call Rust backend for rectangle area calculation
      area.value = await invoke('calc_area', { target: normalizedRect });
    } else if (currentShapeType.value === 'circle') {
      // Currently calculated in frontend, but can be replaced with Rust backend call
      const circle = currentShape.value as Circle;
      area.value = Math.PI * Math.pow(circle.radius / gridSize.value, 2);
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
      
      area.value = Math.abs(polygonArea) / 2 / (gridSize.value * gridSize.value);
    }
    
    errMessage.value = ""; // Clear any previous error
  } catch (e) {
    errMessage.value = e instanceof Error ? e.message : JSON.stringify(e);
  }
}

function handleShapeUpdate(shape: Rectangle | Circle | Polygon, type: ShapeType) {
  currentShape.value = shape;
  currentShapeType.value = type;
  
  // Automatically calculate area when shape changes
  calc_area();
}
</script>

<template>
  <main class="container">
    <h1>Shape Drawing & Area Calculator</h1>
    
    <!-- Drawing Canvas -->
    <div class="canvas-section">
      <DrawingCanvas 
        :grid-size="gridSize"
        :initial-shape="currentShape"
        @shape-updated="handleShapeUpdate" 
      />
    </div>
    
    <div class="result-section">
      <h3>Results:</h3>
      <p class="result">Area: <span class="highlight">{{ area.toFixed(2) }}</span> square units</p>
      <p v-if="errMessage" class="error">{{ errMessage }}</p>
      <p class="note">Note: Rectangle calculations are performed by the Rust backend. Circle and polygon calculations are currently done in the frontend.</p>
    </div>
  </main>
</template>

<style>
:root {
  font-family: Inter, Avenir, Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 24px;
  font-weight: 400;
  color: #0f0f0f;
  background-color: #f6f6f6;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

.container {
  margin: 0;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  height: 100vh;
  box-sizing: border-box;
}

h1 {
  text-align: center;
  margin-top: 0;
  margin-bottom: 1rem;
}

.canvas-section {
  flex: 1;
  display: flex;
  min-height: 0; /* Important for flexbox to respect children's sizes */
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.result-section {
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: #e8f5e9;
  border-radius: 8px;
  border-left: 4px solid #4caf50;
}

.result {
  font-size: 1.2em;
}

.highlight {
  font-weight: bold;
  color: #2e7d32;
}

.error {
  color: #d32f2f;
  background-color: #ffebee;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
}

.note {
  font-style: italic;
  font-size: 0.9em;
  color: #666;
  margin-top: 0.5rem;
}

@media (prefers-color-scheme: dark) {
  :root {
    color: #f6f6f6;
    background-color: #2f2f2f;
  }
  
  .result-section {
    background-color: #263238;
    border-left-color: #4caf50;
  }
  
  .highlight {
    color: #81c784;
  }
  
  .error {
    background-color: #311b1b;
  }
  
  .note {
    color: #aaa;
  }
}
</style>