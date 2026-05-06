const handler = async ({ sock, from, pushName, sender }) => {

    // 🕒 saludo según hora
    const hour = new Date().getHours()
    let saludo = 'Hola'

    if (hour >= 5 && hour < 12) saludo = '🌅 Buenos días'
    else if (hour >= 12 && hour < 18) saludo = '🌞 Buenas tardes'
    else saludo = '🌙 Buenas noches'

    // 🎯 emojis por TAG
    const tagEmojis = {
        grupo: '👥',
        informacion: 'ℹ️',
        juegos: '🎮',
        'on-off': '🟢🔴',
        owner: '👑',
        descargas: '📥',
        tools: '⚙️'
    }

    // ⚡ emoji comandos
    const cmdEmoji = '➤'

    let menu = `╭━━━〔 🤖 SPIDER BOT 〕━━━⬣
┃ ${saludo} @${sender.split('@')[0]}
┃ 👤 Usuario: ${pushName}
╰━━━━━━━━━━━━━━━⬣\n`

    // 📦 agrupar plugins
    const groups = {}

    for (const plugin of global.plugins || []) {

        if (!plugin.menu) continue
        if (!plugin.command) continue

        const tag = plugin.tags?.[0] || 'others'

        if (!groups[tag]) groups[tag] = []

        const commands = Array.isArray(plugin.command)
            ? plugin.command
            : [plugin.command]

        groups[tag].push(...commands)
    }

    // 🧾 construir menú
    for (const tag in groups) {

        const emojiTag = tagEmojis[tag] || '📦'

        menu += `\n╭───〔 ${emojiTag} ${tag.toUpperCase()} 〕\n`

        for (const cmd of groups[tag]) {
            menu += `│ ${cmdEmoji} .${cmd}\n`
        }

        menu += `╰────────────⬣\n`
    }

    menu += `\n⚡ Total comandos: ${
        Object.values(groups).flat().length
    }`

    // 📤 enviar con mención
    await sock.sendMessage(from, {
        text: menu,
        mentions: [sender]
    })
}

handler.command = ['menu']
handler.tags = ['informacion']
handler.menu = true

export default handler
