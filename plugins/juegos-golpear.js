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

    if (isBlockedGroup && !isAdmin)
        return

    // 👤 TARGET
    const ctx =
        m.message?.extendedTextMessage?.contextInfo ||
        m.message?.imageMessage?.contextInfo ||
        m.message?.videoMessage?.contextInfo

    let who

    if (ctx?.mentionedJid?.length) {

        who = ctx.mentionedJid[0]

    } else if (ctx?.participant) {

        who = ctx.participant

    } else {

        return sock.sendMessage(from,{
            text:'⚠️ Menciona a alguien o responde un mensaje'
        },{ quoted:m })
    }

    // ⚡ reacción
    await sock.sendMessage(from,{
        react:{
            text:'👊🏻',
            key:m.key
        }
    })

    const texto =
`👊🏻 *@${sender.split('@')[0]}* golpeó a *@${who.split('@')[0]}*`

    // 🎞️ videos
    const videos = [
        'https://telegra.ph/file/8e60a6379c1b72e4fbe0f.mp4',
        'https://telegra.ph/file/8ac9ca359cac4c8786194.mp4',
        'https://telegra.ph/file/cc20935de6993dd391af1.mp4',
        'https://telegra.ph/file/9c0bba4c6b71979e56f55.mp4',
        'https://telegra.ph/file/5d22649b472e539f27df9.mp4',
        'https://telegra.ph/file/804eada656f96a04ebae8.mp4',
        'https://telegra.ph/file/3a2ef7a12eecbb6d6df53.mp4',
        'https://telegra.ph/file/c4c27701496fec28d6f8a.mp4',
        'https://telegra.ph/file/c8e5a210a3a34e23391ee.mp4',
        'https://telegra.ph/file/70bac5a760539efad5aad.mp4',
        'https://qu.ax/iPDiG.mp4'
    ]

    const video =
        videos[
            Math.floor(
                Math.random() * videos.length
            )
        ]

    // 📤 enviar
    await sock.sendMessage(
        from,
        {
            video:{ url:video },
            gifPlayback:true,
            caption:texto,
            mentions:[ sender, who ]
        },
        { quoted:m }
    )
}

handler.command = ['golpear']
handler.tags = ['juegos']
handler.group = true
handler.menu = true

export default handler