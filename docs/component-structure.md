src/
├── App.vue                   # Main application component
├── components/
│   ├── DrawingCanvas/        # Main drawing canvas container
│   │   ├── index.vue         # Combines all sub-components
│   │   ├── GraphGrid.vue     # Grid display with units and axes
│   │   ├── ShapeMenu.vue     # Tools for selecting shapes
│   │   ├── DrawingArea.vue   # The actual canvas element and drawing logic
│   │   └── PropertiesPanel.vue # Unit settings and shape properties
│   └── ResizablePanel.vue    # Resizable panel component
├── types/
│   └── shapes.ts             # Type definitions for shapes
└── utils/
    ├── coordinates.ts        # Coordinate conversion utilities
    └── measurementUnits.ts   # Units of measurement utilities
