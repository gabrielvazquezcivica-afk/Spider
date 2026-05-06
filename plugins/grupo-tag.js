import { downloadContentFromMessage } from '@whiskeysockets/baileys'

function footer() {
  return `\n\n> SPIDER BOT`
}

const handler = async ({ sock, m, from }) => {

  // 📌 solo grupos
  if (!from.endsWith('@g.us')) {
    return sock.sendMessage(from, {
      text: '⚠️ Solo funciona en grupos'
    }, { quoted: m })
  }

  // 📊 obtener metadata del grupo
  let metadata
  try {
    metadata = await sock.groupMetadata(from)
  } catch {
    return sock.sendMessage(from, {
      text: '❌ Error obteniendo datos del grupo'
    }, { quoted: m })
  }

  const participants = metadata.participants
  const sender = m.key.participant || m.key.remoteJid

  // 👑 validar admin real
  const isAdmin = participants.some(p =>
    p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin')
  )

  if (!isAdmin) {
    return sock.sendMessage(from, {
      text: '⚠️ Solo administradores pueden usar este comando'
    }, { quoted: m })
  }

  // 👥 menciones
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

  await sock.sendMessage(from, {
    react: { text: '📣', key: m.key }
  })

  // ───────── TEXTO ─────────
  if (!quoted && clean) {
    return sock.sendMessage(from, {
      text: clean + footer(),
      mentions
    }, { quoted: m })
  }

  // ───────── CITADO ─────────
  if (quoted) {

    const type = Object.keys(quoted)[0]
    let msg = {}

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

      if (mediaType === 'image') {
        msg.image = buffer
        msg.caption = clean + footer()
      }

      if (mediaType === 'video') {
        msg.video = buffer
        msg.caption = clean + footer()
      }

      if (mediaType === 'audio') {
        msg.audio = buffer
        msg.ptt = true
        msg.mimetype = 'audio/mp4'
      }

      if (mediaType === 'sticker') {
        msg.sticker = buffer
      }

      msg.mentions = mentions

      return sock.sendMessage(from, msg, { quoted: m })

    } catch (e) {
      console.log(e)
      return sock.sendMessage(from, {
        text: '❌ Error procesando contenido'
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
