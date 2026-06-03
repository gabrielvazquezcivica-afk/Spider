import fs from 'fs'
import config from '../config.js'

const file = './data/apagado.json'

function getDB() {

    try {

        if (!fs.existsSync(file))
            return []

        return JSON.parse(
            fs.readFileSync(
                file,
                'utf-8'
            )
        )

    } catch {

        return []
    }
}

function saveDB(data) {

    fs.writeFileSync(
        file,
        JSON.stringify(
            data,
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

    // 🕷️ REACCIÓN
    await sock.sendMessage(from,{
        react:{
            text:'🌀',
            key:m.key
        }
    })

    let db = getDB()

    const option =
        args[0]?.toLowerCase()

    if (!option) {

        return sock.sendMessage(from,{
            text:
`🕷️ CONTROL DEL BOT

.bot on
.bot off`
        },{ quoted:m })
    }

    // 🔴 APAGAR
    if (option === 'off') {

        if (!db.includes(from)) {

            db.push(from)
            saveDB(db)
        }

        return sock.sendMessage(from,{
            text:'🔴 Bot desactivado en este grupo.'
        },{ quoted:m })
    }

    // 🟢 ENCENDER
    if (option === 'on') {

        db = db.filter(
            id => id !== from
        )

        saveDB(db)

        return sock.sendMessage(from,{
            text:'🟢 Bot activado nuevamente en este grupo.'
        },{ quoted:m })
    }

    return sock.sendMessage(from,{
        text:'⚠️ Usa solamente:\n\n.bot on\n.bot off'
    },{ quoted:m })
}

handler.command = ['bot']
handler.tags = ['owner']
handler.group = true
handler.menu = true

export default handler