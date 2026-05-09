import config from '../config.js'

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
  const senderLid = sender.split('@')[0]
  const isOwner = config.ownerLid.includes(senderLid)

  if (!isOwner) {
    return sock.sendMessage(from, {
      text: '🕷️ Solo el owner puede usar este comando.'
    }, { quoted: m })
  }

  // 📥 obtener enlace
  const link = args[0]

  if (!link) {
    return sock.sendMessage(from, {
      text: '⚠️ Envía el enlace del grupo.\nEjemplo: !join https://chat.whatsapp.com/XXXXXX'
    }, { quoted: m })
  }

  // 🔗 validar que sea enlace de WhatsApp
  if (!link.includes('chat.whatsapp.com/')) {
    return sock.sendMessage(from, {
      text: '❌ Enlace inválido, asegúrate de que sea de WhatsApp.'
    }, { quoted: m })
  }

  // 🔑 extraer código de invitación
  const codigo = link.split('chat.whatsapp.com/')[1]?.trim()

  if (!codigo) {
    return sock.sendMessage(from, {
      text: '❌ No se pudo obtener el código del enlace.'
    }, { quoted: m })
  }

  // ⚡ reacción
  await sock.sendMessage(from, {
    react: { text: '🔗', key: m.key }
  })

  try {
    // ➕ unirse al grupo
    const grupoId = await sock.groupAcceptInvite(codigo)

    // 📩 AVISO A TI: Confirmación de que entró
    await sock.sendMessage(from, {
      text:
`╭━━━〔 🔗 JOIN 〕━━━⬣
┃
┃ 🕷️ Me uní correctamente
┃ ⚡ Enlace procesado exitosamente
┃ 👤 ${pushName}
┃
╰━━━━━━━━━━━━━━━━⬣

> SPIDER BOT`
    }, { quoted: m })

    // 📩 AVISO EN EL GRUPO RECIÉN ENTRADO
    await sock.sendMessage(grupoId, {
      text:
`╭━━━〔 🕷️ SPIDER BOT 〕━━━⬣
┃
┃ ✅ Ya estoy dentro del grupo
┃ ⚡ Listo para funcionar
┃ 👑 Creado por: Gabriel Vázquez
┃
╰━━━━━━━━━━━━━━━━━━━━⬣`
    })

  } catch (e) {
    console.log('❌ ERROR JOIN:', e)

    let errorMsg = '❌ No pude unirme al grupo.'

    // 📌 errores comunes
    if (e?.message?.includes('404')) errorMsg = '❌ El enlace es inválido o ya expiró.'
    if (e?.message?.includes('403')) errorMsg = '❌ No tengo permiso o el grupo está cerrado.'
    if (e?.message?.includes('already')) errorMsg = 'ℹ️ Ya estoy en ese grupo.'

    return sock.sendMessage(from, {
      text: errorMsg
    }, { quoted: m })
  }
}

handler.command = ['join']
handler.tags = ['owner']
handler.menu = true

export default handler
      
