// Command Palette
export class CommandPalette {
    constructor() {
        this.commands = [];
    }

    registerCommands(commands) {
        this.commands = commands;
    }

    show() {
        const modal = document.getElementById('commandPalette');
        const input = document.getElementById('commandInput');
        modal.classList.remove('hidden');
        input.value = '';
        input.focus();
        this.render();
    }

    hide() {
        document.getElementById('commandPalette').classList.add('hidden');
    }

    render(filter = '') {
        const list = document.getElementById('commandList');
        list.innerHTML = '';

        const filtered = this.commands.filter(cmd =>
            cmd.name.toLowerCase().includes(filter.toLowerCase())
        );

        filtered.forEach((cmd, index) => {
            const item = document.createElement('div');
            item.className = `command-item ${index === 0 ? 'selected' : ''}`;
            item.innerHTML = `
                <span class="command-name">${cmd.name}</span>
                <span class="command-shortcut">${cmd.shortcut}</span>
            `;
            item.addEventListener('click', () => {
                cmd.action();
                this.hide();
            });
            list.appendChild(item);
        });
    }

    setupEventListeners() {
        document.getElementById('commandPaletteBtn').addEventListener('click', () => this.show());

        document.getElementById('commandInput').addEventListener('input', (e) => {
            this.render(e.target.value);
        });

        document.getElementById('commandInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const selected = document.querySelector('.command-item.selected');
                if (selected) selected.click();
            } else if (e.key === 'Escape') {
                this.hide();
            }
        });

        // Close on backdrop click
        document.getElementById('commandPalette').addEventListener('click', (e) => {
            if (e.target.id === 'commandPalette') {
                this.hide();
            }
        });
    }
}

