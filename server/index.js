const express = require('express');
const path = require('path');
const schedule = require('node-schedule');
const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory data stores
let macros = [
  { id: 'demo', name: 'Example Macro' }
];
let operations = {};
let schedules = {};
let scheduleCounter = 0;

function runMacro(macro) {
  const runId = Date.now().toString();
  operations[runId] = { status: 'running', type: 'macro', macroId: macro.id };
  setTimeout(() => {
    operations[runId].status = 'completed';
  }, 2000);
}

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

// POST /api/schedule
app.post('/api/schedule', (req, res) => {
  const { id, name, date, time, recurrence = 'once' } = req.body || {};
  const macro = macros.find(m => m.id === id || m.name === name);
  if (!macro) {
    return res.status(404).json({ error: 'Macro not found' });
  }
  if (!date) return res.status(400).json({ error: 'date required' });
  const dt = new Date(`${date}T${time || '00:00'}`);
  const scheduleId = (++scheduleCounter).toString();
  const rule =
    recurrence === 'daily'
      ? { hour: dt.getHours(), minute: dt.getMinutes() }
      : recurrence === 'weekly'
      ? { dayOfWeek: dt.getDay(), hour: dt.getHours(), minute: dt.getMinutes() }
      : recurrence === 'monthly'
      ? { date: dt.getDate(), hour: dt.getHours(), minute: dt.getMinutes() }
      : dt;
  const job = schedule.scheduleJob(rule, () => {
    runMacro(macro);
    if (recurrence === 'once') {
      job.cancel();
      delete schedules[scheduleId];
    }
  });
  schedules[scheduleId] = { id: scheduleId, macroId: macro.id, date: dt.toISOString(), recurrence, job };
  res.json({ scheduleId });
});

// GET /api/schedule
app.get('/api/schedule', (req, res) => {
  const list = Object.values(schedules).map(({ job, ...info }) => info);
  res.json(list);
});

// DELETE /api/schedule/:id
app.delete('/api/schedule/:id', (req, res) => {
  const sc = schedules[req.params.id];
  if (!sc) return res.status(404).json({ error: 'Not found' });
  sc.job.cancel();
  delete schedules[req.params.id];
  res.json({ ok: true });
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

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Hermes server listening on port ${port}`);
  });
}

module.exports = app;
