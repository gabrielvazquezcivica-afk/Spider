import fs from 'fs'

const petDB = './data/mascotas.json'
const regDB = './data/registros.json'
const fightDB = './data/peleasmascota.json'

function readJSON(path) {
    try {
        if (!fs.existsSync(path)) {
            fs.writeFileSync(path, JSON.stringify({}))
            return {}
        }
        return JSON.parse(fs.readFileSync(path, 'utf8'))
    } catch {
        return {}
    }
}

function saveJSON(path, data) {
    fs.writeFileSync(
        path,
        JSON.stringify(data, null, 2)
    )
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
            fs.readFileSync('./data/modoadmin.json')
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

    if (isBlockedGroup && !isAdmin) return

    const pets = readJSON(petDB)
    const regs = readJSON(regDB)
    const fights = readJSON(fightDB)

    const myId = sender.split('@')[0]

    if (!pets[myId]) {
        return sock.sendMessage(from, {
            text: '⚠️ No tienes mascota.'
        }, { quoted: m })
    }

    const apuesta = parseInt(args[0])

    if (!apuesta || apuesta <= 0) {
        return sock.sendMessage(from, {
            text: '.peleamascota 500 @usuario'
        }, { quoted: m })
    }

    const context =
        m.message?.extendedTextMessage
            ?.contextInfo || {}

    let target = null

    if (context.participant)
        target = context.participant

    if (
        context.mentionedJid &&
        context.mentionedJid.length
    ) {
        target =
            context.mentionedJid[0]
    }

    if (!target) {
        return sock.sendMessage(from, {
            text: '⚠️ Menciona a alguien.'
        }, { quoted: m })
    }

    const targetId =
        target.split('@')[0]

    if (!pets[targetId]) {
        return sock.sendMessage(from, {
            text: '⚠️ Ese usuario no tiene mascota.'
        }, { quoted: m })
    }

    if (fights[from]) {
        return sock.sendMessage(from, {
            text: '⚠️ Ya hay una pelea activa.'
        }, { quoted: m })
    }

    fights[from] = {
        challenger: sender,
        target,
        bet: apuesta,
        pending: true,
        createdAt: Date.now()
    }

    saveJSON(fightDB, fights)

    // TIMEOUT AUTOMÁTICO
    setTimeout(async () => {

        const db = readJSON(fightDB)
        const pelea = db[from]

        if (
            pelea &&
            pelea.pending &&
            pelea.challenger === sender
        ) {
            delete db[from]
            saveJSON(fightDB, db)

            await sock.sendMessage(from, {
                text:
`⏳ @${targetId} no aceptó la pelea en 2 minutos.

❌ Pelea cancelada automáticamente.`,
                mentions: [target]
            })
        }

    }, 120000)

    await sock.sendMessage(from, {
        text:
`╭━━━〔 🐾 PELEA MASCOTA 〕━━━⬣
┃
┃ @${myId}
┃ desafía a
┃ @${targetId}
┃
┃ 💰 Apuesta:
┃ ${apuesta}
┃
┃ Usa:
┃ .acceptpet
┃
┃ ⏳ Expira en 2 min
┃
╰━━━━━━━━━━━━━━━━⬣`,
        mentions: [
            sender,
            target
        ]
    }, { quoted: m })
}

handler.command = ['peleamascota']
handler.tags = ['rpg']
handler.group = true
handler.menu = true

export default handler