import fs from 'fs'

const pathDB = './data/registros.json'

function getDB() {
    try {
        if (!fs.existsSync(pathDB)) {
            fs.writeFileSync(
                pathDB,
                JSON.stringify({})
            )
            return {}
        }

        return JSON.parse(
            fs.readFileSync(
                pathDB,
                'utf8'
            )
        )
    } catch {
        return {}
    }
}

function saveDB(db) {
    fs.writeFileSync(
        pathDB,
        JSON.stringify(
            db,
            null,
            2
        )
    )
}

const shop = {
    1: {
        vida: 10,
        precio: 250
    },
    2: {
        vida: 25,
        precio: 700
    },
    3: {
        vida: 50,
        precio: 1800
    },
    4: {
        vida: 100,
        precio: 5000
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

    if (
        isBlockedGroup &&
        !isAdmin
    ) return

    const db = getDB()
    const id = sender.split('@')[0]

    if (!db[id]) {
        return sock.sendMessage(from,{
            text:
'⚠️ Debes registrarte con .reg'
        },{ quoted:m })
    }

    db[id].vida ??= 100
    db[id].dinero ??= 0

    const option = args[0]

    if (!shop[option]) {
        return sock.sendMessage(from,{
            text:
`⚠️ Opción inválida.

Usa:
.buy 1
.buy 2
.buy 3
.buy 4`
        },{ quoted:m })
    }

    const item = shop[option]

    if (db[id].vida >= 100) {
        return sock.sendMessage(from,{
            text:
'⚠️ Ya tienes la vida completa.'
        },{ quoted:m })
    }

    if (db[id].dinero < item.precio) {
        return sock.sendMessage(from,{
            text:
'⚠️ No tienes suficiente dinero.'
        },{ quoted:m })
    }

    db[id].dinero -= item.precio
    db[id].vida += item.vida

    if (db[id].vida > 100)
        db[id].vida = 100

    saveDB(db)

    await sock.sendMessage(from,{
        text:
`╭━━━〔 ❤️ COMPRA 〕━━━⬣
┃
┃ Compraste:
┃ +${item.vida} vida
┃
┃ 💰 Precio:
┃ $${item.precio}
┃
┃ ❤️ Vida:
┃ ${db[id].vida}/100
┃
┃ 💵 Dinero:
┃ ${db[id].dinero}
┃
╰━━━━━━━━━━━━━━━━⬣`
    },{ quoted:m })
}

handler.command = ['buy']
handler.tags = ['rpg']
handler.group = true
handler.menu = false

export default handler