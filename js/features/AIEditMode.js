// AI Edit Mode - Split Panel Editor with AI Suggestions
export class AIEditMode {
    constructor(openAIClient, tabManager, editorManager, settingsManager) {
        this.openAIClient = openAIClient;
        this.tabManager = tabManager;
        this.editorManager = editorManager;
        this.settingsManager = settingsManager;
        this.aiEditors = new Map();
        this.isActive = false;
        this.onStatusChange = null;
    }

    toggle() {
        this.isActive = !this.isActive;
        const panel = document.getElementById('aiEditPanel');
        const btn = document.getElementById('aiEditBtn');
        
        if (this.isActive) {
            panel.classList.remove('hidden');
            btn.style.background = 'var(--accent)';
            btn.style.color = 'white';
            this.generate();
        } else {
            panel.classList.add('hidden');
            btn.style.background = '';
            btn.style.color = '';
        }
    }

    async generate(customPrompt = '') {
        if (!this.openAIClient.apiKey) {
            alert('Please set your OpenAI API key in settings first.');
            this.toggle();
            return;
        }

        const tab = this.tabManager.getActiveTab();
        if (!tab) return;

        const editor = this.editorManager.getEditor(tab.id);
        if (!editor) return;

        const currentCode = editor.getValue();
        if (!currentCode.trim()) {
            alert('Please write some code first before using AI edit mode.');
            return;
        }

        this.setStatus('AI is enhancing your code...');

        try {
            const improvedCode = await this.openAIClient.improveCode(
                currentCode,
                tab.language,
                customPrompt
            );

            this.showResult(improvedCode, tab.language);
            this.setStatus('AI suggestions ready ✓');
        } catch (error) {
            console.error('AI edit error:', error);
            this.setStatus('AI edit failed');
            alert(`Error: ${error.message}`);
        }
    }

    showResult(code, language) {
        const container = document.getElementById('aiEditContainer');
        container.innerHTML = '';

        const activeTabId = this.tabManager.activeTabId;
        let aiEditor = this.aiEditors.get(activeTabId);
        
        const settings = this.settingsManager.getAll();
        
        if (!aiEditor) {
            aiEditor = monaco.editor.create(container, {
                value: code,
                language: language,
                theme: settings.theme === 'dark' ? 'vs-dark' : 'vs',
                fontSize: settings.fontSize,
                automaticLayout: true,
                minimap: { enabled: true },
                lineNumbers: 'on',
                renderWhitespace: 'selection',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                readOnly: false
            });

            this.aiEditors.set(activeTabId, aiEditor);
        } else {
            aiEditor.setValue(code);
        }
    }

    accept() {
        const activeTabId = this.tabManager.activeTabId;
        const aiEditor = this.aiEditors.get(activeTabId);
        
        if (!aiEditor) return;

        const improvedCode = aiEditor.getValue();
        this.editorManager.setValue(activeTabId, improvedCode);
        this.tabManager.updateTabContent(activeTabId, improvedCode);
        
        this.toggle();
        this.setStatus('AI changes accepted ✓');
    }

    reject() {
        this.toggle();
        this.setStatus('AI changes rejected');
    }

    regenerate() {
        const promptInput = document.getElementById('aiEditPromptInput');
        const customPrompt = promptInput.value.trim();
        this.generate(customPrompt);
    }

    setStatus(message) {
        if (this.onStatusChange) {
            this.onStatusChange(message);
        }
    }

    setupEventListeners() {
        document.getElementById('aiEditBtn').addEventListener('click', () => this.toggle());
        document.getElementById('aiEditAcceptBtn').addEventListener('click', () => this.accept());
        document.getElementById('aiEditRejectBtn').addEventListener('click', () => this.reject());
        document.getElementById('aiEditRefreshBtn').addEventListener('click', () => this.regenerate());
        
        document.getElementById('aiEditPromptInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.regenerate();
            }
        });
    }
}

