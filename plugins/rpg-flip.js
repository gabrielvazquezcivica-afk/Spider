import fs from 'fs'

const pathDB = './data/registros.json'

function getDB() {
    try {
        if (!fs.existsSync(pathDB)) {
            fs.writeFileSync(pathDB, JSON.stringify({}))
            return {}
        }
        return JSON.parse(fs.readFileSync(pathDB, 'utf8'))
    } catch {
        return {}
    }
}

function saveDB(db) {
    fs.writeFileSync(
        pathDB,
        JSON.stringify(db, null, 2)
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
        const adminDB = JSON.parse(
            fs.readFileSync(
                './data/modoadmin.json',
                'utf8'
            )
        )
        isBlockedGroup = adminDB[from]
    } catch {}

    const user = participants?.find(
        p => p.id === sender
    )

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    if (isBlockedGroup && !isAdmin) return

    const db = getDB()
    const id = sender.split('@')[0]

    if (!db[id]) {
        return sock.sendMessage(from,{
            text:'⚠️ Debes registrarte.'
        },{ quoted:m })
    }

    const bet = parseInt(args[0])

    if (!bet || bet <= 0) {
        return sock.sendMessage(from,{
            text:'🎲 Usa:\n.flip 500'
        },{ quoted:m })
    }

    if (db[id].dinero < bet) {
        return sock.sendMessage(from,{
            text:'⚠️ No tienes suficiente dinero.'
        },{ quoted:m })
    }

    // 50/50 REAL
    const win = Math.random() < 0.5

    let msg = ''
    let change = 0

    if (win) {
        change = bet
        db[id].dinero += bet
        msg = '🎉 GANASTE'
    } else {
        change = -bet
        db[id].dinero -= bet
        msg = '💀 PERDISTE'
    }

    db[id].exp = (db[id].exp || 0) + 10
    db[id].nivel = db[id].nivel || 1

    let levelup = false

    while (db[id].exp >= 200) {
        db[id].exp -= 200
        db[id].nivel++
        levelup = true
    }

    saveDB(db)

    await sock.sendMessage(from,{
        text:
`╭━━━〔 🎲 COINFLIP 〕━━━⬣
┃
┃ ${win ? '🪙 CARA' : '🪙 CRUZ'}
┃
┃ ${msg}
┃
┃ 💰 Cambio:
┃ ${change >= 0 ? '+' : ''}${change}
┃
┃ 💵 Dinero:
┃ ${db[id].dinero}
${levelup ? '┃ 🎉 SUBISTE DE NIVEL' : ''}
┃
╰━━━━━━━━━━━━━━━━⬣`
    },{ quoted:m })
}

handler.command = ['flip']
handler.tags = ['rpg']
handler.group = true
handler.menu = true

export default handler