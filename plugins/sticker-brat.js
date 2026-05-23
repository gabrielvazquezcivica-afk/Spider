import fs from 'fs'
import axios from 'axios'
import { sticker } from '../lib/sticker.js'

/* ───── DELAY ───── */
const delay = ms =>
  new Promise(resolve =>
    setTimeout(resolve, ms)
  )

/* ───── MODODADMIN ───── */
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

/* ───── API BRAT ───── */
async function fetchSticker(
  text,
  attempt = 1
) {

  try {

    const res =
      await axios.get(
        'https://kepolu-brat.hf.space/brat',
        {
          params:{ q:text },
          responseType:'arraybuffer'
        }
      )

    return res.data

  } catch(e) {

    if (
      e.response?.status === 429 &&
      attempt <= 3
    ) {

      const retry =
        Number(
          e.response.headers[
            'retry-after'
          ]
        ) || 5

      await delay(
        retry * 1000
      )

      return fetchSticker(
        text,
        attempt + 1
      )
    }

    throw e
  }
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
    db[from]

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

  /* 🔥 TEXO */
  let text =
    args.join(' ').trim()

  if (!text) {

    const quoted =
      getQuotedText(m)

    if (quoted)
      text = quoted
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

    /* 📥 IMG API */
    const buffer =
      await fetchSticker(text)

    /* 🖼️ STICKER */
    const stiker =
      await sticker(
        buffer,
        false,
        'Spider Bot',
        'SoyGabo'
      )

    if (!stiker)
      throw new Error(
        'No se pudo crear'
      )

    /* 📤 ENVIAR */
    await sock.sendMessage(
      from,
      {
        sticker: stiker
      },
      {
        quoted:m
      }
    )

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

export default handler