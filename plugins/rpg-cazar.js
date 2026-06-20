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
    const cd = 15 * 60 * 1000

    if (
        db[id].cooldowns.cazar &&
        now < db[id].cooldowns.cazar
    ) {
        const left =
            db[id].cooldowns.cazar - now

        const mins =
            Math.floor(left / 60000)

        const secs =
            Math.floor((left % 60000) / 1000)

        return sock.sendMessage(from,{
            text:`⏳ Espera ${mins}m ${secs}s`
        },{ quoted:m })
    }

    db[id].cooldowns.cazar = now + cd

    const animals = [
        { name:'🐇 Conejo', type:'good' },
        { name:'🦌 Venado', type:'good' },
        { name:'🐗 Jabalí', type:'good' },
        { name:'🐺 Lobo', type:'bad' },
        { name:'🐻 Oso', type:'bad' }
    ]

    const animal =
        animals[
            Math.floor(
                Math.random() *
                animals.length
            )
        ]

    let msg = ''

    if (animal.type === 'good') {

        const money =
            Math.floor(
                Math.random() * 601
            ) + 200

        db[id].dinero += money
        db[id].exp += 30

        msg =
`🎯 Cazaste ${animal.name}

💰 +${money}
⭐ +30 EXP`

    } else {

        const escape =
            Math.random() < 0.5

        if (escape) {

            const money =
                Math.floor(
                    Math.random() * 401
                ) + 100

            db[id].dinero += money
            db[id].exp += 40

            msg =
`⚔️ Derrotaste ${animal.name}

💰 +${money}
⭐ +40 EXP`

        } else {

            const damage =
                Math.floor(
                    Math.random() * 21
                ) + 15

            db[id].vida -= damage

            if (db[id].vida < 0)
                db[id].vida = 0

            msg =
`${animal.name} te atacó

❤️ -${damage} vida`
        }
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
`╭━━━〔 🏹 CAZA 〕━━━⬣
┃
┃ ${msg}
┃
┃ ❤️ Vida:
┃ ${db[id].vida}
┃
┃ 💰 Dinero:
┃ ${db[id].dinero}
${levelup ? '┃ 🎉 Subiste de nivel' : ''}
┃
╰━━━━━━━━━━━━━━━━⬣`
    },{ quoted:m })
}

handler.command = ['cazar']
handler.tags = ['rpg']
handler.group = true
handler.menu = true

export default handler