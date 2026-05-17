import fs from 'fs'
import config from '../config.js'

const banPath = './data/banned.json'

/* 📂 DB */
function getDB() {

    try {

        if (!fs.existsSync(banPath))
            return {}

        return JSON.parse(
            fs.readFileSync(
                banPath,
                'utf-8'
            )
        )

    } catch {

        return {}
    }
}

function saveDB(db) {

    fs.writeFileSync(
        banPath,
        JSON.stringify(
            db,
            null,
            2
        )
    )
}

function onlyNumber(jid = '') {

    return jid.replace(
        /[^0-9]/g,
        ''
    )
}

const handler = async (ctx) => {

    const {
        sock,
        m,
        from,
        sender
    } = ctx

    /* 👑 SOLO OWNER */
    if (
        !config.owner.includes(sender)
    ) {

        return sock.sendMessage(from,{
            text:'❌ Solo el owner puede usar este comando'
        },{ quoted:m })
    }

    /* 👤 OBJETIVO */
    const ctxMsg =
        m.message?.extendedTextMessage?.contextInfo

    const userRaw =
        ctxMsg?.mentionedJid?.[0] ||
        ctxMsg?.participant

    if (!userRaw) {

        return sock.sendMessage(from,{
            text:
`⚠️ Menciona o responde al usuario

Ejemplo:
.ban @usuario`
        },{ quoted:m })
    }

    /* 🚫 EVITAR OWNER */
    if (
        config.owner.includes(userRaw)
    ) {

        return sock.sendMessage(from,{
            text:'❌ No puedes banear a un owner'
        },{ quoted:m })
    }

    const db = getDB()

    /* 🚫 YA BANEADO */
    if (db[userRaw]) {

        return sock.sendMessage(from,{
            text:
`⚠️ @${onlyNumber(userRaw)} ya está baneado`,
            mentions:[userRaw]
        },{ quoted:m })
    }

    /* ⚡ REACCIÓN */
    await sock.sendMessage(from,{
        react:{
            text:'🚫',
            key:m.key
        }
    })

    /* 💾 GUARDAR */
    db[userRaw] = {
        banned:true,
        by:sender,
        time:Date.now()
    }

    saveDB(db)

    /* 📩 MENSAJE */
    await sock.sendMessage(from,{
        text:
`🚫 Usuario baneado del bot

👤 Usuario:
@${onlyNumber(userRaw)}

> Ya no podrá usar comandos`,
        mentions:[userRaw]
    },{ quoted:m })
}

/* ⚙️ CONFIG */
handler.command = ['ban']
handler.tags = ['owner']
handler.menu = true
handler.owner = true

export default handler