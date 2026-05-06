import { downloadContentFromMessage } from '@whiskeysockets/baileys'

function footer() {
  return `\n\n> SPIDER BOT`
}

const handler = async ({ sock, m, from }) => {

  // 🚫 solo grupos
  if (!from.endsWith('@g.us')) {
    return sock.sendMessage(from, {
      text: '⚠️ Solo funciona en grupos'
    }, { quoted: m })
  }

  // 📊 metadata grupo
  let metadata
  try {
    metadata = await sock.groupMetadata(from)
  } catch {
    return sock.sendMessage(from, {
      text: '❌ No se pudo obtener el grupo'
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

  const ctx = m.message?.extendedTextMessage?.contextInfo
  const quoted = ctx?.quotedMessage

  // 🔥 reacción
  await sock.sendMessage(from, {
    react: { text: '📣', key: m.key }
  })

  // ───────── SOLO TEXTO ─────────
  if (!quoted && clean) {
    return sock.sendMessage(from, {
      text: clean + footer(),
      mentions
    }, { quoted: m })
  }

  // ───────── CITADO ─────────
  if (quoted) {

    const type = Object.keys(quoted)[0]

    // 📄 TEXTO
    if (type === 'conversation' || type === 'extendedTextMessage') {

      const t =
        quoted.conversation ||
        quoted.extendedTextMessage?.text ||
        ''

      return sock.sendMessage(from, {
        text: t + footer(),
        mentions
      }, { quoted: m })
    }

    const mediaType = type.replace('Message', '')

    try {
      const stream = await downloadContentFromMessage(quoted[type], mediaType)
      let buffer = Buffer.from([])

      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
      }

      const caption = clean ? `${clean}${footer()}` : footer()

      // 🖼 IMAGEN (FIX REAL)
      if (mediaType === 'image') {
        return sock.sendMessage(from, {
          image: buffer,
          caption,
          mentions
        }, { quoted: m })
      }

      // 🎥 VIDEO
      if (mediaType === 'video') {
        return sock.sendMessage(from, {
          video: buffer,
          caption,
          mentions
        }, { quoted: m })
      }

      // 🎧 AUDIO
      if (mediaType === 'audio') {
        return sock.sendMessage(from, {
          audio: buffer,
          ptt: true,
          mimetype: 'audio/mp4',
          mentions
        }, { quoted: m })
      }

      // 🧩 STICKER
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
