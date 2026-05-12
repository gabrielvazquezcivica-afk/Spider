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

    // 🔒 MODODADMIN
    if (isBlockedGroup && !isAdmin) return

    const ctx = m.message?.extendedTextMessage?.contextInfo

    // 👥 mencionados
    const mentioned =
        ctx?.mentionedJid || []

    let user1
    let user2

    // ✅ si mencionan 2 personas
    if (mentioned.length >= 2) {

        user1 = mentioned[0]
        user2 = mentioned[1]

    // ✅ si mencionan 1 persona
    } else if (mentioned.length === 1) {

        user1 = sender
        user2 = mentioned[0]

    // ✅ si responden mensaje
    } else if (ctx?.participant) {

        user1 = sender
        user2 = ctx.participant

    } else {

        return sock.sendMessage(from, {
            text: '⚠️ Menciona a 1 o 2 personas para usar ship'
        }, { quoted: m })
    }

    // 🚫 evitar mismo usuario
    if (user1 === user2) {
        return sock.sendMessage(from, {
            text: '💀 No puedes hacer ship con la misma persona'
        }, { quoted: m })
    }

    const percent = randomShip()

    await sock.sendMessage(from, {
        react: { text: '💘', key: m.key }
    })

    let msg = ''

    if (percent <= 20) {
        msg = '💔 Cero compatibilidad…'
    } else if (percent <= 50) {
        msg = '💞 Algo hay…'
    } else if (percent <= 80) {
        msg = '💖 Buena conexión'
    } else {
        msg = '💘 AMOR PERFECTO'
    }

    return sock.sendMessage(from, {
        text:
`💘 SPIDER SHIP 💘

👤 Usuario 1: @${user1.split('@')[0]}
👤 Usuario 2: @${user2.split('@')[0]}

📊 Compatibilidad: ${percent}%

${msg}`,
        mentions: [user1, user2]
    }, { quoted: m })
}

handler.command = ['ship']
handler.tags = ['juegos']
handler.group = true
handler.menu = true

export default handler
