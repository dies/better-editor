# NotAIs - Product Specification

**NotAIs** (pronounced "Notes") - AI-Powered Note Editor

## Core Vision
A minimalist, two-panel note-taking application that combines a clean text editor with an AI-powered smart assistant panel. The app should feel like a modern, intelligent notepad that helps you write better, solve problems, and get instant answers.

## Architecture

### Two-Panel Layout (Always Visible)

**LEFT PANEL: Text Editor**
- Monaco editor configured for text/markdown editing (NOT code editing)
- Clean, distraction-free interface
- Features:
  - Line numbers (optional)
  - Word wrap enabled
  - Markdown syntax highlighting
  - Minimal UI chrome
  - Focus on writing, not coding

**RIGHT PANEL: Smart Assistant**
- Always-visible AI-powered panel
- Real-time analysis and enhancement
- Features:
  1. **Markdown Preview** - Renders markdown with a reliable library (marked.js)
  2. **Text Polishing** - AI improves grammar, clarity, style based on custom user prompt
  3. **Math Solver** - Detects and solves mathematical expressions (e.g., "100-20%", "5+5")
  4. **Question Answering** - Answers questions like "5 EUR in UAH", "What is X?"
  5. **Smart Detection** - Automatically detects what kind of help user needs

## Key Features

### 1. Smart Panel Behavior
- Analyzes text as you type (with debouncing)
- Automatically detects:
  - Markdown content → renders preview
  - Math expressions → solves and shows results
  - Questions → provides answers
  - Regular text → applies corrections based on user's prompt
- Updates in real-time (1-second delay after typing stops)

### 2. Customizable Text Correction
- Settings panel with textarea for custom correction prompt
- Default prompt: "Improve grammar, clarity, and style. Fix typos and suggest better phrasing."
- User can customize: "Make it more formal", "Simplify language", "Add more detail", etc.
- AI applies this prompt to all text analysis

### 3. File Management
- Multi-tab support for multiple notes
- Open/save files (.txt, .md, .json, etc.)
- PWA with file handler registration
- Auto-save support

### 4. Model Selection
- Settings to choose OpenAI model
- Fast models for real-time analysis:
  - GPT-3.5 Turbo (fastest, cheapest)
  - GPT-4o Mini (balanced)
  - GPT-4o (most capable)
- Separate autocomplete model option for quick suggestions

### 5. UI/UX
- Minimalist design with clean vector logo
- Dark/light theme support
- Keyboard-first navigation
- Command palette for quick actions
- Status bar with cursor position and stats

## What to EXCLUDE

❌ **No Chat Sidebar** - Not needed, Smart Panel handles everything
❌ **No AI Edit Mode Modal** - Smart Panel replaces this
❌ **No Complex Autocomplete** - Keep it simple
❌ **No Code-Editor Features** - This is for notes, not code

## Technical Stack

- **Monaco Editor** - Configured for text editing
- **OpenAI API** - For all AI features
- **Marked.js** - For markdown rendering
- **ES6 Modules** - Clean, modular code
- **PWA** - Installable, offline-capable
- **File System Access API** - Native file operations

## Settings Panel

Required settings:
1. **OpenAI API Key** (with verification)
2. **Model Selection** (main and autocomplete)
3. **Custom Correction Prompt** (textarea)
4. **Enable/Disable Smart Panel**
5. **Font Size**
6. **Theme Toggle**

## Smart Panel Logic

```
User types → 1 second delay → Analyze content:

IF markdown detected:
  → Render markdown preview

IF math expression detected (e.g., "100-20%", "5+5"):
  → Calculate result
  → Show formatted answer

IF question detected (e.g., "5 EUR in UAH", "What is..."):
  → Query AI for answer
  → Show clear response

ELSE:
  → Apply user's correction prompt
  → Show polished version with corrections highlighted
```

## Example Use Cases

### Use Case 1: Writing Notes
```
User types: "The qick brown fox jumps over teh lazy dog"
Smart Panel shows: "The quick brown fox jumps over the lazy dog"
+ Grammar corrections highlighted
```

### Use Case 2: Math
```
User types: "I need to calculate 100 - 20% ="
Smart Panel shows: "Result: 80"
+ Explanation of calculation
```

### Use Case 3: Currency
```
User types: "How much is 5 EUR in UAH?"
Smart Panel shows: "5 EUR = approximately 210 UAH"
+ Current exchange rate and timestamp
```

### Use Case 4: Markdown
```
User types:
# Hello
This is **bold**

Smart Panel shows:
[Rendered markdown with proper formatting]
```

## File Structure

```
better-editor/
├── index.html          # Main app
├── styles.css          # All styles
├── app.js             # Main app logic
├── logo.svg           # App icon
├── manifest.json      # PWA manifest
├── service-worker.js  # PWA offline support
└── js/
    ├── SmartPanel.js      # Smart panel logic
    ├── TextEditor.js      # Monaco config
    ├── TabManager.js      # Tab handling
    ├── OpenAIClient.js    # API client
    ├── SettingsManager.js # Settings
    └── FileHandler.js     # File operations
```

## Success Criteria

✅ Clean two-panel layout that's always visible
✅ Monaco configured for text (not code) editing
✅ Smart panel that actually helps with writing
✅ Math and question answering works reliably
✅ Markdown preview is smooth and accurate
✅ User can customize correction behavior
✅ Fast, responsive, feels like magic
✅ Works offline as PWA
✅ Beautiful, minimalist design

## Future Enhancements (Not for initial build)

- Voice dictation
- Collaborative editing
- Cloud sync
- Templates library
- Export to PDF
- Advanced math rendering (LaTeX)
- Multiple AI providers
- Plugins system

