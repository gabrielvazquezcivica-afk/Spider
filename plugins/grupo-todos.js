const handler = async ({ sock, m, from }) => {

  if (!from.endsWith('@g.us')) {
    return sock.sendMessage(from, {
      text: '⚠️ Este comando solo funciona en grupos.'
    }, { quoted: m })
  }

  let metadata

  try {
    metadata = await sock.groupMetadata(from)
  } catch {
    return sock.sendMessage(from, {
      text: '❌ No pude obtener la información del grupo.'
    }, { quoted: m })
  }

  const participants = metadata.participants
  const sender = m.key.participant || m.key.remoteJid

  const isAdmin = participants.some(
    p =>
      p.id === sender &&
      (
        p.admin === 'admin' ||
        p.admin === 'superadmin'
      )
  )

  if (!isAdmin) {
    return sock.sendMessage(from, {
      text: '🚫 Solo los administradores pueden usar este comando.'
    }, { quoted: m })
  }

  const mentions =
    participants.map(p => p.id)

  const groupName =
    metadata.subject

  const total =
    participants.length

  await sock.sendMessage(from, {
    react: {
      text: '🕸️',
      key: m.key
    }
  })

  const mentionText =
  participants
    .map(
      p =>
      `➥ @${p.id.split('@')[0]}`
    )
    .join('\n')

  const text =
`📢 ÚNETE AL CANAL OFICIAL DE SPIDER BOT

🔗 https://whatsapp.com/channel/0029Vb8a4lI2ZjCx2SSlfn2r

> 📡 ${groupName}
> 👥 ${total} miembros

╭━━━ 𝐀𝐓𝐄𝐍𝐂𝐈𝐎𝐍 ━━━⬣
${mentionText}
╰━━━━━━━━━━━━━━━━⬣

> 𝐁𝐘 𝐒𝐎𝐘𝐆𝐀𝐁𝐎 `

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