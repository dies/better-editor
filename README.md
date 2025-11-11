# AI Text Editor - Minimalist PWA

A powerful, minimalist text editor PWA with Monaco editor and OpenAI integration for intelligent code completion and AI assistance.

## ✨ Features

### Core Features
- 🎨 **Monaco Editor** - Full-featured code editor with syntax highlighting
- ✨ **AI Edit Mode** - Split-panel code improvement with side-by-side comparison
- 💬 **AI Chat Assistant** - Ask questions, get explanations, refactor code
- 📱 **PWA Support** - Install as native app on macOS, Windows, Linux
- 📁 **File Handlers** - Open .js, .txt, .ts, .json, .html, .css, .md files directly

### Productivity Features
- 🗂️ **Multi-Tab Support** - Work with multiple files simultaneously
- ⌨️ **Keyboard Shortcuts** - Full keyboard navigation
- 🎯 **Command Palette** - Quick access to all commands (Cmd+P)
- 💾 **File System Access** - Native open/save file dialogs
- 🌓 **Dark/Light Themes** - Easy on the eyes
- 📊 **Status Bar** - Line/column numbers, language detection
- 🎭 **Minimalist Design** - Clean, distraction-free interface with vector logo

## 🚀 Getting Started

### 1. Serve the Application

You need to serve the app over HTTPS or localhost for PWA features to work.

**Option A: Using Python (simplest)**
```bash
# Python 3
python3 -m http.server 8000

# Then open: http://localhost:8000
```

**Option B: Using Node.js**
```bash
# Install serve globally
npm install -g serve

# Run
serve -p 8000

# Then open: http://localhost:8000
```

**Option C: Using PHP**
```bash
php -S localhost:8000
```

### 2. Configure OpenAI API

1. Click the **Settings** button (⚙️) or press `Cmd+,`
2. Enter your OpenAI API key (get one at https://platform.openai.com/api-keys)
3. Select your preferred model:
   - **GPT-4o Mini** (recommended) - Fast and balanced
   - **GPT-4o** - Most capable
   - **GPT-3.5 Turbo** - Fastest
4. Click "Save Settings"
   - The app will verify your API key before saving
   - You'll see "Verifying API Key..." while it checks
   - Invalid keys will be rejected with an error message

### 3. Install as PWA

**On macOS (Safari or Chrome):**
1. Open the app in your browser
2. Click the Share button or browser menu
3. Select "Add to Dock" or "Install App"
4. The app will now open .js and .txt files directly!

**On Chrome/Edge:**
1. Click the install icon (⊕) in the address bar
2. Click "Install"

## ⌨️ Keyboard Shortcuts

### File Operations
- `Cmd+T` - New tab
- `Cmd+O` - Open file
- `Cmd+S` - Save file
- `Cmd+W` - Close tab

### Navigation
- `Cmd+1-9` - Switch to tab 1-9
- `Cmd+Tab` - Next tab
- `Cmd+Shift+Tab` - Previous tab

### AI Features
- `Cmd+E` - Toggle AI Edit Mode (split-panel code improvement)
- `Cmd+Shift+A` - Accept AI suggestions
- `Cmd+Shift+R` - Reject AI suggestions
- `Cmd+Shift+G` - Regenerate AI suggestions

### Commands
- `Cmd+P` - Command palette
- `Cmd+K` - Toggle AI chat
- `Cmd+,` - Settings
- `Esc` - Dismiss modals

## 🤖 AI Features

### AI Edit Mode (Cmd+E)
The star feature! Opens a split-panel view showing:
- **Left panel**: Your original code
- **Right panel**: AI-enhanced version
- **Custom prompts**: Type specific instructions
- **Accept/Reject**: Easy controls to apply or dismiss changes
- **Regenerate**: Try different improvements

Perfect for:
- Code review and improvements
- Adding comments and documentation
- Refactoring and optimization
- Fixing bugs and best practices

### AI Chat Assistant (Cmd+K)
- Ask questions about your code
- Get explanations and suggestions
- Context-aware (sees your current file)
- Powered by GPT-4o-mini by default

## 🎨 Customization

All settings are available in the Settings panel (Cmd+,):

- **API Key** - Your OpenAI API key (stored locally)
- **Model** - Choose your preferred OpenAI model
- **Autocomplete** - Enable/disable AI suggestions
- **Autocomplete Delay** - Adjust trigger delay (500-5000ms)
- **Font Size** - Editor font size (10-24px)
- **Theme** - Toggle with the 🌙 button

## 📁 File Handling

The app registers handlers for:
- JavaScript (`.js`, `.mjs`)
- TypeScript (`.ts`, `.tsx`)
- Text files (`.txt`)
- JSON (`.json`)
- HTML (`.html`)
- CSS (`.css`)
- Markdown (`.md`)

Once installed as a PWA, you can:
1. Right-click any supported file
2. Choose "Open With"
3. Select "AI Text Editor"
4. File opens directly in the app!

## 🔒 Privacy & Security

- **API key verification** - Keys are validated before being saved
- **API keys stored locally** - Never sent anywhere except OpenAI
- **No tracking** - No analytics or data collection
- **Offline capable** - Core features work without internet
- **Local file access** - Files stay on your device

## 🛠️ Technical Stack

- **Monaco Editor** - The editor that powers VS Code
- **OpenAI API** - GPT-4o-mini for AI features
- **Service Worker** - PWA offline support
- **File System Access API** - Native file handling
- **Web App Manifest** - PWA installation
- **ES6 Modules** - Clean, modular code architecture

## 📁 Project Structure

```
better-editor/
├── index.html          # Main HTML file
├── styles.css          # Global styles
├── app.js             # Main application entry point
├── logo.svg           # App logo
├── manifest.json      # PWA manifest
├── service-worker.js  # Service worker for offline support
└── js/                # Modular JavaScript code
    ├── core/          # Core application logic
    │   ├── TabManager.js
    │   ├── EditorManager.js
    │   └── FileOperations.js
    ├── features/      # AI-powered features
    │   ├── AIEditMode.js
    │   ├── AIChat.js
    │   └── AIAutocomplete.js
    ├── ui/            # User interface components
    │   ├── SettingsManager.js
    │   ├── ThemeManager.js
    │   ├── CommandPalette.js
    │   ├── TabUI.js
    │   └── StatusBar.js
    └── utils/         # Utility classes
        ├── OpenAIClient.js
        ├── FileHandler.js
        └── KeyboardShortcuts.js
```

See [js/README.md](js/README.md) for detailed code structure documentation.

## 💡 Tips

1. **AI Edit Mode** - Use Cmd+E for comprehensive code improvements instead of small autocomplete suggestions
2. **Custom Prompts** - In AI Edit Mode, type specific instructions like "Add error handling" or "Make this more efficient"
3. **AI Chat** - Use Cmd+K for questions and explanations about your code
4. **Keyboard First** - Most actions have keyboard shortcuts (Cmd+P to see all)
5. **Command Palette** - When in doubt, press Cmd+P to search commands
6. **Fast Model** - GPT-4o-mini is perfect for quick code improvements

## 🚧 Future Ideas

- [ ] Code snippets library
- [ ] Git integration
- [ ] Collaborative editing
- [ ] Plugin system
- [ ] More AI features (refactoring, testing, documentation)
- [ ] Cloud sync (optional)
- [ ] Mobile optimization

## 📝 License

MIT License - Feel free to modify and use as you wish!

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome!

---

**Enjoy your AI-powered text editor! 🚀**

