// AI Text Editor - Main Application Entry Point
// Modular architecture with clean separation of concerns

import { OpenAIClient } from './js/utils/OpenAIClient.js';
import { FileHandler } from './js/utils/FileHandler.js';
import { KeyboardShortcuts } from './js/utils/KeyboardShortcuts.js';
import { TabManager } from './js/core/TabManager.js';
import { EditorManager } from './js/core/EditorManager.js';
import { FileOperations } from './js/core/FileOperations.js';
import { SettingsManager } from './js/ui/SettingsManager.js';
import { ThemeManager } from './js/ui/ThemeManager.js';
import { CommandPalette } from './js/ui/CommandPalette.js';
import { TabUI } from './js/ui/TabUI.js';
import { StatusBar } from './js/ui/StatusBar.js';
import { AIChat } from './js/features/AIChat.js';
import { AIEditMode } from './js/features/AIEditMode.js';
import { AIAutocomplete } from './js/features/AIAutocomplete.js';

class AITextEditor {
    constructor() {
        this.init();
    }

    async init() {
        // Register service worker
        await this.initServiceWorker();

        // Initialize Monaco Editor
        await this.initMonaco();

        // Initialize core managers
        this.tabManager = new TabManager();
        this.editorManager = new EditorManager({});
        this.editorManager.setContainer(document.getElementById('editorContainer'));

        // Initialize OpenAI client
        const storedSettings = JSON.parse(localStorage.getItem('editorSettings') || '{}');
        this.openAIClient = new OpenAIClient(
            storedSettings.apiKey || '',
            storedSettings.model || 'gpt-4o-mini'
        );

        // Initialize UI managers
        this.settingsManager = new SettingsManager(this.openAIClient);
        this.themeManager = new ThemeManager(this.settingsManager);
        this.commandPalette = new CommandPalette();
        this.tabUI = new TabUI(this.tabManager);
        this.statusBar = new StatusBar();

        // Initialize features
        this.fileOperations = new FileOperations(this.tabManager, this.editorManager);
        this.aiChat = new AIChat(this.openAIClient, this.tabManager);
        this.aiEditMode = new AIEditMode(
            this.openAIClient,
            this.tabManager,
            this.editorManager,
            this.settingsManager
        );
        this.aiAutocomplete = new AIAutocomplete(
            this.openAIClient,
            this.editorManager,
            this.settingsManager
        );

        // Initialize keyboard shortcuts
        this.shortcuts = new KeyboardShortcuts();
        this.initKeyboardShortcuts();

        // Setup event listeners
        this.setupEventListeners();

        // Setup callbacks
        this.setupCallbacks();

        // Initialize commands
        this.initCommands();

        // Create initial tab
        this.tabManager.createTab('Untitled-1.txt');

        // Apply theme
        this.themeManager.apply();

        // Show welcome message
        if (!this.settingsManager.get('apiKey')) {
            this.aiChat.showWelcomeMessage();
        }

        console.log('✅ AI Text Editor initialized');
    }

    async initServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('/service-worker.js');
                console.log('Service Worker registered');
                
