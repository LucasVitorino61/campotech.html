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

const EMAIL_CONFIG = {
  user: process.env.EMAIL_USER || 'seuemail@gmail.com',
  pass: process.env.EMAIL_PASS || 'xxxx xxxx xxxx xxxx',
};

let dynamicConfig = { ...EMAIL_CONFIG };

function rebuildTransporter(user, pass) {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass }
  });
}

let activeTransporter = rebuildTransporter(dynamicConfig.user, dynamicConfig.pass);

app.get('/api/ping', (req, res) => {
  res.json({ ok: true, message: 'Campo Tech Backend v1.0 online ✓' });
});

app.post('/api/config-email', async (req, res) => {
  const { email, pass } = req.body;
  if (!email || !pass)
    return res.status(400).json({ ok: false, error: 'E-mail e senha são obrigatórios.' });
  const testTransporter = rebuildTransporter(email, pass);
  try {
    await testTransporter.verify();
    dynamicConfig = { user: email, pass };
    activeTransporter = testTransporter;
    res.json({ ok: true, message: 'E-mail configurado com sucesso!' });
  } catch (err) {
    res.status(400).json({ ok: false, error: 'Credenciais inválidas.' });
  }
});

app.post('/api/send-alert', async (req, res) => {
  const { emails, subject, machine, message, type, hours, hoursLeft } = req.body;
  if (!emails || emails.length === 0)
    return res.status(400).json({ ok: false, error: 'Nenhum destinatário.' });
  try {
    await activeTransporter.sendMail({
      from:    `"Campo Tech Alertas" <${dynamicConfig.user}>`,
      to:      emails.join(', '),
      subject: `[Campo Tech] ${subject}`,
      html:    `<p>${message}</p><p>Máquina: ${machine}</p><p>Horímetro: ${hours} h</p>`,
    });
    res.json({ ok: true, message: 'E-mail enviado!' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/horimetro', (req, res) => {
  const { machine_id, hours } = req.body;
  res.json({ ok: true, machine_id, hours });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Rodando na porta ' + PORT));
