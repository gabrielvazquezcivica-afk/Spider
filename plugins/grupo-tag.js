import { downloadContentFromMessage } from '@whiskeysockets/baileys'

function footer(name) {
  return `\n\n> ${name}`
}

const handler = async (ctx) => {

  const { sock, from, m, isGroup, participants, sender } = ctx

  const botName = 'Spider Bot'
  const msgs = global.config?.messages || {}

  // 🚫 solo grupos
  if (!isGroup) {
    return sock.sendMessage(from, {
      text: msgs.group || '⚠️ Este comando solo funciona en grupos'
    }, { quoted: m })
  }

  // 👑 validar admin (compatible con tu index)
  const user = participants?.find(p => p.id === sender)
  const isAdmin = user?.admin || user?.admin === 'admin' || user?.admin === 'superadmin'

  if (!isAdmin) {
    return sock.sendMessage(from, {
      text: msgs.admin || '⚠️ Solo administradores pueden usar este comando'
    }, { quoted: m })
  }

  // 👥 todos los participantes
  const groupMembers = participants.map(p => p.id)

  // 📌 texto limpio
  const rawText =
    m.message?.conversation ||
    m.message?.extendedTextMessage?.text ||
    ''

  const cleanText = rawText.startsWith(global.prefix || '.')
    ? rawText.slice((global.prefix || '.').length).trim()
    : rawText.trim()

  // 📌 mensaje citado
  const ctx = m.message?.extendedTextMessage?.contextInfo
  const quoted = ctx?.quotedMessage

  await sock.sendMessage(from, {
    react: { text: '📣', key: m.key }
  })

  // ───────── TEXT ─────────
  if (!quoted && cleanText) {
    return sock.sendMessage(from, {
      text: cleanText + footer(botName),
      mentions: groupMembers
    }, { quoted: m })
  }

  // ───────── MEDIA ─────────
  if (quoted) {

    const type = Object.keys(quoted)[0]

    let msg = {}

    // 📄 texto citado
    if (type === 'conversation' || type === 'extendedTextMessage') {

      const text =
        quoted.conversation ||
        quoted.extendedTextMessage?.text ||
        ''

      msg.text = text + footer(botName)
      msg.mentions = groupMembers

      return sock.sendMessage(from, msg, { quoted: m })
    }

    // 📦 media (imagen, video, audio, sticker)
    const mediaType = type.replace('Message', '')

    try {
      const stream = await downloadContentFromMessage(quoted[type], mediaType)
      let buffer = Buffer.from([])

      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
      }

      if (mediaType === 'audio') {
        msg.audio = buffer
        msg.mimetype = 'audio/mp4'
        msg.ptt = true
      }

      if (mediaType === 'image') {
        msg.image = buffer
        msg.caption = (quoted[type]?.caption || cleanText || '') + footer(botName)
      }

      if (mediaType === 'video') {
        msg.video = buffer
        msg.caption = (quoted[type]?.caption || cleanText || '') + footer(botName)
      }

      if (mediaType === 'sticker') {
        msg.sticker = buffer
      }

      msg.mentions = groupMembers

      return sock.sendMessage(from, msg, { quoted: m })

    } catch (e) {
      return sock.sendMessage(from, {
        text: '❌ Error al procesar el mensaje'
      }, { quoted: m })
    }
  }

  return sock.sendMessage(from, {
    text: '⚠️ Usa .n respondiendo o escribiendo un mensaje'
  }, { quoted: m })
}

handler.command = ['n']
handler.tags = ['grupo']
handler.help = ['n <texto>']
handler.group = true
handler.admin = true
handler.menu = true

export default handler
