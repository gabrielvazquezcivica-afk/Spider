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

    // 🔥 si la palabra sola excede
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

    // 🔥 si ya no cabe
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

  // 🔥 líneas acomodadas
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

    // 🚫 quitar spam consola
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

/* ───── COMANDO ───── */
const handler = async ({
  sock,
  m,
  from,
  args
}) => {

  const text =
    args.join(' ').trim()

  if (!text) {

    return sock.sendMessage(from,{
      text:
`❌ Escribe un texto

Ejemplo:
.brat ya te vimos cállate`
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

    // ✅ reacción final
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