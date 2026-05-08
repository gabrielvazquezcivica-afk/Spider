import config from '../config.js'

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

  // 📊 metadata
  let metadata
  try {
    metadata = await sock.groupMetadata(from)
  } catch {
    return sock.sendMessage(from, {
      text: '❌ No pude obtener la información del grupo.'
    }, { quoted: m })
  }

  const participants = metadata.participants || []

  // 👤 usuario limpio
  const senderNum = onlyNumber(sender)

  // 👑 ADMIN REAL
  const userData = participants.find(p =>
    onlyNumber(p.id) === senderNum
  )

  const isAdmin =
    userData?.admin === 'admin' ||
    userData?.admin === 'superadmin'

  if (!isAdmin) {
    return sock.sendMessage(from, {
      text: '🕷️ Solo los administradores pueden usar este comando.'
    }, { quoted: m })
  }

  // 👤 usuario mencionado
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
  const owners = (config.owner || []).map(n =>
    onlyNumber(n)
  )

  if (owners.includes(userNum)) {
    return sock.sendMessage(from, {
      text: '❌ Ese usuario está protegido.'
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

    // 📩 mensaje
    await sock.sendMessage(from, {
      text:
`╭━━━〔 🕷️ SPIDER SYSTEM 〕━━━⬣
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
handler.menu = true

export default handler
