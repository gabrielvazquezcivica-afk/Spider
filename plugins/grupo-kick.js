const handler = async ({ sock, m, from, pushName }) => {

  // 🚫 evitar mensajes del bot
  if (m.key.fromMe) return

  // 🚫 solo grupos
  if (!from.endsWith('@g.us')) {
    return sock.sendMessage(from, {
      text: '⚠️ Este comando solo funciona en grupos'
    }, { quoted: m })
  }

  // 📊 metadata
  let metadata
  try {
    metadata = await sock.groupMetadata(from)
  } catch {
    return sock.sendMessage(from, {
      text: '❌ Error obteniendo datos del grupo'
    }, { quoted: m })
  }

  const participants = metadata.participants || []

  // 👤 usuario
  const sender = (m.key.participant || m.key.remoteJid)
    ?.split(':')[0]

  // 👑 validar admin usuario
  const isAdmin = participants.some(p =>
    p.id.split(':')[0] === sender &&
    (p.admin === 'admin' || p.admin === 'superadmin')
  )

  if (!isAdmin) {
    return sock.sendMessage(from, {
      text: '🕷️ Solo los administradores pueden usar este comando.'
    }, { quoted: m })
  }

  // 🤖 validar admin bot
  const botId =
    sock.user.id.split(':')[0] + '@s.whatsapp.net'

  const botData = participants.find(p =>
    p.id === botId
  )

  const isBotAdmin =
    botData?.admin === 'admin' ||
    botData?.admin === 'superadmin'

  if (!isBotAdmin) {
    return sock.sendMessage(from, {
      text: '⚠️ El bot necesita ser administrador.'
    }, { quoted: m })
  }

  // 🎯 usuario mencionado
  const mentioned =
    m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]

  if (!mentioned) {
    return sock.sendMessage(from, {
      text: '⚠️ Menciona al usuario.\n\nEjemplo:\n.kick @usuario'
    }, { quoted: m })
  }

  // 🚫 evitar kick al owner
  const target = participants.find(p => p.id === mentioned)

  if (target?.admin === 'superadmin') {
    return sock.sendMessage(from, {
      text: '❌ No puedo expulsar al creador del grupo.'
    }, { quoted: m })
  }

  // ⚡ reacción
  await sock.sendMessage(from, {
    react: { text: '☠️', key: m.key }
  })

  try {

    // 👢 expulsar
    await sock.groupParticipantsUpdate(
      from,
      [mentioned],
      'remove'
    )

    // 📤 mensaje
    await sock.sendMessage(from, {
      text:
`╭─〔 ☠️ SPIDER KICK 〕
│
│ Enemigo eliminado
│ @${mentioned.split('@')[0]}
│
│ > Por: ${pushName}
╰────────────⬣

> SPIDER BOT`,
      mentions: [mentioned]
    }, { quoted: m })

  } catch (e) {

    console.log(e)

    return sock.sendMessage(from, {
      text: '❌ No pude expulsar al usuario.'
    }, { quoted: m })
  }
}

handler.command = ['kick']
handler.tags = ['grupo']
handler.menu = true
handler.group = true

export default handler
