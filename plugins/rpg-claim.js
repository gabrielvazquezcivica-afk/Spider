import fs from 'fs'

const pathDB = './data/registros.json'
const COOLDOWN = 24 * 60 * 60 * 1000

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
    const h = Math.floor(ms / 3600000)
    const m = Math.floor((ms % 3600000) / 60000)
    return `${h}h ${m}m`
}

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

    if (!user.lastClaim)
        user.lastClaim = 0

    const now = Date.now()
    const diff = now - user.lastClaim

    if (diff < COOLDOWN) {
        return sock.sendMessage(
            from,
            {
                text:
`⏳ Ya reclamaste tu recompensa diaria.

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
            text: '🎁',
            key: m.key
        }
    })

    const reward =
        Math.floor(Math.random() * 3000) + 1000

    user.dinero += reward
    user.lastClaim = now

    saveDB(db)

    await sock.sendMessage(
        from,
        {
            text:
`╭━━━〔 🎁 DAILY CLAIM 〕━━━⬣
┃
┃ 💸 Recompensa:
┃ $${reward}
┃
┃ 💰 Dinero total:
┃ $${user.dinero}
┃
┃ 🕒 Próximo claim:
┃ 24 horas
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

handler.command = ['claim']
handler.tags = ['rpg']
handler.help = ['claim']
handler.group = true
handler.menu = true

export default handler