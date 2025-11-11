// NotAIs - AI-Powered Note Editor
import { OpenAIClient } from './js/OpenAIClient.js';
import { SmartPanel } from './js/SmartPanel.js';
import { TextEditor } from './js/TextEditor.js';
import { TabManager } from './js/TabManager.js';
import { SettingsManager } from './js/SettingsManager.js';
import { FileHandler } from './js/FileHandler.js';
import { InlineSolver } from './js/InlineSolver.js';

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
        this.inlineSolver = new InlineSolver(this.openAI);
        
        // Connect smart panel status to UI
        this.smartPanel.onStatusChange = (message) => {
            this.setAIStatus(message);
        };

        // Initialize commands
        this.commands = this.initCommands();

        // Create initial empty tab
        this.tabManager.createTab('Untitled.md', '');
        
        // Apply theme BEFORE creating editor
        this.applyTheme();
        
        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                if (this.settings.theme === 'system') {
                    this.applyTheme();
                }
            });
        }
        
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
        let lastLineCount = editor.getModel().getLineCount();
        
        editor.onDidChangeModelContent((e) => {
            const content = editor.getValue();
            this.tabManager.updateContent(tabId, content);
            this.tabManager.renderTabs();
            this.updateStatus();
            
            // Check for inline solving on the changed line
            if (e.changes.length > 0) {
                const change = e.changes[0];
                const lineNumber = change.range.startLineNumber;
                const lineContent = editor.getModel().getLineContent(lineNumber);
                
                // Only process if line ends with = and we just typed it
                if (lineContent.trim().endsWith('=')) {
                    this.inlineSolver.processLine(editor, lineNumber, lineContent);
                }
            }
            
            // Update smart panel (but exclude math/questions from going there)
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

    setAIStatus(msg) {
        const statusEl = document.getElementById('aiStatus');
        
        // Remove all state classes
        statusEl.classList.remove('idle', 'waiting', 'active', 'streaming', 'error');
        
        if (!msg || msg === 'Idle') {
            statusEl.textContent = 'AI: Idle';
            statusEl.classList.add('idle');
        } else if (msg.includes('Waiting for typing')) {
            statusEl.textContent = 'AI: Waiting...';
            statusEl.classList.add('waiting');
        } else if (msg.includes('Sending') || msg.includes('Waiting for AI')) {
            statusEl.textContent = 'AI: Requesting...';
            statusEl.classList.add('active');
        } else if (msg.includes('Streaming')) {
            statusEl.textContent = 'AI: Streaming';
            statusEl.classList.add('streaming');
        } else if (msg.includes('Error')) {
            statusEl.textContent = 'AI: ' + msg;
            statusEl.classList.add('error');
        } else {
            statusEl.textContent = 'AI: ' + msg;
            statusEl.classList.add('active');
        }
    }

    copySmartPanelContent() {
        const content = document.getElementById('smartPanelContent').textContent;
        navigator.clipboard.writeText(content).then(() => {
            this.setStatus('Copied to clipboard ✓');
        }).catch(err => {
            console.error('Copy failed:', err);
            this.setStatus('Copy failed');
        });
    }

    replaceWithSmartPanelContent() {
        const tab = this.tabManager.getActiveTab();
        if (!tab) return;

        const smartContent = document.getElementById('smartPanelContent').textContent;
        
        // Get only the actual content, not the placeholder text
        if (smartContent.includes('Start typing') || smartContent.includes('Set your OpenAI')) {
            return;
        }

        this.textEditor.setValue(tab.id, smartContent);
        tab.content = smartContent;
        tab.modified = true;
        this.tabManager.renderTabs();
        this.setStatus('Content replaced ✓');
    }

    applyTheme() {
        let isDark = true;

        if (this.settings.theme === 'system') {
            // Detect system preference
            isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        } else {
            isDark = this.settings.theme === 'dark';
        }

        if (isDark) {
            document.body.classList.remove('light-theme');
        } else {
            document.body.classList.add('light-theme');
        }

        // Update Monaco editors
        this.textEditor?.updateSettings(this.settings);
    }

    initCommands() {
        return [
            { name: 'New Tab', shortcut: 'Cmd+T', action: () => { const id = this.tabManager.createTab(); this.switchTab(id); }},
            { name: 'Open File', shortcut: 'Cmd+O', action: () => this.openFile() },
            { name: 'Save File', shortcut: 'Cmd+S', action: () => this.saveFile() },
            { name: 'Close Tab', shortcut: 'Cmd+W', action: () => this.closeTab(this.tabManager.activeTabId) },
            { name: 'Settings', shortcut: 'Cmd+,', action: () => this.settingsManager.showModal() },
            { name: 'Command Palette', shortcut: 'Cmd+P', action: () => this.showCommandPalette() }
        ];
    }

    showCommandPalette() {
        const modal = document.getElementById('commandPalette');
        const input = document.getElementById('commandInput');
        modal.classList.remove('hidden');
        input.value = '';
        input.focus();
        this.renderCommands();
    }

    hideCommandPalette() {
        document.getElementById('commandPalette').classList.add('hidden');
    }

    renderCommands(filter = '') {
        const list = document.getElementById('commandList');
        list.innerHTML = '';

        const filtered = this.commands.filter(cmd =>
            cmd.name.toLowerCase().includes(filter.toLowerCase())
        );

        filtered.forEach((cmd, index) => {
            const item = document.createElement('div');
            item.className = `command-item ${index === 0 ? 'selected' : ''}`;
            item.innerHTML = `
                <span class="command-name">${cmd.name}</span>
                <span class="command-shortcut">${cmd.shortcut}</span>
            `;
            item.onclick = () => {
                cmd.action();
                this.hideCommandPalette();
            };
            list.appendChild(item);
        });
    }

    async saveSettings() {
        const saved = await this.settingsManager.saveFromUI();
        if (saved) {
            this.settings = this.settingsManager.settings;
            this.openAI.updateCredentials(this.settings.apiKey, this.settings.model);
            this.textEditor.updateSettings(this.settings);
            this.smartPanel.setEnabled(this.settings.smartPanelEnabled);
            this.applyTheme(); // Apply theme change
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
        document.getElementById('commandPaletteBtn').onclick = () => this.showCommandPalette();
        document.getElementById('settingsBtn').onclick = () => this.settingsManager.showModal();

        // Panel action buttons
        document.getElementById('copyBtn').onclick = () => this.copySmartPanelContent();
        document.getElementById('replaceBtn').onclick = () => this.replaceWithSmartPanelContent();

        // Settings modal
        document.getElementById('closeSettingsBtn').onclick = () => this.settingsManager.hideModal();
        document.getElementById('saveSettingsBtn').onclick = () => this.saveSettings();
        document.getElementById('settingsModal').onclick = (e) => {
            if (e.target.id === 'settingsModal') {
                this.settingsManager.hideModal();
            }
        };

        // Command palette
        document.getElementById('commandInput').addEventListener('input', (e) => {
            this.renderCommands(e.target.value);
        });

        document.getElementById('commandInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const selected = document.querySelector('.command-item.selected');
                if (selected) selected.click();
            } else if (e.key === 'Escape') {
                this.hideCommandPalette();
            }
        });

        document.getElementById('commandPalette').onclick = (e) => {
            if (e.target.id === 'commandPalette') {
                this.hideCommandPalette();
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
            } else if (cmd && e.key === 'p') {
                e.preventDefault();
                this.showCommandPalette();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.hideCommandPalette();
                // Also close settings modal if open
                const settingsModal = document.getElementById('settingsModal');
                if (!settingsModal.classList.contains('hidden')) {
                    this.settingsManager.hideModal();
                }
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new NotAIs();
});
