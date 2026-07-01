// ═══════════════════════════════════════════════════════
//  Campo Tech Empilhadeiras — Backend Completo
//  Para rodar local:  node server.js
//  Para Railway:      sobe este arquivo + package.json
// ═══════════════════════════════════════════════════════

const express    = require('express');
const nodemailer = require('nodemailer');
const cors       = require('cors');
const path       = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// ════════════════════════════════════════════════════
//  SERVE O SITE HTML (para funcionar na internet)
//  Acesse: https://seuapp.railway.app
// ════════════════════════════════════════════════════
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'campotech-horimetro.html'));
});

// ════════════════════════════════════════════════════
//  CONFIGURAÇÃO DO E-MAIL
//  Local:   coloque aqui seu email e senha de app
//  Railway: configure em Variables (mais seguro)
// ════════════════════════════════════════════════════
const EMAIL_CONFIG = {
  user: process.env.EMAIL_USER || 'seuemail@gmail.com',
  pass: process.env.EMAIL_PASS || 'xxxx xxxx xxxx xxxx',
};

// Config dinâmica (atualizada pelo painel)
let dynamicConfig = { ...EMAIL_CONFIG };

function rebuildTransporter(user, pass) {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });
}

let activeTransporter = rebuildTransporter(dynamicConfig.user, dynamicConfig.pass);

// ════════════════════════════════════════════════════
//  TEMPLATE DO E-MAIL
// ════════════════════════════════════════════════════
function buildEmailHTML(subject, machine, message, type, hours, hoursLeft) {
  const colors = {
    alert: { bg: '#EF444422', border: '#EF4444', text: '#F87171', emoji: '🚨' },
    warn:  { bg: '#F59E0B22', border: '#F59E0B', text: '#FBBF24', emoji: '⚠️'  },
    ok:    { bg: '#22C55E22', border: '#22C55E', text: '#4ADE80', emoji: '✅' },
    info:  { bg: '#38BDF822', border: '#38BDF8', text: '#7DD3FC', emoji: 'ℹ️'  },
  };
  const c   = colors[type] || colors.info;
  const now = new Date().toLocaleString('pt-BR');

  const horimetroBlock = (hours !== undefined && hours !== null) ? `
    <tr style="border-bottom:1px solid #1E2FA855">
      <td style="padding:10px 0;color:#7A8EC0;font-size:13px;width:140px">Horímetro Atual</td>
      <td style="padding:10px 0">
        <span style="font-family:monospace;font-size:20px;font-weight:bold;color:#FFFFFF;
          letter-spacing:3px;background:#050914;padding:4px 12px;border-radius:6px;
          border:1px solid #D92B2B44">${String(hours).padStart(5,'0')} h</span>
      </td>
    </tr>
    ${hoursLeft !== undefined && hoursLeft !== null ? `
    <tr style="border-bottom:1px solid #1E2FA855">
      <td style="padding:10px 0;color:#7A8EC0;font-size:13px">Horas Restantes</td>
      <td style="padding:10px 0;font-size:15px;font-weight:bold;
        color:${type==='alert'?'#F87171':type==='warn'?'#FBBF24':'#4ADE80'}">
        ${hoursLeft > 0 ? hoursLeft+' h até a revisão' : 'Revisão vencida!'}
      </td>
    </tr>` : ''}
  ` : '';

  return `<!DOCTYPE html>
  <html lang="pt-BR">
  <head><meta charset="UTF-8"/></head>
  <body style="margin:0;padding:20px;background:#060B1E;font-family:Arial,sans-serif">
    <div style="max-width:520px;margin:0 auto">
      <div style="background:#0A0F2C;padding:24px;border-radius:12px 12px 0 0;
        text-align:center;border-bottom:3px solid #D92B2B">
        <h1 style="color:#D92B2B;font-size:22px;margin:0;letter-spacing:1px">CAMPO TECH</h1>
        <p style="color:#7A8EC0;font-size:12px;margin:4px 0 0;letter-spacing:2px;text-transform:uppercase">
          Empilhadeiras — Sistema de Monitoramento</p>
      </div>
      <div style="background:#151C4F;padding:28px;border-left:1px solid #1E2FA8;border-right:1px solid #1E2FA8">
        <div style="background:${c.bg};border:1px solid ${c.border};border-radius:10px;
          padding:16px 20px;margin-bottom:22px">
          <p style="color:${c.text};font-size:18px;font-weight:bold;margin:0">${c.emoji} ${subject}</p>
        </div>
        <table style="width:100%;border-collapse:collapse">
          <tr style="border-bottom:1px solid #1E2FA855">
            <td style="padding:10px 0;color:#7A8EC0;font-size:13px;width:140px">Máquina</td>
            <td style="padding:10px 0;color:#F0F4FF;font-size:13px;font-weight:bold">${machine}</td>
          </tr>
          ${horimetroBlock}
          <tr style="border-bottom:1px solid #1E2FA855">
            <td style="padding:10px 0;color:#7A8EC0;font-size:13px">Mensagem</td>
            <td style="padding:10px 0;color:#F0F4FF;font-size:13px">${message}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#7A8EC0;font-size:13px">Data / Hora</td>
            <td style="padding:10px 0;color:#F0F4FF;font-size:13px">${now}</td>
          </tr>
        </table>
        ${type === 'alert' ? `
        <div style="background:#EF444415;border:1px solid #EF444455;border-radius:8px;
          padding:14px;margin-top:20px">
          <p style="color:#F87171;font-size:13px;margin:0;font-weight:bold">⛔ Ação imediata necessária</p>
          <p style="color:#FCA5A5;font-size:12px;margin:6px 0 0">
            Pare a máquina e agende a manutenção com urgência.</p>
        </div>` : ''}
      </div>
      <div style="background:#0E1438;padding:16px;border-radius:0 0 12px 12px;
        text-align:center;border:1px solid #1E2FA822;border-top:none">
        <p style="color:#4A5A88;font-size:11px;margin:0">
          Este é um e-mail automático do sistema Campo Tech. Não responda.</p>
        <p style="color:#4A5A88;font-size:11px;margin:4px 0 0">© Campo Tech Empilhadeiras</p>
      </div>
    </div>
  </body>
  </html>`;
}

