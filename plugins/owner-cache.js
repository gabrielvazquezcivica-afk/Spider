import fs from 'fs'
import config from '../config.js'

const handler = async ({
  sock,
  m,
  from,
  sender
}) => {

  // 🚫 evitar mensajes del bot
  if (m.key.fromMe) return

  // 👑 validar owner
  const senderLid =
    sender.split('@')[0]

  const isOwner =
    config.ownerLid.includes(
      senderLid
    )

  if (!isOwner) {

    return sock.sendMessage(from,{
      text:
'🕷️ Solo el owner puede usar este comando.'
    },{
      quoted:m
    })
  }

  /* ⚡ AVISO */
  const aviso =
    await sock.sendMessage(from,{
      text:
'🧹 Limpiando cache...'
    },{
      quoted:m
    })

  /* 🧹 LIMPIAR CACHE */
  global.groupCache = {}

  /* 🗑️ LIMPIAR TMP */
  try {

    const tmp =
      '/data/data/com.termux/files/usr/tmp'

    if (fs.existsSync(tmp)) {

      const files =
        fs.readdirSync(tmp)

      for (const file of files) {

        try {

          fs.unlinkSync(
            `${tmp}/${file}`
          )

        } catch {}
      }
    }

  } catch {}

  /* ⚡ GC */
  if (global.gc) {

    try {
      global.gc()
    } catch {}
  }

  /* ✅ FINAL */
  await sock.sendMessage(from,{
    text:
'✅ Cache limpiada correctamente.',
    edit:aviso.key
  })
}

handler.command = ['cache']
handler.tags = ['owner']
handler.menu = true

export default handler