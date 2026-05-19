import fs from 'fs'
import path from 'path'
import os from 'os'
import axios from 'axios'
import { spawn } from 'child_process'

/* ───── PNG → WEBP ───── */
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
      '-q:v', '80',
      '-preset', 'picture',
      '-loop', '0',
      '-an',
      '-vsync', '0',
      '-y',

      tmpOut
    ])

    ff.on('close', code => {

      if (code === 0)
        resolve()
      else
        reject(
          new Error('FFmpeg falló')
        )
    })

    ff.on('error', reject)
  })

  const result = fs.readFileSync(tmpOut)

  try { fs.unlinkSync(tmpIn) } catch {}
  try { fs.unlinkSync(tmpOut) } catch {}

  return result
}

/* ───── COMANDO ───── */
const handler = async ({
  sock,
  m,
  from,
  args,
  sender,
  participants
}) => {

  /* 🔒 MODODADMIN */
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

  if (isBlockedGroup && !isAdmin)
    return

  /* 📄 TEXTO */
  const text = args.join(' ').trim()

  if (!text) {

    return sock.sendMessage(from,{
      text:
`🕷️ Uso correcto:
.brat Hola mundo`
    },{ quoted:m })
  }

  /* ⚡ REACCIÓN */
  await sock.sendMessage(from,{
    react:{
      text:'🎨',
      key:m.key
    }
  })

  try {

    /* 🔥 API */
    const api =
`https://kepolu-brat.hf.space/brat?q=${encodeURIComponent(text)}`

    const res = await axios.get(api,{
      responseType:'arraybuffer'
    })

    if (!res.data)
      throw new Error('Sin imagen')

    /* 🖼️ CREAR STICKER */
    const stickerBuffer =
      await createSticker(res.data)

    /* 📤 ENVIAR */
    await sock.sendMessage(from,{
      sticker: stickerBuffer
    },{ quoted:m })

    /* ✅ */
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
      text:'❌ Error al crear el sticker brat'
    },{ quoted:m })

    await sock.sendMessage(from,{
      react:{
        text:'❌',
        key:m.key
      }
    })
  }
}

handler.command = ['brat']
handler.tags = ['stickers']
handler.help = ['brat <texto>']
handler.menu = true
handler.group = true

export default handler