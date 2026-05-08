import config from '../config.js'

const handler = async ({
  sock,
  m,
  from,
  sender,
  isGroup,
  pushName
}) => {

  // 🔍 DEBUG
  console.log('📌 SENDER RAW =>', sender)

  if (m.key.fromMe) return

  // ❌ solo grupos
  if (!isGroup) {
    return sock.sendMessage(from, {
      text: '⚠️ Este comando solo funciona en grupos.'
    }, { quoted: m })
  }

  // 👑 limpiar número
  const senderNumber = String(sender)
    .split('@')[0]
    .split(':')[0]
    .replace(/^521/, '')
    .replace(/^52/, '')

  console.log('📌 SENDER LIMPIO =>', senderNumber)
  console.log('📌 OWNERS =>', config.owner)

  // 👑 validar owner
  const isOwner = config.owner.some(num =>
    senderNumber === String(num)
  )

  console.log('📌 ES OWNER =>', isOwner)

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

  // 🤖 verificar admin bot
  const botNumber = String(sock.user.id)
    .split('@')[0]
    .split(':')[0]

  const botData = participants.find(p =>
    String(p.id).includes(botNumber)
  )

  const isBotAdmin =
    botData?.admin === 'admin' ||
    botData?.admin === 'superadmin'

  if (!isBotAdmin) {
    return sock.sendMessage(from, {
      text: '⚠️ El bot necesita ser administrador.'
    }, { quoted: m })
  }

  // 👑 owner ya admin
  const ownerData = participants.find(p =>
    String(p.id).includes(senderNumber)
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
