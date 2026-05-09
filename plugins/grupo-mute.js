import fs from 'fs'

const path = './data/mute.json'

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

// 💾 SAVE
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
    participants,
    sender,
    isGroup
}) => {

    if (!isGroup) return

    // 🔐 SOLO ADMINS
    const user = participants.find(
        p => p.id === sender
    )

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    if (!isAdmin) {
        return sock.sendMessage(from,{
            text:'⚠️ Solo administradores pueden usar este comando'
        },{ quoted:m })
    }

    // 👤 USUARIO
    const ctx =
        m.message?.extendedTextMessage?.contextInfo

    const target =
        ctx?.mentionedJid?.[0] ||
        ctx?.participant

    if (!target) {
        return sock.sendMessage(from,{
            text:'⚠️ Menciona o responde al usuario'
        },{ quoted:m })
    }

    if (target === sender) {
        return sock.sendMessage(from,{
            text:'⚠️ No puedes mutearte'
        },{ quoted:m })
    }

    const db = getDB()

    if (!db[from]) {
        db[from] = []
    }

    // 🔇 YA MUTEADO = DESMUTEAR
    if (db[from].includes(target)) {

        db[from] =
            db[from].filter(
                x => x !== target
            )

        saveDB(db)

        return sock.sendMessage(from,{
            text:
`🕷️ Usuario desmuteado

👤 @${target.split('@')[0]}`,
            mentions:[target]
        },{ quoted:m })
    }

    // 🔇 MUTEAR
    db[from].push(target)

    saveDB(db)

    return sock.sendMessage(from,{
        text:
`🕸️ Usuario muteado

👤 @${target.split('@')[0]}

⚠️ Sus mensajes serán eliminados`,
        mentions:[target]
    },{ quoted:m })
}

handler.command = ['mute']
handler.tags = ['grupo']
handler.group = true
handler.menu = true

export default handler

// 🔥 BORRAR MENSAJES + BLOQUEAR COMANDOS
export async function before({
    sock,
    m,
    from,
    sender,
    isGroup
}) {

    if (!isGroup) return
    if (!m.message) return

    const db = getDB()

    if (!db[from]) return

    const isMuted =
        db[from].includes(sender)

    if (!isMuted) return

    try {

        // 🗑️ BORRAR MENSAJE
        await sock.sendMessage(from,{
            delete: m.key
        })

    } catch {}

    return true
               }
