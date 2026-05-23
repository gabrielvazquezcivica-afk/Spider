import fs from 'fs'
import axios from 'axios'

/* 📂 DB MODODADMIN */
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

/* ⏳ DELAY */
const delay = (ms) =>
  new Promise(resolve =>
    setTimeout(resolve, ms)
  )

/* 🎨 OBTENER IMAGEN BRAT */
const fetchSticker = async (
  text,
  attempt = 1
) => {

  try {

    const response =
      await axios.get(
        'https://kepolu-brat.hf.space/brat',
        {
          params: {
            q: text
          },
          responseType:
            'arraybuffer'
        }
      )

    return response.data

  } catch (error) {

    if (
      error.response?.status === 429 &&
      attempt <= 3
    ) {

      const retryAfter =
        error.response.headers[
          'retry-after'
        ] || 5

      await delay(
        retryAfter * 1000
      )

      return fetchSticker(
        text,
        attempt + 1
      )
    }

    throw error
  }
}

/* 💬 TEXTO RESPONDIDO */
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

    return sock.sendMessage(
      from,
      {
        text:
`❌ Escribe un texto

Ejemplo:
.brat hola

O responde un mensaje con:
.brat`
      },
      {
        quoted:m
      }
    )
  }

  /* 🎨 REACCIÓN */
  await sock.sendMessage(from,{
    react:{
      text:'🎨',
      key:m.key
    }
  })

  try {

    /* 🖼️ OBTENER IMAGEN */
    const buffer =
      await fetchSticker(text)

    /* 📤 ENVIAR STICKER */
    await sock.sendMessage(
      from,
      {
        sticker: buffer
      },
      {
        quoted:m
      }
    )

    /* ✅ REACCIÓN */
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

    await sock.sendMessage(
      from,
      {
        text:
'❌ Error al generar sticker'
      },
      {
        quoted:m
      }
    )
  }
}

handler.command = ['brat']
handler.tags = ['stickers']
handler.help = ['brat <texto>']
handler.menu = true

export default handler