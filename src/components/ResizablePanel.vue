<script setup lang="ts">
import { ref, onUnmounted } from 'vue';

const props = defineProps<{
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  resizeDirection?: 'horizontal' | 'vertical' | 'both';
  position?: 'left' | 'right' | 'top' | 'bottom';
}>();

// Default values for props
const initialWidth = props.initialWidth || 250;
const initialHeight = props.initialHeight || 250;
const minWidth = props.minWidth || 100;
const minHeight = props.minHeight || 100;
const maxWidth = props.maxWidth || window.innerWidth;
const maxHeight = props.maxHeight || window.innerHeight;
const resizeDirection = props.resizeDirection || 'both';
const position = props.position || 'right';

// Reactive state
const width = ref(initialWidth);
const height = ref(initialHeight);
const isResizing = ref(false);
const startX = ref(0);
const startY = ref(0);
const startWidth = ref(0);
const startHeight = ref(0);

// Resize handlers
function startResize(e: MouseEvent) {
  isResizing.value = true;
  startX.value = e.clientX;
  startY.value = e.clientY;
  startWidth.value = width.value;
  startHeight.value = height.value;
  
  document.addEventListener('mousemove', resize);
  document.addEventListener('mouseup', stopResize);
  
  // Prevent text selection during resize
  document.body.style.userSelect = 'none';
}

function resize(e: MouseEvent) {
  if (!isResizing.value) return;
  
  if (resizeDirection === 'horizontal' || resizeDirection === 'both') {
    const deltaX = position === 'left' ? startX.value - e.clientX : e.clientX - startX.value;
    const newWidth = startWidth.value + deltaX;
    width.value = Math.max(minWidth, Math.min(maxWidth, newWidth));
  }
  
  if (resizeDirection === 'vertical' || resizeDirection === 'both') {
    const deltaY = position === 'top' ? startY.value - e.clientY : e.clientY - startY.value;
    const newHeight = startHeight.value + deltaY;
    height.value = Math.max(minHeight, Math.min(maxHeight, newHeight));
  }
}

function stopResize() {
  isResizing.value = false;
  document.removeEventListener('mousemove', resize);
  document.removeEventListener('mouseup', stopResize);
  document.body.style.userSelect = '';
}

// Clean up event listeners on unmount
onUnmounted(() => {
  if (isResizing.value) {
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResize);
    document.body.style.userSelect = '';
  }
});

// Determine resize handle position classes
const handleClasses = {
  left: position === 'left' ? 'left-0' : 'right-0',
  top: position === 'top' ? 'top-0' : 'bottom-0',
  cursor: resizeDirection === 'horizontal' ? 'cursor-ew-resize' : 
           resizeDirection === 'vertical' ? 'cursor-ns-resize' : 'cursor-nwse-resize'
};
</script>

<template>
  <div 
    class="resizable-panel"
    :style="{
      width: `${width}px`,
      height: `${height}px`
    }"
  >
    <div class="panel-content">
      <slot></slot>
    </div>
    
    <!-- Resize handle -->
    <div
      class="resize-handle"
      :class="[handleClasses.cursor, handleClasses.left, handleClasses.top]"
      @mousedown="startResize"
    ></div>
  </div>
</template>

<style scoped>
.resizable-panel {
  position: relative;
  overflow: hidden;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background: #f8f8f8;
}

.panel-content {
  height: 100%;
  width: 100%;
  overflow: auto;
  padding: 10px;
}

.resize-handle {
  position: absolute;
  z-index: 10;
  background-color: transparent;
}

/* Horizontal resize handle */
.resize-handle.cursor-ew-resize {
  width: 6px;
  height: 100%;
  top: 0;
}

/* Vertical resize handle */
.resize-handle.cursor-ns-resize {
  height: 6px;
  width: 100%;
  left: 0;
}

/* Corner resize handle */
.resize-handle.cursor-nwse-resize {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.resize-handle:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.resize-handle:active {
  background-color: rgba(0, 0, 0, 0.2);
}

@media (prefers-color-scheme: dark) {
  .resizable-panel {
    background: #2d2d2d;
    border-color: #444;
  }
}
</style>
