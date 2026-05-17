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

const handler = async ({
    sock,
    m,
    from,
    sender
}) => {

    // 🚫 evitar mensajes del bot
    if (m.key.fromMe) return

    // 👑 validar owner por LID
    const senderLid =
        sender.split('@')[0]

    const isOwner =
        config.ownerLid.includes(
            senderLid
        )

    if (!isOwner) {

        return sock.sendMessage(from,{
            text:'🕷️ Solo el owner puede usar este comando.'
        },{ quoted:m })
    }

    /* 👤 OBJETIVO */
    const ctx =
        m.message?.extendedTextMessage?.contextInfo

    const userRaw =
        ctx?.mentionedJid?.[0] ||
        ctx?.participant

    if (!userRaw) {

        return sock.sendMessage(from,{
            text:
`⚠️ Menciona o responde al usuario

Ejemplo:
.unban @usuario`
        },{ quoted:m })
    }

    const db = getDB()

    /* ❌ NO BANEADO */
    if (!db[userRaw]) {

        return sock.sendMessage(from,{
            text:
`⚠️ @${userRaw.split('@')[0]} no está baneado.`,
            mentions:[userRaw]
        },{ quoted:m })
    }

    /* ⚡ REACCIÓN */
    await sock.sendMessage(from,{
        react:{
            text:'✅',
            key:m.key
        }
    })

    /* 🗑️ ELIMINAR */
    delete db[userRaw]

    saveDB(db)

    /* 📩 MENSAJE */
    await sock.sendMessage(from,{
        text:
`╭━━━〔 ✅ UNBAN 〕━━━⬣
┃
┃ 👤 Usuario desbaneado
┃ 🔓 Acceso restaurado
┃
┃ 🆔 @${userRaw.split('@')[0]}
┃
╰━━━━━━━━━━━━⬣

> SPIDER BOT`,
        mentions:[userRaw]
    },{ quoted:m })
}

handler.command = ['unban']
handler.tags = ['owner']
handler.menu = true

export default handler