import fs from 'fs'

const path = './data/modoadmin.json'

function getDB() {

    try {

        if (!fs.existsSync(path))
            return {}

        return JSON.parse(
            fs.readFileSync(path, 'utf-8')
        )

    } catch {

        return {}
    }
}

const handler = async ({
    sock,
    m,
    from,
    isGroup,
    participants,
    sender
}) => {

    // 🚫 evitar mensajes del bot
    if (m.key.fromMe) return

    // 🛑 solo grupos
    if (!isGroup) {

        return sock.sendMessage(from,{
            text:
'❌ Este comando solo funciona en grupos'
        },{
            quoted:m
        })
    }

    /* 🔒 MODODADMIN */
    const db = getDB()

    const isBlockedGroup =
        db[from]

    const user =
        participants.find(
            p => p.id === sender
        )

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    // 🚫 bloqueo silencioso
    if (
        isBlockedGroup &&
        !isAdmin
    ) return

    // ⚡ reacción
    await sock.sendMessage(from,{
        react:{
            text:'📜',
            key:m.key
        }
    })

    // 📤 reglas
    await sock.sendMessage(from,{
        text:
`╭━━━〔 📜 REGLAS VV2 〕━━━⬣
┃
┣━━━〔 ⚡ HABILIDADES 〕━━━⬣
┃
┃ 🌀 Tatsuya
┃
┃ 🔥 Activa:
┃ Cualquiera menos:
┃ • Otto
┃ • Sonia
┃ • Wolfram
┃ • Luqueta
┃
┣━━━〔 🛠️ CREACIÓN 〕━━━⬣
┃
┃ • Mini Uzi
┃ • Desert
┃ • XM8
┃ • Woodpecker
┃ • MP40
┃ • M590
┃ • M1887
┃ • Trogon
┃ • AWM-Y
┃
┃ ❤️ 200 HP
┃ 🪖 Casco nivel 2
┃ 🦺 Chaleco nivel 2
┃ 🧱 Pared gloo
┃ 🔧 Reparadores
┃ 🍄 Hongo
┃
┃ ⚙️ Aditamentos:
┃ Permitidos
┃
┃ 🎨 Aspecto de arma:
┃ Permitido
┃
┃ 💰 Dinero:
┃ 9999 o quitar
┃ precio a armas
┃
┣━━━〔 ✅ PERMITIDO 〕━━━⬣
┃
┃ • Techos
┃ • Segundos pisos
┃ • Etc
┃
╰━━━━━━━━━━━━━━━━⬣`
    },{
        quoted:m
    })

    // ✅ reacción
    await sock.sendMessage(from,{
        react:{
            text:'✅',
            key:m.key
        }
    })
}

handler.command = ['vv2']
handler.tags = ['ff']
handler.help = ['vv2']
handler.menu = true
handler.group = true

export default handler