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

    // 🛑 Solo grupos
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

    // 🗺️ Imagen Purgatorio
    const imageUrl =
'https://i.postimg.cc/XvX6Pys2/16d40be27a91dfbcc21f485b46c6eb23.jpg'

    // ⚡ reacción
    await sock.sendMessage(from,{
        react:{
            text:'🗺️',
            key:m.key
        }
    })

    // 📤 enviar imagen
    await sock.sendMessage(from,{
        image:{ url:imageUrl },
        caption:
`╭━━━〔 🌋 PURGATORIO 〕━━━⬣
┃
┃ 📍 MAPA DE PURGATORIO
┃ 🎮 FREE FIRE
┃
┃ ⚡ Ideal para
┃ combates largos
┃ y estrategia.
┃
╰━━━━━━━━━━━━━━━━⬣`
    },{
        quoted:m
    })
}

handler.command = ['purgatorio']
handler.tags = ['ff']
handler.help = ['purgatorio']
handler.menu = true
handler.group = true

export default handler