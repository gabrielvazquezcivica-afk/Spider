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

/* ───── SEPARAR TEXTO Y EMOJIS (AHORA CORRECTO) ───── */
function cleanText(text = '') {
  // Separamos emojis y texto, aseguramos que no se corten
  const emojis = text.match(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu) || [];
  const soloTexto = text
    .replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .trim();
  return { soloTexto, emojis };
}

/* ───── CORTE DE PALABRAS IGUAL A TU EJEMPLO ───── */
function wrapText(text, maxChars = 7) { // MÁS CORTO, igual que "-1 / una / mrda"
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';

  for (const word of words) {
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

/* ───── STICKER PERFECTO ───── */
async function createSticker(text) {
  const { soloTexto, emojis } = cleanText(text);

  // Ajuste de corte según largo del texto
  let maxChars = 7;
  if (soloTexto.length > 20) maxChars = 8;
  if (soloTexto.length > 50) maxChars = 9;
  if (soloTexto.length > 100) maxChars = 10;

  const lines = wrapText(soloTexto, maxChars);
  
  // Poner emojis AL FINAL, completos y separados
  if (emojis.length > 0) lines.push(emojis.join(' '));

  const formatted = lines.join('\n');
  const totalLines = lines.length;

  // 🔥 TAMAÑO DE LETRA: NUNCA MUY CHICA, AJUSTADA
  let fontSize = 145; // Texto corto: GRANDE
  if (totalLines >= 2) fontSize = 130;
  if (totalLines >= 3) fontSize = 115;
  if (totalLines >= 4) fontSize = 100;
  if (totalLines >= 6) fontSize = 90;
  if (totalLines >= 8) fontSize = 80;
  if (totalLines >= 10) fontSize = 70; // Incluso muy largo, se ve bien

  const tmpDir = os.tmpdir();
  const txtPath = path.join(tmpDir, `txt_${Date.now()}.txt`);
  const outPath = path.join(tmpDir, `sticker_${Date.now()}.webp`);

  fs.writeFileSync(txtPath, formatted);

  return new Promise((resolve, reject) => {
    const ff = spawn('ffmpeg', [
      '-f', 'lavfi',
      '-i', 'color=c=white:s=550x550', // Tamaño exacto para que texto se vea grande
      '-vf',
`drawtext=
font='sans-bold':
textfile='${txtPath.replace(/'/g, "'\\\\''")}':
fontcolor=black:
fontsize=${fontSize}:
line_spacing=6:
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
