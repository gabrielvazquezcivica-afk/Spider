import fs from 'fs'

const path = './data/modoadmin.json'

// 📥 DB
function getDB() {
    try {

        if (!fs.existsSync(path)) return {}

        return JSON.parse(
            fs.readFileSync(path, 'utf-8')
        )

    } catch {

        return {}
    }
}

function shuffle(array) {
    return array.sort(() => Math.random() - 0.5)
}

const handler = async ({
    sock,
    m,
    from,
    args,
    isGroup,
    participants,
    sender
}) => {

    if (!isGroup) {
        return sock.sendMessage(from,{
            text:'⚠️ Solo funciona en grupos'
        },{ quoted:m })
    }

    // 🔒 MODODADMIN
    const db = getDB()
    const isBlockedGroup = db[from]

    const user = participants.find(
        p => p.id === sender
    )

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    if (isBlockedGroup && !isAdmin) return

    const categoria = args.join(' ')

    if (!categoria) {

        return sock.sendMessage(from,{
            text:
`🕷️ Ejemplos:

.top memes
.top feos
.top inteligentes
.top dormilones`
        },{ quoted:m })
    }

    // 🔥 REACCIÓN
    await sock.sendMessage(from,{
        react:{
            text:'🏆',
            key:m.key
        }
    })

    // 🔥 RANDOM USERS
    const users = shuffle(
        participants.map(p => p.id)
    ).slice(0, 10)

    let text =
`╭━━━〔 🕷️ TOP ${categoria.toUpperCase()} 🕷️ 〕━━━⬣

`

    users.forEach((user, i) => {

        text +=
`${i + 1}. @${user.split('@')[0]}\n`
    })

    text += '\n╰━━━━━━━━━━━━━━━━⬣'

    await sock.sendMessage(from,{
        text,
        mentions: users
    },{ quoted:m })
}

handler.command = ['top']
handler.tags = ['juegos']
handler.group = true
handler.menu = true

export default handler
