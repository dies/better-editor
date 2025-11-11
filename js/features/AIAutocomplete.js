// AI Autocomplete Feature (deprecated - using AI Edit Mode instead)
// Kept for backward compatibility but not actively used
export class AIAutocomplete {
    constructor(openAIClient, editorManager, settingsManager) {
        this.openAIClient = openAIClient;
        this.editorManager = editorManager;
        this.settingsManager = settingsManager;
        this.timeout = null;
        this.currentSuggestions = [];
        this.selectedIndex = 0;
    }

    schedule(tab) {
        clearTimeout(this.timeout);
        const delay = this.settingsManager.get('autoCompleteDelay');
        
        this.timeout = setTimeout(() => {
            this.trigger(tab);
        }, delay);
    }

    async trigger(tab) {
        if (!this.settingsManager.get('autoComplete')) return;
        if (!this.openAIClient.apiKey) return;

        const editor = this.editorManager.getEditor(tab.id);
        if (!editor) return;

        const position = editor.getPosition();
        const model = editor.getModel();
        const textBeforeCursor = model.getValueInRange({
            startLineNumber: Math.max(1, position.lineNumber - 10),
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column
        });

        if (textBeforeCursor.trim().length < 10) return;

        try {
            const suggestions = await this.openAIClient.complete(
                textBeforeCursor,
                tab.language
            );
            
            if (suggestions && suggestions.length > 0) {
                this.showSuggestions(suggestions, position, editor);
            }
        } catch (error) {
            console.error('Autocomplete error:', error);
        }
    }

    showSuggestions(suggestions, position, editor) {
        this.currentSuggestions = suggestions;
        this.selectedIndex = 0;

        const container = document.getElementById('autocompleteSuggestions');
        container.innerHTML = '';
        
        suggestions.forEach((suggestion, index) => {
            const item = document.createElement('div');
            item.className = `autocomplete-item ${index === 0 ? 'selected' : ''}`;
            item.textContent = suggestion;
            item.addEventListener('click', () => {
                this.accept(suggestion, editor);
            });
            container.appendChild(item);
        });

        // Position near cursor
        const coords = editor.getScrolledVisiblePosition(position);
        const editorContainer = document.getElementById('editorContainer');
        const rect = editorContainer.getBoundingClientRect();
        
        container.style.left = `${rect.left + coords.left}px`;
        container.style.top = `${rect.top + coords.top + 20}px`;
        container.classList.remove('hidden');
    }

    hide() {
        const container = document.getElementById('autocompleteSuggestions');
        container.classList.add('hidden');
        this.currentSuggestions = [];
    }

    accept(suggestion, editor) {
        if (!editor) return;

        const position = editor.getPosition();
        editor.executeEdits('autocomplete', [{
            range: new monaco.Range(
                position.lineNumber,
                position.column,
                position.lineNumber,
                position.column
            ),
            text: suggestion
        }]);

        this.hide();
        editor.focus();
    }
}

