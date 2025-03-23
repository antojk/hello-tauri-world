<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Shape, ShapeType } from '../types/shapes';

const props = defineProps<{
  currentShape: Shape;
  currentShapeType: ShapeType;
  debugMode: boolean;
}>();

// Store debug messages
const messages = ref<string[]>([]);

// Maximum number of messages to show
const MAX_MESSAGES = 10;

// Add a debug message
function addMessage(message: string) {
  messages.value.unshift(message);
  if (messages.value.length > MAX_MESSAGES) {
    messages.value = messages.value.slice(0, MAX_MESSAGES);
  }
}

// Clear messages
function clearMessages() {
  messages.value = [];
}

// Watch for shape changes
watch(() => props.currentShape, (newShape) => {
  if (props.debugMode) {
    if (props.currentShapeType === 'polygon') {
      const polygon = newShape as { points: { x: number, y: number }[] };
      addMessage(`Polygon points: ${polygon.points.length}`);

      // Log each point for debugging
      polygon.points.forEach((point, index) => {
        addMessage(`  Point ${index}: (${point.x.toFixed(1)}, ${point.y.toFixed(1)})`);
      });
    }
  }
}, { deep: true });

// Expose methods
defineExpose({
  addMessage,
  clearMessages
});
</script>

<template>
  <div v-if="debugMode"
    class="fixed bottom-2 right-2 w-72 max-h-48 bg-black/80 text-green-400 rounded font-mono text-xs z-50 overflow-hidden flex flex-col">
    <div class="flex justify-between items-center p-2 bg-black/90 border-b border-gray-700">
      <h3 class="m-0 text-sm">Debug Panel</h3>
      <button @click="clearMessages"
        class="bg-gray-700 text-white border-none rounded px-2 py-1 cursor-pointer text-xs hover:bg-gray-600">
        Clear
      </button>
    </div>
    <div class="p-2 overflow-y-auto max-h-36">
      <div v-if="currentShapeType === 'polygon'" class="mb-1 pb-1 border-b border-dashed border-gray-700">
        <strong>Polygon Points:</strong>
        {{ (currentShape as any).points?.length || 0 }}
      </div>
      <div class="flex flex-col">
        <div v-for="(msg, index) in messages" :key="index" class="mb-1 break-all">
          {{ msg }}
        </div>
      </div>
    </div>
  </div>
</template>