// Tab Management
import { FileHandler } from '../utils/FileHandler.js';

export class TabManager {
    constructor() {
        this.tabs = [];
        this.activeTabId = null;
        this.onTabChange = null;
        this.onTabsUpdate = null;
    }

    createTab(filename = 'Untitled.txt', content = '') {
        const id = Date.now().toString();
        const tab = {
            id,
            filename,
            content,
            modified: false,
            language: FileHandler.detectLanguage(filename),
            fileHandle: null
        };

        this.tabs.push(tab);
        this.activeTabId = id;
        this.notifyTabsUpdate();
        this.notifyTabChange(tab);
        
        return id;
    }

    getTab(tabId) {
        return this.tabs.find(t => t.id === tabId);
    }

    getActiveTab() {
        return this.getTab(this.activeTabId);
    }

    getAllTabs() {
        return this.tabs;
    }

    switchToTab(tabId) {
        const tab = this.getTab(tabId);
        if (!tab) return false;

        this.activeTabId = tabId;
        this.notifyTabChange(tab);
        this.notifyTabsUpdate();
        return true;
    }

    updateTabContent(tabId, content) {
        const tab = this.getTab(tabId);
        if (!tab) return false;

        tab.content = content;
        tab.modified = true;
        this.notifyTabsUpdate();
        return true;
    }

    markTabSaved(tabId, filename = null) {
        const tab = this.getTab(tabId);
        if (!tab) return false;

        tab.modified = false;
        if (filename) {
            tab.filename = filename;
            tab.language = FileHandler.detectLanguage(filename);
        }
        this.notifyTabsUpdate();
        return true;
    }

    closeTab(tabId) {
        const index = this.tabs.findIndex(t => t.id === tabId);
        if (index === -1) return false;

        const tab = this.tabs[index];
        
        // Check if modified
        if (tab.modified) {
            if (!confirm(`${tab.filename} has unsaved changes. Close anyway?`)) {
                return false;
            }
        }

        // Remove tab
        this.tabs.splice(index, 1);

        // Switch to another tab or create new one
        if (this.tabs.length === 0) {
            this.createTab('Untitled.txt');
        } else if (tabId === this.activeTabId) {
            const newIndex = Math.max(0, index - 1);
            this.switchToTab(this.tabs[newIndex].id);
        }

        this.notifyTabsUpdate();
        return true;
    }

    nextTab() {
        const currentIndex = this.tabs.findIndex(t => t.id === this.activeTabId);
        const nextIndex = (currentIndex + 1) % this.tabs.length;
        this.switchToTab(this.tabs[nextIndex].id);
    }

    previousTab() {
        const currentIndex = this.tabs.findIndex(t => t.id === this.activeTabId);
        const prevIndex = (currentIndex - 1 + this.tabs.length) % this.tabs.length;
        this.switchToTab(this.tabs[prevIndex].id);
    }

    getTabByIndex(index) {
        return this.tabs[index] || null;
    }

    notifyTabChange(tab) {
        if (this.onTabChange) {
            this.onTabChange(tab);
        }
    }

    notifyTabsUpdate() {
        if (this.onTabsUpdate) {
            this.onTabsUpdate(this.tabs, this.activeTabId);
        }
    }
}

