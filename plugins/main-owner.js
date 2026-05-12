import config from '../config.js'

// ───── QUOTED PRO ─────
const sistema = async (sock, from, titulo = 'Spider Bot 🕷️') => {

  let nombreGrupo = 'Chat'
  let thumbnail = null

  try {

    if (from.endsWith('@g.us')) {

      const metadata =
        await sock.groupMetadata(from)

      nombreGrupo =
        metadata.subject || 'Grupo'

      try {

        const pp =
          await sock.profilePictureUrl(
            from,
            'image'
          )

        const res = await fetch(pp)

        const buffer =
          await res.arrayBuffer()

        thumbnail =
          Buffer.from(buffer)

      } catch {}
    }

  } catch {}

  return {
    key: {
      fromMe: false,
      participant: '0@s.whatsapp.net',
      remoteJid: 'status@broadcast'
    },
    message: {
      extendedTextMessage: {
        text: titulo,
        title: 'Spider Bot',
        description: nombreGrupo,
        jpegThumbnail: thumbnail,
        previewType: 0
      }
    }
  }
}

const handler = async ({
  sock,
  m,
  from
}) => {

  // 📞 owners
  const owners =
    config.owner || []

  if (!owners.length) {

    return sock.sendMessage(from, {
      text: '❌ No hay owners configurados'
    }, { quoted: m })
  }

  // ⚡ reacción
  await sock.sendMessage(from, {
    react: {
      text: '👑',
      key: m.key
    }
  })

  // 📝 texto
  let text =
`╭━━━〔 👑 OWNERS 〕━━━⬣
┃
┃ 🕷️ Contactos oficiales
┃ ⚡ Spider Bot
┃`

  for (const owner of owners) {

    const number =
      owner.split('@')[0]

    text += `┃ 👤 wa.me/${number}\n`
  }

  text += `╰━━━━━━━━━━━━━━━━⬣`

  // 👥 mentions
  const mentions =
    owners.map(o =>
      o.includes('@')
        ? o
        : `${o}@s.whatsapp.net`
    )

  // 📩 enviar
  await sock.sendMessage(from, {
    text,
    mentions
  }, {
    quoted: await sistema(
      sock,
      from,
      '👑 OWNER MENU'
    )
  })
}

handler.command = ['owner']
handler.tags = ['informacion']
handler.menu = true

export default handler
