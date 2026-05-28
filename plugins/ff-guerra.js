import fs from 'fs'

const path = './data/modoadmin.json'

function getDB() {

    try {

        if (!fs.existsSync(path))
            return {}

        return JSON.parse(
            fs.readFileSync(path, 'utf-8')
        )

    } catch {

        return {}
    }
}

function footer() {

    return `\n\n> 𝐒𝐏𝐈𝐃𝐄𝐑 𝐁𝐎𝐓`
}

const handler = async ({
    sock,
    m,
    from,
    isGroup,
    participants,
    sender
}) => {

    // 🚫 evitar mensajes del bot
    if (m.key.fromMe) return

    // 🛑 solo grupos
    if (!isGroup) {

        return sock.sendMessage(from,{
            text:
'❌ Este comando solo funciona en grupos'
        },{
            quoted:m
        })
    }

    /* 🔒 MODODADMIN */
    const db = getDB()

    const isBlockedGroup =
        db[from]

    const user =
        participants.find(
            p => p.id === sender
        )

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    // 🚫 bloqueo silencioso
    if (
        isBlockedGroup &&
        !isAdmin
    ) return

    // 📢 menciones
    const mentions =
        participants.map(
            p => p.id
        )

    // ⚡ reacción
    await sock.sendMessage(from,{
        react:{
            text:'⚔️',
            key:m.key
        }
    })

    // 📤 aviso guerra
    await sock.sendMessage(from,{
        text:
`⚔️ *ATENCIÓN GRUPO* ⚔️

No olviden hacer la guerra que se les pidió.

🔥 Todos atentos y activos.
🏆 Den lo mejor por el clan + footer(),
        mentions
    },{
        quoted:m
    })

    // ✅ reacción
    await sock.sendMessage(from,{
        react:{
            text:'✅',
            key:m.key
        }
    })
}

handler.command = ['guerra']
handler.tags = ['ff']
handler.help = ['guerra']
handler.menu = true
handler.group = true

export default handler