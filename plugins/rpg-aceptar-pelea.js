import fs from 'fs'

const fightDB = './data/peleas.json'

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

    const peleas = getFightDB()
    const pelea = peleas[from]

    if (!pelea) {
        return sock.sendMessage(from,{
            text:
'⚠️ No hay pelea pendiente.'
        },{ quoted:m })
    }

    if (!pelea.pending) {
        return sock.sendMessage(from,{
            text:
'⚠️ Esa pelea ya comenzó.'
        },{ quoted:m })
    }

    if (sender !== pelea.target) {
        return sock.sendMessage(from,{
            text:
'⚠️ Esa pelea no es para ti.'
        },{ quoted:m })
    }

    pelea.pending = false
    pelea.active = true

    pelea.hp1 = 100
    pelea.hp2 = 100

    pelea.turn = pelea.challenger

    saveFightDB(peleas)

    const challengerId =
        pelea.challenger.split('@')[0]

    const targetId =
        pelea.target.split('@')[0]

    await sock.sendMessage(from,{
        text:
`╭━━━〔 ⚔️ PELEA INICIADA 〕━━━⬣
┃
┃ 🥊 @${challengerId}
┃ ❤️ HP: 100
┃
┃ 🥊 @${targetId}
┃ ❤️ HP: 100
┃
┃ 🎯 Turno de:
┃ @${challengerId}
┃
┃ Usa:
┃ .ataque
┃
╰━━━━━━━━━━━━━━━━⬣`,
        mentions:[
            pelea.challenger,
            pelea.target
        ]
    },{ quoted:m })
}

handler.command = ['aceptar']
handler.tags = ['rpg']
handler.group = true
handler.menu = false

export default handler