                // Handle file launches
                if ('launchQueue' in window) {
                    window.launchQueue.setConsumer(async (launchParams) => {
                        if (launchParams.files && launchParams.files.length > 0) {
                            for (const fileHandle of launchParams.files) {
                                const fileData = await FileHandler.readFileHandle(fileHandle);
                                const tabId = this.tabManager.createTab(fileData.name, fileData.content);
                                const tab = this.tabManager.getTab(tabId);
                                tab.fileHandle = fileData.fileHandle;
                                tab.modified = false;
                            }
                        }
                    });
                }
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    async initMonaco() {
        return new Promise((resolve) => {
            require.config({ 
                paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } 
            });
            require(['vs/editor/editor.main'], () => {
                console.log('Monaco Editor loaded');
                resolve();
            });
        });
    }

    setupCallbacks() {
        // Tab manager callbacks
        this.tabManager.onTabChange = (tab) => {
            const editor = this.editorManager.createEditor(tab);
            
            // Setup editor change listener
            editor.onDidChangeModelContent(() => {
                this.tabManager.updateTabContent(tab.id, editor.getValue());
                this.statusBar.update(tab, editor);
                
                // Schedule autocomplete (disabled by default, using AI Edit Mode instead)
                // this.aiAutocomplete.schedule(tab);
            });

            // Setup cursor position listener
            editor.onDidChangeCursorPosition(() => {
                this.statusBar.update(tab, editor);
            });

            this.statusBar.update(tab, editor);
        };

        this.tabManager.onTabsUpdate = (tabs, activeTabId) => {
            this.tabUI.render(tabs, activeTabId);
        };

        // Settings manager callbacks
        this.settingsManager.onSettingsChange = (settings) => {
            this.editorManager.updateSettings(settings);
            this.openAIClient.updateCredentials(settings.apiKey, settings.model);
            this.themeManager.apply();
        };

        // AI Edit Mode callbacks
        this.aiEditMode.onStatusChange = (message) => {
            this.statusBar.setTemporaryStatus(message);
        };
    }

    setupEventListeners() {
        this.fileOperations.setupEventListeners();
        this.settingsManager.setupEventListeners();
        this.themeManager.setupEventListeners();
        this.commandPalette.setupEventListeners();
        this.aiChat.setupEventListeners();
        this.aiEditMode.setupEventListeners();
        this.shortcuts.setupGlobalListener();
    }

    initKeyboardShortcuts() {
        this.shortcuts.register('t', () => this.tabManager.createTab(), { cmd: true });
        this.shortcuts.register('o', () => this.fileOperations.openFile(), { cmd: true });
        this.shortcuts.register('s', () => this.fileOperations.saveFile(), { cmd: true });
        this.shortcuts.register('w', () => this.tabManager.closeTab(this.tabManager.activeTabId), { cmd: true });
        this.shortcuts.register('e', () => this.aiEditMode.toggle(), { cmd: true });
        this.shortcuts.register('p', () => this.commandPalette.show(), { cmd: true });
        this.shortcuts.register('k', () => this.aiChat.toggle(), { cmd: true });
        this.shortcuts.register(',', () => this.settingsManager.showModal(), { cmd: true });
        this.shortcuts.register('tab', () => this.tabManager.nextTab(), { cmd: true });
        this.shortcuts.register('tab', () => this.tabManager.previousTab(), { cmd: true, shift: true });
        
        // AI Edit Mode shortcuts
        this.shortcuts.register('a', () => this.aiEditMode.accept(), { cmd: true, shift: true });
        this.shortcuts.register('r', () => this.aiEditMode.reject(), { cmd: true, shift: true });
        this.shortcuts.register('g', () => this.aiEditMode.regenerate(), { cmd: true, shift: true });
        
        // Tab number shortcuts (Cmd+1-9)
        for (let i = 1; i <= 9; i++) {
            this.shortcuts.register(i.toString(), () => {
                const tab = this.tabManager.getTabByIndex(i - 1);
                if (tab) this.tabManager.switchToTab(tab.id);
            }, { cmd: true });
        }

        // Escape to hide things
        this.shortcuts.register('escape', () => {
            this.aiAutocomplete.hide();
            this.commandPalette.hide();
        });
    }

    initCommands() {
        const commands = [
            { name: 'New Tab', shortcut: 'Cmd+T', action: () => this.tabManager.createTab() },
            { name: 'Open File', shortcut: 'Cmd+O', action: () => this.fileOperations.openFile() },
            { name: 'Save File', shortcut: 'Cmd+S', action: () => this.fileOperations.saveFile() },
            { name: 'Close Tab', shortcut: 'Cmd+W', action: () => this.tabManager.closeTab(this.tabManager.activeTabId) },
            { name: 'AI Edit Mode', shortcut: 'Cmd+E', action: () => this.aiEditMode.toggle() },
            { name: 'Settings', shortcut: 'Cmd+,', action: () => this.settingsManager.showModal() },
            { name: 'AI Chat', shortcut: 'Cmd+K', action: () => this.aiChat.toggle() },
            { name: 'Toggle Theme', shortcut: '', action: () => this.themeManager.toggle() },
            { name: 'Next Tab', shortcut: 'Cmd+Tab', action: () => this.tabManager.nextTab() },
            { name: 'Previous Tab', shortcut: 'Cmd+Shift+Tab', action: () => this.tabManager.previousTab() },
            { name: 'Accept AI Edit', shortcut: 'Cmd+Shift+A', action: () => this.aiEditMode.accept() },
            { name: 'Reject AI Edit', shortcut: 'Cmd+Shift+R', action: () => this.aiEditMode.reject() },
            { name: 'Regenerate AI Edit', shortcut: 'Cmd+Shift+G', action: () => this.aiEditMode.regenerate() }
        ];

        this.commandPalette.registerCommands(commands);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AITextEditor();
});
