import fs from 'fs'
import path from 'path'
import os from 'os'
import { spawn } from 'child_process'

/* ───── ACOMODAR TEXTO ───── */
function wrapText(text, maxChars = 13) {

  const words = text.split(' ')
  const lines = []

  let current = ''

  for (const word of words) {

    // 🔥 palabra enorme
    if (word.length > maxChars) {

      if (current.trim()) {
        lines.push(current.trim())
        current = ''
      }

      for (let i = 0; i < word.length; i += maxChars) {
        lines.push(
          word.slice(i, i + maxChars)
        )
      }

      continue
    }

    // 🔥 acomodar líneas
    if (
      (current + ' ' + word)
        .trim()
        .length > maxChars
    ) {

      lines.push(current.trim())
      current = word

    } else {

      current += ' ' + word
    }
  }

  if (current.trim())
    lines.push(current.trim())

  return lines.join('\n')
}

/* ───── CALCULAR TAMAÑO ───── */
function getFontSize(linesCount) {

  if (linesCount <= 2) return 80
  if (linesCount <= 4) return 68
  if (linesCount <= 6) return 58
  if (linesCount <= 8) return 50

  return 42
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

  // 🔥 texto acomodado
  const formatted =
    wrapText(text)

  const linesCount =
    formatted.split('\n').length

  // 🔥 tamaño dinámico
  const fontSize =
    getFontSize(linesCount)

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
line_spacing=18:
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

    // 🚫 ocultar spam ffmpeg
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