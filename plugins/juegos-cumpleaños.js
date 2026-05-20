import fs from 'fs'

const audio =
'https://files.catbox.moe/ipauj8.mp3'

const path = './data/modoadmin.json'

// 📥 DB modoadmin
function getDB() {

    try {

        if (!fs.existsSync(path))
            return {}

        return JSON.parse(
            fs.readFileSync(
                path,
                'utf-8'
            )
        )

    } catch {

        return {}
    }
}

const frases = [

    '🎂 Hoy es un día especial porque alguien increíble cumple años',

    '🥳 Spider Bot vino a felicitarte en tu gran día',

    '🎉 Que nunca te falten risas, salud y dinero',

    '🎁 Hoy se celebra el nacimiento de una leyenda',

    '🍰 Esperamos pastel para todos',

    '🎊 Que cumplas muchos años más',

    '🕷️ Spider Bot te desea lo mejor hoy y siempre'
]

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

    const isBlockedGroup =
        db[from]

    const user =
        participants.find(
            p => p.id === sender
        )

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    if (
        isBlockedGroup &&
        !isAdmin
    ) return

    /* 👤 TARGET */
    const ctx =
        m.message?.extendedTextMessage?.contextInfo ||
        m.message?.imageMessage?.contextInfo ||
        m.message?.videoMessage?.contextInfo

    const who =
        ctx?.mentionedJid?.[0] ||
        ctx?.participant

    if (!who) {

        return sock.sendMessage(from,{
            text:
'🎂 Menciona a alguien o responde un mensaje'
        },{
            quoted:m
        })
    }

    /* ⚡ REACCIÓN */
    await sock.sendMessage(from,{
        react:{
            text:'🎉',
            key:m.key
        }
    })

    const frase =
        frases[
            Math.floor(
                Math.random() *
                frases.length
            )
        ]

    const texto =
`╭━━━〔 🎂 FELIZ CUMPLEAÑOS 🎂 〕━━━⬣

🎉 Felicidades @${who.split('@')[0]}

${frase}

🎁 Que tengas un día increíble
🍰 Pásala bonito
🥳 Y nunca te falte felicidad

╰━━━━━━━━━━━━━━━━━━⬣

> SPIDER BOT 🕷️`

    /* 📤 TEXTO */
    await sock.sendMessage(
        from,
        {
            text:texto,
            mentions:[who]
        },
        {
            quoted:m
        }
    )

    /* 🔊 AUDIO */
    await sock.sendMessage(
        from,
        {
            audio:{
                url:audio
            },
            mimetype:'audio/mpeg',
            ptt:true
        },
        {
            quoted:m
        }
    )

    /* ✅ */
    await sock.sendMessage(from,{
        react:{
            text:'🎂',
            key:m.key
        }
    })
}

handler.command = ['cumple']
handler.tags = ['juegos']
handler.help = ['cumple @usuario']
handler.group = true
handler.menu = true

export default handler