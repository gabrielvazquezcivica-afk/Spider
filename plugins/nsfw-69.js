import fs from 'fs'
import path from 'path'

const nsfwFile =
    path.join(
        process.cwd(),
        './data/nsfw.json'
    )

/* 🔞 DB NSFW */
function getNSFWDB() {

    try {

        if (!fs.existsSync(nsfwFile))
            return {}

        return JSON.parse(
            fs.readFileSync(nsfwFile)
        )

    } catch (e) {

        console.error(
            'NSFW DB Error:',
            e
        )

        return {}
    }
}

const handler = async (ctx) => {

    const {
        sock,
        m,
        from,
        sender,
        isGroup
    } = ctx

    if (!isGroup) {

        return sock.sendMessage(from,{
            text:'❌ Este comando solo funciona en grupos'
        },{ quoted:m })
    }

    /* 🔞 NSFW ACTIVADO */
    const nsfwDB =
        getNSFWDB()

    const nsfwActive =
        nsfwDB[from] || false

    if (!nsfwActive) {

        return sock.sendMessage(from,{
            text:
`🔞 Los comandos NSFW están desactivados

• Un administrador puede activarlos con:
.nsfw on`
        },{ quoted:m })
    }

    /* 👤 TARGET */
    const ctxMsg =
        m.message?.extendedTextMessage?.contextInfo

    let target = null

    if (
        ctxMsg?.mentionedJid?.length
    ) {

        target =
            ctxMsg.mentionedJid[0]

    } else if (
        ctxMsg?.participant
    ) {

        target =
            ctxMsg.participant
    }

    if (!target) {

        return sock.sendMessage(from,{
            text:'❌ Etiqueta o responde a alguien'
        },{ quoted:m })
    }

    const user1 =
        '@' + sender.split('@')[0]

    const user2 =
        '@' + target.split('@')[0]

    /* ⚡ REACCIÓN */
    await sock.sendMessage(from,{
        react:{
            text:'🔥',
            key:m.key
        }
    })

    /* 🎞️ VIDEOS */
    const videos = [

'https://telegra.ph/file/bb4341187c893748f912b.mp4',
'https://telegra.ph/file/c7f154b0ce694449a53cc.mp4',
'https://telegra.ph/file/1101c595689f638881327.mp4',
'https://telegra.ph/file/f7f2a23e9c45a5d6bf2a1.mp4',
'https://telegra.ph/file/a2098292896fb05675250.mp4',
'https://telegra.ph/file/16f43effd7357e82c94d3.mp4',
'https://telegra.ph/file/55cb31314b168edd732f8.mp4',
'https://telegra.ph/file/1cbaa4a7a61f1ad18af01.mp4',
'https://telegra.ph/file/1083c19087f6997ec8095.mp4'

    ]

    const video =
        videos[
            Math.floor(
                Math.random() *
                videos.length
            )
        ]

    /* 📤 ENVIAR */
    await sock.sendMessage(from,{
        video:{ url:video },
        gifPlayback:true,
        caption:
`🔥 69 ACTIVADO 🔥

${user1} está haciendo un 69 con ${user2}`,
        mentions:[
            sender,
            target
        ]
    },{ quoted:m })
}

handler.command = ['69']
handler.tags = ['nsfw']
handler.group = true
handler.menu = true

export default handler