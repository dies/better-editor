# Code Structure Documentation

This directory contains the modular JavaScript code for the AI Text Editor, organized by responsibility and feature.

## 📁 Directory Structure

```
js/
├── core/           # Core application logic
├── features/       # AI-powered features
├── ui/            # User interface components
└── utils/         # Utility classes and helpers
```

## 🏗️ Core Modules (`/core`)

### `TabManager.js`
Manages tabs (files) in the editor.
- Create, switch, close tabs
- Track tab state (modified, content, language)
- Notify listeners of tab changes

### `EditorManager.js`
Manages Monaco editor instances.
- Create/dispose editor instances per tab
- Apply global settings to all editors
- Handle editor operations (getValue, setValue)

### `FileOperations.js`
Handles file system operations.
- Open files from disk
- Save files to disk
- Integration with File System Access API

## 🤖 Feature Modules (`/features`)

### `AIEditMode.js`
Split-panel AI code improvement feature.
- Generate AI-enhanced versions of code
- Side-by-side comparison
- Accept/reject/regenerate AI suggestions

### `AIChat.js`
AI assistant chat sidebar.
- Chat with AI about your code
- Context-aware responses
- Code explanations and suggestions

### `AIAutocomplete.js` (deprecated)
Legacy autocomplete feature.
- Kept for backward compatibility
- Replaced by AI Edit Mode for better UX

## 🎨 UI Modules (`/ui`)

### `SettingsManager.js`
Application settings management.
- Load/save settings to localStorage
- API key verification
- Settings modal UI

### `ThemeManager.js`
Theme switching (dark/light).
- Apply theme to UI and editors
- Persist theme preference

### `CommandPalette.js`
Quick command access (Cmd+P).
- Fuzzy search commands
- Execute actions quickly
- Keyboard-first navigation

### `TabUI.js`
Tab bar rendering and interaction.
- Render tab list
- Handle tab clicks
- Show modified indicators

### `StatusBar.js`
Bottom status bar.
- Show cursor position
- Display file language
- Show save status

## 🛠️ Utility Modules (`/utils`)

### `OpenAIClient.js`
OpenAI API client wrapper.
- Chat completions
- Code improvement
- API key verification
- Centralized API logic

### `FileHandler.js`
File system utilities.
- File picker dialogs
- Read/write operations
- Language detection from filename

### `KeyboardShortcuts.js`
Global keyboard shortcut handler.
- Register shortcuts with modifiers
- Handle key events globally
- Platform-aware (Mac/Windows)

## 🔄 Data Flow

```
User Action
    ↓
KeyboardShortcuts / UI Event
    ↓
Feature/Core Module
    ↓
Manager (Tab/Editor/Settings)
    ↓
Callback Notifications
    ↓
UI Update
```

## 🎯 Design Principles

1. **Separation of Concerns**: Each module has a single, clear responsibility
2. **Loose Coupling**: Modules communicate through callbacks and interfaces
3. **Easy Testing**: Small, focused modules are easier to test
4. **Maintainability**: Changes to one feature don't affect others
5. **Scalability**: Easy to add new features without touching existing code

## 🚀 Adding New Features

1. Create a new module in the appropriate directory
2. Import it in `app.js`
3. Initialize it in the `AITextEditor` class
4. Register any callbacks or event listeners
5. Add commands to the command palette if needed

Example:
```javascript
// js/features/MyNewFeature.js
export class MyNewFeature {
    constructor(dependencies) {
        this.dependencies = dependencies;
    }
    
    doSomething() {
        // Your feature logic
    }
    
    setupEventListeners() {
        // Event listeners
    }
}

// In app.js
import { MyNewFeature } from './js/features/MyNewFeature.js';

// In init()
this.myFeature = new MyNewFeature(dependencies);
this.myFeature.setupEventListeners();
```

## 📦 Dependencies

- **Monaco Editor**: Loaded via CDN in `app.js`
- **OpenAI API**: REST API client in `OpenAIClient.js`
- **Browser APIs**: File System Access API, Service Worker API

## 🔍 Module Dependencies

```
app.js (Main Entry)
 ├─ OpenAIClient
 ├─ TabManager
 ├─ EditorManager
 │   └─ uses: TabManager
 ├─ SettingsManager
 │   └─ uses: OpenAIClient
 ├─ ThemeManager
 │   └─ uses: SettingsManager
 ├─ AIEditMode
 │   └─ uses: OpenAIClient, TabManager, EditorManager, SettingsManager
 ├─ AIChat
 │   └─ uses: OpenAIClient, TabManager
 └─ FileOperations
     └─ uses: TabManager, EditorManager, FileHandler
```

## 🧪 Testing Strategy

Each module can be tested independently:
- Unit tests for utility modules
- Integration tests for feature modules
- UI tests for interface components

## 📝 Notes

- All modules use ES6 imports/exports
- Callbacks are used for loose coupling
- Settings are persisted to localStorage
- Editor instances are cached per tab

