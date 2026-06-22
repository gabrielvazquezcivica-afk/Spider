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
    sender,
    args
}) => {

    // 👑 owner only
    const senderNum =
        sender.replace(/[^0-9]/g, '')

    if (
        !config.ownerLid?.includes(senderNum)
    ) {
        return sock.sendMessage(from,{
            text:
'🕷️ Solo el owner puede usar este comando.'
        },{ quoted:m })
    }

    let target = null

    // mención
    const mentioned =
        m.message?.extendedTextMessage
            ?.contextInfo
            ?.mentionedJid

    if (mentioned?.length) {
        target = mentioned[0]
    }

    // reply
    const quoted =
        m.message?.extendedTextMessage
            ?.contextInfo
            ?.participant

    if (quoted) {
        target = quoted
    }

    if (!target) {
        return sock.sendMessage(from,{
            text:
'⚠️ Menciona o responde a un usuario.'
        },{ quoted:m })
    }

    const amount =
        parseInt(args[0])

    if (
        !amount ||
        amount <= 0
    ) {
        return sock.sendMessage(from,{
            text:
'⚠️ Uso:\n.chetar2 50000'
        },{ quoted:m })
    }

    const db = getDB()
    const id =
        target.split('@')[0]

    if (!db[id]) {
        return sock.sendMessage(from,{
            text:
'⚠️ Ese usuario no está registrado.'
        },{ quoted:m })
    }

    db[id].dinero =
        (db[id].dinero || 0) + amount

    saveDB(db)

    await sock.sendMessage(from,{
        react:{
            text:'💰',
            key:m.key
        }
    })

    await sock.sendMessage(from,{
        text:
`╭━━━〔 💰 CHETAR2 〕━━━⬣
┃
┃ 👤 @${id}
┃
┃ +$${amount}
┃
┃ 💵 Total:
┃ ${db[id].dinero}
┃
╰━━━━━━━━━━━━━━━━⬣`,
        mentions:[target]
    },{ quoted:m })

    await sock.sendMessage(from,{
        react:{
            text:'✅',
            key:m.key
        }
    })
}

handler.command = ['chetar2']
handler.tags = ['owner']
handler.group = true
handler.menu = true

export default handler