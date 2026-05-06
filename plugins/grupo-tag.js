import { downloadContentFromMessage } from '@whiskeysockets/baileys'

function footer(name) {
  return `\n\n> ${name}`
}

const handler = async (ctx) => {

  const { sock, from, m, isGroup, participants, sender } = ctx

  if (!sock || !from || !m) return

  const botName = 'Spider Bot'

  // 🚫 solo grupos
  if (!isGroup) {
    return sock.sendMessage(from, {
      text: '⚠️ Solo funciona en grupos'
    }, { quoted: m })
  }

  // 👑 admin check
  const user = participants?.find(p => p.id === sender)
  if (!user?.admin) {
    return sock.sendMessage(from, {
      text: '⚠️ Solo admins pueden usar este comando'
    }, { quoted: m })
  }

  const members = participants.map(p => p.id)

  const text =
    m.message?.conversation ||
    m.message?.extendedTextMessage?.text ||
    ''

  const clean = text.startsWith('.n')
    ? text.slice(2).trim()
    : text.trim()

  const ctxInfo = m.message?.extendedTextMessage?.contextInfo
  const quoted = ctxInfo?.quotedMessage

  await sock.sendMessage(from, {
    react: { text: '📣', key: m.key }
  })

  // ───────── SOLO TEXTO ─────────
  if (!quoted && clean) {
    return sock.sendMessage(from, {
      text: clean + footer(botName),
      mentions: members
    }, { quoted: m })
  }

  // ───────── CITADO ─────────
  if (quoted) {

    const type = Object.keys(quoted)[0]
    let msg = {}

    if (type === 'conversation' || type === 'extendedTextMessage') {

      const t = quoted.conversation || quoted.extendedTextMessage?.text || ''

      return sock.sendMessage(from, {
        text: t + footer(botName),
        mentions: members
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
        msg.caption = clean + footer(botName)
      }

      if (mediaType === 'video') {
        msg.video = buffer
        msg.caption = clean + footer(botName)
      }

      if (mediaType === 'audio') {
        msg.audio = buffer
        msg.ptt = true
        msg.mimetype = 'audio/mp4'
      }

      if (mediaType === 'sticker') {
        msg.sticker = buffer
      }

      msg.mentions = members

      return sock.sendMessage(from, msg, { quoted: m })

    } catch (e) {
      console.log(e)
      return sock.sendMessage(from, {
        text: '❌ Error procesando media'
      }, { quoted: m })
    }
  }

  return sock.sendMessage(from, {
    text: '⚠️ Usa .n respondiendo o con texto'
  }, { quoted: m })
}

handler.command = ['n']
handler.tags = ['grupo']
handler.menu = true
handler.group = true
handler.admin = true

export default handler
