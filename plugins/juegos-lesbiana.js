import fs from 'fs'

const frases = [
    '👀 Sospechoso...',
    '🏳️‍🌈 El radar no miente',
    '😳 Eso explica muchas cosas',
    '🔥 Confirmado por la ciencia',
    '😂 Nadie se lo esperaba',
    '💅 Icónica',
    '🌈 Poder lésbico detectado',
    '🤨 Hmm... interesante'
]

const handler = async ({
    sock,
    m,
    from,
    participants,
    sender
}) => {

    // MODODADMIN
    let isBlockedGroup = false

    try {
        const db = JSON.parse(
            fs.readFileSync(
                './data/modoadmin.json',
                'utf8'
            )
        )

        isBlockedGroup = db[from]
    } catch {}

    const adminUser =
        participants?.find(
            p => p.id === sender
        )

    const isAdmin =
        adminUser?.admin === 'admin' ||
        adminUser?.admin === 'superadmin'

    if (
        isBlockedGroup &&
        !isAdmin
    ) return

    const messageType =
        Object.keys(
            m.message || {}
        )[0]

    const contextInfo =
        m.message?.[messageType]
            ?.contextInfo || {}

    let target = null

    if (
        contextInfo.mentionedJid &&
        contextInfo.mentionedJid.length
    ) {
        target =
            contextInfo.mentionedJid[0]
    }

    if (
        contextInfo.participant
    ) {
        target =
            contextInfo.participant
    }

    if (!target) {
        return sock.sendMessage(from,{
            text:
'⚠️ Menciona o responde a alguien.'
        },{ quoted:m })
    }

    const porcentaje =
        Math.floor(
            Math.random() * 101
        )

    const frase =
        frases[
            Math.floor(
                Math.random() *
                frases.length
            )
        ]

    await sock.sendMessage(from,{
        text:
`@${target.split('@')[0]} ES ${porcentaje}% DE LESBIANA
> ${frase}`,
        mentions:[target]
    },{ quoted:m })
}

handler.command = ['lesbiana']
handler.tags = ['juegos']
handler.group = true
handler.menu = true

export default handler