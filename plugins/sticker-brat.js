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

/* ───── QUITAR EMOJIS SOLO DEL TEXTO, PERO MANTENERLOS AL FINAL ───── */
function cleanText(text = '') {
  // Separamos texto y emojis
  const emojis = text.match(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu) || []
  const soloTexto = text
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
    .replace(/[\u2600-\u27BF]/g, '')
    .trim()
  return { soloTexto, emojis }
}

/* ───── AJUSTAR TEXTO EN LÍNEAS CORTO ───── */
function wrapText(text, maxChars = 10) { // Más corto para que se vea como la imagen
  const words = text.split(/\s+/)
  const lines = []
  let line = ''

  for (const word of words) {
    const test = (line + ' ' + word).trim()
    if (test.length > maxChars) {
      if (line) lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

/* ───── STICKER FORMATO IMAGEN ───── */
async function createSticker(text) {
  const { soloTexto, emojis } = cleanText(text)

  // Ajustes para que se vea IGUAL a la imagen
  let maxChars = 10 // Muy corto, como el ejemplo
  if (soloTexto.length > 20) maxChars = 12
  if (soloTexto.length > 40) maxChars = 15

  const lines = wrapText(soloTexto, maxChars)
  // Agregamos emojis al final si hay
  if (emojis.length > 0) lines.push(emojis.join(' '))

  const formatted = lines.join('\n')
  const totalLines = lines.length

  // TAMAÑO DE LETRA PEQUEÑO, COMO EN LA IMAGEN
  let fontSize = 70 // Base pequeña
  if (totalLines >= 2) fontSize = 65
  if (totalLines >= 3) fontSize = 60
  if (totalLines >= 4) fontSize = 55

  const txtPath = path.join(os.tmpdir(), `txt_${Date.now()}.txt`)
  const outPath = path.join(os.tmpdir(), `sticker_${Date.now()}.webp`)

  fs.writeFileSync(txtPath, formatted)

  return new Promise((resolve, reject) => {
    const ff = spawn('ffmpeg', [
      '-f', 'lavfi',
      '-i', 'color=c=white:s=800x800', // Tamaño más pequeño, cuadrado
      '-vf',
`drawtext=
fontfile=/system/fonts/Roboto-Regular.ttf:  /* Fuente normal, no negrita */
textfile='${txtPath}':
fontcolor=black:
fontsize=${fontSize}:
line_spacing=10:  /* Espacio entre líneas pequeño */
x=(w-text_w)/2:
y=(h-text_h)/2:
align=center`, // Centrado perfecto

      '-frames:v', '1',
      '-vcodec', 'libwebp',
      '-lossless', '1',
      '-q:v', '100',
      '-preset', 'picture',
      '-y', outPath
    ])

    ff.stderr.on('data', () => {})

    ff.on('close', code => {
      try { fs.unlinkSync(txtPath) } catch {}
      if (code !== 0) return reject(new Error('FFmpeg falló'))

      try {
        const buffer = fs.readFileSync(outPath)
        fs.unlinkSync(outPath)
        resolve(buffer)
      } catch (e) { reject(e) }
    })

    ff.on('error', reject)
  })
}

/* ───── TEXTO RESPONDIDO ───── */
function getQuotedText(m) {
  const ctx = m.message?.extendedTextMessage?.contextInfo
  const quoted = ctx?.quotedMessage
  if (!quoted) return null

  return (
    quoted.conversation ||
    quoted.extendedTextMessage?.text ||
    quoted.imageMessage?.caption ||
    quoted.videoMessage?.caption ||
    null
  )
}

/* ───── COMANDO ───── */
const handler = async ({ sock, m, from, sender, isGroup, participants, args }) => {
  /* 🔒 MODODADMIN */
  const db = getDB()
  const isBlockedGroup = db[from]
  if (isBlockedGroup && isGroup) {
    const user = participants?.find(p => p.id === sender)
    const isAdmin = user?.admin === 'admin' || user?.admin === 'superadmin'
    if (!isAdmin) return
  }

  /* 🔥 TEXTO */
  let text = args.join(' ').trim()
  if (!text) {
    const quoted = getQuotedText(m)
    if (quoted) text = quoted
  }

  if (!text) {
    return sock.sendMessage(from, {
      text: `❌ Escribe un texto\n\nEjemplo:\n.brat -1 una mrda 😒`
    }, { quoted: m })
  }

  /* 🎨 */
  await sock.sendMessage(from, { react: { text: '🎨', key: m.key } })

  try {
    const sticker = await createSticker(text)
    await sock.sendMessage(from, { sticker }, { quoted: m })
    await sock.sendMessage(from, { react: { text: '✅', key: m.key } })

  } catch (e) {
    console.log('BRAT ERROR:', e)
    await sock.sendMessage(from, { text: '❌ Error al generar sticker' }, { quoted: m })
  }
}

handler.command = ['brat']
handler.tags = ['stickers']
handler.help = ['brat <texto>']
handler.menu = true

export default handler
