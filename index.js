const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERROR: SUPABASE_URL y SUPABASE_KEY son obligatorios.');
  process.exit(1);
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: 'bmx-raffle-bot',
    dataPath: '/app/.wwebjs_auth'
  }),
  puppeteer: {
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote'
    ]
  }
});

client.on('qr', (qr) => {
  console.log('Escanea este código QR con WhatsApp:');
  qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
  console.log('WhatsApp autenticado.');
});

client.on('ready', () => {
  console.log('=================================');
  console.log(' BMX RAFFLE BOT ACTIVO');
  console.log(' WhatsApp: conectado');
  console.log(' Supabase: configurado');
  console.log('=================================');
});

client.on('auth_failure', (message) => {
  console.error('Fallo de autenticación de WhatsApp:', message);
});

client.on('disconnected', (reason) => {
  console.warn('WhatsApp desconectado:', reason);
});

client.on('message', async (message) => {
  try {
    const text = message.body.trim().toLowerCase();

    console.log(
      `[WhatsApp] ${message.from}: ${message.body}`
    );

    if (text === 'hola') {
      await message.reply(
        '🚲 ¡Hola! BMX Raffle Bot está activo.'
      );
      return;
    }

    if (text === 'estado') {
      const { error } = await supabase
        .from('raffle')
        .select('*')
        .limit(1);

      if (error) {
        console.error('Supabase:', error);

        await message.reply(
          '⚠️ El bot está conectado, pero no pude consultar Supabase.'
        );

        return;
      }

      await message.reply(
        '✅ Bot activo y conexión con Supabase funcionando.'
      );
    }
  } catch (error) {
    console.error('Error procesando mensaje:', error);
  }
});

process.on('SIGTERM', async () => {
  console.log('Cerrando BMX Raffle Bot...');
  await client.destroy();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Cerrando BMX Raffle Bot...');
  await client.destroy();
  process.exit(0);
});

client.initialize();
