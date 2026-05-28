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
`╭━━━〔 📜 REGLAS CLK 〕━━━⬣
┃
┃ 🎮 𝐇𝐀𝐁𝐈𝐋𝐈𝐃𝐀𝐃𝐄𝐒:
┃ • Alok
┃ • Kelly
┃ • Maxim
┃ • Moco
┃
┣━━━〔 ⚔️ REGLAS 〕━━━⬣
┃ • Solo primera ronda Desert
┃ • 1 M10 por equipo
┃ • No techos
┃ • No segundos pisos
┃
┃ 📍 Observatory,
┃ Clowk Tower y Peak
┃ no cuentan como altura
┃
┃ 🧱 Paredes gloo,
┃ carros, contenedores
┃ y personajes no
┃ cuentan como altura
┃
┣━━━〔 🛠️ CREACIÓN 〕━━━⬣
┃ • Desert
┃ • UMP
┃ • M1014
┃ • 200 HP
┃ • Casco nivel 2
┃ • Chaleco nivel 2
┃ • Reparadores
┃ • Pared gloo
┃ • Hongo
┃ • Dinero 9999
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

handler.command = ['clk']
handler.tags = ['ff']
handler.help = ['clk']
handler.menu = true
handler.group = true

export default handler