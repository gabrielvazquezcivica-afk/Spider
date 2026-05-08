import config from '../config.js'

const handler = async ({
  sock,
  m,
  from,
  sender,
  isGroup,
  pushName
}) => {

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
      text: '❌ Error obteniendo grupo.'
    }, { quoted: m })
  }

  const participants = metadata.participants || []

  // 👑 buscar participante real
  const userData = participants.find(p => p.id === sender)

  // 📱 número REAL
  const realNumber = userData?.id
    ?.split('@')[0]
    ?.split(':')[0]
    ?.replace(/^521/, '')
    ?.replace(/^52/, '')

  console.log('📌 NUMERO REAL =>', realNumber)

  // 👑 validar owner
  const isOwner = config.owner.includes(realNumber)

  console.log('📌 ES OWNER =>', isOwner)

  if (!isOwner) {
    return sock.sendMessage(from, {
      text: '🕷️ Solo el owner puede usar este comando.'
    }, { quoted: m })
  }

  // 🤖 BOT ADMIN
  const botNumber = sock.user.id
    .split('@')[0]
    .split(':')[0]

  const botData = participants.find(p =>
    p.id.includes(botNumber)
  )

  const isBotAdmin =
    botData?.admin === 'admin' ||
    botData?.admin === 'superadmin'

  if (!isBotAdmin) {
    return sock.sendMessage(from, {
      text: '⚠️ El bot necesita ser administrador.'
    }, { quoted: m })
  }

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
