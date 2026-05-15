import fs from 'fs'

const path = './data/casados.json'
const modoadminPath = './data/modoadmin.json'

// 📥 DB matrimonios
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

// 🔒 modoadmin
function getModoAdmin() {
    try {
        if (!fs.existsSync(modoadminPath)) return {}
        return JSON.parse(fs.readFileSync(modoadminPath, 'utf-8'))
    } catch {
        return {}
    }
}

const handler = async ({
    sock,
    m,
    from,
    sender,
    isGroup,
    participants
}) => {

    if (!isGroup) return

    // 🔒 MODODADMIN
    const modoadmin = getModoAdmin()

    const isBlockedGroup = modoadmin[from]

    if (isBlockedGroup) {

        const user = participants.find(
            p => p.id === sender
        )

        const isAdmin =
            user?.admin === 'admin' ||
            user?.admin === 'superadmin'

        if (!isAdmin) return
    }

    const db = getDB()

    // 💔 buscar pareja
    const pareja = db[sender]

    if (!pareja) {
        return sock.sendMessage(from,{
            text:'💔 No estás casado con nadie'
        },{ quoted:m })
    }

    // ⚡ reacción
    await sock.sendMessage(from,{
        react:{ text:'💔', key:m.key }
    })

    // 🗑️ borrar ambos
    delete db[sender]
    delete db[pareja]

    saveDB(db)

    return sock.sendMessage(from,{
        text:
`💔 DIVORCIO

👤 @${sender.split('@')[0]}
💔 se divorció de
👤 @${pareja.split('@')[0]}

🥀 El amor terminó...`,
        mentions:[sender, pareja]
    },{ quoted:m })
}

handler.command = ['divorcio','divorce']
handler.tags = ['juegos']
handler.group = true
handler.menu = true

export default handler