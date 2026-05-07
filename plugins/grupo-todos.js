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

  // 🔥 FIX REAL (más estable que el tuyo)
  const sender = m.key.participant || m.key.remoteJid

  // 👑 validación robusta
  const isAdmin = participants.find(p =>
    (p.id === sender || p.id === sender.replace(/:[0-9]+/, '')) &&
    (p.admin === 'admin' || p.admin === 'superadmin')
  )

  if (!isAdmin) {
    return sock.sendMessage(from, {
      text: '🕷️ Solo los administradores pueden usar este comando.'
    }, { quoted: m })
  }

  const groupName = metadata.subject
  const total = participants.length

  const mentions = participants.map(p => p.id)

  const mentionText = participants
    .map(p => `🕷️ @${p.id.split('@')[0]}`)
    .join('\n')

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
