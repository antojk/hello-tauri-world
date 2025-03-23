<script setup lang="ts">
import { defineProps, defineEmits, onUnmounted } from 'vue';
import type { ShapeType } from '../../types/shapes';

const props = defineProps<{
  selectedShape: ShapeType;  // This prop name matches what's used in the template
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
  <div class="bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700 p-4 w-20 flex flex-col gap-4">
    <h3 class="text-xs font-semibold text-center uppercase text-gray-600 dark:text-gray-400 mb-2">Shapes</h3>
    
    <div class="flex flex-col gap-3">
      <button 
        v-for="shape in shapes" 
        :key="shape.id"
        @click="selectShape(shape.id as ShapeType)" 
        :class="{ 
          'bg-primary-500 text-white border-primary-600': props.selectedShape === shape.id,
          'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600': props.selectedShape !== shape.id
        }"
        class="w-12 h-12 flex flex-col items-center justify-center rounded mx-auto
               border border-gray-300 dark:border-gray-700 transition-colors duration-200"
        :title="shape.tooltip"
        :aria-label="shape.label"
      >
        <span class="text-xl mb-1">{{ shape.icon }}</span>
        <span class="text-xs">{{ shape.label }}</span>
      </button>
    </div>
    
    <!-- Spacer to push reset button to the bottom -->
    <div class="grow"></div>
    
    <button 
      @click="resetCanvas" 
      class="w-12 h-12 flex flex-col items-center justify-center rounded mx-auto
             bg-red-500 hover:bg-red-600 text-white border border-red-600
             transition-colors duration-200"
      title="Reset Canvas (Esc)"
      aria-label="Reset Canvas"
    >
      <span class="text-xl mb-1">↺</span>
      <span class="text-xs">Reset</span>
    </button>
  </div>
</template>