import fs from 'fs'

const pathDB = './data/registros.json'
const COOLDOWN = 20 * 60 * 1000

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

const handler = async ({
    sock,
    m,
    from,
    sender,
    args,
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

    if (isBlockedGroup && !isAdmin) return

    const db = getDB()
    const myId = sender.split('@')[0]

    if (!db[myId]) {
        return sock.sendMessage(from, {
            text: '⚠️ Debes registrarte primero con .reg'
        }, { quoted: m })
    }

    let target = null

    const quoted =
        m.message?.extendedTextMessage
        ?.contextInfo

    if (quoted?.participant)
        target = quoted.participant

    if (
        quoted?.mentionedJid &&
        quoted.mentionedJid.length
    ) {
        target = quoted.mentionedJid[0]
    }

    if (!target) {
        return sock.sendMessage(from, {
            text:
`⚠️ Debes responder o mencionar a alguien.

Ejemplo:
.robar 500 @usuario`
        }, { quoted: m })
    }

    if (target === sender) {
        return sock.sendMessage(from, {
            text: '⚠️ No puedes robarte a ti mismo.'
        }, { quoted: m })
    }

    const victimId = target.split('@')[0]

    if (!db[victimId]) {
        return sock.sendMessage(from, {
            text: '⚠️ Ese usuario no está registrado.'
        }, { quoted: m })
    }

    const amount = Number(args[0])

    if (!amount || amount <= 0) {
        return sock.sendMessage(from, {
            text:
`⚠️ Cantidad inválida.

Ejemplo:
.robar 500 @usuario`
        }, { quoted: m })
    }

    const robber = db[myId]
    const victim = db[victimId]

    if (!robber.lastRob)
        robber.lastRob = 0

    const now = Date.now()
    const diff = now - robber.lastRob

    if (diff < COOLDOWN) {
        return sock.sendMessage(from, {
            text:
`⏳ Debes esperar.

${formatTime(COOLDOWN - diff)}`
        }, { quoted: m })
    }

    robber.lastRob = now

    await sock.sendMessage(from, {
        react: {
            text: '🦹',
            key: m.key
        }
    })

    const success =
        Math.random() < 0.5

    if (success) {

        const stolen =
            Math.min(
                amount,
                victim.dinero
            )

        victim.dinero -= stolen
        robber.dinero += stolen

        saveDB(db)

        return sock.sendMessage(
            from,
            {
                text:
`╭━━━〔 🦹 ROBO 〕━━━⬣
┃
┃ ✅ Robo exitoso
┃
┃ 🕷️ Ladrón:
┃ @${myId}
┃
┃ 🎯 Víctima:
┃ @${victimId}
┃
┃ 💸 Robaste:
┃ $${stolen}
┃
╰━━━━━━━━━━━━━━━━⬣

> SPIDER BOT`,
                mentions: [
                    sender,
                    target
                ]
            },
            {
                quoted: m
            }
        )
    }

    const penalty =
        Math.min(
            amount,
            robber.dinero
        )

    robber.dinero -= penalty
    victim.dinero += penalty

    saveDB(db)

    return sock.sendMessage(
        from,
        {
            text:
`╭━━━〔 🚨 ROBO FALLIDO 〕━━━⬣
┃
┃ ❌ Te atraparon
┃
┃ 🕷️ Ladrón:
┃ @${myId}
┃
┃ 🎯 Víctima:
┃ @${victimId}
┃
┃ 💸 Perdiste:
┃ $${penalty}
┃
╰━━━━━━━━━━━━━━━━⬣

> SPIDER BOT`,
            mentions: [
                sender,
                target
            ]
        },
        {
            quoted: m
        }
    )
}

handler.command = ['robar']
handler.tags = ['rpg']
handler.help = ['robar <cantidad> @usuario']
handler.group = true
handler.menu = true

export default handler