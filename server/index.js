const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

// In-memory data stores
let macros = [
  { id: 'demo', name: 'Example Macro' }
];
let operations = {};

// POST /api/macros/run
app.post('/api/macros/run', (req, res) => {
  const { id, name } = req.body || {};
  const macro = macros.find(m => m.id === id || m.name === name);
  if (!macro) {
    return res.status(404).json({ error: 'Macro not found' });
  }
  const runId = Date.now().toString();
  operations[runId] = { status: 'running', type: 'macro', macroId: macro.id };
  // Simulate async execution
  setTimeout(() => {
    operations[runId].status = 'completed';
  }, 2000);
  res.json({ runId, status: operations[runId].status });
});

// GET /api/macros
app.get('/api/macros', (req, res) => {
  res.json(macros);
});

// POST /api/fill
app.post('/api/fill', (req, res) => {
  const { profile } = req.body || {};
  if (!profile) {
    return res.status(400).json({ error: 'Profile required' });
  }
  const fillId = Date.now().toString();
  operations[fillId] = { status: 'running', type: 'fill', profile };
  setTimeout(() => {
    operations[fillId].status = 'completed';
  }, 2000);
  res.json({ fillId, status: operations[fillId].status });
});

// GET /api/status/:id
app.get('/api/status/:id', (req, res) => {
  const op = operations[req.params.id];
  if (!op) {
    return res.status(404).json({ error: 'Operation not found' });
  }
  res.json(op);
});

app.listen(port, () => {
  console.log(`Hermes server listening on port ${port}`);
});
