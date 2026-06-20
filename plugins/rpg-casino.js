import fs from 'fs'

const pathDB = './data/registros.json'
const cooldownDB = './data/casino_cd.json'

function getDB(path) {
    try {
        if (!fs.existsSync(path)) {
            fs.writeFileSync(path, JSON.stringify({}))
            return {}
        }
        return JSON.parse(fs.readFileSync(path, 'utf8'))
    } catch {
        return {}
    }
}

function saveDB(path, data) {
    fs.writeFileSync(path, JSON.stringify(data, null, 2))
}

const handler = async ({
    sock,
    m,
    from,
    sender,
    args,
    participants
}) => {

    // MODODADMIN
    let isBlockedGroup = false
    try {
        const adminDB = JSON.parse(
            fs.readFileSync('./data/modoadmin.json', 'utf8')
        )
        isBlockedGroup = adminDB[from]
    } catch {}

    const user = participants?.find(
        p => p.id === sender
    )

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    if (isBlockedGroup && !isAdmin) return

    const db = getDB(pathDB)
    const cooldown = getDB(cooldownDB)

    const id = sender.split('@')[0]

    if (!db[id]) {
        return sock.sendMessage(from, {
            text: '⚠️ Debes registrarte con .reg'
        }, { quoted: m })
    }

    const now = Date.now()
    const cd = 15 * 60 * 1000

    if (cooldown[id] && now < cooldown[id]) {
        const left = cooldown[id] - now
        const mins = Math.floor(left / 60000)
        const secs = Math.floor((left % 60000) / 1000)

        return sock.sendMessage(from, {
            text: `⏳ Espera ${mins}m ${secs}s para volver al casino`
        }, { quoted: m })
    }

    const apuesta = parseInt(args[0])

    if (!apuesta || apuesta <= 0) {
        return sock.sendMessage(from, {
            text: '🎰 Usa:\n.casino 500'
        }, { quoted: m })
    }

    if (db[id].dinero < apuesta) {
        return sock.sendMessage(from, {
            text: '⚠️ No tienes suficiente dinero.'
        }, { quoted: m })
    }

    cooldown[id] = now + cd
    saveDB(cooldownDB, cooldown)

    const slots = ['🍒', '🍋', '🍉', '💎', '7️⃣']

    const rand = () =>
        slots[Math.floor(Math.random() * slots.length)]

    await sock.sendMessage(from, {
        text: '🎰 Girando...\n❔ ❔ ❔'
    }, { quoted: m })

    await new Promise(r => setTimeout(r, 1000))
    await sock.sendMessage(from, { text: `🎰\n${rand()} ❔ ❔` })

    await new Promise(r => setTimeout(r, 1000))
    await sock.sendMessage(from, { text: `🎰\n${rand()} ${rand()} ❔` })

    await new Promise(r => setTimeout(r, 1000))

    const a = rand()
    const b = rand()
    const c = rand()

    let reward = 0
    let result = ''

    if (a === b && b === c) {

        if (a === '7️⃣') {
            reward = apuesta * 20
            result = '🔥 ULTRA JACKPOT x20'
        }
        else if (a === '💎') {
            reward = apuesta * 10
            result = '💎 DIAMOND JACKPOT x10'
        }
        else {
            reward = apuesta * 4
            result = '🎉 JACKPOT x4'
        }

    } else if (
        a === b ||
        b === c ||
        a === c
    ) {
        reward = apuesta * 2
        result = '✨ Premio x2'
    } else {
        reward = -apuesta
        result = '💀 Perdiste'
    }

    db[id].dinero += reward
    db[id].exp = (db[id].exp || 0) + 20
    db[id].nivel = db[id].nivel || 1

    let levelup = false

    while (db[id].exp >= 200) {
        db[id].exp -= 200
        db[id].nivel += 1
        levelup = true
    }

    saveDB(pathDB, db)

    await sock.sendMessage(from, {
        text:
`╭━━━〔 🎰 CASINO 〕━━━⬣
┃
┃ ${a} ${b} ${c}
┃
┃ ${result}
┃
┃ 💰 Cambio:
┃ ${reward >= 0 ? '+' : ''}${reward}
┃
┃ 💵 Dinero:
┃ ${db[id].dinero}
${levelup ? '┃ 🎉 SUBISTE DE NIVEL' : ''}
┃
╰━━━━━━━━━━━━━━━━⬣`
    }, { quoted: m })
}

handler.command = ['casino']
handler.tags = ['rpg']
handler.group = true
handler.menu = true

export default handler