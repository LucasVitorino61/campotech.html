const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'campotech-horimetro.html'));
});

app.get('/api/ping', (req, res) => {
  res.json({ ok: true, message: 'online' });
});

app.post('/api/send-alert', async (req, res) => {
  const { emails, subject, machine, message } = req.body;
  console.log('Enviando para:', emails);
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Campo Tech <onboarding@resend.dev>',
        to: emails,
        subject: `[Campo Tech] ${subject}`,
        html: `<p><b>Máquina:</b> ${machine}</p><p><b>Mensagem:</b> ${message}</p>`
      })
    });
    const data = await response.json();
    console.log('Resend resposta:', JSON.stringify(data));
    if (data.id) {
      res.json({ ok: true, message: 'E-mail enviado!' });
    } else {
      res.status(500).json({ ok: false, error: JSON.stringify(data) });
    }
  } catch (err) {
    console.error('ERRO:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/config-email', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/horimetro', (req, res) => {
  const { machine_id, hours } = req.body;
  res.json({ ok: true, machine_id, hours });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Rodando na porta ' + PORT));
