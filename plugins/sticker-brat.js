import fs from 'fs'
import path from 'path'
import os from 'os'
import { spawn } from 'child_process'

/* ───── WRAP TEXTO ───── */
function wrapText(text, maxWidth = 18) {

  // 🔥 conservar espacios reales
  const words =
    text.replace(/\n/g, ' \n ')
      .split(/(\s+)/)

  const lines = []

  let line = ''

  for (const part of words) {

    // salto manual
    if (part === '\n') {

      lines.push(line.trimEnd())
      line = ''
      continue
    }

    // espacios
    if (/^\s+$/.test(part)) {

      line += part
      continue
    }

    // palabra enorme
    if (part.length > maxWidth) {

      if (line.trim())
        lines.push(line.trimEnd())

      line = ''

      for (
        let i = 0;
        i < part.length;
        i += maxWidth
      ) {

        lines.push(
          part.slice(i, i + maxWidth)
        )
      }

      continue
    }

    // overflow
    if (
      line.length + part.length >
      maxWidth
    ) {

      lines.push(line.trimEnd())
      line = part

    } else {

      line += part
    }
  }

  if (line.trim())
    lines.push(line.trimEnd())

  return lines
}

/* ───── FUENTE DINÁMICA ───── */
function getFontSize(lines) {

  const total =
    lines.length

  const longest =
    Math.max(
      ...lines.map(
        l => l.length
      )
    )

  // 🔥 más grande sin cortar
  if (
    total <= 2 &&
    longest <= 12
  ) return 82

  if (
    total <= 4 &&
    longest <= 18
  ) return 68

  if (
    total <= 6
  ) return 56

  if (
    total <= 8
  ) return 48

  if (
    total <= 10
  ) return 42

  return 36
}

/* ───── CREAR STICKER ───── */
async function createSticker(text) {

  let maxWidth = 18

  if (text.length > 50)
    maxWidth = 22

  if (text.length > 100)
    maxWidth = 26

  if (text.length > 180)
    maxWidth = 30

  const lines =
    wrapText(text, maxWidth)

  const formatted =
    lines.join('\n')

  const fontSize =
    getFontSize(lines)

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

  return new Promise((resolve,reject)=>{

    const ff = spawn('ffmpeg',[

      // 🔥 canvas MUCHO más grande
      '-f','lavfi',
      '-i','color=c=white:s=900x900',

      '-vf',

`drawtext=
fontfile=/system/fonts/Roboto-Bold.ttf:
textfile='${txtFile}':
fontcolor=black:
fontsize=${fontSize}:
line_spacing=10:
fix_bounds=true:
x=(w-text_w)/2:
y=(h-text_h)/2:
borderw=0,
scale=512:512`,

      '-frames:v','1',

      '-vcodec','libwebp',
      '-lossless','1',
      '-q:v','100',
      '-preset','picture',

      '-y',
      output
    ])

    ff.stderr.on('data',()=>{})

    ff.on('close',code=>{

      try {
        fs.unlinkSync(txtFile)
      } catch {}

      if(code !== 0)
        return reject(
          new Error(
            'FFmpeg falló'
          )
        )

      try {

        const buffer =
          fs.readFileSync(output)

        fs.unlinkSync(output)

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

/* ───── DB MODODADMIN ───── */
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

    const quotedText =
      getQuotedText(m)

    if (quotedText)
      text = quotedText
  }

  if (!text) {

    return sock.sendMessage(from,{
      text:
`❌ Escribe un texto

Ejemplo:
.brat hola

O responde un mensaje con:
.brat`
    },{
      quoted:m
    })
  }

  /* 🎨 REACCIÓN */
  await sock.sendMessage(from,{
    react:{
      text:'🎨',
      key:m.key
    }
  })

  try {

    const sticker =
      await createSticker(text)

    /* 📤 ENVIAR */
    await sock.sendMessage(from,{
      sticker
    },{
      quoted:m
    })

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