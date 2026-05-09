import config from '../config.js'

// ───── HELPERS ─────
function onlyNumber (jid = '') {
  return jid?.toString().replace(/[^0-9]/g, '')
}

const handler = async ({
  sock,
  m,
  from,
  sender,
  isGroup,
  pushName,
  args
}) => {

  // 🚫 evitar mensajes del bot
  if (m.key.fromMe) return

  // 👑 validar owner por LID
  const senderLid = onlyNumber(sender)
  const isOwner = config.ownerLid.includes(senderLid)

  if (!isOwner) {
    return sock.sendMessage(from, {
      text: '🕷️ Solo el owner puede usar este comando.'
    }, { quoted: m })
  }

  // 📥 verificar argumento
  if (!args[0]) {
    return sock.sendMessage(from, {
      text:
`╭━━━〔 🔗 JOIN 〕━━━⬣
┃
┃ 📌 Uso correcto:
┃ !join <enlace del grupo>
┃
┃ 🔗 Ejemplo:
┃ !join https://chat.whatsapp.com/XXXXXXX
┃
╰━━━━━━━━━━━━━━━━⬣`
    }, { quoted: m })
  }

  const link = args[0]
  // 🔗 extraer código del enlace
  const match = link.match(/chat\.whatsapp\.com\/([0-9A-Za-z]+)/i)

  if (!match) {
    return sock.sendMessage(from, {
      text: '❌ Enlace inválido, asegúrate de que sea de WhatsApp.'
    }, { quoted: m })
  }

  const codigo = match[1]

  // ⏳ reacción proceso
  await sock.sendMessage(from, {
    react: { text: '⏳', key: m.key }
  })

  try {
    // ✅ MÉTODO QUE FUNCIONA EN CUALQUIER GRUPO
    await sock.groupAcceptInvite(codigo)

    // ✅ reacción éxito
    await sock.sendMessage(from, {
      react: { text: '✅', key: m.key }
    })

    // 📩 AVISO DE CONFIRMACIÓN (ESTILO SPIDER BOT)
    await sock.sendMessage(from, {
      text:
`╭━━━〔 🔗 JOIN 〕━━━⬣
┃
┃ 🕷️ Me uní correctamente
┃ ⚡ Enlace procesado exitosamente
┃ 👤 ${pushName}
┃
╰━━━━━━━━━━━━━━━━⬣`
    }, { quoted: m })

  } catch (e) {
    console.log('❌ ERROR JOIN:', e)

    // ❌ reacción error
    await sock.sendMessage(from, {
      react: { text: '❌', key: m.key }
    })

    // 📌 mensajes de error detallados
    let errorMsg =
`╭━━━〔 ❌ ERROR JOIN 〕━━━⬣
┃
┃ ⚠️ No pude unirme al grupo
┃
┃ 📌 Posibles causas:
┃ • Enlace expirado o inválido
┃ • Ya estoy dentro del grupo
┃ • WhatsApp bloqueó la entrada
┃ • Grupo muy antiguo con restricciones
┃
╰━━━━━━━━━━━━━━━━━━━━⬣`

    if (e?.message?.includes('already')) {
      errorMsg =
`╭━━━〔 ℹ️ AVISO 〕━━━⬣
┃
┃ ✅ Ya estoy en ese grupo
┃ ⚡ No es necesario unirme otra vez
┃
╰━━━━━━━━━━━━━━━━⬣`
    }

    return sock.sendMessage(from, { text: errorMsg }, { quoted: m })
  }
}

handler.command = ['join']
handler.tags = ['owner']
handler.menu = true

export default handler
