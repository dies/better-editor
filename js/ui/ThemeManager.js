// Theme Management
export class ThemeManager {
    constructor(settingsManager) {
        this.settingsManager = settingsManager;
    }

    apply() {
        const theme = this.settingsManager.get('theme');
        if (theme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
    }

    toggle() {
        const currentTheme = this.settingsManager.get('theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.settingsManager.set('theme', newTheme);
        this.apply();
    }

    setupEventListeners() {
        document.getElementById('themeToggle').addEventListener('click', () => this.toggle());
    }
}

