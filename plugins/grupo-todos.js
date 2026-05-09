const handler = async ({ sock, m, from }) => {

  if (!from.endsWith('@g.us')) {
    return sock.sendMessage(from, {
      text: '┌─ ⚠️ ─┐\n│ Solo grupos │\n└───────┘'
    }, { quoted: m })
  }

  let metadata
  try {
    metadata = await sock.groupMetadata(from)
  } catch {
    return sock.sendMessage(from, {
      text: '┌─ ❌ ─┐\n│ Error grupo │\n└───────┘'
    }, { quoted: m })
  }

  const participants = metadata.participants
  const sender = m.key.participant || m.key.remoteJid

  // 🔥 
  const isAdmin = participants.some(p =>
    p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin')
  )

  if (!isAdmin) {
    return sock.sendMessage(from, {
      text: '┌─ 🚫 ─┐\n│ Solo admins │\n└───────┘'
    }, { quoted: m })
  }

  const mentions = participants.map(p => p.id)
  const groupName = metadata.subject
  const total = participants.length

  const mentionText = participants
    .map((p, i) => `• @${p.id.split('@')[0]}`)
    .join(' ')

  await sock.sendMessage(from, {
    react: { text: '🕸️', key: m.key }
  })

  const text =
`┌──────────────┐
│ 🕷️ INVITANDO A TODOS
├──────────────┤
│ 📡 ${groupName}
│ 👥 Total: ${total}
├──────────────┤
│ ${mentionText}
└──────────────┘

> 🕸️ SPIDER BOT`

  await sock.sendMessage(from, {
    text,
    mentions
  }, { quoted: m })
}

handler.command = ['todos']
handler.tags = ['grupo']
handler.menu = true
handler.group = true

export default handler
