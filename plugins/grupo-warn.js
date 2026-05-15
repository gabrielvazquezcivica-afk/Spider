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
        participants,
        pushName,
        args
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
.warn @usuario spam`
        },{ quoted:m })
    }

    /* ❌ NO WARN ADMINS */
    const target =
        participants.find(
            p => p.id === userRaw
        )

    const targetAdmin =
        target?.admin === 'admin' ||
        target?.admin === 'superadmin'

    if (targetAdmin) {

        return sock.sendMessage(from,{
            text:'⚠️ No puedes advertir a otro administrador'
        },{ quoted:m })
    }

    /* 📂 DB */
    const db = getDB()

    if (!db[from])
        db[from] = {}

    if (!db[from][userRaw]) {

        db[from][userRaw] = {
            warns:0
        }
    }

    /* ➕ WARN */
    db[from][userRaw].warns += 1

    const warns =
        db[from][userRaw].warns

    saveDB(db)

    /* 📝 RAZÓN */
    const reason =
        args.slice(1).join(' ') ||
        'Sin razón'

    /* ⚡ REACCIÓN */
    await sock.sendMessage(from,{
        react:{
            text:'⚠️',
            key:m.key
        }
    })

    /* 🚨 MENSAJE */
    await sock.sendMessage(from,{
        text:
`╭━━━〔 ⚠️ WARNING 〕━━━⬣
┃
┃ 👤 Usuario:
┃ @${onlyNumber(userRaw)}
┃
┃ 📌 Razón:
┃ ${reason}
┃
┃ 🚨 Advertencias:
┃ ${warns}/3
┃
┃ 👮 Admin:
┃ ${pushName}
╰━━━━━━━━━━━━━━━━⬣`,
        mentions:[userRaw]
    },{ quoted:m })

    /* ☠️ EXPULSAR */
    if (warns >= 3) {

        delete db[from][userRaw]

        saveDB(db)

        await sock.sendMessage(from,{
            text:
`☠️ @${onlyNumber(userRaw)} alcanzó las 3 advertencias y será expulsado.`,
            mentions:[userRaw]
        },{ quoted:m })

        try {

            await sock.groupParticipantsUpdate(
                from,
                [userRaw],
                'remove'
            )

        } catch {

            await sock.sendMessage(from,{
                text:'❌ No pude expulsar al usuario'
            },{ quoted:m })
        }
    }
}

handler.command = ['warn']
handler.tags = ['grupo']
handler.group = true
handler.menu = true

export default handler