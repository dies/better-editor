// Simple Express server for local development
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8000;

// Serve static files
app.use(express.static(__dirname));

// SPA fallback - serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.listen(PORT, () => {
  console.log(`
🚀 Smart Note Editor
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Server running at: http://localhost:${PORT}
📝 Ready for note-taking!
🔄 Auto-reload enabled with nodemon

Press Ctrl+C to stop
  `);
});

