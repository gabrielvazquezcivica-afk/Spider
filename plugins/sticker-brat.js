import fs from 'fs'
import path from 'path'
import os from 'os'
import { spawn } from 'child_process'

async function createSticker(text) {

  const output = path.join(
    os.tmpdir(),
    `brat_${Date.now()}.webp`
  )

  await new Promise((resolve,reject)=>{

    const ff = spawn('ffmpeg',[

      '-f','lavfi',
      '-i','color=c=white:s=512x512',

      '-vf',
      `drawtext=text='${text
        .replace(/:/g,'\\:')
        .replace(/'/g,"\\'")
      }':fontcolor=black:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2`,

      '-vcodec','libwebp',
      '-lossless','1',
      '-qscale','1',
      '-preset','picture',
      '-loop','0',
      '-an',
      '-vsync','0',
      '-y',

      output
    ])

    ff.on(
      'close',
      code => {

        if(code === 0)
          resolve()

        else
          reject(
            new Error(
              'FFmpeg fallo'
            )
          )
      }
    )

    ff.on(
      'error',
      reject
    )
  })

  const buffer =
    fs.readFileSync(output)

  try {
    fs.unlinkSync(output)
  } catch {}

  return buffer
}

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
.brat ya te vimos`
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
    },{ quoted:m })

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
    },{ quoted:m })
  }
}

handler.command = ['brat']
handler.tags = ['stickers']
handler.help = ['brat <texto>']
handler.menu = true

export default handler