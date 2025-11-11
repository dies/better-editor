// File Operations Handler
import { FileHandler } from '../utils/FileHandler.js';

export class FileOperations {
    constructor(tabManager, editorManager) {
        this.tabManager = tabManager;
        this.editorManager = editorManager;
    }

    async openFile() {
        try {
            const fileData = await FileHandler.openFile();
            if (!fileData) return;

            // Check if file is already open
            const existingTab = this.tabManager.getAllTabs().find(t => t.filename === fileData.name);
            if (existingTab) {
                this.tabManager.switchToTab(existingTab.id);
                return;
            }

            const tabId = this.tabManager.createTab(fileData.name, fileData.content);
            const tab = this.tabManager.getTab(tabId);
            tab.fileHandle = fileData.fileHandle;
            tab.modified = false;
            
            return { success: true, message: 'File opened' };
        } catch (error) {
            console.error('Error opening file:', error);
            return { success: false, message: 'Error opening file' };
        }
    }

    async saveFile() {
        const tab = this.tabManager.getActiveTab();
        if (!tab) return { success: false, message: 'No active tab' };

        const content = this.editorManager.getValue(tab.id);

        try {
            const result = await FileHandler.saveFile(tab.fileHandle, tab.filename, content);
            
            if (result.success) {
                tab.fileHandle = result.fileHandle;
                this.tabManager.markTabSaved(tab.id, result.filename);
                return { success: true, message: 'File saved' };
            }
            
            return { success: false, message: 'Save cancelled' };
        } catch (error) {
            console.error('Error saving file:', error);
            return { success: false, message: 'Error saving file' };
        }
    }

    setupEventListeners() {
        document.getElementById('newTabBtn').addEventListener('click', () => {
            this.tabManager.createTab();
        });

        document.getElementById('openFileBtn').addEventListener('click', async () => {
            await this.openFile();
        });

        document.getElementById('saveFileBtn').addEventListener('click', async () => {
            await this.saveFile();
        });
    }
}

