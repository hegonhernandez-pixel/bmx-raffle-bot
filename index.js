```javascript
'use strict';

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { createClient } = require('@supabase/supabase-js');

// ============================================================
// CONFIGURACIÓN
// ============================================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const CHROMIUM_PATH =
  process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium';

if (!SUPABASE_URL) {
  console.error('❌ Falta la variable SUPABASE_URL');
  process.exit(1);
}

if (!SUPABASE_KEY) {
  console.error('❌ Falta la variable SUPABASE_KEY');
  process.exit(1);
}

// ============================================================
// SUPABASE
// ============================================================

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

// ============================================================
// WHATSAPP
// ============================================================

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: 'bmx-raffle-bot',
    dataPath: '/app/.wwebjs_auth'
  }),

  puppeteer: {
    executablePath: CHROMIUM_PATH,
    headless: true,

    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--no-first-run',
      '--no-zygote',
      '--disable-extensions',
      '--disable-background-networking'
    ]
  }
});

// ============================================================
// ESTADO
// ============================================================

let whatsappReady = false;
let shuttingDown = false;

// ============================================================
// UTILIDADES
// ============================================================

function log(message, ...args) {
  console.log(
    `[${new Date().toISOString()}] ${message}`,
    ...args
  );
}

function error(message, ...args) {
  console.error(
    `[${new Date().toISOString()}] ${message}`,
    ...args
  );
}

// ============================================================
// EVENTOS DE WHATSAPP
// ============================================================

// QR para autenticación inicial
client.on('qr', (qr) => {
  console.log('');
  console.log('================================================');
  console.log('📱 ESCANEA ESTE CÓDIGO QR CON WHATSAPP');
  console.log('================================================');
  console.log('');

  qrcode.generate(qr, {
    small: true
  });

  console.log('');
  console.log('================================================');
});

// Proceso de autenticación iniciado
client.on('authenticated', () => {
  log('🔐 WhatsApp autenticado correctamente.');
});

// Fallo de autenticación
client.on('auth_failure', (message) => {
  error('❌ Fallo de autenticación de WhatsApp:', message);
});

// Cliente listo
client.on('ready', () => {
  whatsappReady = true;

  console.log('');
  console.log('================================================');
  console.log('🚲 BMX RAFFLE BOT');
  console.log('================================================');
  console.log('✅ WhatsApp conectado');
  console.log('✅ Chromium:', CHROMIUM_PATH);
  console.log('✅ Supabase configurado');
  console.log('================================================');
  console.log('');
});

// Cambio de estado de WhatsApp
client.on('change_state', (state) => {
  log(`📡 Estado de WhatsApp: ${state}`);
});

// Desconexión
client.on('disconnected', (reason) => {
  whatsappReady = false;

  error('⚠️ WhatsApp desconectado:', reason);

  if (!shuttingDown) {
    log('El proceso continúa activo.');
  }
});

// ============================================================
// MENSAJES
// ============================================================

client.on('message', async (message) => {
  try {
    // Ignorar mensajes propios
    if (message.fromMe) {
      return;
    }

    const text = (message.body || '').trim();
    const command = text.toLowerCase();

    log(
      `📩 Mensaje de ${message.from}: ${text}`
    );

    // --------------------------------------------------------
    // PING
    // --------------------------------------------------------

    if (command === 'ping') {
      await message.reply('🏓 Pong');

      return;
    }

    // --------------------------------------------------------
    // HOLA
    // --------------------------------------------------------

    if (
      command === 'hola' ||
      command === 'hello' ||
      command === 'buenas'
    ) {
      await message.reply(
        '🚲 ¡Hola! Soy el BMX Raffle Bot.\n\n' +
        'Estoy conectado y listo para ayudarte.\n\n' +
        'Escribe *estado* para consultar el estado del bot.'
      );

      return;
    }

    // --------------------------------------------------------
    // ESTADO
    // --------------------------------------------------------

    if (
      command === 'estado' ||
      command === 'status'
    ) {
      const estadoWhatsApp = whatsappReady
        ? '✅ conectado'
        : '❌ desconectado';

      const supabaseEstado = SUPABASE_URL
        ? '✅ configurado'
        : '❌ no configurado';

      await message.reply(
        '🚲 *BMX Raffle Bot*\n\n' +
        `WhatsApp: ${estadoWhatsApp}\n` +
        `Supabase: ${supabaseEstado}\n` +
        `Chromium: ${CHROMIUM_PATH}\n\n` +
        'Bot operativo.'
      );

      return;
    }

    // --------------------------------------------------------
    // AYUDA
    // --------------------------------------------------------

    if (
      command === 'ayuda' ||
      command === 'help' ||
      command === 'menu'
    ) {
      await message.reply(
        '🚲 *BMX Raffle Bot*\n\n' +
        '*Comandos disponibles:*\n\n' +
        '🏓 ping — comprobar respuesta\n' +
        '📊 estado — consultar estado\n' +
        '❓ ayuda — mostrar este menú'
      );

      return;
    }

  } catch (err) {
    error(
      '❌ Error procesando mensaje:',
      err
    );
  }
});

// ============================================================
// ERRORES DEL CLIENTE
// ============================================================

client.on('loading_screen', (percent, message) => {
  log(
    `⏳ WhatsApp cargando: ${percent}% - ${message}`
  );
});

client.on('remote_session_saved', () => {
  log('💾 Sesión remota guardada.');
});

// ============================================================
// COMPROBACIÓN BÁSICA DE SUPABASE
// ============================================================
//
// No hacemos una consulta a una tabla concreta porque todavía
// no conocemos el esquema de la base de datos del proyecto.
// La conexión queda preparada para utilizar Supabase desde
// los comandos reales de la rifa.
// ============================================================

async function initializeSupabase() {
  try {
    log('🔌 Inicializando cliente Supabase...');
    log(`Supabase URL: ${SUPABASE_URL}`);

    // El cliente se crea correctamente aquí.
    // Las operaciones reales contra tablas se agregarán
    // cuando conozcamos el esquema de la rifa.

    if (supabase) {
      log('✅ Cliente Supabase inicializado.');
    }
  } catch (err) {
    error(
      '❌ Error inicializando Supabase:',
      err
    );
  }
}

// ============================================================
// INICIALIZACIÓN
// ============================================================

async function start() {
  try {
    console.log('');
    console.log('================================================');
    console.log('🚀 INICIANDO BMX RAFFLE BOT');
    console.log('================================================');
    console.log('');

    log(`Node.js: ${process.version}`);
    log(`Chromium: ${CHROMIUM_PATH}`);

    await initializeSupabase();

    log('🚀 Inicializando WhatsApp...');

    await client.initialize();

  } catch (err) {
    error(
      '❌ Error fatal iniciando el bot:',
      err
    );

    process.exit(1);
  }
}

// ============================================================
// CIERRE LIMPIO
// ============================================================

async function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  console.log('');
  log(`🛑 Recibida señal ${signal}. Cerrando bot...`);

  try {
    await client.destroy();

    log('✅ WhatsApp cerrado correctamente.');
  } catch (err) {
    error(
      '⚠️ Error cerrando WhatsApp:',
      err
    );
  }

  process.exit(0);
}

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});

process.on('SIGINT', () => {
  shutdown('SIGINT');
});

// ============================================================
// ERRORES GLOBALES
// ============================================================

process.on('uncaughtException', (err) => {
  error(
    '❌ Excepción no controlada:',
    err
  );
});

process.on('unhandledRejection', (reason) => {
  error(
    '❌ Promise rechazada:',
    reason
  );
});

// ============================================================
// ARRANCAR
// ============================================================

start();
```
