// Tab UI Rendering
export class TabUI {
    constructor(tabManager) {
        this.tabManager = tabManager;
        this.container = document.getElementById('tabs');
    }

    render(tabs, activeTabId) {
        this.container.innerHTML = '';

        tabs.forEach((tab, index) => {
            const tabEl = document.createElement('div');
            tabEl.className = `tab ${tab.id === activeTabId ? 'active' : ''}`;
            tabEl.innerHTML = `
                <span class="tab-name" title="${tab.filename}">${tab.filename}</span>
                ${tab.modified ? '<span class="tab-modified">●</span>' : ''}
                <button class="tab-close" data-tab-id="${tab.id}">✕</button>
            `;
            
            tabEl.addEventListener('click', (e) => {
                if (!e.target.classList.contains('tab-close')) {
                    this.tabManager.switchToTab(tab.id);
                }
            });

            const closeBtn = tabEl.querySelector('.tab-close');
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.tabManager.closeTab(tab.id);
            });

            this.container.appendChild(tabEl);
        });
    }
}

