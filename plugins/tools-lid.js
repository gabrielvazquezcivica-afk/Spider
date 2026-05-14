import fs from 'fs'

// 🔒 MODODADMIN
const modoadminPath = './data/modoadmin.json'

function getModoAdmin() {
    try {
        if (!fs.existsSync(modoadminPath)) return {}
        return JSON.parse(
            fs.readFileSync(modoadminPath, 'utf-8')
        )
    } catch {
        return {}
    }
}

const handler = async ({
    sock,
    m,
    from,
    sender,
    isGroup,
    participants
}) => {

    // 🔒 MODODADMIN
    const modoadmin = getModoAdmin()

    const isBlockedGroup =
        isGroup &&
        modoadmin[from]

    if (isBlockedGroup) {

        const user = participants.find(
            p => p.id === sender
        )

        const isAdmin =
            user?.admin === 'admin' ||
            user?.admin === 'superadmin'

        if (!isAdmin) return
    }

    // ⚡ reacción
    await sock.sendMessage(from,{
        react:{
            text:'🆔',
            key:m.key
        }
    })

    // 🧠 sacar LID
    const lid =
        m.key.participant ||
        sender ||
        m.key.remoteJid

    // 📩 mensaje
    await sock.sendMessage(from,{
        text:
`🆔 LID DEL USUARIO

${lid}`
    },{ quoted:m })
}

handler.command = ['lid']
handler.tags = ['tools']
handler.menu = true
handler.group = false

export default handler
