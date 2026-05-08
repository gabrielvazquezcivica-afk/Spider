import fs from 'fs'

const path = './data/setbye.json'

function getDB() {
    try {
        if (!fs.existsSync(path)) return {}
        return JSON.parse(fs.readFileSync(path))
    } catch {
        return {}
    }
}

function saveDB(data) {
    fs.writeFileSync(path, JSON.stringify(data, null, 2))
}

const handler = async ({
    sock,
    m,
    from,
    isGroup,
    participants,
    sender
}) => {

    if (!isGroup) return

    const user = participants.find(p => p.id === sender)

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    if (!isAdmin) {
        return sock.sendMessage(from,{
            text:'⚠️ Solo admins pueden usar este comando'
        },{ quoted:m })
    }

    const db = getDB()

    if (!db[from]) {
        return sock.sendMessage(from,{
            text:'⚠️ No hay bye personalizado'
        },{ quoted:m })
    }

    delete db[from]

    saveDB(db)

    sock.sendMessage(from,{
        text:'🕷️ Bye personalizado eliminado'
    },{ quoted:m })
}

handler.command = ['delbye']
handler.tags = ['grupo']
handler.group = true
handler.menu = true

export default handler
