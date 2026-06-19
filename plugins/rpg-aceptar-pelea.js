import fs from 'fs'

const fightDB = './data/peleas.json'
const regDB = './data/registros.json'

function getFightDB() {
    try {
        return JSON.parse(fs.readFileSync(fightDB,'utf8'))
    } catch {
        return {}
    }
}

function saveFightDB(db) {
    fs.writeFileSync(fightDB, JSON.stringify(db,null,2))
}

function getRegDB() {
    try {
        return JSON.parse(fs.readFileSync(regDB,'utf8'))
    } catch {
        return {}
    }
}

function saveRegDB(db) {
    fs.writeFileSync(regDB, JSON.stringify(db,null,2))
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

    const user = participants?.find(p => p.id === sender)

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    if (isBlockedGroup && !isAdmin) return

    const fights = getFightDB()
    const regs = getRegDB()

    const fight = fights[from]

    if (!fight) {
        return sock.sendMessage(from,{
            text:'⚠️ No hay pelea.'
        },{ quoted:m })
    }

    if (fight.target !== sender) {
        return sock.sendMessage(from,{
            text:'⚠️ Esa pelea no es tuya.'
        },{ quoted:m })
    }

    const p1 = regs[fight.challenger.split('@')[0]]
    const p2 = regs[fight.target.split('@')[0]]

    let hp1 = 100
    let hp2 = 100

    while (hp1 > 0 && hp2 > 0) {
        hp2 -= Math.floor(Math.random()*20)+5
        if (hp2 <= 0) break
        hp1 -= Math.floor(Math.random()*20)+5
    }

    let winner

    if (hp1 > 0)
        winner = p1
    else
        winner = p2

    winner.dinero += fight.bet
    winner.exp = (winner.exp || 0) + 50
    winner.nivel = winner.nivel || 1

    if (winner.exp >= 200) {
        winner.exp -= 200
        winner.nivel += 1
    }

    saveRegDB(regs)

    delete fights[from]
    saveFightDB(fights)

    await sock.sendMessage(from,{
        text:
`⚔️ Pelea terminada

🏆 Ganador: ${winner.nombre}
💰 Premio: $${fight.bet}`
    },{ quoted:m })
}

handler.command = ['aceptar']
handler.tags = ['rpg']
handler.group = true
handler.menu = true

export default handler