import config from '../config.js'

const handler = async ({
  sock,
  m,
  from,
  sender,
  isGroup,
  participants
}) => {

  // 🚫 ignorar mensajes del bot
  if (m.key.fromMe) return

  // ❌ solo grupos
  if (!isGroup) {
    return sock.sendMessage(from, {
      text: '⚠️ Este comando solo funciona en grupos.'
    }, { quoted: m })
  }

  // 👑 validar owner
  const senderLid = sender.split('@')[0]

  const isOwner =
    config.ownerLid.includes(senderLid)

  if (!isOwner) {
    return sock.sendMessage(from, {
      text: '🕷️ Solo el owner puede usar este comando.'
    }, { quoted: m })
  }

  await sock.sendMessage(from, {
    react: {
      text: '☠️',
      key: m.key
    }
  })

  const botId =
    sock.user.id.includes(':')
      ? sock.user.id.split(':')[0] + '@s.whatsapp.net'
      : sock.user.id

  const ownerIds =
    config.ownerLid.map(
      num => num + '@s.whatsapp.net'
    )

  const toKick = participants
    .filter(p => {
      if (p.id === botId) return false
      if (ownerIds.includes(p.id)) return false
      return true
    })
    .map(p => p.id)

  if (!toKick.length) {
    return sock.sendMessage(from, {
      text: '⚠️ No hay usuarios para expulsar.'
    }, { quoted: m })
  }

  await sock.sendMessage(from, {
    text:
`╭━━━〔 ☠️ KICKALL 〕━━━⬣
┃
┃ 🕷️ Limpieza iniciada...
┃ 👑 Ejecutado por:
┃ @${senderLid}
┃
┃ Usuarios a expulsar:
┃ ${toKick.length}
┃
╰━━━━━━━━━━━━━━━━⬣`,
    mentions: [sender]
  }, { quoted: m })

  let kicked = 0

  for (const user of toKick) {
    try {
      await sock.groupParticipantsUpdate(
        from,
        [user],
        'remove'
      )
      kicked++
    } catch (e) {
      console.log(
        'KICK ERROR:',
        user,
        e
      )
    }
  }

  await sock.sendMessage(from, {
    text:
`✅ Limpieza terminada

Expulsados: ${kicked}`
  })
}

handler.command = ['low']
handler.tags = ['owner']
handler.group = true
handler.menu = false

export default handler