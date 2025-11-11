// Keyboard Shortcuts Handler
export class KeyboardShortcuts {
    constructor() {
        this.handlers = new Map();
    }

    register(key, callback, modifiers = {}) {
        const keyCombo = this.createKeyCombo(key, modifiers);
        this.handlers.set(keyCombo, callback);
    }

    createKeyCombo(key, modifiers) {
        const parts = [];
        if (modifiers.cmd) parts.push('cmd');
        if (modifiers.shift) parts.push('shift');
        if (modifiers.alt) parts.push('alt');
        parts.push(key.toLowerCase());
        return parts.join('+');
    }

    handle(event) {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const cmdKey = isMac ? event.metaKey : event.ctrlKey;

        const modifiers = {
            cmd: cmdKey,
            shift: event.shiftKey,
            alt: event.altKey
        };

        const keyCombo = this.createKeyCombo(event.key, modifiers);
        const handler = this.handlers.get(keyCombo);

        if (handler) {
            event.preventDefault();
            handler(event);
            return true;
        }

        return false;
    }

    setupGlobalListener() {
        document.addEventListener('keydown', (e) => this.handle(e));
    }
}

