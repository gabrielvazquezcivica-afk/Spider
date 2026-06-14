import { downloadContentFromMessage } from '@whiskeysockets/baileys'

function footer() {
  return `\n\n> 𝐒𝐏𝐈𝐃𝐄𝐑 𝐁𝐎𝐓`
}

const handler = async ({ sock, m, from }) => {

  // 🚫 evitar mensajes del propio bot
  if (m.key.fromMe) return

  // 🚫 solo grupos
  if (!from.endsWith('@g.us')) {
    return sock.sendMessage(from, {
      text: '⚠️ Solo funciona en grupos'
    }, { quoted: m })
  }

  // 📊 metadata
  let metadata
  try {
    metadata = await sock.groupMetadata(from)
  } catch {
    return sock.sendMessage(from, {
      text: '❌ Error grupo'
    }, { quoted: m })
  }

  const participants = metadata.participants
  const sender = m.key.participant || m.key.remoteJid

  // 👑 admin real
  const isAdmin = participants.some(p =>
    p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin')
  )

  if (!isAdmin) {
    return sock.sendMessage(from, {
      text: '⚠️ Solo administradores pueden usar este comando'
    }, { quoted: m })
  }

  const mentions = participants.map(p => p.id)

  const text =
    m.message?.conversation ||
    m.message?.extendedTextMessage?.text ||
    ''

  const clean = text.startsWith('.n')
    ? text.slice(2).trim()
    : text.trim()

  // ───────── 🔥 ANTI LOOP CORREGIDO ─────────
  const quotedContext = m.message?.extendedTextMessage?.contextInfo
  const quotedMsg = quotedContext?.quotedMessage
  // Verificamos si el mensaje citado es del bot, no si tiene ".n"
  const isQuotedFromMe = quotedContext?.participant === sock.user.id || quotedContext?.fromMe === true
  if (isQuotedFromMe) return // Solo evitamos bucles con mensajes del bot

  // 🔥 reacción
  await sock.sendMessage(from, {
    react: { text: '📣', key: m.key }
  })

  // ───────── SOLO TEXTO ─────────
  if (!quotedMsg && clean) {
    return sock.sendMessage(from, {
      text: clean + footer(),
      mentions
    }, { quoted: m })
  }

  // ───────── CITADO ─────────
  if (quotedMsg) {
    const type = Object.keys(quotedMsg)[0]

    // 📄 texto citado
    if (type === 'conversation' || type === 'extendedTextMessage') {
      const quotedText =
        quotedMsg.conversation ||
        quotedMsg.extendedTextMessage?.text ||
        ''

      const finalText = clean || quotedText

      return sock.sendMessage(from, {
        text: finalText + footer(),
        mentions
      }, { quoted: m })
    }

    const mediaType = type.replace('Message', '')

    try {
      const stream = await downloadContentFromMessage(quotedMsg[type], mediaType)
      let buffer = Buffer.from([])

      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
      }

      const caption = clean ? `${clean}${footer()}` : footer()

      // 🖼 imagen
      if (mediaType === 'image') {
        return sock.sendMessage(from, {
          image: buffer,
          caption,
          mentions
        }, { quoted: m })
      }

      // 🎥 video
      if (mediaType === 'video') {
        return sock.sendMessage(from, {
          video: buffer,
          caption,
          mentions
        }, { quoted: m })
      }

      // 🎧 audio
      if (mediaType === 'audio') {
        return sock.sendMessage(from, {
          audio: buffer,
          ptt: true,
          mimetype: 'audio/mp4',
          mentions
        }, { quoted: m })
      }

      // 🧩 sticker
      if (mediaType === 'sticker') {
        return sock.sendMessage(from, {
          sticker: buffer
        }, { quoted: m })
      }

    } catch (e) {
      console.log(e)
      return sock.sendMessage(from, {
        text: '❌ Error procesando archivo'
      }, { quoted: m })
    }
  }

  return sock.sendMessage(from, {
    text: '⚠️ Usa .n respondiendo o escribiendo texto'
  }, { quoted: m })
}

handler.command = ['n']
handler.tags = ['grupo']
handler.menu = true
handler.group = true

export default handler
