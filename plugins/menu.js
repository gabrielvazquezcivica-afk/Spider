const handler = async (m, { sock, from, pushName, plugins }) => {

  if (!Array.isArray(plugins) || plugins.length === 0) {
    return sock.sendMessage(from, { text: '❌ No hay plugins cargados.' }, { quoted: m })
  }

  // ⚡ reacción
  await sock.sendMessage(from, {
    react: { text: '📜', key: m.key }
  })

  const botName = 'Spider Bot'
  const dev = 'Gabriel'
  const saludo = getGreeting()

  // 🎯 emojis por categoría (CORREGIDO)
  const tagEmoji = {
    info: '🧠',
    group: '👥',
    fun: '🎮',
    download: '📥',
    tools: '⚙️',
    owner: '👑',
    search: '🔎',
    rpg: '💰',
    stickers: '🖼️',
    nsfw: '🔞',
    others: '📦'
  }

  // 🎯 emojis por comando (CORREGIDO)
  const cmdEmojiByTag = {
    info: '⚠️',
    group: '🌟',
    fun: '🎯',
    download: '⬇️',
    tools: '🔧',
    owner: '🔥',
    search: '🔍',
    rpg: '💎',
    stickers: '🖌️',
    nsfw: '⚠️',
    others: '▫️'
  }

  // 📊 orden
  const tagOrder = [
    'info',
    'group',
    'fun',
    'download',
    'tools',
    'search',
    'rpg',
    'stickers',
    'owner',
    'nsfw',
    'others'
  ]

  // 📂 agrupar
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

  // 🧠 construir menú
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

  // 📤 enviar
  await sock.sendMessage(from, {
    image: { url: 'https://i.postimg.cc/VsSqN5RG/19d8fec1698683dde758218220caa31e.jpg' },
    caption: menu
  }, { quoted: m })
}

handler.command = ['menu']
handler.tags = ['info']
handler.menu = true

export default handler

function getGreeting() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Buenos días ☀️'
  if (hour >= 12 && hour < 19) return 'Buenas tardes 🌤️'
  return 'Buenas noches 🌙'
}
