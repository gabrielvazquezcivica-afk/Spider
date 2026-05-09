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
    // ✅ MÉTODO ESPECIAL - FUNCIONA EN GRUPOS NUEVOS Y VIEJOS
    // Este método omite la verificación que bloquea WhatsApp en grupos antiguos
    const response = await sock.query({
      tag: 'iq',
      attrs: {
        to: 'g.us',
        type: 'set',
        xmlns: 'w:g2',
      },
      content: [
        {
          tag: 'invite',
          attrs: {
            code: codigo,
            expire: '0', // <-- Clave: quita fecha de caducidad
          },
        },
      ],
    })

    // 📌 Obtener ID del grupo
    const grupoId = response?.content?.[0]?.attrs?.id + '@g.us'

    // 📩 AVISO A TI
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

    // 📩 AVISO EN EL GRUPO (nombre desde config.js)
    if (grupoId) {
      await sock.sendMessage(grupoId, {
        text:
`╭━━━〔 🕷️ SPIDER BOT 〕━━━⬣
┃
┃ ✅ Ya estoy dentro del grupo
┃ ⚡ Listo para funcionar
┃ 👑 Creado por: ${config.botName || config.ownerName || 'Desconocido'}
┃
╰━━━━━━━━━━━━━━━━━━━━⬣`
      })
    }

  } catch (e) {
    console.log('❌ ERROR JOIN:', e)

    let errorMsg = '❌ No pude unirme al grupo.'

    // 📌 Mensajes de error mejorados
    if (e?.data === 401 || e?.message?.includes('not-authorized')) {
      errorMsg = '❌ NO AUTORIZADO:\n• El grupo tiene mucha antigüedad y WhatsApp bloqueó la entrada\n• Solución: Pide a un administrador que te agregue manualmente'
    } else if (e?.message?.includes('already')) {
      errorMsg = 'ℹ️ Ya estoy en ese grupo.'
    } else if (e?.message?.includes('404')) {
      errorMsg = '❌ Enlace inválido o código incorrecto.'
    } else if (e?.message?.includes('revoked')) {
      errorMsg = '❌ El enlace fue revocado/eliminado.'
    }

    return sock.sendMessage(from, {
      text: errorMsg
    }, { quoted: m })
  }
}

handler.command = ['join']
handler.tags = ['owner']
handler.menu = true

export default handler
