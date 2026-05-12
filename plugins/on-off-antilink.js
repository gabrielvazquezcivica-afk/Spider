import fs from 'fs'

const path = './data/antilink.json'

// 📥 DB
function getDB() {
    try {
        if (!fs.existsSync(path)) return {}
        return JSON.parse(
            fs.readFileSync(path, 'utf-8')
        )
    } catch {
        return {}
    }
}

// 💾 guardar
function saveDB(data) {
    fs.writeFileSync(
        path,
        JSON.stringify(data, null, 2)
    )
}

const handler = async ({
    sock,
    m,
    from,
    args,
    participants,
    sender,
    isGroup
}) => {

    if (!isGroup) return

    // 👑 admin
    const user =
        participants.find(
            p => p.id === sender
        )

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    if (!isAdmin) {

        return sock.sendMessage(from, {
            text:
'⚠️ Solo administradores pueden usar este comando'
        }, { quoted: m })
    }

    const db = getDB()

    if (!db[from]) {

        db[from] = {
            enabled: false
        }
    }

    const option =
        args[0]?.toLowerCase()

    // ❓ ayuda
    if (!option) {

        return sock.sendMessage(from, {
            text:
`🕷️ Uso correcto:

.antilink on
.antilink off`
        }, { quoted: m })
    }

    // 🟢 ON
    if (option === 'on') {

        if (db[from].enabled) {

            return sock.sendMessage(from, {
                text:
'⚠️ El AntiLink ya estaba activado'
            }, { quoted: m })
        }

        db[from].enabled = true

        saveDB(db)

        return sock.sendMessage(from, {
            text:
'🕸️ AntiLink activado'
        }, { quoted: m })
    }

    // 🔴 OFF
    if (option === 'off') {

        if (!db[from].enabled) {

            return sock.sendMessage(from, {
                text:
'⚠️ El AntiLink ya estaba desactivado'
            }, { quoted: m })
        }

        db[from].enabled = false

        saveDB(db)

        return sock.sendMessage(from, {
            text:
'🕷️ AntiLink desactivado'
        }, { quoted: m })
    }

    return sock.sendMessage(from, {
        text:
'⚠️ Usa solamente on/off'
    }, { quoted: m })
}

handler.command = ['antilink']
handler.tags = ['on-off']
handler.group = true
handler.menu = true

export default handler
