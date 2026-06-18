import fs from 'fs'
import config from '../config.js'

const pathDB = './data/registros.json'

function getDB() {
    try {
        if (!fs.existsSync(pathDB)) {
            fs.writeFileSync(
                pathDB,
                JSON.stringify({})
            )
            return {}
        }

        return JSON.parse(
            fs.readFileSync(
                pathDB,
                'utf8'
            )
        )
    } catch {
        return {}
    }
}

function saveDB(db) {
    fs.writeFileSync(
        pathDB,
        JSON.stringify(
            db,
            null,
            2
        )
    )
}

const handler = async ({
    sock,
    m,
    from,
    sender
}) => {

    // OWNER CHECK
    const senderLid =
        sender.split('@')[0]

    const isOwner =
        config.ownerLid.includes(
            senderLid
        )

    if (!isOwner) {
        return sock.sendMessage(
            from,
            {
                text:
'🕷️ Solo el owner puede usar este comando.'
            },
            {
                quoted: m
            }
        )
    }

    // DETECTAR TARGET
    const messageType =
        Object.keys(
            m.message || {}
        )[0]

    const contextInfo =
        m.message?.[messageType]
        ?.contextInfo || {}

    let target = null

    if (contextInfo.participant) {
        target =
            contextInfo.participant
    }

    if (
        contextInfo.mentionedJid &&
        contextInfo.mentionedJid.length
    ) {
        target =
            contextInfo
            .mentionedJid[0]
    }

    if (!target) {
        return sock.sendMessage(
            from,
            {
                text:
'⚠️ Responde o menciona a un usuario.'
            },
            {
                quoted: m
            }
        )
    }

    const db = getDB()
    const id =
        target.split('@')[0]

    if (!db[id]) {
        return sock.sendMessage(
            from,
            {
                text:
'⚠️ Ese usuario no está registrado.'
            },
            {
                quoted: m
            }
        )
    }

    const user = db[id]

    if (!user.nivel)
        user.nivel = 1

    if (!user.dinero)
        user.dinero = 0

    if (!user.vida)
        user.vida = 100

    if (!user.energia)
        user.energia = 0

    // CHEAT
    user.nivel += 10
    user.dinero += 10000
    user.vida += 100
    user.energia += 50

    saveDB(db)

    await sock.sendMessage(
        from,
        {
            text:
`╭━━━〔 ⚡ CHETAR 〕━━━⬣
┃
┃ 👤 Usuario:
┃ @${id}
┃
┃ ⭐ Nivel:
┃ +10
┃
┃ 💰 Dinero:
┃ +10000
┃
┃ ❤️ Vida:
┃ +100
┃
┃ ⚡ Energía:
┃ +50
┃
╰━━━━━━━━━━━━━━━━⬣

> SPIDER BOT`,
            mentions: [target]
        },
        {
            quoted: m
        }
    )
}

handler.command = ['chetar']
handler.tags = ['owner']
handler.help = ['chetar @user']
handler.group = true
handler.menu = true

export default handler