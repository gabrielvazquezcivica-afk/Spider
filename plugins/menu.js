import fs from 'fs'

const handler = async (ctx) => {

  const { sock, from, pushName, m } = ctx
  const plugins = global.plugins || []

  if (!Array.isArray(plugins) || plugins.length === 0) {
    return sock.sendMessage(from, {
      text: '❌ No hay plugins cargados.'
    }, { quoted: m })
  }

  await sock.sendMessage(from, {
    react: {
      text: '🔖',
      key: m.key
    }
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
    reg: '🗃️',
    owner: '👑',
    ia: '🔎',
    rpg: '💰',
    stickers: '🖼️',
    search: '📁',
    'on-off': '🔴'
  }

  const fancyTag = {
    informacion: '𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐂𝐈𝐎𝐍',
    grupo: '𝐆𝐑𝐔𝐏𝐎',
    juegos: '𝐉𝐔𝐄𝐆𝐎𝐒',
    descargas: '𝐃𝐄𝐒𝐂𝐀𝐑𝐆𝐀𝐒',
    tools: '𝐓𝐎𝐎𝐋𝐒',
    ff: '𝐅𝐑𝐄𝐄 𝐅𝐈𝐑𝐄',
    reg: '𝐑𝐄𝐆𝐈𝐒𝐓𝐑𝐎',
    owner: '𝐎𝐖𝐍𝐄𝐑',
    ia: '𝐈𝐀',
    rpg: '𝐑𝐏𝐆',
    stickers: '𝐒𝐓𝐈𝐂𝐊𝐄𝐑𝐒',
    search: '𝐒𝐄𝐀𝐑𝐂𝐇',
    'on-off': '𝐎𝐍-𝐎𝐅𝐅'
  }

  const cmdEmojiByTag = {
    informacion: '🤹🏻',
    grupo: '🪐',
    juegos: '🪀',
    descargas: '⏳',
    tools: '📿',
    owner: '🛡️',
    ia: '❇️',
    rpg: '⚔️',
    ff: '🎽',
    reg: '📂',
    stickers: '🌠',
    search: '📌',
    'on-off': '🔮'
  }

  const tagOrder = [
    'informacion',
    'on-off',
    'grupo',
    'juegos',
    'descargas',
    'ia',
    'reg',
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

    if (!plugin.menu || !plugin.command)
      continue

    const cmds = Array.isArray(plugin.command)
      ? plugin.command
      : [plugin.command]

    const tag = plugin.tags?.[0] || 'others'

    if (!categories[tag])
      categories[tag] = []

    categories[tag].push(...cmds)
    total += cmds.length
  }

  let menu =
`╭〔 🕷️ ${botName} 〕
│ 👋 ${saludo}
│ 👤 ${pushName}
│ ⚙️ ${dev}
│ 📊 ${total} comandos
╰────────────`

  for (const tag of tagOrder) {

    if (!categories[tag]) continue

    const emojiTag = tagEmoji[tag] || '📦'
    const emojiCmd = cmdEmojiByTag[tag] || '➤'

    const cmds = [...new Set(categories[tag])].sort()

    menu += `\n\n┌ ${emojiTag} ${fancyTag[tag]}`

    for (const cmd of cmds) {
      menu += `\n├ ${emojiCmd} .${cmd}`
    }

    menu += `\n└────────────`
  }

  menu += `\n\n> 𝐁𝐘 𝐒𝐎𝐘𝐆𝐀𝐁𝐎`

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