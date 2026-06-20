import fs from 'fs'

const pathDB = './data/registros.json'
const cooldownDB = './data/ruleta_cd.json'

function getDB(path) {
    try {
        if (!fs.existsSync(path)) {
            fs.writeFileSync(path, JSON.stringify({}))
            return {}
        }

        return JSON.parse(
            fs.readFileSync(path, 'utf8')
        )
    } catch {
        return {}
    }
}

function saveDB(path, db) {
    fs.writeFileSync(
        path,
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

    const db = getDB(pathDB)
    const cooldown = getDB(cooldownDB)

    const id = sender.split('@')[0]

    if (!db[id]) {
        return sock.sendMessage(from,{
            text:'⚠️ Debes registrarte primero.'
        },{ quoted:m })
    }

    const bet = parseInt(args[0])

    if (!bet || bet <= 0) {
        return sock.sendMessage(from,{
            text:
`🔫 Usa:

.ruleta 500`
        },{ quoted:m })
    }

    if (db[id].dinero < bet) {
        return sock.sendMessage(from,{
            text:'⚠️ No tienes suficiente dinero.'
        },{ quoted:m })
    }

    const now = Date.now()
    const cd = 5 * 60 * 1000

    if (cooldown[id] && now < cooldown[id]) {
        const left = cooldown[id] - now
        const mins = Math.floor(left / 60000)
        const secs = Math.floor((left % 60000) / 1000)

        return sock.sendMessage(from,{
            text:
`⏳ Espera ${mins}m ${secs}s`
        },{ quoted:m })
    }

    cooldown[id] = now + cd
    saveDB(cooldownDB, cooldown)

    await sock.sendMessage(from,{
        react:{
            text:'🔫',
            key:m.key
        }
    })

    await sock.sendMessage(from,{
        text:
`🔫 Girando tambor...

• • •`
    },{ quoted:m })

    await new Promise(r => setTimeout(r, 2000))

    const survive =
        Math.random() < 0.5

    let msg = ''
    let money = 0

    if (survive) {
        money = bet
        db[id].dinero += bet
        msg = '😮 CLICK... sobreviviste'
    } else {
        money = -bet
        db[id].dinero -= bet
        msg = '💥 BANG... te disparaste'
    }

    db[id].exp =
        (db[id].exp || 0) + 15

    db[id].nivel =
        db[id].nivel || 1

    let levelup = false

    while (db[id].exp >= 200) {
        db[id].exp -= 200
        db[id].nivel += 1
        levelup = true
    }

    saveDB(pathDB, db)

    await sock.sendMessage(from,{
        text:
`╭━━━〔 🔫 RULETA 〕━━━⬣
┃
┃ ${msg}
┃
┃ 💰 Cambio:
┃ ${money >= 0 ? '+' : ''}${money}
┃
┃ 💵 Dinero:
┃ ${db[id].dinero}
┃
┃ ⭐ Nivel:
┃ ${db[id].nivel}
${levelup ? '┃ 🎉 SUBISTE DE NIVEL' : ''}
┃
╰━━━━━━━━━━━━━━━━⬣`
    },{ quoted:m })

    await sock.sendMessage(from,{
        react:{
            text: survive ? '✅' : '💀',
            key:m.key
        }
    })
}

handler.command = ['ruleta']
handler.tags = ['rpg']
handler.group = true
handler.menu = true

export default handler