// ════════════════════════════════════════════════════
//  ROTA: Ping
// ════════════════════════════════════════════════════
app.get('/api/ping', (req, res) => {
  res.json({ ok: true, message: 'Campo Tech Backend v1.0 online ✓' });
});

// ════════════════════════════════════════════════════
//  ROTA: Configurar e-mail pelo painel
// ════════════════════════════════════════════════════
app.post('/api/config-email', async (req, res) => {
  const { email, pass } = req.body;
  if (!email || !pass) {
    return res.status(400).json({ ok: false, error: 'E-mail e senha são obrigatórios.' });
  }
  const testTransporter = rebuildTransporter(email, pass);
  try {
    await testTransporter.verify();
    dynamicConfig = { user: email, pass };
    activeTransporter = testTransporter;
    console.log(`[${new Date().toLocaleString('pt-BR')}] ✓ E-mail configurado: ${email}`);
    res.json({ ok: true, message: 'E-mail configurado com sucesso!' });
  } catch (err) {
    console.error('[ERRO] Credenciais inválidas:', err.message);
    res.status(400).json({ ok: false, error: 'Credenciais inválidas. Verifique o e-mail e a Senha de App.' });
  }
});

// ════════════════════════════════════════════════════
//  ROTA: Enviar alerta por e-mail
// ════════════════════════════════════════════════════
app.post('/api/send-alert', async (req, res) => {
  const { emails, subject, machine, message, type, hours, hoursLeft } = req.body;

  if (!emails || emails.length === 0)
    return res.status(400).json({ ok: false, error: 'Nenhum destinatário informado.' });
  if (!subject || !message)
    return res.status(400).json({ ok: false, error: 'Assunto e mensagem são obrigatórios.' });

  const html = buildEmailHTML(subject, machine || '—', message, type || 'info', hours, hoursLeft);

  try {
    const info = await activeTransporter.sendMail({
      from:    `"Campo Tech Alertas" <${dynamicConfig.user}>`,
      to:      emails.join(', '),
      subject: `[Campo Tech] ${subject}`,
      html,
    });
    console.log(`[${new Date().toLocaleString('pt-BR')}] ✉ E-mail enviado → ${emails.join(', ')}`);
    res.json({ ok: true, message: 'E-mail enviado com sucesso!', messageId: info.messageId });
  } catch (err) {
    console.error('[ERRO] Falha ao enviar e-mail:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════
//  ROTA: Receber horímetro da máquina (IoT/CLP)
// ════════════════════════════════════════════════════
app.post('/api/horimetro', (req, res) => {
  const { machine_id, hours } = req.body;
  if (!machine_id || hours === undefined)
    return res.status(400).json({ ok: false, error: 'machine_id e hours são obrigatórios.' });
  console.log(`[${new Date().toLocaleString('pt-BR')}] 📡 Horímetro: ${machine_id} → ${hours} h`);
  res.json({ ok: true, machine_id, hours, received_at: new Date().toISOString() });
});

// ════════════════════════════════════════════════════
//  INICIAR
// ════════════════════════════════════════════════════
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║   Campo Tech — Backend de Alertas    ║');
  console.log(`  ║   Rodando em http://localhost:${PORT}   ║`);
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
  console.log(`  E-mail configurado: ${dynamicConfig.user}`);
  console.log('  Acesse o site em: http://localhost:'+PORT);
  console.log('');
});
