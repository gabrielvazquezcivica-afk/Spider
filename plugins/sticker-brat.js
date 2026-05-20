import fs from 'fs'
import path from 'path'
import os from 'os'
import { spawn } from 'child_process'

/* ───── DB MODOADMIN ───── */
const modoadminPath =
  './data/modoadmin.json'

function getDB() {

  try {

    if (!fs.existsSync(modoadminPath))
      return {}

    return JSON.parse(
      fs.readFileSync(
        modoadminPath,
        'utf-8'
      )
    )

  } catch {

    return {}
  }
}

/* ───── AJUSTAR TEXTO AUTOMÁTICO ───── */
function wrapText(text, maxWidth = 18) {

  const words = text.split(/\s+/)
  const lines = []

  let line = ''

  for (const word of words) {

    if (word.length > maxWidth) {

      if (line.trim()) {

        lines.push(
          line.trim()
        )

        line = ''
      }

      for (
        let i = 0;
        i < word.length;
        i += maxWidth
      ) {

        lines.push(
          word.slice(
            i,
            i + maxWidth
          )
        )
      }

      continue
    }

    const test =
      (line + ' ' + word)
        .trim()

    if (
      test.length > maxWidth
    ) {

      lines.push(
        line.trim()
      )

      line = word

    } else {

      line = test
    }
  }

  if (line.trim())
    lines.push(line.trim())

  return lines
}

/* ───── CALCULAR FUENTE ───── */
function calculateFont(lines) {

  const longest =
    Math.max(
      ...lines.map(
        l => l.length
      )
    )

  const total =
    lines.length

  if (
    total <= 2 &&
    longest <= 10
  ) return 78

  if (
    total <= 4 &&
    longest <= 15
  ) return 64

  if (total <= 6)
    return 52

  if (total <= 8)
    return 44

  return 36
}

/* ───── CREAR STICKER ───── */
async function createSticker(text) {

  let maxWidth = 18

  if (text.length > 80)
    maxWidth = 22

  if (text.length > 140)
    maxWidth = 26

  if (text.length > 220)
    maxWidth = 30

  const lines =
    wrapText(
      text,
      maxWidth
    )

  const formatted =
    lines.join('\n')

  const fontSize =
    calculateFont(lines)

  const output = path.join(
    os.tmpdir(),
    `brat_${Date.now()}.webp`
  )

  const txtFile = path.join(
    os.tmpdir(),
    `brat_${Date.now()}.txt`
  )

  fs.writeFileSync(
    txtFile,
    formatted
  )

  return new Promise(
    (resolve, reject) => {

      const ff = spawn(
        'ffmpeg',
        [

          '-f',
          'lavfi',

          '-i',
          'color=c=white:s=512x512',

          '-vf',

`drawtext=
fontfile=/system/fonts/Roboto-Bold.ttf:
textfile='${txtFile}':
fontcolor=black:
fontsize=${fontSize}:
line_spacing=10:
x=(w-text_w)/2:
y=(h-text_h)/2:
borderw=1`,

          '-frames:v',
          '1',

          '-vcodec',
          'libwebp',

          '-lossless',
          '1',

          '-q:v',
          '100',

          '-preset',
          'picture',

          '-y',
          output
        ]
      )

      ff.stderr.on(
        'data',
        () => {}
      )

      ff.on(
        'close',
        code => {

          try {

            fs.unlinkSync(
              txtFile
            )

          } catch {}

          if (code !== 0)
            return reject(
              new Error(
                'FFmpeg fallo'
              )
            )

          try {

            const buffer =
              fs.readFileSync(
                output
              )

            fs.unlinkSync(
              output
            )

            resolve(buffer)

          } catch (e) {

            reject(e)
          }
        }
      )

      ff.on(
        'error',
        reject
      )
    }
  )
}

/* ───── TEXTO RESPONDIDO ───── */
function getQuotedText(m) {

  const ctx =
    m.message
      ?.extendedTextMessage
      ?.contextInfo

  const quoted =
    ctx?.quotedMessage

  if (!quoted)
    return null

  return (
    quoted.conversation ||
    quoted.extendedTextMessage
      ?.text ||
    quoted.imageMessage
      ?.caption ||
    quoted.videoMessage
      ?.caption ||
    null
  )
}

/* ───── COMANDO ───── */
const handler = async ({
  sock,
  m,
  from,
  sender,
  isGroup,
  participants,
  args
}) => {

  /* 🔒 MODODADMIN */
  if (isGroup) {

    const db = getDB()

    const isBlockedGroup =
      db[from]

    const user =
      participants?.find(
        p => p.id === sender
      )

    const isAdmin =
      user?.admin ===
        'admin' ||
      user?.admin ===
        'superadmin'

    if (
      isBlockedGroup &&
      !isAdmin
    ) return
  }

  /* 🔥 TEXTO */
  let text =
    args.join(' ').trim()

  if (!text) {

    const quotedText =
      getQuotedText(m)

    if (quotedText)
      text = quotedText
  }

  if (!text) {

    return sock.sendMessage(
      from,
      {
        text:
`❌ Escribe o responde un mensaje

Ejemplo:
.brat hola

O responde un mensaje con:
.brat`
      },
      {
        quoted:m
      }
    )
  }

  /* 🎨 REACCIÓN */
  await sock.sendMessage(
    from,
    {
      react:{
        text:'🎨',
        key:m.key
      }
    }
  )

  try {

    const sticker =
      await createSticker(
        text
      )

    /* 📤 ENVIAR */
    await sock.sendMessage(
      from,
      {
        sticker
      },
      {
        quoted:m
      }
    )

    /* ✅ */
    await sock.sendMessage(
      from,
      {
        react:{
          text:'✅',
          key:m.key
        }
      }
    )

  } catch(e) {

    console.log(
      'BRAT ERROR:',
      e
    )

    await sock.sendMessage(
      from,
      {
        text:
'❌ Error al generar sticker'
      },
      {
        quoted:m
      }
    )
  }
}

handler.command = ['brat']
handler.tags = ['stickers']
handler.help = ['brat <texto>']
handler.menu = true
handler.group = true

export default handler