import fs from 'fs'
import path from 'path'
import os from 'os'
import { spawn } from 'child_process'

/* ───── ACOMODAR TEXTO ESTILO MEME ───── */
function wrapText(text, maxChars = 18) {

  const words = text.split(/\s+/)
  const lines = []

  let line = ''

  for (const word of words) {

    if (word.length > maxChars) {

      if (line.trim()) {
        lines.push(line.trim())
        line = ''
      }

      for (
        let i = 0;
        i < word.length;
        i += maxChars
      ) {

        lines.push(
          word.slice(i, i + maxChars)
        )
      }

      continue
    }

    if (
      (line + ' ' + word)
        .trim()
        .length > maxChars
    ) {

      lines.push(line.trim())
      line = word

    } else {

      line += ' ' + word
    }
  }

  if (line.trim())
    lines.push(line.trim())

  return lines
}

/* ───── TAMAÑO DINÁMICO ───── */
function getFontSize(linesCount) {

  if (linesCount <= 3) return 54
  if (linesCount <= 5) return 46
  if (linesCount <= 7) return 40
  if (linesCount <= 10) return 34

  return 28
}

/* ───── CREAR STICKER ───── */
async function createSticker(text) {

  const output = path.join(
    os.tmpdir(),
    `brat_${Date.now()}.webp`
  )

  const txtFile = path.join(
    os.tmpdir(),
    `brat_${Date.now()}.txt`
  )

  const lines =
    wrapText(text)

  const formatted =
    lines.join('\n')

  const fontSize =
    getFontSize(lines.length)

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
fontfile=/system/fonts/Roboto-Bold.ttf:
textfile='${txtFile}':
fontcolor=black:
fontsize=${fontSize}:
line_spacing=12:
x=(w-text_w)/2:
y=(h-text_h)/2:
borderw=1`,

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
            'FFmpeg fallo'
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

/* ───── OBTENER TEXTO ───── */
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
  args
}) => {

  // 🔥 prioridad:
  // texto escrito > reply

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
`❌ Escribe o responde un mensaje

Ejemplo:
.brat hola

O responde un texto con:
.brat`
    },{
      quoted:m
    })
  }

  // 🎨 reacción
  await sock.sendMessage(from,{
    react:{
      text:'🎨',
      key:m.key
    }
  })

  try {

    const sticker =
      await createSticker(text)

    // 📤 enviar sticker
    await sock.sendMessage(from,{
      sticker
    },{
      quoted:m
    })

    // ✅ reacción
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