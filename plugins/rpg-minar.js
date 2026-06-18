import fs from 'fs'

const pathDB = './data/registros.json'
const COOLDOWN = 30 * 60 * 1000

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

function formatTime(ms) {
const min =
Math.floor(ms / 60000)

const sec =
    Math.floor(
        (ms % 60000) / 1000
    )

return `${min}m ${sec}s`

}

const handler = async ({
sock,
m,
from,
sender
}) => {

const db = getDB()
const id = sender.split('@')[0]

if (!db[id]) {
    return sock.sendMessage(
        from,
        {
            text:

'⚠️ Debes registrarte primero con .reg'
},
{
quoted: m
}
)
}

const user = db[id]

if (!user.lastMine) {
    user.lastMine = 0
}

const now = Date.now()
const diff =
    now - user.lastMine

if (diff < COOLDOWN) {

    const remain =
        COOLDOWN - diff

    return sock.sendMessage(
        from,
        {
            text:

`⏳ Ya minaste recientemente.

Vuelve en:
${formatTime(remain)}`
},
{
quoted: m
}
)
}

await sock.sendMessage(
    from,
    {
        react:{
            text:'⛏️',
            key:m.key
        }
    }
)

const reward =
    Math.floor(
        Math.random() * 500
    ) + 100

user.dinero += reward
user.lastMine = now

saveDB(db)

await sock.sendMessage(
    from,
    {
        text:

`╭━━━〔 ⛏️ MINA 〕━━━⬣
┃
┃ 💎 Has minado:
┃ $${reward}
┃
┃ 💰 Dinero total:
┃ $${user.dinero}
┃
╰━━━━━━━━━━━━━━━━⬣`
},
{
quoted: m
}
)

await sock.sendMessage(
    from,
    {
        react:{
            text:'✅',
            key:m.key
        }
    }
)

}

handler.command = ['minar']
handler.tags = ['rpg']
handler.help = ['minar']
handler.group = true
handler.menu = true

export default handler