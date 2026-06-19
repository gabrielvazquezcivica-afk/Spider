import fs from 'fs'

const fightDB = './data/peleas.json'
const regDB = './data/registros.json'

function getFightDB() {
    try {
        if (!fs.existsSync(fightDB)) {
            fs.writeFileSync(
                fightDB,
                JSON.stringify({})
            )
            return {}
        }

        return JSON.parse(
            fs.readFileSync(
                fightDB,
                'utf8'
            )
        )
    } catch {
        return {}
    }
}

function saveFightDB(db) {
    fs.writeFileSync(
        fightDB,
        JSON.stringify(
            db,
            null,
            2
        )
    )
}

function getRegDB() {
    try {
        if (!fs.existsSync(regDB)) {
            fs.writeFileSync(
                regDB,
                JSON.stringify({})
            )
            return {}
        }

        return JSON.parse(
            fs.readFileSync(
                regDB,
                'utf8'
            )
        )
    } catch {
        return {}
    }
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
        const db = JSON.parse(
            fs.readFileSync(
                './data/modoadmin.json'
            )
        )

        isBlockedGroup = db[from]

    } catch {}

    const adminUser =
        participants?.find(
            p => p.id === sender
        )

    const isAdmin =
        adminUser?.admin === 'admin' ||
        adminUser?.admin === 'superadmin'

    if (
        isBlockedGroup &&
        !isAdmin
    ) return

    const registros = getRegDB()
    const peleas = getFightDB()

    const myId =
        sender.split('@')[0]

    if (!registros[myId]) {
        return sock.sendMessage(from,{
            text:'⚠️ Debes registrarte con .reg'
        },{ quoted:m })
    }

    const apuesta =
        parseInt(args[0])

    if (
        !apuesta ||
        apuesta <= 0
    ) {
        return sock.sendMessage(from,{
            text:
`⚠️ Usa:

.pelear 500 @usuario`
        },{ quoted:m })
    }

    if (
        registros[myId].dinero <
        apuesta
    ) {
        return sock.sendMessage(from,{
            text:'⚠️ No tienes suficiente dinero.'
        },{ quoted:m })
    }

    const messageType =
        Object.keys(
            m.message || {}
        )[0]

    const contextInfo =
        m.message?.[messageType]
        ?.contextInfo || {}

    let target = null

    if (contextInfo.participant)
        target =
            contextInfo.participant

    if (
        contextInfo.mentionedJid &&
        contextInfo.mentionedJid.length
    ) {
        target =
            contextInfo
            .mentionedJid[0]
    }

    if (!target) {
        return sock.sendMessage(from,{
            text:
'⚠️ Menciona o responde a alguien.'
        },{ quoted:m })
    }

    if (target === sender) {
        return sock.sendMessage(from,{
            text:
'⚠️ No puedes pelear contigo mismo.'
        },{ quoted:m })
    }

    const targetId =
        target.split('@')[0]

    if (!registros[targetId]) {
        return sock.sendMessage(from,{
            text:
'⚠️ Ese usuario no está registrado.'
        },{ quoted:m })
    }

    if (
        registros[targetId].dinero <
        apuesta
    ) {
        return sock.sendMessage(from,{
            text:
'⚠️ El rival no tiene suficiente dinero.'
        },{ quoted:m })
    }

    if (peleas[from]) {
        return sock.sendMessage(from,{
            text:
'⚠️ Ya existe una pelea en este grupo.'
        },{ quoted:m })
    }

    peleas[from] = {
        challenger: sender,
        target,
        bet: apuesta,
        pending: true
    }

    saveFightDB(peleas)

    await sock.sendMessage(from,{
        text:
`╭━━━〔 ⚔️ DESAFÍO 〕━━━⬣
┃
┃ 🥊 @${myId}
┃ desafió a
┃ @${targetId}
┃
┃ 💰 Apuesta:
┃ $${apuesta}
┃
┃ Usa:
┃ .aceptar
┃ .rechazar
┃
╰━━━━━━━━━━━━━━━━⬣`,
        mentions:[
            sender,
            target
        ]
    },{ quoted:m })
}

handler.command = ['pelear']
handler.tags = ['rpg']
handler.group = true
handler.menu = true

export default handler