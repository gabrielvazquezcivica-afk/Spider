import fs from 'fs'
import path from 'path'
import os from 'os'
import { spawn } from 'child_process'

/* ───── MODODADMIN ───── */
function getDB() {
  try {
    const pathDB = './data/modoadmin.json'
    if (!fs.existsSync(pathDB)) return {}
    return JSON.parse(fs.readFileSync(pathDB, 'utf-8'))
  } catch {
    return {}
  }
}

/* ───── SEPARAR TEXTO Y EMOJIS (AHORA SÍ FUNCIONA) ───── */
function cleanText(text = '') {
  // Captura TODOS los emojis existentes
  const emojis = text.match(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}]/gu) || [];
  // Quitamos solo emojis del texto
  const soloTexto = text
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}]/gu, '')
    .trim();
  return { soloTexto, emojis };
}

/* ───── CORTE EXACTO: MÁXIMO 6 LETRAS POR LÍNEA ───── */
function wrapText(text, maxChars = 6) { // CORTE CORTO, IGUAL AL EJEMPLO
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';

  for (const word of words) {
    // Si la palabra es sola y muy larga, la cortamos por letras
    if (word.length > maxChars) {
      const partes = word.match(new RegExp('.{1,' + maxChars + '}', 'g')) || [];
      partes.forEach(p => lines.push(p));
      line = '';
      continue;
    }

    const test = (line + ' ' + word).trim();
    if (test.length > maxChars) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/* ───── STICKER FORMATO PERFECTO ───── */
async function createSticker(text) {
  const { soloTexto, emojis } = cleanText(text);

  // Siempre cortar a 6 caracteres, como tu ejemplo
  const lines = wrapText(soloTexto, 6);
  
  // ✅ EMOJIS: VAN AL FINAL, COMPLETOS, SIEMPRE
  if (emojis.length > 0) lines.push(emojis.join(' '));

  const formatted = lines.join('\n');
  const totalLines = lines.length;

  // ✅ TAMAÑO DE LETRA: SE AJUSTA PERO SIEMPRE GRANDE
  let fontSize = 145;
  if (totalLines >= 2) fontSize = 130;
  if (totalLines >= 3) fontSize = 115;
  if (totalLines >= 4) fontSize = 105;
  if (totalLines >= 6) fontSize = 95;
  if (totalLines >= 8) fontSize = 88;
  if (totalLines >= 10) fontSize = 80;
  if (totalLines >= 12) fontSize = 72;
  if (totalLines >= 15) fontSize = 65;

  const tmpDir = os.tmpdir();
  const txtPath = path.join(tmpDir, `txt_${Date.now()}.txt`);
  const outPath = path.join(tmpDir, `sticker_${Date.now()}.webp`);

  fs.writeFileSync(txtPath, formatted);

  return new Promise((resolve, reject) => {
    const ff = spawn('ffmpeg', [
      '-f', 'lavfi',
      '-i', 'color=c=white:s=520x520', // Tamaño exacto
      '-vf',
`drawtext=
font='sans-bold':
textfile='${txtPath.replace(/'/g, "'\\\\''")}':
fontcolor=black:
fontsize=${fontSize}:
line_spacing=4:  // ✅ MUY JUNTO, IGUAL AL EJEMPLO
x=(w-text_w)/2:
y=(h-text_h)/2`,

      '-frames:v', '1',
      '-vcodec', 'libwebp',
      '-lossless', '1',
      '-q:v', '100',
      '-preset', 'picture',
      '-y', outPath
    ]);

    let errorLog = '';
    ff.stderr.on('data', data => { errorLog += data.toString() });

    ff.on('close', code => {
      try { fs.unlinkSync(txtPath) } catch {}
      if (code !== 0) {
        console.log('FFMPEG ERROR:\n', errorLog);
        return reject(new Error('FFmpeg falló'));
      }

      try {
        const buffer = fs.readFileSync(outPath);
        fs.unlinkSync(outPath);
        resolve(buffer);
      } catch (e) { reject(e) }
    });

    ff.on('error', err => {
      console.log('SPAWN ERROR:', err);
      reject(err);
    });
  });
}

/* ───── TEXTO RESPONDIDO ───── */
function getQuotedText(m) {
  const ctx = m.message?.extendedTextMessage?.contextInfo;
  const quoted = ctx?.quotedMessage;
  if (!quoted) return null;

  return (
    quoted.conversation ||
    quoted.extendedTextMessage?.text ||
    quoted.imageMessage?.caption ||
    quoted.videoMessage?.caption ||
    null
  );
}

/* ───── COMANDO ───── */
const handler = async ({ sock, m, from, sender, isGroup, participants, args }) => {
  const db = getDB();
  const isBlockedGroup = db[from];
  if (isBlockedGroup && isGroup) {
    const user = participants?.find(p => p.id === sender);
    const isAdmin = user?.admin === 'admin' || user?.admin === 'superadmin';
    if (!isAdmin) return;
  }

  let text = args.join(' ').trim();
  if (!text) {
    const quoted = getQuotedText(m);
    if (quoted) text = quoted;
  }

  if (!text) {
    return sock.sendMessage(from, {
      text: `❌ Escribe un texto\n\nEjemplo:\n.brat -1 una mrda 😒`
    }, { quoted: m });
  }

  await sock.sendMessage(from, { react: { text: '🎨', key: m.key } });

  try {
    const sticker = await createSticker(text);
    await sock.sendMessage(from, { sticker }, { quoted: m });
    await sock.sendMessage(from, { react: { text: '✅', key: m.key } });

  } catch (e) {
    console.log('BRAT ERROR:', e);
    await sock.sendMessage(from, { text: '❌ Error al generar sticker' }, { quoted: m });
  }
};

handler.command = ['brat'];
handler.tags = ['stickers'];
handler.help = ['brat <texto>'];
handler.menu = true;

export default handler;
