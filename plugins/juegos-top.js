import fs from 'fs'

const path = './data/modoadmin.json'

// 📥 DB
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

const reactions = [
    '🕷️',
    '🔥',
    '💀',
    '⚡',
    '👑',
    '🤣',
    '😈',
    '🥵'
]

const handler = async ({
    sock,
    m,
    from,
    isGroup,
    participants,
    args,
    sender
}) => {

    if (!isGroup) return

    const db = getDB()
    const isBlockedGroup = db[from]

    // 🔐 ADMIN
    const user = participants.find(
        p => p.id === sender
    )

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    // 🔥 MODODADMIN
    if (isBlockedGroup && !isAdmin)
        return

    const tema = args.join(' ')

    if (!tema) {

        return sock.sendMessage(from,{
            text:
`⚠️ Usa el comando así:

.top infieles
.top pajeros
.top chismosos
.top dormidos`
        },{ quoted:m })
    }

    // 🔥 REACCIÓN RANDOM
    const react =
        reactions[
            Math.floor(
                Math.random() * reactions.length
            )
        ]

    // 🔥 RANDOM USERS
    const randomUsers = [...participants]
        .sort(() => Math.random() - 0.5)
        .slice(0, 10)

    const mentions =
        randomUsers.map(u => u.id)

    let text =
`╭━━━〔 🕷️ SPIDER TOP 〕━━━⬣
┃
┃ 🏆 TOP ${tema.toUpperCase()}
┃
`

    randomUsers.forEach((u, i) => {

        text +=
`┃ ${i + 1}. @${u.id.split('@')[0]}
`
    })

    text +=
'╰━━━━━━━━━━━━━━━━⬣'

    // 📩 ENVIAR MENSAJE
    const msg = await sock.sendMessage(from,{
        text,
        mentions
    },{ quoted:m })

    // 🔥 REACCIONAR AL MENSAJE ENVIADO
    await sock.sendMessage(from,{
        react:{
            text: react,
            key: msg.key
        }
    })
}

handler.command = ['top']
handler.tags = ['juegos']
handler.group = true
handler.menu = true

export default handler
