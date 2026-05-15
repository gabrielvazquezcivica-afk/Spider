import fs from 'fs'

const path = './data/modoadmin.json'

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

function randomPercent() {
    return Math.floor(Math.random() * 101)
}

const frases = [
    '> 🌈 Sospechoso nivel Spider',
    '> 🕷️ Confirmado por el sistema',
    '> 💅 Muy delicadito',
    '> 🌈 El radar explotó',
    '> 🏳️‍🌈 Demasiado brillante',
    '> 💘 Spider detectó mucho flow',
    '> 😳 El porcentaje no miente',
    '> 🕸️ Nivel peligroso detectado',
    '> 🤨 Ya saliste del clóset',
    '> 🔥 El detector anda loco'
]

function randomFrase() {
    return frases[
        Math.floor(
            Math.random() * frases.length
        )
    ]
}

const delay = ms =>
    new Promise(resolve =>
        setTimeout(resolve, ms)
    )

const handler = async (ctx) => {

    const {
        sock,
        m,
        from,
        isGroup,
        participants,
        sender
    } = ctx

    /* 🔒 MODODADMIN */
    if (isGroup) {

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

        if (isBlockedGroup && !isAdmin)
            return
    }

    /* 👤 USUARIO */
    const ctxMsg =
        m.message?.extendedTextMessage
            ?.contextInfo

    const userRaw =
        ctxMsg?.mentionedJid?.[0] ||
        ctxMsg?.participant ||
        sender

    const percent =
        randomPercent()

    const frase =
        randomFrase()

    /* ⚡ REACCIÓN */
    await sock.sendMessage(from,{
        react:{
            text:'🌈',
            key:m.key
        }
    })

    /* 📩 MENSAJE */
    const msg =
        await sock.sendMessage(from,{
            text:
`🌈 Analizando a @${userRaw.split('@')[0]}.

▰▱▱▱▱▱▱▱▱ 10%`,
            mentions:[userRaw]
        },{ quoted:m })

    /* 🔄 ANIMACIÓN */
    const frames = [
        '▰▰▱▱▱▱▱▱▱ 30%',
        '▰▰▰▰▱▱▱▱▱ 50%',
        '▰▰▰▰▰▰▱▱▱ 80%',
        '▰▰▰▰▰▰▰▰▰ 100%'
    ]

    for (const frame of frames) {

        await delay(800)

        await sock.sendMessage(from,{
            text:
`🌈 Analizando a @${userRaw.split('@')[0]}.

${frame}`,
            mentions:[userRaw],
            edit: msg.key
        })
    }

    /* ✅ RESULTADO */
    await delay(700)

    await sock.sendMessage(from,{
        text:
`🌈 RESULTADO SPIDER

👤 Usuario:
@${userRaw.split('@')[0]}

🏳️‍🌈 Porcentaje:
${percent}% Gay

${frase}`,
        mentions:[userRaw],
        edit: msg.key
    })
}

handler.command = ['gay']
handler.tags = ['juegos']
handler.group = true
handler.menu = true

export default handler