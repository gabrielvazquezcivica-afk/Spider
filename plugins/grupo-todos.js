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

  const participants = metadata.participants
  const sender = m.key.participant || m.key.remoteJid

  // 🔥 MISMA LÓGICA QUE TU .n
  const isAdmin = participants.some(p =>
    p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin')
  )

  if (!isAdmin) {
    return sock.sendMessage(from, {
      text: '⚠️ Solo administradores pueden usar este comando'
    }, { quoted: m })
  }

  const mentions = participants.map(p => p.id)
  const groupName = metadata.subject
  const total = participants.length

  const mentionText = participants
    .map((p, i) => `┃ 🕷️ ${i + 1}. @${p.id.split('@')[0]}`)
    .join('\n')

  await sock.sendMessage(from, {
    react: { text: '🕸️', key: m.key }
  })

  const text =
`╭━━━〔 🕷️ SPIDER SYSTEM 〕━━━⬣
┃
┃ 📡 INVOCANDO MIEMBROS
┃ 🏷️ Grupo: ${groupName}
┃ 👥 Total: ${total}
┃
╰━━━━━━━━━━━━━━━━⬣

╭━━━〔 👥 USUARIOS 〕━━━⬣
${mentionText}
╰━━━━━━━━━━━━━━━━⬣

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
