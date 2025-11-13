// Auto-save to localStorage - Never lose your work
export class StorageManager {
    constructor() {
        this.storageKey = 'notes_tabs';
        this.autoSaveInterval = null;
    }

    // Save all tabs to localStorage
    saveTabs(tabs) {
        const tabsToSave = tabs.map(tab => ({
            id: tab.id,
            filename: tab.filename,
            content: tab.content,
            language: tab.language,
            modified: tab.modified,
            hasDiskFile: !!tab.fileHandle, // Don't save if it has a disk file
            savedAt: Date.now()
        }));

        // Only save tabs without disk files
        const unsavedTabs = tabsToSave.filter(tab => !tab.hasDiskFile);

        localStorage.setItem(this.storageKey, JSON.stringify({
            tabs: unsavedTabs,
            lastSaved: Date.now()
        }));

        console.log(`Auto-saved ${unsavedTabs.length} unsaved tabs to localStorage`);
    }

    // Restore tabs from localStorage
    restoreTabs() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (!stored) return null;

            const data = JSON.parse(stored);
            const now = Date.now();
            const ageInDays = (now - data.lastSaved) / (1000 * 60 * 60 * 24);

            console.log(`Restoring ${data.tabs.length} tabs from localStorage`);
            console.log(`Last saved: ${new Date(data.lastSaved).toLocaleString()} (${ageInDays.toFixed(1)} days ago)`);

            return data.tabs.map(tab => ({
                ...tab,
                fileHandle: null // No file handle for restored tabs
            }));
        } catch (error) {
            console.error('Error restoring tabs:', error);
            return null;
        }
    }

    // Clear localStorage
    clear() {
        localStorage.removeItem(this.storageKey);
        console.log('Cleared auto-saved tabs');
    }

    // Start auto-save (every 5 seconds)
    startAutoSave(getTabsCallback) {
        this.stopAutoSave();
        this.autoSaveInterval = setInterval(() => {
            const tabs = getTabsCallback();
            if (tabs && tabs.length > 0) {
                this.saveTabs(tabs);
            }
        }, 5000); // Save every 5 seconds
    }

    // Stop auto-save
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    // Get info about stored data
    getStorageInfo() {
        const stored = localStorage.getItem(this.storageKey);
        if (!stored) return null;

        try {
            const data = JSON.parse(stored);
            return {
                tabCount: data.tabs.length,
                lastSaved: new Date(data.lastSaved),
                ageInDays: (Date.now() - data.lastSaved) / (1000 * 60 * 60 * 24),
                sizeInKB: (new Blob([stored]).size / 1024).toFixed(2)
            };
        } catch {
            return null;
        }
    }
}

