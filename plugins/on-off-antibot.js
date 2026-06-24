import fs from 'fs'

const antiBotPath = './data/antibot.json'

function getDB() {
    try {
        if (!fs.existsSync(antiBotPath)) {
            fs.writeFileSync(
                antiBotPath,
                JSON.stringify({})
            )
            return {}
        }

        return JSON.parse(
            fs.readFileSync(
                antiBotPath,
                'utf8'
            )
        )
    } catch {
        return {}
    }
}

function saveDB(db) {
    fs.writeFileSync(
        antiBotPath,
        JSON.stringify(db, null, 2)
    )
}

const handler = async ({
    sock,
    m,
    from,
    args,
    sender,
    participants
}) => {

    const user =
        participants?.find(
            p => p.id === sender
        )

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    if (!isAdmin) {
        return sock.sendMessage(from,{
            text:'⚠️ Solo admins.'
        },{ quoted:m })
    }

    if (!args[0]) {
        return sock.sendMessage(from,{
            text:
`Usa:

.antibot on
.antibot off`
        },{ quoted:m })
    }

    const db = getDB()
    const option = args[0].toLowerCase()

    if (option === 'on') {
        db[from] = true
        saveDB(db)

        return sock.sendMessage(from,{
            text:'✅ AntiBot activado.'
        },{ quoted:m })
    }

    if (option === 'off') {
        delete db[from]
        saveDB(db)

        return sock.sendMessage(from,{
            text:'❌ AntiBot desactivado.'
        },{ quoted:m })
    }
}

handler.command = ['antibot']
handler.tags = ['on-off']
handler.group = true
handler.menu = true

export default handler