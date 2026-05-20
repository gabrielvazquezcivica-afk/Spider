import fs from 'fs'
import axios from 'axios'

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

    '🏳️‍🌈 100% homosexual detectado',
    '💅 El radar gay explotó',
    '🌈 Confirmado por Spider Bot',
    '🫦 Demasiado brillante para ser hetero',
    '💖 Nivel de homosexualidad: EXTREMO',
    '✨ Este usuario salió del clóset',
    '🌈 Spider Bot detectó vibras sospechosas',
    '💅 Más diva imposible',
    '🕺 Homosexualidad encontrada',
    '🏳️‍🌈 Certificado oficialmente'
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

    let who

    if (
        ctx?.mentionedJid?.length
    ) {

        who =
            ctx.mentionedJid[0]

    } else if (
        ctx?.participant
    ) {

        who =
            ctx.participant

    } else {

        who = sender
    }

    /* ⚡ REACCIÓN */
    await sock.sendMessage(from,{
        react:{
            text:'🏳️‍🌈',
            key:m.key
        }
    })

    try {

        /* 📸 FOTO PERFIL */
        let pfp

        try {

            pfp =
                await sock.profilePictureUrl(
                    who,
                    'image'
                )

        } catch {

            pfp =
'https://telegra.ph/file/24fa902ead26340f3df2c.png'
        }

        /* 🌈 EFECTO */
        const api =
`https://some-random-api.com/canvas/gay?avatar=${encodeURIComponent(pfp)}`

        const res =
            await axios.get(api,{
                responseType:'arraybuffer'
            })

        const frase =
            frases[
                Math.floor(
                    Math.random() *
                    frases.length
                )
            ]

        /* 📤 ENVIAR */
        await sock.sendMessage(
            from,
            {
                image: Buffer.from(res.data),
                caption:
`🏳️‍🌈 *GAY DETECTOR* 🏳️‍🌈

👤 @${who.split('@')[0]}

${frase}`,
                mentions:[who]
            },
            {
                quoted:m
            }
        )

        /* ✅ */
        await sock.sendMessage(from,{
            react:{
                text:'✅',
                key:m.key
            }
        })

    } catch(e) {

        console.log(
            'GAY2 ERROR:',
            e
        )

        await sock.sendMessage(from,{
            text:'❌ Error al generar imagen'
        },{
            quoted:m
        })
    }
}

handler.command = ['gay2']
handler.tags = ['juegos']
handler.help = ['gay2 @usuario']
handler.menu = true
handler.group = true

export default handler