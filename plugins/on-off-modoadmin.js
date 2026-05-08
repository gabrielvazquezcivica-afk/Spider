import fs from 'fs'

const path = './data/modoadmin.json'

// 📥 DB
function getDB() {
    try {
        if (!fs.existsSync(path)) return {}
        return JSON.parse(fs.readFileSync(path, 'utf-8'))
    } catch {
        return {}
    }
}

// 💾 guardar
function saveDB(data) {
    fs.writeFileSync(path, JSON.stringify(data, null, 2))
}

const handler = async ({ sock, m, from, isGroup, participants, sender }) => {

    if (!isGroup) return

    // 🔐 SOLO ADMINS
    const user = participants.find(p => p.id === sender)
    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    if (!isAdmin) {
        return sock.sendMessage(from, {
            text: '⚠️ Solo los administradores pueden usar este comando'
        }, { quoted: m })
    }

    let db = getDB()

    if (db[from]) {
        delete db[from]

        return sock.sendMessage(from, {
            text: '🕷️ Modo admin OFF'
        }, { quoted: m })
    }

    db[from] = true
    saveDB(db)

    return sock.sendMessage(from, {
        text: '🕸️ Modo admin ON'
    }, { quoted: m })
}

handler.command = ['modoadmin']
handler.tags = ['on-off']
handler.group = true
handler.menu = true

export default handler
