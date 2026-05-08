function onlyNumber(jid = '') {
  return jid.replace(/[^0-9]/g, '')
}

const handler = async ({
  sock,
  m,
  from,
  sender,
  isGroup,
  pushName
}) => {

  // 🚫 evitar mensajes del bot
  if (m.key.fromMe) return

  // ❌ solo grupos
  if (!isGroup) {
    return sock.sendMessage(from, {
      text: '⚠️ Este comando solo funciona en grupos.'
    }, { quoted: m })
  }

  // 👑 OWNER REAL
  const senderNumber = onlyNumber(sender)

  const isOwner = global.config.owner.some(num =>
    senderNumber.endsWith(num)
  )

  if (!isOwner) {
    return sock.sendMessage(from, {
      text: '🕷️ Solo el owner puede usar este comando.'
    }, { quoted: m })
  }

  // 📊 metadata
  let metadata
  try {
    metadata = await sock.groupMetadata(from)
  } catch {
    return sock.sendMessage(from, {
      text: '❌ Error obteniendo datos del grupo.'
    }, { quoted: m })
  }

  const participants = metadata.participants || []

  // 🤖 BOT ADMIN
  const botNumber = onlyNumber(sock.user.id)

  const botData = participants.find(p =>
    onlyNumber(p.id) === botNumber
  )

  const isBotAdmin =
    botData?.admin === 'admin' ||
    botData?.admin === 'superadmin'

  if (!isBotAdmin) {
    return sock.sendMessage(from, {
      text: '⚠️ El bot necesita ser administrador.'
    }, { quoted: m })
  }

  // 👑 verificar si owner ya es admin
  const ownerData = participants.find(p =>
    onlyNumber(p.id) === senderNumber
  )

  const alreadyAdmin =
    ownerData?.admin === 'admin' ||
    ownerData?.admin === 'superadmin'

  if (alreadyAdmin) {
    return sock.sendMessage(from, {
      text: '⚠️ Ya eres administrador.'
    }, { quoted: m })
  }

  // ⚡ reacción
  await sock.sendMessage(from, {
    react: { text: '👑', key: m.key }
  })

  try {

    // 👑 dar admin
    await sock.groupParticipantsUpdate(
      from,
      [sender],
      'promote'
    )

    // 📩 mensaje
    await sock.sendMessage(from, {
      text:
`╭━━━〔 👑 AUTO ADMIN 〕━━━⬣
┃
┃ 🕷️ Acceso concedido
┃ ⚡ Owner promovido
┃ 👤 ${pushName}
┃
╰━━━━━━━━━━━━━━━━⬣

> SPIDER BOT`
    }, { quoted: m })

  } catch (e) {

    console.log(e)

    return sock.sendMessage(from, {
      text: '❌ No pude darte administrador.'
    }, { quoted: m })
  }
}

handler.command = ['autoadmin']
handler.tags = ['owner']
handler.group = true
handler.menu = true

export default handler
