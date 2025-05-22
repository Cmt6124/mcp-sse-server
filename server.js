const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

let clients = [];

app.get('/mcp-stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  clients.push(res);

  const keepAlive = setInterval(() => {
    res.write(':\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(keepAlive);
    clients = clients.filter(c => c !== res);
  });
});

app.post('/trigger-task', async (req, res) => {
  const task = req.body;

  clients.forEach(client => {
    client.write(`data: ${JSON.stringify(task)}\n\n`);
  });

  try {
    await axios.post('https://your-n8n-url.com/webhook/mcp', task);
  } catch (err) {
    console.error('Error sending to n8n:', err.message);
  }

  res.status(200).send({ message: 'Task dispatched' });
});

app.listen(PORT, () => {
  console.log(`✅ MCP Server running on port ${PORT}`);
});
