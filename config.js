import fs from 'fs'

const dbPath = './database/owners.json'

// crear carpeta / archivo si no existe
if (!fs.existsSync('./database')) {
    fs.mkdirSync('./database', { recursive: true })
}

if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(
        dbPath,
        JSON.stringify({
            owner: [],
            ownerLid: []
        }, null, 2)
    )
}

// owners agregados dinámicamente
const saved = JSON.parse(fs.readFileSync(dbPath))

// 👑 CONFIG PRINCIPAL
const config = {
    // 🤖 Nombre del bot
    botName: 'SPIDER BOT',

    // 👑 Nombre del dueño principal
    ownerName: 'SoyGabo',

    // 📱 owners principales (nunca se borran)
    owner: [
        '523310167470',
        '18252535152'
    ],

    // 🆔 LID principales
    ownerLid: [
        '215590228750567',
        '279302511845418'
    ],

    // ⚙️ prefijo
    prefix: '.'
}

// unir sin duplicados
global.botName = config.botName
global.ownerName = config.ownerName
global.prefix = config.prefix

global.mainOwner = [...config.owner]
global.mainOwnerLid = [...config.ownerLid]

global.owner = [
    ...new Set([
        ...config.owner,
        ...(saved.owner || [])
    ])
]

global.ownerLid = [
    ...new Set([
        ...config.ownerLid,
        ...(saved.ownerLid || [])
    ])
]

export default config