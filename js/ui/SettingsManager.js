// Settings Management
export class SettingsManager {
    constructor(openAIClient) {
        this.openAIClient = openAIClient;
        this.settings = this.loadSettings();
        this.onSettingsChange = null;
    }

    loadSettings() {
        const defaults = {
            apiKey: '',
            model: 'gpt-4o-mini',
            autoComplete: true,
            autoCompleteDelay: 1000,
            fontSize: 14,
            theme: 'dark'
        };
        
        const stored = localStorage.getItem('editorSettings');
        return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
    }

    saveSettings() {
        localStorage.setItem('editorSettings', JSON.stringify(this.settings));
    }

    get(key) {
        return this.settings[key];
    }

    set(key, value) {
        this.settings[key] = value;
        this.saveSettings();
        this.notifyChange();
    }

    getAll() {
        return { ...this.settings };
    }

    async update(newSettings) {
        Object.assign(this.settings, newSettings);
        this.saveSettings();
        this.notifyChange();
    }

    showModal() {
        document.getElementById('settingsModal').classList.remove('hidden');
        document.getElementById('apiKeyInput').value = this.settings.apiKey;
        document.getElementById('modelSelect').value = this.settings.model;
        document.getElementById('fontSizeInput').value = this.settings.fontSize;
    }

    hideModal() {
        document.getElementById('settingsModal').classList.add('hidden');
    }

    async saveFromUI() {
        const newApiKey = document.getElementById('apiKeyInput').value.trim();
        const newModel = document.getElementById('modelSelect').value;
        const saveBtn = document.getElementById('saveSettingsBtn');
        
        const fontSize = parseInt(document.getElementById('fontSizeInput').value);
        
        // Verify API key if changed and not empty
        if (newApiKey && newApiKey !== this.settings.apiKey) {
            const originalText = saveBtn.textContent;
            saveBtn.disabled = true;
            saveBtn.textContent = 'Verifying API Key...';
            
            this.openAIClient.updateCredentials(newApiKey, newModel);
            const isValid = await this.openAIClient.verifyApiKey();
            
            if (!isValid) {
                saveBtn.disabled = false;
                saveBtn.textContent = originalText;
                alert('Invalid API key. Please check your OpenAI API key and try again.');
                return { success: false };
            }
            
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
        }
        
        // Save all settings
        await this.update({
            apiKey: newApiKey,
            model: newModel,
            fontSize
        });
        
        this.hideModal();
        return { success: true };
    }

    setupEventListeners() {
        document.getElementById('settingsBtn').addEventListener('click', () => this.showModal());
        document.getElementById('closeSettingsBtn').addEventListener('click', () => this.hideModal());
        document.getElementById('saveSettingsBtn').addEventListener('click', () => this.saveFromUI());

        // Close on backdrop click
        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') {
                this.hideModal();
            }
        });
    }

    notifyChange() {
        if (this.onSettingsChange) {
            this.onSettingsChange(this.settings);
        }
    }
}

