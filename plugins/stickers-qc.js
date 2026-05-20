import fs from 'fs'
import path from 'path'
import os from 'os'
import axios from 'axios'
import { spawn } from 'child_process'

/* ───── PNG → STICKER ───── */
async function createSticker(buffer) {

  const tmpIn = path.join(
    os.tmpdir(),
    `${Date.now()}.png`
  )

  const tmpOut = path.join(
    os.tmpdir(),
    `${Date.now()}.webp`
  )

  fs.writeFileSync(tmpIn, buffer)

  await new Promise((resolve, reject) => {

    const ff = spawn('ffmpeg', [

      '-i', tmpIn,

      '-vcodec', 'libwebp',

      '-vf',
      'scale=512:512:force_original_aspect_ratio=decrease,fps=15',

      '-lossless', '1',
      '-loop', '0',
      '-preset', 'default',
      '-an',
      '-vsync', '0',
      '-y',

      tmpOut
    ])

    // 🔇 evitar spam consola
    ff.stderr.on('data',()=>{})

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

/* ───── COMANDO QC ───── */
const handler = async ({
  sock,
  m,
  from,
  args,
  isGroup,
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

  const user =
    participants?.find(
      p => p.id === sender
    )

  const isAdmin =
    user?.admin === 'admin' ||
    user?.admin === 'superadmin'

  // 🔥 silencioso
  if (
    isBlockedGroup &&
    !isAdmin
  ) return

  /* 📝 TEXTO */
  let text =
    args.join(' ').trim()

  // 📩 responder mensaje
  if (
    !text &&
    (
      m.message?.extendedTextMessage
        ?.contextInfo
        ?.quotedMessage
    )
  ) {

    const quoted =
      m.message.extendedTextMessage
        .contextInfo
        .quotedMessage

    text =
      quoted?.conversation ||
      quoted?.extendedTextMessage?.text ||
      quoted?.imageMessage?.caption ||
      quoted?.videoMessage?.caption ||
      ''
  }

  if (!text) {

    return sock.sendMessage(from,{
      text:
`❌ Escribe un texto

Ejemplo:
.qc hola mundo`
    },{ quoted:m })
  }

  // 🔥 límite
  if (text.length > 200) {

    return sock.sendMessage(from,{
      text:
'❌ Máximo 200 caracteres'
    },{ quoted:m })
  }

  /* 👤 NOMBRE */
  const name =
    m.pushName ||
    sender.split('@')[0]

  /* 🖼️ FOTO */
  const avatar =
    await sock.profilePictureUrl(
      sender,
      'image'
    ).catch(()=>
      'https://i.imgur.com/JP2jKzD.png'
    )

  // 🎨 reacción
  await sock.sendMessage(from,{
    react:{
      text:'🖌️',
      key:m.key
    }
  })

  try {

    /* 🔥 API QC */
    const body = {

      type:'quote',

      format:'png',

      backgroundColor:'#1b1429',

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

      throw new Error(
        'API inválida'
      )
    }

    /* 🖼️ buffer */
    const buffer =
      Buffer.from(
        res.data.result.image,
        'base64'
      )

    /* 🕷️ sticker */
    const sticker =
      await createSticker(
        buffer
      )

    /* 📤 enviar */
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
      'QC ERROR:',
      e
    )

    await sock.sendMessage(from,{
      text:
      '❌ Error al generar QC'
    },{
      quoted:m
    })
  }
}

handler.command = ['qc']
handler.tags = ['stickers']
handler.help = ['qc <texto>']
handler.menu = true

export default handler