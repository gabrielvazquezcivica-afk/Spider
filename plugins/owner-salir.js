import config from '../config.js'

const handler = async ({
  sock,
  m,
  from,
  sender,
  isGroup
}) => {

  // 🚫 ignorar mensajes del bot
  if (m.key.fromMe) return

  // ❌ solo grupos
  if (!isGroup) {
    return sock.sendMessage(from, {
      text: '⚠️ Este comando solo funciona en grupos.'
    }, { quoted: m })
  }

  // 👑 validar owner
  const senderLid = sender.split('@')[0]

  const isOwner =
    config.ownerLid.includes(senderLid)

  if (!isOwner) {
    return sock.sendMessage(from, {
      text: '🕷️ Solo el owner puede usar este comando.'
    }, { quoted: m })
  }

  // ⚡ reacción
  await sock.sendMessage(from, {
    react: {
      text: '🚪',
      key: m.key
    }
  })

  try {

    // 📩 mensaje antes de salir
    await sock.sendMessage(from, {
      text:
`╭━━━〔 🕷️ SPIDER BOT 〕━━━⬣
┃
┃ ☠️ Misión finalizada
┃ 🕸️ Desconectándome del grupo...
┃ 👑 Orden ejecutada por:
┃ @${sender.split('@')[0]}
┃
╰━━━━━━━━━━━━━━━━⬣

> Hasta otra ocasión.`,
      mentions: [sender]
    }, { quoted: m })

    // ⏳ espera
    await new Promise(resolve =>
      setTimeout(resolve, 2000)
    )

    // 🚪 salir del grupo
    await sock.groupLeave(from)

  } catch (e) {

    console.log('❌ ERROR SALIR:', e)

    return sock.sendMessage(from, {
      text: '❌ No pude salir del grupo.'
    }, { quoted: m })
  }
}

handler.command = ['salir']
handler.tags = ['owner']
handler.group = true
handler.menu = false

export default handler
