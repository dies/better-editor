// NotAIs - AI-Powered Note Editor
import { OpenAIClient } from './js/OpenAIClient.js';
import { SmartPanel } from './js/SmartPanel.js';
import { TextEditor } from './js/TextEditor.js';
import { TabManager } from './js/TabManager.js';
import { SettingsManager } from './js/SettingsManager.js';
import { FileHandler } from './js/FileHandler.js';

class NotAIs {
    constructor() {
        this.init();
    }

    async init() {
        // Register service worker
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/service-worker.js');
                // Force update to get latest version
                registration.update();
            } catch (error) {
                console.error('Service Worker error:', error);
            }
        }

        // Load Monaco
        await this.loadMonaco();

        // Initialize settings FIRST to get theme
        this.settingsManager = new SettingsManager(null);
        this.settings = this.settingsManager.settings;

        // Initialize OpenAI
        this.openAI = new OpenAIClient(this.settings.apiKey, this.settings.model);
        this.settingsManager.openAIClient = this.openAI;

        // Initialize managers
        this.tabManager = new TabManager();
        this.textEditor = new TextEditor(this.settings);
        this.smartPanel = new SmartPanel(this.openAI);
        this.smartPanel.setEnabled(this.settings.smartPanelEnabled);

        // Create initial tab
        const welcomeText = `# Welcome to NotAIs

Start typing to see AI magic in the right panel!

**Try these:**
- Write some text (AI will polish it)
- Math: \`100 - 20% =\`
- Questions: \`5 EUR in UAH?\`
- Use markdown formatting

The right panel will automatically:
- Render markdown beautifully
- Solve math problems
- Answer questions
- Polish your writing based on your custom prompt`;

        this.tabManager.createTab('Welcome.md', welcomeText);
        
        // Apply theme BEFORE creating editor
        this.applyTheme();
        
        // Setup and render
        this.setupEventListeners();
        this.switchTab(this.tabManager.activeTabId);
        
        console.log('✅ NotAIs ready');
    }

    async loadMonaco() {
        return new Promise((resolve) => {
            require.config({ 
                paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } 
            });
            require(['vs/editor/editor.main'], resolve);
        });
    }

    switchTab(tabId) {
        const tab = this.tabManager.getTab(tabId);
        if (!tab) return;

        // Save current content
        const activeTab = this.tabManager.getActiveTab();
        if (activeTab && activeTab.id !== tabId) {
            activeTab.content = this.textEditor.getValue(activeTab.id);
        }

        this.tabManager.switchToTab(tabId);
        const editor = this.textEditor.createEditor(tab);

        // Editor listeners
        editor.onDidChangeModelContent(() => {
            const content = editor.getValue();
            this.tabManager.updateContent(tabId, content);
            this.tabManager.renderTabs();
            this.updateStatus();
            
            // Update smart panel
            this.smartPanel.scheduleUpdate(content, this.settings.correctionPrompt);
        });

        editor.onDidChangeCursorPosition(() => {
            this.updateStatus();
        });

        this.tabManager.renderTabs();
        this.updateStatus();

        // Initial smart panel update
        if (tab.content) {
            this.smartPanel.scheduleUpdate(tab.content, this.settings.correctionPrompt);
        }
    }

    closeTab(tabId) {
        if (this.tabManager.closeTab(tabId)) {
            this.textEditor.deleteEditor(tabId);
            this.switchTab(this.tabManager.activeTabId);
        }
    }

    async openFile() {
        const file = await FileHandler.openFile();
        if (!file) return;

        const tabId = this.tabManager.createTab(file.name, file.content);
        const tab = this.tabManager.getTab(tabId);
        tab.fileHandle = file.handle;
        tab.modified = false;
        this.switchTab(tabId);
    }

    async saveFile() {
        const tab = this.tabManager.getActiveTab();
        if (!tab) return;

        const content = this.textEditor.getValue(tab.id);
        const result = await FileHandler.saveFile(tab.fileHandle, tab.filename, content);

        if (result.success) {
            tab.fileHandle = result.handle;
            this.tabManager.markSaved(tab.id, result.filename);
            this.tabManager.renderTabs();
            this.setStatus('Saved ✓');
        }
    }

    updateStatus() {
        const tab = this.tabManager.getActiveTab();
        if (!tab) return;

        const editor = this.textEditor.getEditor(tab.id);
        if (editor) {
            const pos = editor.getPosition();
            document.getElementById('cursorPos').textContent = `Ln ${pos.lineNumber}, Col ${pos.column}`;
        }

        document.getElementById('fileStatus').textContent = tab.modified ? 'Modified' : 'Saved';
    }

    setStatus(msg) {
        document.getElementById('fileStatus').textContent = msg;
        setTimeout(() => this.updateStatus(), 2000);
    }

    applyTheme() {
        if (this.settings.theme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
    }

    toggleTheme() {
        this.settings.theme = this.settings.theme === 'dark' ? 'light' : 'dark';
        this.settingsManager.settings.theme = this.settings.theme;
        this.settingsManager.save();
        this.applyTheme();
        this.textEditor.updateSettings(this.settings);
    }

    async saveSettings() {
        const saved = await this.settingsManager.saveFromUI();
        if (saved) {
            this.settings = this.settingsManager.settings;
            this.openAI.updateCredentials(this.settings.apiKey, this.settings.model);
            this.textEditor.updateSettings(this.settings);
            this.smartPanel.setEnabled(this.settings.smartPanelEnabled);
            this.setStatus('Settings saved ✓');
        }
    }

    setupEventListeners() {
        // Toolbar buttons
        document.getElementById('newTabBtn').onclick = () => {
            const tabId = this.tabManager.createTab();
            this.switchTab(tabId);
        };
        document.getElementById('openFileBtn').onclick = () => this.openFile();
        document.getElementById('saveFileBtn').onclick = () => this.saveFile();
        document.getElementById('settingsBtn').onclick = () => this.settingsManager.showModal();
        document.getElementById('themeToggle').onclick = () => this.toggleTheme();
        document.getElementById('togglePanel').onclick = () => this.smartPanel.toggle();

        // Settings modal
        document.getElementById('closeSettingsBtn').onclick = () => this.settingsManager.hideModal();
        document.getElementById('saveSettingsBtn').onclick = () => this.saveSettings();
        document.getElementById('settingsModal').onclick = (e) => {
            if (e.target.id === 'settingsModal') {
                this.settingsManager.hideModal();
            }
        };

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            const cmd = navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey;
            
            if (cmd && e.key === 't') {
                e.preventDefault();
                const tabId = this.tabManager.createTab();
                this.switchTab(tabId);
            } else if (cmd && e.key === 'o') {
                e.preventDefault();
                this.openFile();
            } else if (cmd && e.key === 's') {
                e.preventDefault();
                this.saveFile();
            } else if (cmd && e.key === 'w') {
                e.preventDefault();
                this.closeTab(this.tabManager.activeTabId);
            } else if (cmd && e.key === ',') {
                e.preventDefault();
                this.settingsManager.showModal();
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new NotAIs();
});
