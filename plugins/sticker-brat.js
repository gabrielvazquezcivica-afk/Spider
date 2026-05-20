import fs from 'fs'
import path from 'path'
import os from 'os'
import { spawn } from 'child_process'

/* ───── WRAP TEXTO ───── */
function wrapText(text, maxWidth = 10) {

  const words = text.split(/\s+/)
  const lines = []

  let line = ''

  for (const word of words) {

    const test =
      (line + ' ' + word).trim()

    if (test.length > maxWidth) {

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

/* ───── FUENTE DINÁMICA ───── */
function getFontSize(lines) {

  const total = lines.length

  if (total <= 2) return 95
  if (total <= 4) return 80
  if (total <= 6) return 68
  if (total <= 8) return 58
  if (total <= 10) return 50

  return 42
}

/* ───── CREAR STICKER ───── */
async function createSticker(text) {

  let maxWidth = 10

  if (text.length > 40)
    maxWidth = 12

  if (text.length > 80)
    maxWidth = 14

  if (text.length > 140)
    maxWidth = 16

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

      '-f','lavfi',
      '-i','color=c=white:s=512x512',

      '-vf',
`drawtext=
fontfile=/system/fonts/Roboto-Regular.ttf:
textfile='${txtFile}':
fontcolor=black:
fontsize=${fontSize}:
line_spacing=12:
x=(w-text_w)/2:
y=(h-text_h)/2`,

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
          new Error('FFmpeg falló')
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

/* ───── OBTENER TEXTO REPLY ───── */
function getQuotedText(m) {

  const ctx =
    m.message?.extendedTextMessage?.contextInfo

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
  args,
  sender,
  isGroup
}) => {

  /* 🔒 MODODADMIN */
  const modoadminPath =
    './data/modoadmin.json'

  if (
    fs.existsSync(modoadminPath)
  ) {

    try {

      const data =
        JSON.parse(
          fs.readFileSync(
            modoadminPath
          )
        )

      if (
        data[from]?.enabled &&
        isGroup
      ) {

        const metadata =
          await sock.groupMetadata(from)

        const participants =
          metadata.participants || []

        const user =
          participants.find(
            p => p.id === sender
          )

        const isAdmin =
          user?.admin === 'admin' ||
          user?.admin === 'superadmin'

        if (!isAdmin) return
      }

    } catch {}
  }

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
.brat hola`
    },{
      quoted:m
    })
  }

  await sock.sendMessage(from,{
    react:{
      text:'🎨',
      key:m.key
    }
  })

  try {

    const sticker =
      await createSticker(text)

    await sock.sendMessage(from,{
      sticker
    },{
      quoted:m
    })

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
      text:'❌ Error al generar sticker'
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