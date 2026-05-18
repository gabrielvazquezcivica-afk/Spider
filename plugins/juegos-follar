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

const handler = async ({
    sock,
    m,
    from,
    sender,
    isGroup,
    participants
}) => {

    if (!isGroup) return

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

    /* 👤 TARGET */
    const ctx =
        m.message?.extendedTextMessage?.contextInfo ||
        m.message?.imageMessage?.contextInfo ||
        m.message?.videoMessage?.contextInfo

    const target =
        ctx?.mentionedJid?.[0] ||
        ctx?.participant

    if (!target) {
        return sock.sendMessage(from, {
            text: '⚠️ Menciona a alguien o responde un mensaje'
        }, { quoted: m })
    }

    // 🚫 evitar mismo usuario
    if (target === sender) {
        return sock.sendMessage(from, {
            text: '💀 No puedes usar esto contigo mismo'
        }, { quoted: m })
    }

    /* ⚡ REACCIÓN */
    await sock.sendMessage(from, {
        react: {
            text: '🔥',
            key: m.key
        }
    })

    const mentions = [
        sender,
        target
    ]

    const name1 =
        sender.split('@')[0]

    const name2 =
        target.split('@')[0]

    const text =
`🤤👅🥵 *ACABAS DE FOLLAR* 🥵👅🤤

@${name1} SE ACABA DE FOLLAR A LA PERRA DE @${name2} AH 4 PATAS MIENTRAS GEMIA COMO UNA MALDITA PERRA (Aaah...Aaah, NO PARES, SIGUE, SIGUE) Y LA HAS DEJADO TAN REVENTADA QUE NO PUEDE NI SOSTENER SU PROPIO CUERPO LA MALDITA PERRA 😳🔥

🤤 @${name2} YA TE HAN FOLLADO 🥵`

    return sock.sendMessage(
        from,
        {
            text,
            mentions
        },
        {
            quoted: m
        }
    )
}

handler.command = ['follar']
handler.tags = ['juegos']
handler.group = true
handler.menu = true

export default handler