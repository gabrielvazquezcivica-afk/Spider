import fs from 'fs'
import path from 'path'
import os from 'os'
import axios from 'axios'
import { spawn } from 'child_process'

// ───── PNG → STICKER ─────
async function createSticker(buffer) {

  const tmpIn = path.join(
    os.tmpdir(),
    `qc_${Date.now()}.png`
  )

  const tmpOut = path.join(
    os.tmpdir(),
    `qc_${Date.now()}.webp`
  )

  fs.writeFileSync(tmpIn, buffer)

  await new Promise((resolve, reject) => {

    const ff = spawn('ffmpeg', [

      '-i', tmpIn,

      '-vf',
      'scale=512:512:force_original_aspect_ratio=increase,crop=512:512',

      '-vcodec', 'libwebp',
      '-lossless', '1',
      '-q:v', '100',
      '-preset', 'picture',
      '-loop', '0',
      '-an',
      '-vsync', '0',
      '-y',

      tmpOut
    ])

    // 🚫 sin spam
    ff.stderr.on('data', () => {})

    ff.on(
      'close',
      code => {

        if (code === 0)
          resolve()

        else
          reject(
            new Error(
              'FFmpeg falló'
            )
          )
      }
    )

    ff.on(
      'error',
      reject
    )
  })

  const result =
    fs.readFileSync(tmpOut)

  try {
    fs.unlinkSync(tmpIn)
  } catch {}

  try {
    fs.unlinkSync(tmpOut)
  } catch {}

  return result
}

// ───── COMANDO QC ─────
export const handler = async (m, {
  sock,
  from,
  args,
  isGroup,
  sender,
  reply
}) => {

  /* ───── 🔒 MODO ADMIN SILENCIOSO ───── */
  let groupSettings = { enabled:false }

  const modoadminPath =
    './data/modoadmin.json'

  if (
    fs.existsSync(modoadminPath)
  ) {

    try {

      const modoadminData =
        JSON.parse(
          fs.readFileSync(
            modoadminPath
          )
        )

      groupSettings =
        modoadminData[from] ||
        { enabled:false }

    } catch {}
  }

  if (
    groupSettings.enabled &&
    isGroup
  ) {

    let isAdmin = false

    try {

      const metadata =
        await sock.groupMetadata(from)

      const participants =
        metadata.participants || []

      isAdmin = participants.some(
        p =>
          p.id === sender &&
          (
            p.admin === 'admin' ||
            p.admin === 'superadmin'
          )
      )

    } catch {}

    if (!isAdmin) return
  }

  /* ───── TEXTO ───── */
  let text =
    args.join(' ').trim()

  // 📌 responder mensaje
  if (
    !text &&
    m.quoted
  ) {

    text =
      m.quoted.text ||
      m.quoted.caption ||
      ''
  }

  if (!text) {

    return reply(
`❌ Escribe un texto

Ejemplo:
.qc hola spider

o responde un mensaje`
    )
  }

  // ✂️ limitar
  if (text.length > 300) {
    text = text.slice(0,300)
  }

  // 👤 nombre
  const name =
    m.pushName ||
    sender.split('@')[0]

  // 🖼️ foto
  let avatar

  try {

    avatar =
      await sock.profilePictureUrl(
        sender,
        'image'
      )

  } catch {

    avatar =
      'https://files.catbox.moe/7an4l5.png'
  }

  try {

    // 🎨 reacción
    await sock.sendMessage(from,{
      react:{
        text:'🖌️',
        key:m.key
      }
    })

    // ───── API QC ─────
    const body = {

      type:'quote',

      format:'png',

      backgroundColor:'#FFFFFF',

      width:512,

      height:768,

      scale:2,

      messages:[{

        avatar:true,

        from:{
          id:1,
          name,
          photo:{
            url:avatar
          }
        },

        text,

        replyMessage:{}
      }]
    }

    const res =
      await axios.post(
        'https://bot.lyo.su/quote/generate',
        body,
        {
          headers:{
            'Content-Type':
              'application/json'
          }
        }
      )

    if (
      !res.data?.result?.image
    ) {

      throw 'API inválida'
    }

    // 🖼️ buffer
    const imageBuffer =
      Buffer.from(
        res.data.result.image,
        'base64'
      )

    // 🕷️ sticker
    const sticker =
      await createSticker(
        imageBuffer
      )

    // 📤 enviar
    await sock.sendMessage(
      from,
      {
        sticker
      },
      {
        quoted:m
      }
    )

    // ✅ reacción
    await sock.sendMessage(from,{
      react:{
        text:'✅',
        key:m.key
      }
    })

  } catch(e) {

    console.log(
      'QC ERROR:',
      e
    )

    reply(
      '❌ Error al generar QC'
    )
  }
}

handler.command = ['qc']
handler.tags = ['stickers']
handler.help = ['qc <texto>']
handler.menu = true
handler.group = false

export default handler