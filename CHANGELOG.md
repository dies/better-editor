# Changelog

## v2.0.0 - Major Refactor & UI Improvements (2024)

### 🎨 UI/UX Improvements
- ✨ **New Minimalist Logo**: Beautiful animated SVG logo with gradient pen design
- 🎯 **Cleaner Header**: Removed app name text, leaving only the elegant logo icon
- 💅 **Refined Icons**: Replaced emoji icons with clean, minimalist SVG icons (Feather Icons style)
- 🎨 **Better Visual Hierarchy**: Improved spacing and visual balance

### 🏗️ Architecture Overhaul
Refactored monolithic 980-line `app.js` into clean, modular structure:

#### Core Modules (`js/core/`)
- **TabManager.js** - Tab lifecycle and state management
- **EditorManager.js** - Monaco editor instance management
- **FileOperations.js** - File system operations (open/save)

#### Feature Modules (`js/features/`)
- **AIEditMode.js** - Split-panel code improvement (main feature)
- **AIChat.js** - AI assistant chat sidebar
- **AIAutocomplete.js** - Legacy autocomplete (deprecated)

#### UI Modules (`js/ui/`)
- **SettingsManager.js** - Settings persistence and API key verification
- **ThemeManager.js** - Dark/light theme switching
- **CommandPalette.js** - Quick command access
- **TabUI.js** - Tab bar rendering
- **StatusBar.js** - Bottom status information

#### Utility Modules (`js/utils/`)
- **OpenAIClient.js** - Centralized OpenAI API client
- **FileHandler.js** - File system utilities
- **KeyboardShortcuts.js** - Global keyboard shortcut handler

### ✨ New Features
- **AI Edit Mode (Cmd+E)**: Split-panel view for AI-powered code improvements
  - Side-by-side comparison of original and improved code
  - Custom prompt input for specific instructions
  - Accept/Reject/Regenerate controls
  - Much better UX than autocomplete for substantial code changes

### 🔧 Technical Improvements
- **ES6 Modules**: Proper module system with imports/exports
- **Separation of Concerns**: Each module has single, clear responsibility
- **Loose Coupling**: Modules communicate through callbacks
- **Better Maintainability**: Easy to find, update, and test specific features
- **Scalability**: Simple to add new features without touching existing code

### 🗑️ Removed
- **Autocomplete UI Settings**: Removed autocomplete delay and toggle from settings
  - Feature deprecated in favor of AI Edit Mode
  - Code kept for backward compatibility but not actively used

### 📚 Documentation
- **js/README.md**: Comprehensive code structure documentation
- **README.md**: Updated with new features and modular structure
- **CHANGELOG.md**: This file!

### 🎯 Benefits

**For Users:**
- Cleaner, more professional interface
- Better AI features (Edit Mode >> Autocomplete)
- Faster, more responsive UI

**For Developers:**
- ~100 line files instead of 1 giant file
- Easy to understand and modify
- Clear dependencies and data flow
- Ready for unit testing
- Simple to extend with new features

### 📦 File Structure
```
Before:                     After:
app.js (980 lines)    →    app.js (200 lines, orchestration only)
                           js/
                             ├── core/ (3 modules)
                             ├── features/ (3 modules)
                             ├── ui/ (5 modules)
                             └── utils/ (3 modules)
```

### 🚀 Migration Notes
- No breaking changes for users
- Settings migrate automatically
- Service worker cache updated (v1 → v2)
- New logo cached for offline use

### ⚡ Performance
- Slightly faster initial load (ES6 modules lazy load)
- Better memory management (clear module boundaries)
- Same runtime performance

---

## v1.0.0 - Initial Release

### Features
- Monaco editor integration
- OpenAI API integration
- Multi-tab support
- File system access
- PWA support
- Dark/light themes
- Command palette
- AI chat
- AI autocomplete

