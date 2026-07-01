const express    = require('express');
const nodemailer = require('nodemailer');
const cors       = require('cors');
const path       = require('path');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'campotech-horimetro.html'));
});

function rebuildTransporter() {
  return nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

app.get('/api/ping', (req, res) => {
  res.json({ ok: true, message: 'online' });
});

app.post('/api/send-alert', async (req, res) => {
  const { emails, subject, machine, message } = req.body;
  console.log('Tentando enviar para:', emails);
  try {
    const transporter = rebuildTransporter();
    await transporter.sendMail({
      from:    process.env.EMAIL_USER,
      to:      emails.join(', '),
      subject: `[Campo Tech] ${subject}`,
      html:    `<p><b>Máquina:</b> ${machine}</p><p><b>Mensagem:</b> ${message}</p>`,
    });
    console.log('E-mail enviado com sucesso!');
    res.json({ ok: true, message: 'E-mail enviado!' });
  } catch (err) {
    console.error('ERRO:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/config-email', (req, res) => {
  res.json({ ok: true, message: 'Use as variáveis do Railway.' });
});

app.post('/api/horimetro', (req, res) => {
  const { machine_id, hours } = req.body;
  res.json({ ok: true, machine_id, hours });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Rodando na porta ' + PORT));
