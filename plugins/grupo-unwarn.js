import fs from 'fs'

const path = './data/warns.json'

function getDB() {

    try {

        if (!fs.existsSync(path))
            return {}

        return JSON.parse(
            fs.readFileSync(path,'utf-8')
        )

    } catch {

        return {}
    }
}

function saveDB(data) {

    fs.writeFileSync(
        path,
        JSON.stringify(data,null,2)
    )
}

function onlyNumber(jid = '') {

    return jid.replace(/[^0-9]/g,'')
}

const handler = async (ctx) => {

    const {
        sock,
        m,
        from,
        sender,
        isGroup,
        participants
    } = ctx

    if (!isGroup) {

        return sock.sendMessage(from,{
            text:'⚠️ Este comando solo funciona en grupos'
        },{ quoted:m })
    }

    /* 🔒 SOLO ADMINS */
    const user =
        participants.find(
            p => p.id === sender
        )

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    if (!isAdmin) {

        return sock.sendMessage(from,{
            text:'⚠️ Solo administradores pueden usar este comando'
        },{ quoted:m })
    }

    /* 👤 USUARIO */
    const ctxMsg =
        m.message?.extendedTextMessage
            ?.contextInfo

    const userRaw =
        ctxMsg?.mentionedJid?.[0] ||
        ctxMsg?.participant

    if (!userRaw) {

        return sock.sendMessage(from,{
            text:
`⚠️ Menciona o responde a un usuario

Ejemplo:
.unwarn @usuario`
        },{ quoted:m })
    }

    /* 📂 DB */
    const db = getDB()

    if (
        !db[from] ||
        !db[from][userRaw]
    ) {

        return sock.sendMessage(from,{
            text:'⚠️ Ese usuario no tiene advertencias'
        },{ quoted:m })
    }

    /* ➖ QUITAR WARN */
    db[from][userRaw].warns -= 1

    if (db[from][userRaw].warns <= 0) {

        delete db[from][userRaw]
    }

    saveDB(db)

    /* ⚡ REACCIÓN */
    await sock.sendMessage(from,{
        react:{
            text:'✅',
            key:m.key
        }
    })

    /* 📩 MENSAJE */
    await sock.sendMessage(from,{
        text:
`Advertencia removida de @${onlyNumber(userRaw)}
> Por @${onlyNumber(sender)}`,
        mentions:[
            userRaw,
            sender
        ]
    },{ quoted:m })
}

handler.command = ['unwarn']
handler.tags = ['grupo']
handler.group = true
handler.menu = true

export default handler