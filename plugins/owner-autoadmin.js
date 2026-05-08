import config from '../config.js'

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

  // 👑 validar owner por LID
  const senderLid = sender.split('@')[0]

  const isOwner = config.ownerLid.includes(senderLid)

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
      text: '❌ Error obteniendo grupo.'
    }, { quoted: m })
  }

  const participants = metadata.participants || []

  // 👑 buscar usuario
  const userData = participants.find(p => p.id === sender)

  // 👑 ya admin
  const alreadyAdmin =
    userData?.admin === 'admin' ||
    userData?.admin === 'superadmin'

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

    // 👑 promote
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
┃ 🕷️ Owner promovido
┃ ⚡ Acceso concedido
┃ 👤 ${pushName}
┃
╰━━━━━━━━━━━━━━━━⬣

> SPIDER BOT`
    }, { quoted: m })

  } catch (e) {

    console.log('❌ ERROR AUTOADMIN:', e)

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
