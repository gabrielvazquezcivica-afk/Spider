const handler = async ({ sock, from, sender, m }) => {

    // 🕒 saludo
    const hour = new Date().getHours()
    let saludo = 'Hola'

    if (hour >= 5 && hour < 12) saludo = '🌅 Buenos días'
    else if (hour >= 12 && hour < 18) saludo = '🌞 Buenas tardes'
    else saludo = '🌙 Buenas noches'

    // 📊 orden de categorías
    const tagOrder = [
        'info',
        'group',
        'fun',
        'owner',
        'tools',
        'download',
        'others'
    ]

    // 🧠 config de tags
    const tagData = {
        info: { name: 'Información', tagEmoji: 'ℹ️', cmdEmoji: '⚠️' },
        group: { name: 'Grupo', tagEmoji: '🏖️', cmdEmoji: '🌟' },
        fun: { name: 'Juegos', tagEmoji: '🎮', cmdEmoji: '🎯' },
        owner: { name: 'Owner', tagEmoji: '👑', cmdEmoji: '🔥' },
        tools: { name: 'Herramientas', tagEmoji: '🛠️', cmdEmoji: '⚙️' },
        download: { name: 'Descargas', tagEmoji: '📥', cmdEmoji: '📎' },
        others: { name: 'Otros', tagEmoji: '📦', cmdEmoji: '✨' }
    }

    let menu = `╭━━━〔 🤖 SPIDER BOT 〕━━━⬣
┃ ${saludo} @${sender.split('@')[0]}
╰━━━━━━━━━━━━━━━⬣\n`

    const groups = {}

    // 📦 agrupar plugins
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
    for (const tag of tagOrder) {

        if (!groups[tag]) continue

        const data = tagData[tag] || tagData['others']

        // 🔥 quitar duplicados + ordenar
        const cmds = [...new Set(groups[tag])].sort()

        menu += `\n${data.name} ${data.tagEmoji}\n`

        for (const cmd of cmds) {
            menu += `${data.cmdEmoji} .${cmd}\n`
        }
    }

    // 📊 total real
    const total = Object.values(groups)
        .flat()
        .filter((v, i, a) => a.indexOf(v) === i).length

    menu += `\n⚡ Total comandos: ${total}`

    // 📤 enviar
    await sock.sendMessage(from, {
        text: menu,
        mentions: [sender]
    }, { quoted: m })
}

handler.command = ['menu']
handler.tags = ['informacion']
handler.menu = true

export default handler
