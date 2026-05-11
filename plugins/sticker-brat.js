import fs from 'fs'
import path from 'path'
import os from 'os'
import axios from 'axios'
import { spawn } from 'child_process'

/* ───── PNG → STICKER ───── */
async function createSticker(buffer) {

  const tmpIn = path.join(
    os.tmpdir(),
    `brat_${Date.now()}.png`
  )

  const tmpOut = path.join(
    os.tmpdir(),
    `brat_${Date.now()}.webp`
  )

  fs.writeFileSync(tmpIn, buffer)

  await new Promise((resolve, reject) => {

    const ff = spawn('ffmpeg', [

      '-i', tmpIn,

      '-vf',
      'scale=512:512:force_original_aspect_ratio=decrease,' +
      'pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white',

      '-vcodec', 'libwebp',
      '-lossless', '1',
      '-qscale', '1',
      '-preset', 'picture',
      '-loop', '0',
      '-an',
      '-vsync', '0',
      '-y',

      tmpOut
    ])

    ff.stderr.on('data', () => {})

    ff.on(
      'close',
      code => {

        if (code === 0)
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

  const result = fs.readFileSync(tmpOut)

  try {
    fs.unlinkSync(tmpIn)
  } catch {}

  try {
    fs.unlinkSync(tmpOut)
  } catch {}

  return result
}

/* ───── COMANDO ───── */
const handler = async ({
  sock,
  m,
  from,
  args,
  isGroup,
  sender,
  participants
}) => {

  // 🔒 MODODADMIN
  let isBlockedGroup = false

  try {

    const db = JSON.parse(
      fs.readFileSync(
        './data/modoadmin.json'
      )
    )

    isBlockedGroup = db[from]

  } catch {}

  const user = participants?.find(
    p => p.id === sender
  )

  const isAdmin =
    user?.admin === 'admin' ||
    user?.admin === 'superadmin'

  // 🔥 silencioso
  if (isBlockedGroup && !isAdmin) return

  const text = args.join(' ').trim()

  if (!text) {

    return sock.sendMessage(from,{
      text:
`❌ Escribe un texto

Ejemplo:
.brat Hola mundo`
    },{ quoted:m })
  }

  // 🎨 reacción
  await sock.sendMessage(from,{
    react:{
      text:'🎨',
      key:m.key
    }
  })

  try {

    // 🔥 API brat
    const res = await axios.get(
      'https://kepolu-brat.hf.space/brat',
      {
        params:{
          q:text
        },
        responseType:'arraybuffer'
      }
    )

    if (
      !res.data ||
      !res.data.byteLength
    ) {
      throw new Error(
        'Imagen vacía'
      )
    }

    // 🖼️ sticker
    const sticker =
      await createSticker(
        res.data
      )

    // 🕷️ enviar
    await sock.sendMessage(from,{
      sticker
    },{ quoted:m })

    // ✅ reacción
    await sock.sendMessage(from,{
      react:{
        text:'✅',
        key:m.key
      }
    })

  } catch (e) {

    console.log(
      'BRAT ERROR:',
      e
    )

    await sock.sendMessage(from,{
      text:'❌ Error al generar brat'
    },{ quoted:m })
  }
}

handler.command = ['brat']
handler.tags = ['stickers']
handler.help = ['brat <texto>']
handler.menu = true
handler.group = true

export default handler
