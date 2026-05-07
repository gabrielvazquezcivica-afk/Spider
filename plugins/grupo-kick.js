function normalizeJid(u) {
  return typeof u === 'string' ? u : u?.id
}

function onlyNumber(jid = '') {
  return normalizeJid(jid)?.replace(/[^0-9]/g, '')
}

const handler = async ({
  sock,
  m,
  from,
  sender,
  isGroup,
  isAdmin,
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

  // 👑 solo admins
  if (!isAdmin) {
    return sock.sendMessage(from, {
      text: '🕷️ Solo los administradores pueden usar este comando.'
    }, { quoted: m })
  }

  // 📊 metadata
  let metadata
  try {
    metadata = await sock.groupMetadata(from)
  } catch {
    return sock.sendMessage(from, {
      text: '❌ No pude obtener la información del grupo.'
    }, { quoted: m })
  }

  // 🤖 verificar admin bot
  const botJid = sock.user?.id || ''
  const botNum = onlyNumber(botJid)

  const botData = metadata.participants.find(p =>
    onlyNumber(p.id) === botNum
  )

  const isBotAdmin =
    botData?.admin === 'admin' ||
    botData?.admin === 'superadmin'

  if (!isBotAdmin) {
    return sock.sendMessage(from, {
      text: '⚠️ Necesito ser administrador para expulsar usuarios.'
    }, { quoted: m })
  }

  // 👤 usuario
  const ctx = m.message?.extendedTextMessage?.contextInfo

  const userRaw =
    ctx?.mentionedJid?.[0] ||
    ctx?.participant

  if (!userRaw) {
    return sock.sendMessage(from, {
      text:
`⚠️ Debes mencionar al usuario.

Ejemplo:
.kick @usuario`
    }, { quoted: m })
  }

  const userNum = onlyNumber(userRaw)

  // 👑 owners protegidos
  const owners = (global.config.owner || []).map(n =>
    onlyNumber(n)
  )

  if (owners.includes(userNum)) {
    return sock.sendMessage(from, {
      text: '❌ Ese usuario está protegido.'
    }, { quoted: m })
  }

  // 🤖 evitar kick bot
  if (userNum === botNum) {
    return sock.sendMessage(from, {
      text: '⚠️ No puedo eliminarme.'
    }, { quoted: m })
  }

  // ⚡ reacción
  await sock.sendMessage(from, {
    react: { text: '🕸️', key: m.key }
  })

  try {

    // 👢 expulsar
    await sock.groupParticipantsUpdate(
      from,
      [normalizeJid(userRaw)],
      'remove'
    )

    // 📩 mensaje spider
    await sock.sendMessage(from, {
      text:
`╭━━━〔 🕷️ SPIDER KICK 〕━━━⬣
┃
┃ ☠️ Objetivo eliminado
┃ 👤 Usuario: @${userNum}
┃ 🕸️ por:
┃ ${pushName}
╰━━━━━━━━━━━━━━━━⬣

> SPIDER BOT`,
      mentions: [normalizeJid(userRaw)]
    }, { quoted: m })

  } catch (e) {

    console.log('❌ Error kick:', e)

    return sock.sendMessage(from, {
      text: '❌ No pude expulsar al usuario.'
    }, { quoted: m })
  }
}

handler.command = ['kick']
handler.tags = ['grupo']
handler.group = true
handler.admin = true
handler.menu = true

export default handler
