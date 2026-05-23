import fs from 'fs'
import path from 'path'
import os from 'os'
import { spawn } from 'child_process'

/* ───── MODODADMIN ───── */
function getDB() {

  try {

    const pathDB =
      './data/modoadmin.json'

    if (!fs.existsSync(pathDB))
      return {}

    return JSON.parse(
      fs.readFileSync(
        pathDB,
        'utf-8'
      )
    )

  } catch {

    return {}
  }
}

/* ───── QUITAR EMOJIS ───── */
function cleanText(text='') {

  return text
    .replace(
      /[\u{1F300}-\u{1FAFF}]/gu,
      ''
    )
    .replace(
      /[\u2600-\u27BF]/g,
      ''
    )
    .trim()
}

/* ───── ACOMODAR TEXTO ───── */
function wrapText(
  text,
  maxChars = 18
) {

  const words =
    text.split(/\s+/)

  const lines = []

  let line = ''

  for (const word of words) {

    const test =
      (line + ' ' + word)
      .trim()

    if (
      test.length > maxChars
    ) {

      if (line)
        lines.push(line)

      line = word

    } else {

      line = test
    }
  }

  if (line)
    lines.push(line)

  return lines
}

/* ───── STICKER ───── */
async function createSticker(text) {

  text =
    cleanText(text)

  /* 🔥 ancho dinámico */
  let maxChars = 18

  if (text.length > 40)
    maxChars = 22

  if (text.length > 80)
    maxChars = 28

  if (text.length > 140)
    maxChars = 34

  const lines =
    wrapText(
      text,
      maxChars
    )

  const formatted =
    lines.join('\n')

  const totalLines =
    lines.length

  /* 🔥 letra grande */
  let fontSize = 110

  if (totalLines >= 3)
    fontSize = 95

  if (totalLines >= 5)
    fontSize = 82

  if (totalLines >= 7)
    fontSize = 72

  if (totalLines >= 9)
    fontSize = 62

  const txtPath =
    path.join(
      os.tmpdir(),
      `txt_${Date.now()}.txt`
    )

  const outPath =
    path.join(
      os.tmpdir(),
      `sticker_${Date.now()}.webp`
    )

  fs.writeFileSync(
    txtPath,
    formatted
  )

  return new Promise(
    (resolve,reject)=>{

    const ff =
      spawn('ffmpeg',[

      '-f','lavfi',

      '-i',
      'color=c=white:s=1200x1200',

      '-vf',

`drawtext=
fontfile=/system/fonts/Roboto-Bold.ttf:
textfile='${txtPath}':
fontcolor=black:
fontsize=${fontSize}:
line_spacing=20:
x=(w-text_w)/2:
y=(h-text_h)/2`,

      '-frames:v','1',

      '-vcodec',
      'libwebp',

      '-lossless',
      '1',

      '-q:v',
      '100',

      '-preset',
      'picture',

      '-y',
      outPath
    ])

    ff.stderr.on(
      'data',
      ()=>{}
    )

    ff.on(
      'close',
      code=>{

      try {
        fs.unlinkSync(txtPath)
      } catch {}

      if (code !== 0)
        return reject(
          new Error(
            'FFmpeg falló'
          )
        )

      try {

        const buffer =
          fs.readFileSync(
            outPath
          )

        fs.unlinkSync(
          outPath
        )

        resolve(buffer)

      } catch(e){

        reject(e)
      }
    })

    ff.on(
      'error',
      reject
    )
  })
}

/* ───── TEXTO RESPONDIDO ───── */
function getQuotedText(m) {

  const ctx =
    m.message?.extendedTextMessage
      ?.contextInfo

  const quoted =
    ctx?.quotedMessage

  if (!quoted)
    return null

  return (
    quoted.conversation ||
    quoted.extendedTextMessage?.text ||
    quoted.imageMessage?.caption ||
    quoted.videoMessage?.caption ||
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
  const db = getDB()

  const isBlockedGroup =
    db[from]

  if (
    isBlockedGroup &&
    isGroup
  ) {

    const user =
      participants?.find(
        p => p.id === sender
      )

    const isAdmin =
      user?.admin === 'admin' ||
      user?.admin === 'superadmin'

    if (!isAdmin) return
  }

  /* 🔥 TEXTO */
  let text =
    args.join(' ').trim()

  if (!text) {

    const quoted =
      getQuotedText(m)

    if (quoted)
      text = quoted
  }

  if (!text) {

    return sock.sendMessage(from,{
      text:
`❌ Escribe un texto

Ejemplo:
.brat Hola mundo`
    },{
      quoted:m
    })
  }

  /* 🎨 */
  await sock.sendMessage(from,{
    react:{
      text:'🎨',
      key:m.key
    }
  })

  try {

    const sticker =
      await createSticker(text)

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
    await sock.sendMessage(from,{
      react:{
        text:'✅',
        key:m.key
      }
    })

  } catch(e) {

    console.log(
      'BRAT ERROR:',
      e
    )

    await sock.sendMessage(from,{
      text:
'❌ Error al generar sticker'
    },{
      quoted:m
    })
  }
}

handler.command = ['brat']
handler.tags = ['stickers']
handler.help = ['brat <texto>']
handler.menu = true

export default handler