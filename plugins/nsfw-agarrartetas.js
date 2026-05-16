import fs from 'fs'
import path from 'path'

const nsfwFile =
    path.join(
        process.cwd(),
        './data/nsfw.json'
    )

/* 🔞 NSFW DB */
function getNSFWDB() {

    try {

        if (!fs.existsSync(nsfwFile))
            return {}

        return JSON.parse(
            fs.readFileSync(nsfwFile)
        )

    } catch (e) {

        console.error(
            'Error NSFW DB:',
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

    const texto =
`${user1} está agarrando las tetas de ${user2}`

    /* ⚡ REACCIÓN */
    await sock.sendMessage(from,{
        react:{
            text:'🔥',
            key:m.key
        }
    })

    /* 🎞️ VIDEOS */
    const videos = [

'https://telegra.ph/file/82d32821f3b57b62359f2.mp4',
'https://telegra.ph/file/04bbf490e29158f03e348.mp4',
'https://telegra.ph/file/37c21753892b5d843b9ce.mp4',
'https://telegra.ph/file/075db3ebba7126d2f0d95.mp4',
'https://telegra.ph/file/e6bf14b93dfe22c4972d0.mp4',
'https://telegra.ph/file/05c1bd3a2ec54428ac2fc.mp4',
'https://telegra.ph/file/e999ef6e67a1a75a515d6.mp4',
'https://telegra.ph/file/538c95e4f1c481bcc3cce.mp4',
'https://telegra.ph/file/61d85d10baf2e3b9a4cde.mp4',
'https://telegra.ph/file/36149496affe5d02c8965.mp4'

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
        caption:texto,
        mentions:[
            sender,
            target
        ]
    },{ quoted:m })
}

handler.command = ['agarrartetas']
handler.tags = ['nsfw']
handler.group = true
handler.menu = true

export default handler