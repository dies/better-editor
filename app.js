// AI Smart Note Editor - Main Application
import { OpenAIClient } from './js/OpenAIClient.js';
import { SmartPanel } from './js/SmartPanel.js';
import { TextEditor } from './js/TextEditor.js';
import { TabManager } from './js/TabManager.js';
import { SettingsManager } from './js/SettingsManager.js';
import { FileHandler } from './js/FileHandler.js';

class SmartNoteEditor {
    constructor() {
        this.init();
    }

    async init() {
        // Register service worker
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('/service-worker.js');
            } catch (error) {
                console.error('Service Worker error:', error);
            }
        }

        // Load Monaco
        await this.loadMonaco();

        // Initialize managers
        const settings = new SettingsManager(null);
        this.settings = settings.load();

        this.openAI = new OpenAIClient(this.settings.apiKey, this.settings.model);
        settings.openAIClient = this.openAI;
        this.settingsManager = settings;

        this.tabManager = new TabManager();
        this.textEditor = new TextEditor(this.settings);
        this.smartPanel = new SmartPanel(this.openAI);

        // Create initial tab
        this.tabManager.createTab('Welcome.md', '# Welcome to Smart Note Editor\n\nStart typing to see AI magic happen in the right panel!\n\n**Try:**\n- Writing some text (it will be polished)\n- Math: `100 - 20% =`\n- Questions: `5 EUR in UAH?`\n- Markdown formatting');
        
        // Setup
        this.setupEventListeners();
        this.switchTab(this.tabManager.activeTabId);
        this.applyTheme();
        
        console.log('✅ Smart Note Editor ready');
    }

    async loadMonaco() {
        return new Promise((resolve) => {
            require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
            require(['vs/editor/editor.main'], resolve);
        });
    }

    switchTab(tabId) {
        const tab = this.tabManager.getTab(tabId);
        if (!tab) return;

        // Save current tab content
        const activeTab = this.tabManager.getActiveTab();
        if (activeTab && activeTab.id !== tabId) {
            activeTab.content = this.textEditor.getValue(activeTab.id);
        }

        this.tabManager.switchToTab(tabId);
        const editor = this.textEditor.createEditor(tab);

        // Setup editor listeners
        editor.onDidChangeModelContent(() => {
            const content = editor.getValue();
            this.tabManager.updateContent(tabId, content);
            this.tabManager.renderTabs();
            this.updateStatus();
            
            // Update smart panel
            const correctionPrompt = this.settings.correctionPrompt || 'Improve grammar and clarity';
            this.smartPanel.scheduleUpdate(content, correctionPrompt);
        });

        editor.onDidChangeCursorPosition(() => {
            this.updateStatus();
        });

        this.tabManager.renderTabs();
        this.updateStatus();

        // Initial smart panel update
        if (tab.content) {
            const correctionPrompt = this.settings.correctionPrompt || 'Improve grammar and clarity';
            this.smartPanel.scheduleUpdate(tab.content, correctionPrompt);
        }
    }

    closeTab(tabId) {
        if (this.tabManager.closeTab(tabId)) {
            const activeId = this.tabManager.activeTabId;
            this.textEditor.deleteEditor(tabId);
            this.switchTab(activeId);
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
        const editor = this.textEditor.getEditor(tab.id);
        
        if (editor) {
            const pos = editor.getPosition();
            document.getElementById('cursorPos').textContent = `Ln ${pos.lineNumber}, Col ${pos.column}`;
        }

        const status = tab.modified ? 'Modified' : 'Saved';
        document.getElementById('fileStatus').textContent = status;
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
        // Toolbar
        document.getElementById('newTabBtn').onclick = () => {
            const tabId = this.tabManager.createTab();
            this.switchTab(tabId);
        };
        document.getElementById('openFileBtn').onclick = () => this.openFile();
        document.getElementById('saveFileBtn').onclick = () => this.saveFile();
        document.getElementById('settingsBtn').onclick = () => this.settingsManager.showModal();
        document.getElementById('themeToggle').onclick = () => this.toggleTheme();
        document.getElementById('toggleSmartPanel').onclick = () => this.smartPanel.toggle();

        // Settings modal
        document.getElementById('closeSettingsBtn').onclick = () => this.settingsManager.hideModal();
        document.getElementById('saveSettingsBtn').onclick = () => this.saveSettings();
        document.getElementById('settingsModal').onclick = (e) => {
            if (e.target.id === 'settingsModal') this.settingsManager.hideModal();
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

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SmartNoteEditor();
});
