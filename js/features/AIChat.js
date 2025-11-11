// AI Chat Feature
export class AIChat {
    constructor(openAIClient, tabManager) {
        this.openAIClient = openAIClient;
        this.tabManager = tabManager;
    }

    toggle() {
        const sidebar = document.getElementById('aiChatSidebar');
        sidebar.classList.toggle('hidden');
    }

    async sendMessage(message) {
        if (!message.trim()) return;

        const apiKey = this.openAIClient.apiKey;
        if (!apiKey) {
            this.addMessage('Please set your OpenAI API key in settings first.', 'error');
            return;
        }

        // Add user message
        this.addMessage(message, 'user');

        // Get current code context
        const tab = this.tabManager.getActiveTab();
        const context = tab ? `Current file (${tab.filename}):\n${tab.content}` : '';

        try {
            const reply = await this.openAIClient.chat([
                { role: 'system', content: 'You are a helpful AI assistant for a text editor. Help with coding, writing, and editing tasks.' },
                { role: 'user', content: `Context:\n${context}\n\nQuestion: ${message}` }
            ]);
            
            this.addMessage(reply, 'assistant');
        } catch (error) {
            console.error('Chat error:', error);
            this.addMessage(`Error: ${error.message}`, 'error');
        }
    }

    addMessage(text, role) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${role}`;
        messageEl.textContent = text;
        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showWelcomeMessage() {
        this.addMessage('Welcome to AI Text Editor! Please set your OpenAI API key in settings to enable AI features.', 'assistant');
    }

    setupEventListeners() {
        document.getElementById('aiChatBtn').addEventListener('click', () => this.toggle());
        document.getElementById('closeChatBtn').addEventListener('click', () => this.toggle());
        
        document.getElementById('sendChatBtn').addEventListener('click', () => {
            const input = document.getElementById('chatInput');
            this.sendMessage(input.value);
            input.value = '';
        });

        document.getElementById('chatInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.shiftKey) {
                e.preventDefault();
                const input = document.getElementById('chatInput');
                this.sendMessage(input.value);
                input.value = '';
            }
        });
    }
}

