# Notes

> AI-powered note editor with real-time intelligent assistance

A minimalist two-panel note editor that makes your writing smarter. Write in the left panel, see AI magic in the right panel - markdown preview, text polishing, math solving, and instant answers to your questions.

**✨ [Try it now](https://dies.github.io/better-editor/)**

## ✨ Features

### Two-Panel Layout (Always Visible)

**LEFT PANEL: Text Editor**
- Clean Monaco editor configured for writing (not coding)
- Markdown support with syntax highlighting
- Word wrap, smooth scrolling
- Distraction-free interface

**RIGHT PANEL: Smart Assistant**
- **📄 Markdown Preview** - Live rendering as you type
- **✍️ Text Polishing** - AI improves grammar, clarity, style (customizable)
- **🧮 Math Solver** - Solves expressions like `100-20%`, `5+5`
- **❓ Q&A** - Answers questions like "5 EUR in UAH?"
- **🤖 AI Detection** - Automatically knows what you need

### Intelligence

- Analyzes text in real-time (1 second after you stop typing)
- Detects markdown → shows preview
- Detects math → solves problems
- Detects questions → provides answers
- Applies your custom correction prompt to everything

### Customization

- **Custom Correction Prompt** - Define how AI should improve your writing
- **Model Selection** - Choose GPT-3.5 Turbo (fastest) to GPT-4o (smartest)
- **Dark/Light Theme** - Easy on the eyes
- **Font Size** - Adjust to your preference

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- OpenAI API key

### Local Development

```bash
# Install dependencies
npm install

# Start dev server with auto-reload
npm run dev
```

Server runs at http://localhost:8000 with:
- ✅ Auto-restart on file changes
- ✅ **No caching** (always fresh code)
- ✅ Service worker disabled for development

**First time?** Just run `npm install && npm run dev` and you're done!

### Production Deployment

**GitHub Pages**

```bash
# Deploy to GitHub Pages
npm run deploy
```

**Live Demo:** https://dies.github.io/better-editor/

See [DEPLOY.md](DEPLOY.md) for detailed deployment instructions.

## ⚙️ Configuration

### 1. Set Your OpenAI API Key

1. Click Settings (⚙️) or press `Cmd+,`
2. Enter your API key from https://platform.openai.com/api-keys
3. Choose your model (GPT-4o Mini recommended for balance)
4. Click Save (key is verified before saving)

### 2. Customize Correction Prompt

Default: "Improve grammar, clarity, and style. Fix typos and suggest better phrasing."

Examples:
- "Make it more formal and professional"
- "Simplify the language for beginners"
- "Add more detail and examples"
- "Make it concise and to the point"

## 📝 Usage Examples

### Writing & Polishing

```
You type:
"The qick brown fox jumps over teh lazy dog"

Smart Panel shows:
✅ "The quick brown fox jumps over the lazy dog"
+ Grammar corrections highlighted
```

### Math Problems

```
You type:
"I need to calculate 100 - 20% ="

Smart Panel shows:
🧮 Result: 80
📝 Explanation: 20% of 100 is 20, so 100 - 20 = 80
```

### Currency & Conversions

```
You type:
"How much is 5 EUR in UAH?"

Smart Panel shows:
💱 5 EUR ≈ 210 UAH
📅 Rate as of [current date]
```

### Markdown Preview

```
You type:
# My Notes
This is **bold** and this is *italic*

Smart Panel shows:
[Beautiful rendered markdown]
```

## ⌨️ Keyboard Shortcuts

- `Cmd+T` - New tab
- `Cmd+O` - Open file
- `Cmd+S` - Save file
- `Cmd+W` - Close tab
- `Cmd+,` - Settings

## 🛠️ Tech Stack

- **Monaco Editor** - The editor that powers VS Code
- **OpenAI API** - GPT models for intelligence
- **Custom Markdown Parser** - Lightweight, works offline
- **Express** - Local dev server
- **Nodemon** - Auto-restart on file changes
- **PWA** - Installable as native app

## 📁 Project Structure

```
better-editor/
├── index.html          # Main app HTML
├── styles.css          # All styles
├── app.js             # Main application
├── logo.svg           # App icon
├── manifest.json      # PWA manifest
├── service-worker.js  # Offline support
├── package.json       # Dependencies
├── nodemon.json       # Auto-reload config
└── js/
    ├── OpenAIClient.js    # API client
    ├── SmartPanel.js      # Right panel logic
    ├── TextEditor.js      # Monaco config
    ├── TabManager.js      # Tab handling
    ├── SettingsManager.js # Settings
    └── FileHandler.js     # File operations
```

## 🔒 Privacy & Security

- API keys stored locally in browser (localStorage)
- Never sent anywhere except OpenAI
- No tracking or analytics
- Files stay on your device
- Works offline (PWA)

## 💡 Tips

1. **Start Simple** - Just start typing and watch the magic
2. **Customize Prompts** - Make AI work the way YOU want
3. **Use Markdown** - Format your notes beautifully
4. **Ask Questions** - The AI is surprisingly smart
5. **Do Math** - No need for calculator apps

## 🚧 Development

```bash
# Local dev server with auto-reload
npm run dev

# Production build
npm start

# Deploy to GitHub Pages
npm run deploy
```

### Stack

- **Express** - Simple local server
- **Nodemon** - Auto-reload on changes
- **gh-pages** - One-command deployment
- **Static PWA** - No build step needed!

### Development Workflow

```bash
# 1. Start dev server (leave it running)
npm run dev

# 2. Edit files - server auto-restarts
# 3. Refresh browser to see changes
# 4. Commit and deploy
git add .
git commit -m "Your changes"
npm run deploy
```

## 🐛 Troubleshooting

**"Port 8000 already in use"**
```bash
# Find and kill the process
lsof -ti:8000 | xargs kill -9
```

**"API key invalid"**
- Check your key at https://platform.openai.com/api-keys
- Make sure you have credits/billing enabled

**"Smart panel not updating"**
- Check API key is set
- Check browser console for errors
- Verify internet connection

## 📄 License

MIT License - feel free to use and modify!

## 🙏 Credits

Built with love using:
- Monaco Editor (Microsoft)
- OpenAI API
- Marked.js
- Feather Icons

---

**Happy note-taking! ✨**
