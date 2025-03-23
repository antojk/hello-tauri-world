<script setup lang="ts">
import { defineProps, defineEmits, onUnmounted } from 'vue';
import type { ShapeType } from '../../types/shapes';

const props = defineProps<{
  selectedShape: ShapeType;
}>();

const emit = defineEmits<{
  (e: 'selectShape', shape: ShapeType): void;
  (e: 'resetCanvas'): void;
}>();

// Shape definitions with icons and tooltips
const shapes = [
  { id: 'rectangle', label: 'Rectangle', icon: '□', tooltip: 'Draw a rectangle (R)' },
  { id: 'circle', label: 'Circle', icon: '○', tooltip: 'Draw a circle (C)' },
  { id: 'polygon', label: 'Polygon', icon: '⭐', tooltip: 'Draw a polygon (P)' }
] as const;

function selectShape(shape: ShapeType) {
  emit('selectShape', shape);
}

function resetCanvas() {
  emit('resetCanvas');
}

// Handle keyboard shortcuts
function handleKeyDown(event: KeyboardEvent) {
  // Only process if no input element is focused
  if (document.activeElement?.tagName === 'INPUT' || 
      document.activeElement?.tagName === 'TEXTAREA') {
    return;
  }
  
  switch (event.key.toLowerCase()) {
    case 'r':
      emit('selectShape', 'rectangle');
      break;
    case 'c':
      emit('selectShape', 'circle');
      break;
    case 'p':
      emit('selectShape', 'polygon');
      break;
    case 'escape':
      emit('resetCanvas');
      break;
  }
}

// Setup keyboard shortcuts
window.addEventListener('keydown', handleKeyDown);
// Clean up on component unmount
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <div class="shape-menu">
    <div class="menu-section">
      <h3 class="menu-title">Shapes</h3>
      <div class="shape-buttons">
        <button 
          v-for="shape in shapes" 
          :key="shape.id"
          @click="selectShape(shape.id as ShapeType)" 
          :class="{ active: selectedShape === shape.id }"
          :title="shape.tooltip"
          :aria-label="shape.label"
        >
          <span class="shape-icon">{{ shape.icon }}</span>
          <span class="shape-label">{{ shape.label }}</span>
        </button>
      </div>
    </div>
    
    <div class="menu-section">
      <button 
        @click="resetCanvas" 
        class="reset-btn" 
        title="Reset Canvas (Esc)"
        aria-label="Reset Canvas"
      >
        <span class="reset-icon">↺</span>
        <span class="reset-label">Reset</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.shape-menu {
  background-color: #f5f5f5;
  border-right: 1px solid #ccc;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px 8px;
  width: 80px;
}

.menu-section {
  margin-bottom: 20px;
}

.menu-title {
  font-size: 0.8rem;
  font-weight: 600;
  margin: 0 0 8px;
  text-align: center;
  text-transform: uppercase;
  color: #666;
}

.shape-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

button {
  background-color: transparent;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px;
  transition: all 0.2s;
  width: 100%;
}

button:hover {
  background-color: #e0e0e0;
}

button.active {
  background-color: #2196F3;
  color: white;
  border-color: #1976D2;
}

.shape-icon, .reset-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.shape-label, .reset-label {
  font-size: 10px;
}

.reset-btn {
  background-color: #f44336;
  color: white;
  border-color: #d32f2f;
  margin-top: auto;
}

.reset-btn:hover {
  background-color: #d32f2f;
}

@media (prefers-color-scheme: dark) {
  .shape-menu {
    background-color: #333;
    border-color: #444;
  }
  
  .menu-title {
    color: #aaa;
  }
  
  button {
    background-color: #3a3a3a;
    border-color: #555;
    color: #eee;
  }
  
  button:hover {
    background-color: #444;
  }
}
</style>
