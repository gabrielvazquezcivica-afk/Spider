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

  fs.writeFileSync(
    tmpIn,
    buffer
  )

  await new Promise((resolve,reject)=>{

    const ff = spawn('ffmpeg',[

      '-i', tmpIn,

      // 🔥 ESTE SÍ LO DEJA COMO EL ORIGINAL
      // blanco y negro SIN colores
      '-vf',
'format=gray,negate,scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white',

      '-vcodec','libwebp',
      '-lossless','1',
      '-loop','0',
      '-preset','picture',
      '-an',
      '-vsync','0',
      '-y',

      tmpOut
    ])

    ff.on(
      'close',
      code =>
        code === 0
          ? resolve()
          : reject(
              new Error(
                'FFmpeg fallo'
              )
            )
    )

    ff.on(
      'error',
      reject
    )
  })

  const result =
    fs.readFileSync(tmpOut)

  fs.unlinkSync(tmpIn)
  fs.unlinkSync(tmpOut)

  return result
}

/* ───── TEXTO RESPONDIDO ───── */
function getQuotedText(m) {

  const ctx =
    m.message?.extendedTextMessage
      ?.contextInfo

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

/* ───── DB MODODADMIN ───── */
function getDB() {

  try {

    const pathDB =
      './data/modoadmin.json'

    if (!fs.existsSync(pathDB))
      return {}

    return JSON.parse(
      fs.readFileSync(
        pathDB,
        'utf-8'
      )
    )

  } catch {

    return {}
  }
}

/* ───── COMANDO ───── */
const handler = async ({
  sock,
  m,
  from,
  sender,
  isGroup,
  participants,
  args
}) => {

  /* 🔒 MODODADMIN */
  const db = getDB()

  const isBlockedGroup =
    db[from]?.enabled

  if (
    isBlockedGroup &&
    isGroup
  ) {

    const user =
      participants?.find(
        p => p.id === sender
      )

    const isAdmin =
      user?.admin === 'admin' ||
      user?.admin === 'superadmin'

    if (!isAdmin) return
  }

  /* 🔥 TEXTO */
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
.brat hola

O responde un mensaje con:
.brat`
    },{
      quoted:m
    })
  }

  /* 🎨 REACCIÓN */
  await sock.sendMessage(from,{
    react:{
      text:'🎨',
      key:m.key
    }
  })

  try {

    /* 🔹 API BRAT */
    const res =
      await axios.get(
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
        'Respuesta vacía'
      )
    }

    /* 🔹 STICKER */
    const sticker =
      await createSticker(
        res.data
      )

    /* 📤 ENVIAR */
    await sock.sendMessage(from,{
      sticker
    },{
      quoted:m
    })

    /* ✅ */
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
      text:
'❌ Error al generar sticker'
    },{
      quoted:m
    })
  }
}

handler.command = ['brat']
handler.tags = ['stickers']
handler.help = ['brat <texto>']
handler.menu = true
handler.group = false

export default handler