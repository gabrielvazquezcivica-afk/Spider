const handler = async ({ sock, m, from }) => {

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
  const sender = m.key.participant || m.key.remoteJid

  // 👑 validar admin
  const isAdmin = participants.some(p =>
    p.id === sender &&
    (p.admin === 'admin' || p.admin === 'superadmin')
  )

  if (!isAdmin) {
    return sock.sendMessage(from, {
      text: '🕷️ Solo los administradores pueden usar este comando.'
    }, { quoted: m })
  }

  // ⚡ reacción
  await sock.sendMessage(from, {
    react: { text: '🔗', key: m.key }
  })

  try {

    // 🔗 link grupo
    const code = await sock.groupInviteCode(from)
    const link = `https://chat.whatsapp.com/${code}`

    // 🖼️ foto grupo
    let groupPic

    try {
      groupPic = await sock.profilePictureUrl(from, 'image')
    } catch {
      groupPic = 'https://i.postimg.cc/0QNxYz4V/spider.jpg'
    }

    const text =
`╭━━━〔 🕷️ LINK DEL GRUPO 〕━━━⬣
┃ 🔗 ${link}
╰━━━━━━━━━━━━━━━━⬣

> SPIDER BOT`

    // 📤 enviar
    await sock.sendMessage(from, {
      image: { url: groupPic },
      caption: text
    }, { quoted: m })

  } catch (e) {

    console.log(e)

    return sock.sendMessage(from, {
      text: '❌ No pude obtener el enlace del grupo'
    }, { quoted: m })
  }
}

handler.command = ['link']
handler.tags = ['grupo']
handler.menu = true
handler.group = true
handler.admin = true

export default handler
