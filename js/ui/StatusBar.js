// Status Bar Management
export class StatusBar {
    constructor() {
        this.fileStatusEl = document.getElementById('fileStatus');
        this.cursorPositionEl = document.getElementById('cursorPosition');
        this.languageEl = document.getElementById('language');
    }

    updateFileStatus(status) {
        this.fileStatusEl.textContent = status;
    }

    updateCursorPosition(line, column) {
        this.cursorPositionEl.textContent = `Ln ${line}, Col ${column}`;
    }

    updateLanguage(language) {
        this.languageEl.textContent = language;
    }

    update(tab, editor) {
        if (!tab) return;

        const status = tab.modified ? 'Modified' : 'Saved';
        this.updateFileStatus(status);
        this.updateLanguage(tab.language);

        if (editor) {
            const position = editor.getPosition();
            if (position) {
                this.updateCursorPosition(position.lineNumber, position.column);
            }
        }
    }

    setTemporaryStatus(message, duration = 2000) {
        const originalStatus = this.fileStatusEl.textContent;
        this.updateFileStatus(message);
        setTimeout(() => {
            this.updateFileStatus(originalStatus);
        }, duration);
    }
}

