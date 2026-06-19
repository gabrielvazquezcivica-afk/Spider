import fs from 'fs'

const pathDB = './data/registros.json'
const COOLDOWN = 30 * 60 * 1000

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

const crimenes = [
    'Robaste un banco',
    'Hackeaste una cuenta bancaria',
    'Asaltaste una joyería',
    'Vendiste mercancía ilegal',
    'Robaste un cajero',
    'Secuestraste un millonario',
    'Entraste a una mansión',
    'Robaste un auto de lujo'
]

const handler = async ({
    sock,
    m,
    from,
    sender,
    participants
}) => {

    // MODODADMIN
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

    if (isBlockedGroup && !isAdmin) return

    const db = getDB()
    const id = sender.split('@')[0]

    if (!db[id]) {
        return sock.sendMessage(from, {
            text: '⚠️ Debes registrarte con .reg'
        }, { quoted: m })
    }

    const user = db[id]

    if (!user.lastCrime)
        user.lastCrime = 0

    if (!user.exp)
        user.exp = 0

    if (!user.nivel)
        user.nivel = 1

    const now = Date.now()
    const diff = now - user.lastCrime

    if (diff < COOLDOWN) {
        return sock.sendMessage(from, {
            text:
`⏳ Debes esperar.

${formatTime(COOLDOWN - diff)}`
        }, { quoted: m })
    }

    user.lastCrime = now

    await sock.sendMessage(from, {
        react: {
            text: '🕵️',
            key: m.key
        }
    })

    const crimen =
        crimenes[
            Math.floor(
                Math.random() * crimenes.length
            )
        ]

    const escaped = Math.random() < 0.6

    if (escaped) {

        const reward =
            Math.floor(Math.random() * 181) + 120

        const gainedExp =
            Math.floor(Math.random() * 40) + 20

        user.dinero += reward
        user.exp += gainedExp

        let levelUp = false

        while (user.exp >= 200) {
            user.exp -= 200
            user.nivel += 1
            levelUp = true
        }

        saveDB(db)

        return sock.sendMessage(from, {
            text:
`╭━━━〔 🕵️ CRIMEN 〕━━━⬣
┃
┃ 🔥 Crimen:
┃ ${crimen}
┃
┃ ✅ Escapaste
┃
┃ 💰 Ganaste:
┃ $${reward}
┃
┃ ⭐ Exp:
┃ +${gainedExp}
┃
┃ 📊 Total Exp:
┃ ${user.exp}/200
┃
┃ 🏅 Nivel:
┃ ${user.nivel}
┃
${levelUp ? '┃\n┃ 🎉 SUBISTE DE NIVEL!' : ''}
╰━━━━━━━━━━━━━━━━⬣

> SPIDER BOT`
        }, { quoted: m })
    }

    saveDB(db)

    return sock.sendMessage(from, {
        text:
`╭━━━〔 🚔 CRIMEN 〕━━━⬣
┃
┃ 🔥 Crimen:
┃ ${crimen}
┃
┃ ❌ Fuiste atrapado
┃
┃ 🚓 La policía te arrestó
┃
╰━━━━━━━━━━━━━━━━⬣

> SPIDER BOT`
    }, { quoted: m })
}

handler.command = ['crimen']
handler.tags = ['rpg']
handler.help = ['crimen']
handler.group = true
handler.menu = true

export default handler