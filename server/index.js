import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(express.json({ limit: '2mb' }));

const PORT = process.env.PORT || 3000;

const clients = {
  openai: process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null,
  openrouter: process.env.OPENROUTER_API_KEY
    ? new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: 'https://openrouter.ai/api/v1'
      })
    : null,
  groq: process.env.GROQ_API_KEY
    ? new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1'
      })
    : null
};

app.get('/api/health', (_, res) =>
  res.json({
    ok: true,
    configured: Object.entries(clients)
      .filter(([, value]) => value)
      .map(([key]) => key)
  })
);

app.post('/api/chat', async (req, res) => {
  try {
    const {
      provider = 'openai',
      model = 'gpt-4o-mini',
      messages = []
    } = req.body;

    const client = clients[provider];

    if (!client) {
      return res.status(503).json({
        error: `${provider} is not configured. Add its key in Railway Variables.`
      });
    }

    const out = await client.chat.completions.create({ model, messages });
    res.json({
      message: out.choices?.[0]?.message || {
        role: 'assistant',
        content: ''
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const dist = path.join(__dirname, '..', 'dist');
app.use(express.static(dist));

// Express 5 no longer accepts app.get('*').
app.use((_, res) => {
  res.sendFile(path.join(dist, 'index.html'));
});

app.listen(PORT, () => console.log(`Orbit Studio listening on ${PORT}`));
