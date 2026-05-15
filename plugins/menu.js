import fetch from 'node-fetch'

const handler = async (ctx) => {

  const { sock, from, pushName, m } = ctx
  const plugins = global.plugins || []

  if (!Array.isArray(plugins) || plugins.length === 0) {
    return sock.sendMessage(from, {
      text: '❌ No hay plugins cargados.'
    }, { quoted: m })
  }

  // ⚡ reacción
  await sock.sendMessage(from, {
    react: { text: '📜', key: m.key }
  })

  const botName = '𝐒𝐩𝐢𝐝𝐞𝐫-𝐁𝐨𝐭'
  const dev = '𝐒𝐨𝐲𝐆𝐚𝐛𝐨'
  const saludo = getGreeting()

  const tagEmoji = {
    informacion: '🧠',
    grupo: '👥',
    juegos: '🎮',
    descargas: '📥',
    tools: '⚙️',
    owner: '👑',
    ia: '🔎',
    rpg: '💰',
    stickers: '🖼️',
    search: '📁',
    'on-off': '🔴🟢'
  }

  const cmdEmojiByTag = {
    informacion: '⚠️',
    grupo: '🌟',
    juegos: '🎯',
    descargas: '⬇️',
    tools: '🔧',
    owner: '🔥',
    ia: '🔍',
    rpg: '💎',
    stickers: '🖌️',
    search: '📂',
    'on-off': '🔛'
  }

  const tagOrder = [
    'informacion',
    'on-off',
    'grupo',
    'juegos',
    'descargas',
    'ia',
    'rpg',
    'stickers',
    'tools',
    'owner',
    'search'
  ]

  const categories = {}
  let total = 0

  for (const plugin of plugins) {

    if (!plugin.menu || !plugin.command) continue

    const cmds = Array.isArray(plugin.command)
      ? plugin.command
      : [plugin.command]

    const tag = plugin.tags?.[0] || 'others'

    if (!categories[tag]) categories[tag] = []

    categories[tag].push(...cmds)
    total += cmds.length
  }

  let menu = `╭━━━〔 🕷️ ${botName} 〕━━━⬣
┃ 👋 ${saludo}
┃ 👤 ${pushName}
┃ ⚙️ Dev: ${dev}
╰━━━━━━━━━━━━━━━━⬣
📊 Comandos: ${total}\n`

  for (const tag of tagOrder) {

    if (!categories[tag]) continue

    const emojiTag = tagEmoji[tag] || '📦'
    const emojiCmd = cmdEmojiByTag[tag] || '➤'

    const cmds = [...new Set(categories[tag])].sort()

    menu += `\n╭─ ${emojiTag} ${tag.toUpperCase()}\n`

    for (const cmd of cmds) {
      menu += `│ ${emojiCmd} .${cmd}\n`
    }

    menu += `╰────────────⬣`
  }

  menu += `\n\n╰─➤ ${botName}`

  await sock.sendMessage(from, {
    image: {
      url: 'https://i.postimg.cc/GpTgKWYp/file-00000000c6a4720caff9cf521ed86667.png'
    },
    caption: menu
  }, {
    quoted: await sistema(sock, from, '🕷️ 𝐒𝐏𝐈𝐃𝐄𝐑-𝐁𝐎𝐓 𝐌𝐄𝐍𝐔')
  })
}

handler.command = ['menu']
handler.tags = ['informacion']
handler.menu = true

export default handler

function getGreeting() {
  const hour = new Date().getHours()

  if (hour >= 5 && hour < 12)
    return 'Buenos días ☀️'

  if (hour >= 12 && hour < 19)
    return 'Buenas tardes 🌤️'

  return 'Buenas noches 🌙'
}

// ───── SISTEMA WHATSAPP ─────
const sistema = async (
  sock,
  from,
  titulo = 'SpiderBot 🕷️'
) => {

  let nombreGrupo = 'Chat'
  let thumbnail = null

  try {

    if (from.endsWith('@g.us')) {

      const metadata =
        await sock.groupMetadata(from)

      nombreGrupo =
        metadata.subject || 'Grupo'

      try {

        const pp =
          await sock.profilePictureUrl(
            from,
            'image'
          )

        const res = await fetch(pp)

        const buffer =
          await res.arrayBuffer()

        thumbnail = Buffer.from(buffer)

      } catch {}
    }

  } catch {}

  return {
    key: {
      fromMe: false,
      participant: '0@s.whatsapp.net',
      remoteJid: 'status@broadcast'
    },
    message: {
      extendedTextMessage: {
        text: titulo,
        title: 'SpiderBot',
        description: nombreGrupo,
        jpegThumbnail: thumbnail,
        previewType: 0
      }
    }
  }
  }
