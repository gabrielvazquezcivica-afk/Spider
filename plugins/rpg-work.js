import fs from 'fs'

const pathDB = './data/registros.json'
const COOLDOWN = 45 * 60 * 1000

function getDB() {
    try {
        if (!fs.existsSync(pathDB)) {
            fs.writeFileSync(pathDB, JSON.stringify({}))
            return {}
        }

        return JSON.parse(
            fs.readFileSync(pathDB, 'utf8')
        )
    } catch {
        return {}
    }
}

function saveDB(db) {
    fs.writeFileSync(
        pathDB,
        JSON.stringify(db, null, 2)
    )
}

function formatTime(ms) {
    const min = Math.floor(ms / 60000)
    const sec = Math.floor((ms % 60000) / 1000)
    return `${min}m ${sec}s`
}

const trabajos = [
    'Programador',
    'Taxista',
    'Minero',
    'Cocinero',
    'Policía',
    'Doctor',
    'Mecánico',
    'Streamer',
    'Youtuber',
    'Electricista'
]

const handler = async ({
    sock,
    m,
    from,
    sender,
    participants
}) => {

    // 🔒 MODODADMIN
    let isBlockedGroup = false

    try {
        const adminDB = JSON.parse(
            fs.readFileSync(
                './data/modoadmin.json',
                'utf8'
            )
        )

        isBlockedGroup = adminDB[from]
    } catch {}

    const userAdmin = participants?.find(
        p => p.id === sender
    )

    const isAdmin =
        userAdmin?.admin === 'admin' ||
        userAdmin?.admin === 'superadmin'

    if (
        isBlockedGroup &&
        !isAdmin
    ) return

    const db = getDB()
    const id = sender.split('@')[0]

    if (!db[id]) {
        return sock.sendMessage(
            from,
            {
                text:
'⚠️ Debes registrarte primero con .reg'
            },
            {
                quoted: m
            }
        )
    }

    const user = db[id]

    if (!user.lastWork)
        user.lastWork = 0

    const now = Date.now()
    const diff = now - user.lastWork

    if (diff < COOLDOWN) {
        return sock.sendMessage(
            from,
            {
                text:
`⏳ Ya trabajaste.

Vuelve en:
${formatTime(COOLDOWN - diff)}`
            },
            {
                quoted: m
            }
        )
    }

    await sock.sendMessage(from, {
        react: {
            text: '💼',
            key: m.key
        }
    })

    const trabajo =
        trabajos[
            Math.floor(
                Math.random() * trabajos.length
            )
        ]

    const pago =
        Math.floor(
            Math.random() * 900
        ) + 100

    user.dinero += pago
    user.lastWork = now

    saveDB(db)

    await sock.sendMessage(
        from,
        {
            text:
`╭━━━〔 💼 WORK 〕━━━⬣
┃
┃ 🧰 Trabajo:
┃ ${trabajo}
┃
┃ 💵 Ganaste:
┃ $${pago}
┃
┃ 💰 Dinero:
┃ $${user.dinero}
┃
╰━━━━━━━━━━━━━━━━⬣

> SPIDER BOT`
        },
        {
            quoted: m
        }
    )

    await sock.sendMessage(from, {
        react: {
            text: '✅',
            key: m.key
        }
    })
}

handler.command = ['work']
handler.tags = ['rpg']
handler.help = ['work']
handler.group = true
handler.menu = true

export default handler