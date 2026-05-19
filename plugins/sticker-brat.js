import fs from 'fs'
import path from 'path'
import os from 'os'
import { spawn } from 'child_process'

/* ───── ACOMODAR TEXTO ───── */
function wrapText(text, max = 10) {

  const words = text.split(' ')
  const lines = []

  let line = ''

  for (const word of words) {

    if (
      (line + word).length > max
    ) {

      lines.push(
        line.trim()
      )

      line = ''
    }

    line += word + ' '
  }

  if (line.trim())
    lines.push(line.trim())

  return lines.join('\n')
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
fontsize=60:
borderw=2:
bordercolor=black:
line_spacing=15:
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
    },{ quoted:m })
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