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
ff: '⚔️',
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
ff: '🧧',
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
'ff',
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
      url: 'https://files.catbox.moe/2dx6ft.jpg'
    },
    caption: menu
  }, { quoted: m })
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