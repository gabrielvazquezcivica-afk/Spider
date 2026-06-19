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
    fs.writeFileSync(
        fightDB,
        JSON.stringify(db, null, 2)
    )
}

function getRegDB() {
    try {
        if (!fs.existsSync(regDB)) {
            fs.writeFileSync(regDB, JSON.stringify({}))
            return {}
        }
        return JSON.parse(fs.readFileSync(regDB, 'utf8'))
    } catch {
        return {}
    }
}

function saveRegDB(db) {
    fs.writeFileSync(
        regDB,
        JSON.stringify(db, null, 2)
    )
}

function bar(hp) {
    const filled = Math.max(0, Math.floor(hp / 10))
    const empty = 10 - filled
    return '🟩'.repeat(filled) + '⬜'.repeat(empty)
}

const handler = async ({
    sock,
    m,
    from,
    sender,
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

    const fights = getFightDB()
    const regs = getRegDB()

    const fight = fights[from]

    if (!fight || !fight.active) {
        return sock.sendMessage(from,{
            text:'⚠️ No hay pelea activa.'
        },{ quoted:m })
    }

    if (
        sender !== fight.challenger &&
        sender !== fight.target
    ) {
        return sock.sendMessage(from,{
            text:'⚠️ No participas en esta pelea.'
        },{ quoted:m })
    }

    if (fight.turn !== sender) {
        const turnId = fight.turn.split('@')[0]

        return sock.sendMessage(from,{
            text:`⚠️ No es tu turno.\nTurno de @${turnId}`,
            mentions:[fight.turn]
        },{ quoted:m })
    }

    const damage =
        Math.floor(Math.random() * 23) + 8

    let attacker
    let defender
    let winner = null

    if (sender === fight.challenger) {
        fight.hp2 -= damage
        fight.turn = fight.target
        attacker = fight.challenger
        defender = fight.target

        if (fight.hp2 <= 0)
            winner = fight.challenger
    } else {
        fight.hp1 -= damage
        fight.turn = fight.challenger
        attacker = fight.target
        defender = fight.challenger

        if (fight.hp1 <= 0)
            winner = fight.target
    }

    if (fight.hp1 < 0) fight.hp1 = 0
    if (fight.hp2 < 0) fight.hp2 = 0

    const attackerId = attacker.split('@')[0]
    const defenderId = defender.split('@')[0]

    // FINALIZAR
    if (winner) {
        const winnerId = winner.split('@')[0]
        const loserId =
            winner === fight.challenger
                ? fight.target.split('@')[0]
                : fight.challenger.split('@')[0]

        regs[winnerId].dinero += fight.bet
        regs[loserId].dinero -= fight.bet

        if (regs[loserId].dinero < 0)
            regs[loserId].dinero = 0

        regs[winnerId].exp =
            (regs[winnerId].exp || 0) + 60

        regs[winnerId].nivel =
            regs[winnerId].nivel || 1

        let levelup = false

        while (regs[winnerId].exp >= 200) {
            regs[winnerId].exp -= 200
            regs[winnerId].nivel += 1
            levelup = true
        }

        saveRegDB(regs)

        delete fights[from]
        saveFightDB(fights)

        return sock.sendMessage(from,{
            text:
`╭━━━〔 ⚔️ KO 〕━━━⬣
┃
┃ 💥 @${attackerId}
┃ hizo ${damage} de daño
┃ a @${defenderId}
┃
┃ 🏆 Ganador:
┃ @${winnerId}
┃
┃ 💰 Premio:
┃ $${fight.bet}
┃
┃ ⭐ Exp:
┃ +60
${levelup ? '┃ 🎉 SUBIÓ DE NIVEL' : ''}
┃
╰━━━━━━━━━━━━━━━━⬣`,
            mentions:[
                attacker,
                defender,
                winner
            ]
        },{ quoted:m })
    }

    saveFightDB(fights)

    await sock.sendMessage(from,{
        text:
`╭━━━〔 ⚔️ ATAQUE 〕━━━⬣
┃
┃ 💥 @${attackerId}
┃ hizo ${damage} daño
┃ a @${defenderId}
┃
┃ ❤️ HP 1: ${fight.hp1}
┃ ${bar(fight.hp1)}
┃
┃ ❤️ HP 2: ${fight.hp2}
┃ ${bar(fight.hp2)}
┃
┃ 🎯 Turno:
┃ @${fight.turn.split('@')[0]}
┃
╰━━━━━━━━━━━━━━━━⬣`,
        mentions:[
            attacker,
            defender,
            fight.turn
        ]
    },{ quoted:m })
}

handler.command = ['ataque']
handler.tags = ['rpg']
handler.group = true
handler.menu = false

export default handler