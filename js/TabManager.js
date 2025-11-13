// Tab Management
export class TabManager {
    constructor() {
        this.tabs = [];
        this.activeTabId = null;
    }

    createTab(filename = 'Untitled.md', content = '') {
        const id = Date.now().toString();
        const tab = {
            id,
            filename,
            content,
            modified: false,
            language: this.detectLanguage(filename),
            fileHandle: null
        };

        this.tabs.push(tab);
        this.activeTabId = id;
        return id;
    }

    detectLanguage(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const map = {
            'md': 'markdown',
            'txt': 'plaintext',
            'json': 'json'
        };
        return map[ext] || 'markdown';
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
        this.activeTabId = tabId;
    }

    updateContent(tabId, content) {
        const tab = this.getTab(tabId);
        if (tab) {
            tab.content = content;
            tab.modified = true;
        }
    }

    markSaved(tabId, filename = null) {
        const tab = this.getTab(tabId);
        if (tab) {
            tab.modified = false;
            if (filename) tab.filename = filename;
        }
    }

    closeTab(tabId) {
        const tab = this.getTab(tabId);
        if (tab && tab.modified) {
            if (!confirm(`${tab.filename} has unsaved changes. Close anyway?`)) {
                return false;
            }
        }

        const index = this.tabs.findIndex(t => t.id === tabId);
        this.tabs.splice(index, 1);

        if (this.tabs.length === 0) {
            this.createTab();
        } else if (tabId === this.activeTabId) {
            this.activeTabId = this.tabs[Math.max(0, index - 1)].id;
        }

        return true;
    }

    renderTabs() {
        const container = document.getElementById('tabs');
        container.innerHTML = '';

        this.tabs.forEach(tab => {
            const el = document.createElement('div');
            el.className = `tab ${tab.id === this.activeTabId ? 'active' : ''}`;
            el.innerHTML = `
                <span class="tab-name">${tab.filename}</span>
                ${tab.modified ? '<span class="tab-modified">●</span>' : ''}
                <button class="tab-close" onclick="window.app.closeTab('${tab.id}')">✕</button>
            `;
            el.onclick = (e) => {
                if (!e.target.classList.contains('tab-close')) {
                    window.app.switchTab(tab.id);
                }
            };
            container.appendChild(el);
        });
    }
}

