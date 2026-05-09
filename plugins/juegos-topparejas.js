import fs from 'fs'

const path = './data/modoadmin.json'

// 📥 DB modoadmin
function getDB() {
    try {
        if (!fs.existsSync(path)) return {}
        return JSON.parse(fs.readFileSync(path, 'utf-8'))
    } catch {
        return {}
    }
}

// 💘 frases random
const frases = [
    '💘 Amor secreto detectado',
    '🕸️ Spider encontró química',
    '💞 Se ven bien juntos',
    '🔥 Pareja explosiva',
    '😍 Hay tensión romántica',
    '💖 Compatibilidad alta',
    '🫶 Destinados a estar juntos',
    '💋 Ya casi se besan',
    '🥰 Conexión perfecta',
    '❤️ Spider aprueba esta pareja'
]

// 🔀 random
function random(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
}

// 🔀 mezclar usuarios
function shuffle(array) {
    return array.sort(() => Math.random() - 0.5)
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

    const db = getDB()
    const isBlockedGroup = db[from]

    const user = participants.find(
        p => p.id === sender
    )

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    // 🔒 MODODADMIN
    if (isBlockedGroup && !isAdmin) return

    // 👥 usuarios reales
    const users = participants
        .map(p => p.id)
        .filter(x => x)

    // 🔥 mezclar
    const mixed = shuffle(users)

    // 💘 sacar 5 parejas
    const parejas = []

    for (let i = 0; i < 5; i++) {

        const user1 = mixed[i * 2]
        const user2 = mixed[(i * 2) + 1]

        if (!user1 || !user2) continue

        parejas.push({
            user1,
            user2,
            frase: random(frases)
        })
    }

    await sock.sendMessage(from,{
        react:{
            text:'💘',
            key:m.key
        }
    })

    let text =
`💘 TOP PAREJAS SPIDER 💘

`

    const mentions = []

    parejas.forEach((p, i) => {

        mentions.push(p.user1)
        mentions.push(p.user2)

        text +=
`${i + 1}. @${p.user1.split('@')[0]} 💞 @${p.user2.split('@')[0]}
${p.frase}

`
    })

    return sock.sendMessage(from,{
        text,
        mentions
    },{ quoted:m })
}

handler.command = ['topparejas']
handler.tags = ['juegos']
handler.group = true
handler.menu = true

export default handler
