import fs from 'fs'

const fightDB = './data/peleas.json'
const regDB = './data/registros.json'

function getFightDB() {
    try {
        if (!fs.existsSync(fightDB)) {
            fs.writeFileSync(fightDB, JSON.stringify({}))
            return {}
        }
        return JSON.parse(fs.readFileSync(fightDB, 'utf8'))
    } catch {
        return {}
    }
}

function saveFightDB(db) {
    fs.writeFileSync(fightDB, JSON.stringify(db, null, 2))
}

function getRegDB() {
    try {
        return JSON.parse(fs.readFileSync(regDB, 'utf8'))
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
            fs.readFileSync('./data/modoadmin.json')
        )
        isBlockedGroup = db[from]
    } catch {}

    const user = participants?.find(p => p.id === sender)

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    if (isBlockedGroup && !isAdmin) return

    const regs = getRegDB()
    const fights = getFightDB()

    const myId = sender.split('@')[0]

    if (!regs[myId]) {
        return sock.sendMessage(from,{
            text:'⚠️ Debes registrarte.'
        },{ quoted:m })
    }

    const amount = parseInt(args[0])

    if (!amount || amount <= 0) {
        return sock.sendMessage(from,{
            text:'⚠️ Usa: .pelear 500 @usuario'
        },{ quoted:m })
    }

    const messageType = Object.keys(m.message || {})[0]
    const contextInfo = m.message?.[messageType]?.contextInfo || {}

    let target = null

    if (contextInfo.participant)
        target = contextInfo.participant

    if (contextInfo.mentionedJid?.length)
        target = contextInfo.mentionedJid[0]

    if (!target) {
        return sock.sendMessage(from,{
            text:'⚠️ Menciona o responde a alguien.'
        },{ quoted:m })
    }

    const targetId = target.split('@')[0]

    if (!regs[targetId]) {
        return sock.sendMessage(from,{
            text:'⚠️ Usuario no registrado.'
        },{ quoted:m })
    }

    fights[from] = {
        challenger: sender,
        target,
        bet: amount
    }

    saveFightDB(fights)

    await sock.sendMessage(from,{
        text:
`⚔️ @${targetId}

Te desafiaron a pelear.

💰 Apuesta: $${amount}

.aceptar
.rechazar`,
        mentions:[target]
    },{ quoted:m })
}

handler.command = ['pelear']
handler.tags = ['rpg']
handler.group = true
handler.menu = true

export default handler