// Monaco Editor Management
export class EditorManager {
    constructor(settings) {
        this.editors = new Map();
        this.settings = settings;
        this.containerElement = null;
    }

    setContainer(element) {
        this.containerElement = element;
    }

    createEditor(tab) {
        if (!this.containerElement) {
            throw new Error('Container element not set');
        }

        this.containerElement.innerHTML = '';

        let editor = this.editors.get(tab.id);
        
        if (!editor) {
            editor = monaco.editor.create(this.containerElement, {
                value: tab.content,
                language: tab.language,
                theme: this.settings.theme === 'dark' ? 'vs-dark' : 'vs',
                fontSize: this.settings.fontSize,
                automaticLayout: true,
                minimap: { enabled: true },
                lineNumbers: 'on',
                renderWhitespace: 'selection',
                scrollBeyondLastLine: false,
                wordWrap: 'on'
            });

            this.editors.set(tab.id, editor);
        } else {
            editor.layout();
            editor.focus();
        }

        return editor;
    }

    getEditor(tabId) {
        return this.editors.get(tabId);
    }

    deleteEditor(tabId) {
        const editor = this.editors.get(tabId);
        if (editor) {
            editor.dispose();
            this.editors.delete(tabId);
        }
    }

    updateSettings(settings) {
        this.settings = settings;
        this.editors.forEach(editor => {
            editor.updateOptions({
                fontSize: settings.fontSize,
                theme: settings.theme === 'dark' ? 'vs-dark' : 'vs'
            });
        });
    }

    getCursorPosition(tabId) {
        const editor = this.getEditor(tabId);
        return editor ? editor.getPosition() : null;
    }

    getValue(tabId) {
        const editor = this.getEditor(tabId);
        return editor ? editor.getValue() : '';
    }

    setValue(tabId, value) {
        const editor = this.getEditor(tabId);
        if (editor) {
            editor.setValue(value);
        }
    }
}

