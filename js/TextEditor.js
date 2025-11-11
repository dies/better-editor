// Text Editor - Monaco configured for note-taking
export class TextEditor {
    constructor(settings) {
        this.settings = settings;
        this.editors = new Map();
        this.container = document.getElementById('editorContainer');
    }

    createEditor(tab) {
        this.container.innerHTML = '';

        let editor = this.editors.get(tab.id);
        
        if (!editor) {
            const theme = this.settings.theme === 'light' ? 'vs' : 'vs-dark';
            
            editor = monaco.editor.create(this.container, {
                value: tab.content,
                language: tab.language || 'markdown',
                theme: theme,
                fontSize: this.settings.fontSize,
                automaticLayout: true,
                
                // Text editor config (not code editor)
                lineNumbers: 'on',
                minimap: { enabled: false },  // No minimap for text editing
                wordWrap: 'on',               // Always wrap
                wrappingStrategy: 'advanced',
                scrollBeyondLastLine: true,
                renderWhitespace: 'none',
                glyphMargin: false,
                folding: false,
                lineDecorationsWidth: 10,
                lineNumbersMinChars: 3,
                renderLineHighlight: 'line',
                cursorBlinking: 'smooth',
                smoothScrolling: true,
                
                // Disable code-specific features
                quickSuggestions: false,
                suggestOnTriggerCharacters: false,
                acceptSuggestionOnCommitCharacter: false,
                tabCompletion: 'off',
                wordBasedSuggestions: false,
                parameterHints: { enabled: false },
                hover: { enabled: false }
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

    updateSettings(settings) {
        this.settings = settings;
        const theme = settings.theme === 'light' ? 'vs' : 'vs-dark';
        
        this.editors.forEach(editor => {
            editor.updateOptions({
                fontSize: settings.fontSize,
                theme: theme
            });
        });
    }

    deleteEditor(tabId) {
        const editor = this.editors.get(tabId);
        if (editor) {
            editor.dispose();
            this.editors.delete(tabId);
        }
    }
}

