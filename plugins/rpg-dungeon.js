import fs from 'fs'

const pathDB = './data/registros.json'

function getDB() {
    try {
        if (!fs.existsSync(pathDB)) {
            fs.writeFileSync(pathDB, JSON.stringify({}))
            return {}
        }

        return JSON.parse(
            fs.readFileSync(pathDB, 'utf8')
        )
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
            text:'⚠️ Debes registrarte con .reg'
        },{ quoted:m })
    }

    db[id].vida ??= 100
    db[id].nivel ??= 1
    db[id].exp ??= 0
    db[id].dinero ??= 0
    db[id].cooldowns ??= {}

    const now = Date.now()
    const cd = 25 * 60 * 1000

    if (
        db[id].cooldowns.dungeon &&
        now < db[id].cooldowns.dungeon
    ) {
        const left =
            db[id].cooldowns.dungeon - now

        const mins =
            Math.floor(left / 60000)

        const secs =
            Math.floor((left % 60000) / 1000)

        return sock.sendMessage(from,{
            text:`⏳ Espera ${mins}m ${secs}s`
        },{ quoted:m })
    }

    db[id].cooldowns.dungeon = now + cd

    const events = [
        'treasure',
        'loot',
        'monster',
        'trap',
        'mimic',
        'nothing'
    ]

    const event =
        events[
            Math.floor(
                Math.random() *
                events.length
            )
        ]

    let msg = ''

    switch (event) {

        case 'treasure': {
            const money =
                Math.floor(Math.random() * 1001) + 500

            db[id].dinero += money
            db[id].exp += 50

            msg =
`💰 Encontraste un tesoro

+${money} dinero
+50 EXP`
            break
        }

        case 'loot': {
            const money =
                Math.floor(Math.random() * 1501) + 700

            db[id].dinero += money
            db[id].exp += 70

            msg =
`🧪 Hallaste loot raro

+${money} dinero
+70 EXP`
            break
        }

        case 'monster': {
            const win =
                Math.random() < 0.5

            if (win) {
                const money =
                    Math.floor(Math.random() * 901) + 400

                db[id].dinero += money
                db[id].exp += 60

                msg =
`⚔️ Derrotaste al monstruo

+${money} dinero
+60 EXP`
            } else {
                const damage =
                    Math.floor(Math.random() * 21) + 20

                db[id].vida -= damage

                if (db[id].vida < 0)
                    db[id].vida = 0

                msg =
`👹 El monstruo te golpeó

-${damage} vida`
            }
            break
        }

        case 'trap': {
            const damage =
                Math.floor(Math.random() * 16) + 10

            db[id].vida -= damage

            if (db[id].vida < 0)
                db[id].vida = 0

            msg =
`🪤 Caíste en una trampa

-${damage} vida`
            break
        }

        case 'mimic': {
            const damage =
                Math.floor(Math.random() * 26) + 20

            db[id].vida -= damage

            if (db[id].vida < 0)
                db[id].vida = 0

            msg =
`☠️ El cofre era un Mimic

-${damage} vida`
            break
        }

        default:
            msg =
`😶 No encontraste nada`
    }

    let levelup = false

    while (db[id].exp >= 200) {
        db[id].exp -= 200
        db[id].nivel += 1
        levelup = true
    }

    saveDB(db)

    await sock.sendMessage(from,{
        text:
`╭━━━〔 🏰 DUNGEON 〕━━━⬣
┃
┃ ${msg}
┃
┃ ❤️ Vida:
┃ ${db[id].vida}
┃
┃ 💰 Dinero:
┃ ${db[id].dinero}
┃
┃ ⭐ Nivel:
┃ ${db[id].nivel}
${levelup ? '┃ 🎉 Subiste de nivel' : ''}
┃
╰━━━━━━━━━━━━━━━━⬣`
    },{ quoted:m })
}

handler.command = ['dungeon']
handler.tags = ['rpg']
handler.group = true
handler.menu = true

export default handler