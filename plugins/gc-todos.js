const handler = async ({ sock, m, from }) => {

  if (!from.endsWith('@g.us')) {
    return sock.sendMessage(from, {
      text: '⚠️ Solo funciona en grupos'
    }, { quoted: m })
  }

  let metadata
  try {
    metadata = await sock.groupMetadata(from)
  } catch {
    return sock.sendMessage(from, {
      text: '❌ Error al obtener el grupo'
    }, { quoted: m })
  }

  const participants = metadata.participants || []
  const sender = m.key.participant || m.key.remoteJid

  // 👑 solo admins
  const isAdmin = participants.some(p =>
    p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin')
  )

  if (!isAdmin) {
    return sock.sendMessage(from, {
      text: '🕷️ Solo administradores pueden activar la red'
    }, { quoted: m })
  }

  const groupName = metadata.subject
  const total = participants.length

  const mentions = participants.map(p => p.id)

  // 🧠 emoji fijo para menciones
  const mentionText = participants
    .map(p => `🕷️ @${p.id.split('@')[0]}`)
    .join('\n')

  // 🕷️ reacción al comando
  await sock.sendMessage(from, {
    react: { text: '🕸️', key: m.key }
  })

  const text =
`🕷️━━━━━━━━━━━━━━━🕷️
      *SPIDER BROADCAST*
🕸️━━━━━━━━━━━━━━━🕸️

🏷️ Grupo: ${groupName}
👥 Miembros: ${total}

☠️ Red activada...

🕷️ MENCIONES:
${mentionText}

🕷️━━━━━━━━━━━━━━━🕷️`

  await sock.sendMessage(from, {
    text,
    mentions
  }, { quoted: m })
}

handler.command = ['todos']
handler.tags = ['grupo']
handler.menu = true
handler.group = true
handler.admin = true

export default handler
