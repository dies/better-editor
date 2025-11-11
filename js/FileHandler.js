// File System Operations
export class FileHandler {
    static async openFile() {
        try {
            const [handle] = await window.showOpenFilePicker({
                types: [{
                    description: 'Text Files',
                    accept: { 'text/plain': ['.txt', '.md', '.json'] }
                }]
            });

            const file = await handle.getFile();
            const content = await file.text();

            return {
                name: file.name,
                content,
                handle
            };
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error opening file:', error);
            }
            return null;
        }
    }

    static async saveFile(handle, filename, content) {
        try {
            let fileHandle = handle;

            if (!fileHandle) {
                fileHandle = await window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{
                        description: 'Text Files',
                        accept: { 'text/plain': ['.txt', '.md', '.json'] }
                    }]
                });
            }

            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();

            return {
                success: true,
                handle: fileHandle,
                filename: fileHandle.name
            };
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error saving file:', error);
            }
            return { success: false };
        }
    }
}

