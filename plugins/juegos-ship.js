import fs from 'fs'

const path = './data/modoadmin.json'

// 📥 DB modoadmin
function getDB() {
    try {
        if (!fs.existsSync(path)) return {}
        return JSON.parse(fs.readFileSync(path, 'utf-8'))
    } catch {
        return {}
    }
}

// 🔢 random porcentaje
function randomShip() {
    return Math.floor(Math.random() * 101)
}

const handler = async ({ sock, m, from, isGroup, participants, sender }) => {

    if (!isGroup) return

    const db = getDB()
    const isBlockedGroup = db[from]

    const user = participants.find(p => p.id === sender)

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    // 🔒 MODODADMIN: solo admins pueden usar comandos normales
    if (isBlockedGroup && !isAdmin) return

    const ctx = m.message?.extendedTextMessage?.contextInfo

    const userRaw =
        ctx?.mentionedJid?.[0] ||
        ctx?.participant

    if (!userRaw) {
        return sock.sendMessage(from, {
            text: '⚠️ Menciona o responde a alguien para usar ship'
        }, { quoted: m })
    }

    if (userRaw === sender) {
        return sock.sendMessage(from, {
            text: '💀 No puedes hacer ship contigo mismo'
        }, { quoted: m })
    }

    const percent = randomShip()

    await sock.sendMessage(from, {
        react: { text: '💘', key: m.key }
    })

    let msg = ''

    if (percent <= 20) msg = '💔 Cero compatibilidad…'
    else if (percent <= 50) msg = '💞 Algo hay…'
    else if (percent <= 80) msg = '💖 Buena conexión'
    else msg = '💘 AMOR PERFECTO'

    return sock.sendMessage(from, {
        text:
`💘 SPIDER SHIP 💘

👤 Usuario 1: @${sender.split('@')[0]}
👤 Usuario 2: @${userRaw.split('@')[0]}

📊 Compatibilidad: ${percent}%

${msg}`,
        mentions: [sender, userRaw]
    }, { quoted: m })
}

handler.command = ['ship']
handler.tags = ['juegos']
handler.group = true
handler.menu = true

export default handler
