require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const os      = require('os');
const { exec } = require('child_process');
const researchRoute = require('./routes/research.route');


const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));   // put index.html in ./public/
app.use('/api/research', researchRoute);


// ─── Running models (GET /api/ps from Ollama) ───────────────────────────────
app.get('/api/models', async (req, res) => {
  try {
    const r    = await fetch('http://localhost:11434/api/ps');
    const data = await r.json();
    // Ollama returns { models: [ { name, size, ... } ] }
    res.json({ models: data.models || [] });
  } catch {
    res.json({ models: [] });
  }
});


// ─── Unload / stop a model ───────────────────────────────────────────────────
// Sending keep_alive: 0 forces Ollama to evict the model from VRAM immediately.
app.post('/api/model/stop', async (req, res) => {
  const { model } = req.body;
  if (!model) return res.status(400).json({ error: 'model name required' });

  try {
    await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, keep_alive: 0 })
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// ─── CPU stats ───────────────────────────────────────────────────────────────
app.get('/api/system/cpu', (req, res) => {
  res.json({
    load:  os.loadavg()[0],   // 1-minute load average
    cores: os.cpus().length
  });
});


// ─── GPU stats (nvidia-smi) ──────────────────────────────────────────────────
// Returns util/used/total only if an NVIDIA GPU is present; otherwise returns {}
app.get('/api/system/gpu', (req, res) => {
  exec(
    'nvidia-smi --query-gpu=utilization.gpu,memory.used,memory.total --format=csv,noheader,nounits',
    (err, stdout) => {
      if (err) return res.json({});   // no GPU or nvidia-smi not installed
      const parts = stdout.trim().split(',').map(s => parseFloat(s.trim()));
      if (parts.length < 3 || parts.some(isNaN)) return res.json({});
      const [util, used, total] = parts;
      res.json({ util, used, total });
    }
  );
});


// ─── Ollama service control (systemctl) ──────────────────────────────────────
// Requires the node process to have sudo rights for systemctl (or a sudoers entry).
app.post('/api/ollama/:action', (req, res) => {
  const allowed = ['start', 'stop', 'restart'];
  const action  = req.params.action;

  if (!allowed.includes(action)) {
    return res.status(400).json({ error: 'unknown action' });
  }

  exec(`sudo systemctl ${action} ollama`, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ error: stderr || err.message });
    res.json({ success: true });
  });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`OllamaProbe server → http://localhost:${PORT}`));