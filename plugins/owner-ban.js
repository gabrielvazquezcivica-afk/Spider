import fs from 'fs'
import config from '../config.js'

const banPath = './data/banned.json'

/* 📂 DB */
function getDB() {

  try {

    if (!fs.existsSync(banPath))
      return {}

    return JSON.parse(
      fs.readFileSync(
        banPath,
        'utf-8'
      )
    )

  } catch {

    return {}
  }
}

function saveDB(db) {

  fs.writeFileSync(
    banPath,
    JSON.stringify(
      db,
      null,
      2
    )
  )
}

const handler = async ({
  sock,
  m,
  from,
  sender,
  isGroup
}) => {

  // 🚫 evitar mensajes del bot
  if (m.key.fromMe) return

  // 👑 validar owner por LID
  const senderLid =
    sender.split('@')[0]

  const isOwner =
    config.ownerLid.includes(
      senderLid
    )

  if (!isOwner) {

    return sock.sendMessage(from,{
      text:'🕷️ Solo el owner puede usar este comando.'
    },{ quoted:m })
  }

  /* 👤 OBJETIVO */
  const ctx =
    m.message?.extendedTextMessage?.contextInfo

  const userRaw =
    ctx?.mentionedJid?.[0] ||
    ctx?.participant

  if (!userRaw) {

    return sock.sendMessage(from,{
      text:
`⚠️ Menciona o responde al usuario

Ejemplo:
.ban @usuario`
    },{ quoted:m })
  }

  /* 🚫 EVITAR OWNER */
  const targetLid =
    userRaw.split('@')[0]

  if (
    config.ownerLid.includes(
      targetLid
    )
  ) {

    return sock.sendMessage(from,{
      text:'❌ No puedes banear a un owner.'
    },{ quoted:m })
  }

  const db = getDB()

  /* 🚫 YA BANEADO */
  if (db[userRaw]) {

    return sock.sendMessage(from,{
      text:
`⚠️ @${targetLid} ya está baneado.`,
      mentions:[userRaw]
    },{ quoted:m })
  }

  /* ⚡ REACCIÓN */
  await sock.sendMessage(from,{
    react:{
      text:'🚫',
      key:m.key
    }
  })

  /* 💾 GUARDAR */
  db[userRaw] = {
    banned:true,
    by:sender,
    time:Date.now()
  }

  saveDB(db)

  /* 📩 MENSAJE */
  await sock.sendMessage(from,{
    text:
`╭━━━〔 🚫 BAN 〕━━━⬣
┃
┃ 👤 Usuario baneado
┃ 🚫 Acceso denegado
┃
┃ 🆔 @${targetLid}
┃
╰━━━━━━━━━━━━⬣

> SPIDER BOT`,
    mentions:[userRaw]
  },{ quoted:m })
}

handler.command = ['ban']
handler.tags = ['owner']
handler.menu = true

export default handler