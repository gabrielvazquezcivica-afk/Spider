const handler = async ({ sock, m, from }) => {

  // 🚫 solo grupos
  if (!from.endsWith('@g.us')) {
    return sock.sendMessage(from, {
      text: '⚠️ Este comando solo funciona en grupos'
    }, { quoted: m })
  }

  const sender = m.key.participant || m.key.remoteJid

  // 👑 SOLO OWNER (desde config.js)
  if (!global.config.owner.includes(sender)) {
    return sock.sendMessage(from, {
      text: '⛔ Solo el owner puede usar este comando'
    }, { quoted: m })
  }

  let metadata
  try {
    metadata = await sock.groupMetadata(from)
  } catch {
    return sock.sendMessage(from, {
      text: '❌ No se pudo obtener el grupo'
    }, { quoted: m })
  }

  const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net'

  // 🔥 verificar si el bot es admin
  const botIsAdmin = metadata.participants.find(p =>
    p.id === botId && (p.admin === 'admin' || p.admin === 'superadmin')
  )

  if (!botIsAdmin) {
    return sock.sendMessage(from, {
      text: '❌ Necesito ser admin para hacer esto'
    }, { quoted: m })
  }

  try {

    // 👑 promover al owner a admin
    await sock.groupParticipantsUpdate(
      from,
      [sender],
      'promote'
    )

    await sock.sendMessage(from, {
      text: `🕷️ AutoAdmin activado

👑 Owner promovido a administrador`
    }, { quoted: m })

  } catch (err) {
    console.log(err)
    await sock.sendMessage(from, {
      text: '❌ Error al promover usuario'
    }, { quoted: m })
  }
}

handler.command = ['autoadmin']
handler.tags = ['owner']
handler.owner = true
handler.group = true

export default handler
