import fs from 'fs'

const fightDB = './data/peleas.json'

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

    delete fights[from]
    saveFightDB(fights)

    await sock.sendMessage(from,{
        text:'❌ Pelea rechazada.'
    },{ quoted:m })
}

handler.command = ['rechazar']
handler.group = true
handler.menu = false

export default handler