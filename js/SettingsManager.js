// Settings Management
export class SettingsManager {
    constructor(openAIClient) {
        this.openAIClient = openAIClient;
        this.settings = this.load();
    }

    load() {
        const defaults = {
            apiKey: '',
            model: 'gpt-4o-mini',
            theme: 'system',
            smartPanelEnabled: true,
            correctionPrompt: 'Improve grammar, clarity, and style. Fix typos and suggest better phrasing.'
        };
        
        const stored = localStorage.getItem('settings');
        return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
    }

    save() {
        localStorage.setItem('settings', JSON.stringify(this.settings));
    }

    get(key) {
        return this.settings[key];
    }

    showModal() {
        document.getElementById('settingsModal').classList.remove('hidden');
        document.getElementById('apiKey').value = this.settings.apiKey;
        document.getElementById('model').value = this.settings.model;
        document.getElementById('theme').value = this.settings.theme;
        document.getElementById('smartPanelEnabled').checked = this.settings.smartPanelEnabled;
        document.getElementById('correctionPrompt').value = this.settings.correctionPrompt;
    }

    hideModal() {
        document.getElementById('settingsModal').classList.add('hidden');
    }

    async saveFromUI() {
        const apiKey = document.getElementById('apiKey').value.trim();
        const model = document.getElementById('model').value;
        const saveBtn = document.getElementById('saveSettingsBtn');

        // Verify API key if changed
        if (apiKey && apiKey !== this.settings.apiKey) {
            saveBtn.textContent = 'Verifying...';
            saveBtn.disabled = true;

            this.openAIClient.updateCredentials(apiKey, model);
            const isValid = await this.openAIClient.verifyApiKey();

            if (!isValid) {
                saveBtn.textContent = 'Save Settings';
                saveBtn.disabled = false;
                alert('Invalid API key. Please check and try again.');
                return false;
            }
        }

        this.settings.apiKey = apiKey;
        this.settings.model = model;
        this.settings.theme = document.getElementById('theme').value;
        this.settings.smartPanelEnabled = document.getElementById('smartPanelEnabled').checked;
        this.settings.correctionPrompt = document.getElementById('correctionPrompt').value.trim();

        this.save();
        this.hideModal();

        saveBtn.textContent = 'Save Settings';
        saveBtn.disabled = false;

        return true;
    }
}

