const handler = async (ctx) => {

  const { sock, from, pushName, m } = ctx
  const plugins = global.plugins || []

  if (!Array.isArray(plugins) || !plugins.length) {
    return sock.sendMessage(from, {
      text: '❌ No hay comandos disponibles.'
    }, { quoted: m })
  }

  await sock.sendMessage(from, {
    react: { text: '📌', key: m.key }
  })

  const botName = 'MALU BOT'
  const owner = 'SoyGabo'
  const saludo = getGreeting()

  const tagEmoji = {
    informacion: '💗',
    grupo: '🔮',
    juegos: '🎮',
    descargas: '📥',
    tools: '🧰',
    ff: '⚔️',
    reg: '🗂️',
    owner: '👑',
    ia: '🤖',
    rpg: '💰',
    stickers: '🖼️',
    search: '🔎',
    'on-off': '🔴'
  }

  const fancyTag = {
    informacion: '𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐂𝐈𝐎𝐍',
    grupo: '𝐆𝐑𝐔𝐏𝐎',
    juegos: '𝐉𝐔𝐄𝐆𝐎𝐒',
    descargas: '𝐃𝐄𝐒𝐂𝐀𝐑𝐆𝐀𝐒',
    tools: '𝐇𝐄𝐑𝐑𝐀𝐌𝐈𝐄𝐍𝐓𝐀𝐒',
    ff: '𝐅𝐑𝐄𝐄 𝐅𝐈𝐑𝐄',
    reg: '𝐑𝐄𝐆𝐈𝐒𝐓𝐑𝐎',
    owner: '𝐎𝐖𝐍𝐄𝐑',
    ia: '𝐈𝐀',
    rpg: '𝐑𝐏𝐆',
    stickers: '𝐒𝐓𝐈𝐂𝐊𝐄𝐑𝐒',
    search: '𝐁𝐔𝐒𝐐𝐔𝐄𝐃𝐀',
    'on-off': '𝐎𝐍 / 𝐎𝐅𝐅'
  }

  // 👇 AQUÍ LOS EMOJIS POR COMANDO (IMPORTANTÍSIMO)
  const cmdEmoji = {
    informacion: '💗',
    grupo: '🔮',
    juegos: '🎮',
    descargas: '📥',
    tools: '🧰',
    ff: '⚔️',
    reg: '🗂️',
    owner: '👑',
    ia: '🤖',
    rpg: '💰',
    stickers: '🖼️',
    search: '🔎',
    'on-off': '🔴'
  }

  const order = [
    'informacion',
    'grupo',
    'juegos',
    'descargas',
    'ia',
    'tools',
    'rpg',
    'ff',
    'stickers',
    'search',
    'reg',
    'owner',
    'on-off'
  ]

  const categories = {}
  let total = 0

  for (const p of plugins) {
    if (!p.menu || !p.command) continue

    const cmds = Array.isArray(p.command) ? p.command : [p.command]
    const tag = p.tags?.[0] || 'informacion'

    if (!categories[tag]) categories[tag] = []
    categories[tag].push(...cmds)

    total += cmds.length
  }

  let text = ''

  text += `╭──〔 🤖 ${botName} 〕──\n`
  text += `│ 👋 ${saludo}\n`
  text += `│ 👤 ${pushName}\n`
  text += `│ 👑 Owner: ${owner}\n`
  text += `│ 📊 Comandos: ${total}\n`
  text += `╰───────────────────\n`

  for (const tag of order) {

    if (!categories[tag]) continue

    const title = fancyTag[tag] || tag.toUpperCase()
    const headerEmoji = tagEmoji[tag] || '📦'

    const cmds = [...new Set(categories[tag])].sort()

    text += `\n╭─ ${headerEmoji} ${title}\n`

    for (const cmd of cmds) {
      const emoji = cmdEmoji[tag] || '➤'
      text += `│ ${emoji} .${cmd}\n`
    }

    text += `╰───────────────\n`
  }

  text += `\n> Bye SoyGabo`

  await sock.sendMessage(from, {
    text,
    mentions: [m.key.participant || m.key.remoteJid]
  }, { quoted: m })
}

handler.command = ['menu']
handler.tags = ['informacion']
handler.menu = true

export default handler

function getGreeting() {
  const h = new Date().getHours()

  if (h >= 5 && h < 12) return 'Buenos días ☀️'
  if (h >= 12 && h < 19) return 'Buenas tardes 🌤️'
  return 'Buenas noches 🌙'
}