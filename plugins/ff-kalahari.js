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

    // 🗺️ Imagen Kalahari
    const imageUrl =
'https://i.postimg.cc/dtRHjtmS/ZXATELMIBFDPPCBWVKLJVENBYM.jpg'

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
`╭━━━〔 🏜️ KALAHARI 〕━━━⬣
┃
┃ 📍 MAPA DE KALAHARI
┃ 🎮 FREE FIRE
┃
┃ ⚡ Perfecto para
┃ partidas rápidas
┃ y estrategias.
┃
╰━━━━━━━━━━━━━━━━⬣`
    },{
        quoted:m
    })
}

handler.command = ['kalahari']
handler.tags = ['ff']
handler.help = ['kalahari']
handler.menu = true
handler.group = true

export default handler