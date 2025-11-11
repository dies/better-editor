// File System Operations Handler
export class FileHandler {
    static async openFile() {
        try {
            const [fileHandle] = await window.showOpenFilePicker({
                types: [{
                    description: 'Text Files',
                    accept: {
                        'text/plain': ['.txt', '.js', '.ts', '.json', '.html', '.css', '.md']
                    }
                }]
            });

            return await FileHandler.readFileHandle(fileHandle);
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error opening file:', error);
                throw error;
            }
            return null;
        }
    }

    static async readFileHandle(fileHandle) {
        const file = await fileHandle.getFile();
        const content = await file.text();
        
        return {
            name: file.name,
            content,
            fileHandle
        };
    }

    static async saveFile(fileHandle, filename, content) {
        try {
            let handle = fileHandle;

            if (!handle) {
                handle = await window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{
                        description: 'Text Files',
                        accept: {
                            'text/plain': ['.txt', '.js', '.ts', '.json', '.html', '.css', '.md']
                        }
                    }]
                });
            }

            const writable = await handle.createWritable();
            await writable.write(content);
            await writable.close();

            return {
                success: true,
                fileHandle: handle,
                filename: handle.name
            };
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error saving file:', error);
                throw error;
            }
            return { success: false };
        }
    }

    static detectLanguage(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const languageMap = {
            'js': 'javascript',
            'mjs': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'json': 'json',
            'html': 'html',
            'css': 'css',
            'md': 'markdown',
            'txt': 'plaintext'
        };
        return languageMap[ext] || 'plaintext';
    }
}

