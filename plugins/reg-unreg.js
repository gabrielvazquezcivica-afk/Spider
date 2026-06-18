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
    return sock.sendMessage(
        from,
        {
            text: '⚠️ No estás registrado.'
        },
        {
            quoted: m
        }
    )
}

await sock.sendMessage(
    from,
    {
        react: {
            text: '🗑️',
            key: m.key
        }
    }
)

const nombre = db[id].nombre

delete db[id]
saveDB(db)

await sock.sendMessage(
    from,
    {
        text:
`╭━━━〔 🗑️ UNREG 〕━━━⬣
┃
┃ 👤 Usuario:
┃ ${nombre}
┃
┃ ❌ Registro eliminado
┃
╰━━━━━━━━━━━━━━━━⬣

> SPIDER BOT`
    },
    {
        quoted: m
    }
)

await sock.sendMessage(
    from,
    {
        react: {
            text: '✅',
            key: m.key
        }
    }
)

}

handler.command = ['unreg']
handler.tags = ['rpg']
handler.help = ['unreg']
handler.group = true
handler.menu = true

export default handler