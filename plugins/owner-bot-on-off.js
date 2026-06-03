import fs from 'fs'
import config from '../config.js'

const file = './data/apagado.json'

function getDB() {
    try {
        if (!fs.existsSync(file)) return []
        return JSON.parse(fs.readFileSync(file))
    } catch {
        return []
    }
}

function saveDB(data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

const handler = async ({
    sock,
    m,
    from,
    sender,
    isGroup,
    args
}) => {

    if (!isGroup) return

    const senderNum =
        sender.replace(/[^0-9]/g, '')

    const isOwner =
        config.ownerLid?.includes(senderNum)

    if (!isOwner) {
        return sock.sendMessage(from,{
            text:'❌ Solo el owner puede usar este comando.'
        },{ quoted:m })
    }

    let db = getDB()

    const option =
        args[0]?.toLowerCase()

    if (!option) {
        return sock.sendMessage(from,{
            text:
`🕷️ CONTROL DEL BOT

.apagar on
.apagar off`
        },{ quoted:m })
    }

    if (option === 'on') {

        if (!db.includes(from)) {
            db.push(from)
            saveDB(db)
        }

        return sock.sendMessage(from,{
            text:'🔴 Bot apagado en este grupo.'
        },{ quoted:m })
    }

    if (option === 'off') {

        db = db.filter(
            id => id !== from
        )

        saveDB(db)

        return sock.sendMessage(from,{
            text:'🟢 Bot activado nuevamente.'
        },{ quoted:m })
    }
}

handler.command = ['apagar']
handler.tags = ['owner']
handler.group = true
handler.menu = true

export default handler

export async function before({
    m,
    from,
    isGroup,
    sender
}) {

    if (!isGroup) return false

    const db = getDB()

    if (!db.includes(from))
        return false

    const senderNum =
        sender.replace(/[^0-9]/g, '')

    const isOwner =
        config.ownerLid?.includes(senderNum)

    if (isOwner)
        return false

    return true
}