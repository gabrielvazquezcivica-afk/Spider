const handler = async (ctx) => {

  const { sock, from, m, args, isGroup, participants, sender } = ctx

  // 🚫 solo grupo
  if (!isGroup) {
    return sock.sendMessage(from, {
      text: '❌ Solo funciona en grupos'
    }, { quoted: m })
  }

  // 👑 solo admins
  const user = participants.find(p => p.id === sender)
  if (!user || !user.admin) {
    return sock.sendMessage(from, {
      text: '❌ Solo administradores pueden usar este comando'
    }, { quoted: m })
  }

  const mentions = participants.map(p => p.id)

  await sock.sendMessage(from, {
    react: { text: '📣', key: m.key }
  })

  // 📌 detectar tipo de mensaje citado
  const msg = m.message

  const text = args.join(' ')

  // ─────────────── TEXT ───────────────
  if (text && !m.quoted) {

    return sock.sendMessage(from, {
      text,
      mentions
    })
  }

  const quoted = m.quoted || m

  // ─────────────── IMAGEN ───────────────
  if (quoted?.message?.imageMessage) {

    const buffer = await quoted.download()

    return sock.sendMessage(from, {
      image: buffer,
      caption: text || '',
      mentions
    })
  }

  // ─────────────── VIDEO ───────────────
  if (quoted?.message?.videoMessage) {

    const buffer = await quoted.download()

    return sock.sendMessage(from, {
      video: buffer,
      caption: text || '',
      mentions
    })
  }

  // ─────────────── AUDIO ───────────────
  if (quoted?.message?.audioMessage) {

    const buffer = await quoted.download()

    return sock.sendMessage(from, {
      audio: buffer,
      mimetype: 'audio/mp4',
      ptt: true
    })
  }

  // ─────────────── STICKER ───────────────
  if (quoted?.message?.stickerMessage) {

    const buffer = await quoted.download()

    return sock.sendMessage(from, {
      sticker: buffer
    })
  }

  // ❌ fallback
  return sock.sendMessage(from, {
    text: '⚠️ Usa .n respondiendo a un mensaje o escribiendo texto'
  }, { quoted: m })
}

handler.command = ['n']
handler.tags = ['grupo']
handler.menu = true
handler.group = true
handler.admin = true

export default handler
