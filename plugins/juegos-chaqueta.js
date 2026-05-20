import fs from 'fs'

const handler = async (ctx) => {

    const {
        sock,
        m,
        from,
        sender,
        isGroup,
        participants
    } = ctx

    if (!isGroup) {
        return sock.sendMessage(from,{
            text:'🚫 Este comando solo funciona en grupos'
        },{ quoted:m })
    }

    /* 🔒 MODODADMIN */
    let isBlockedGroup = false

    try {

        const db = JSON.parse(
            fs.readFileSync(
                './data/modoadmin.json'
            )
        )

        isBlockedGroup = db[from]

    } catch {}

    const user =
        participants?.find(
            p => p.id === sender
        )

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    // 🔥 silencioso
    if (
        isBlockedGroup &&
        !isAdmin
    ) return

    /* 🎯 OBJETIVO */
    let who

    const ctxMsg =
        m.message?.extendedTextMessage
            ?.contextInfo

    if (ctxMsg?.participant) {

        who = ctxMsg.participant

    } else if (
        ctxMsg?.mentionedJid?.length
    ) {

        who = ctxMsg.mentionedJid[0]

    } else {

        who = sender
    }

    /* 🏷️ NOMBRES */
    const target =
        participants?.find(
            p => p.id === who
        )

    const senderContact =
        participants?.find(
            p => p.id === sender
        )

    const name1 =
        senderContact?.notify ||
        sender.split('@')[0]

    const name2 =
        target?.notify ||
        who.split('@')[0]

    /* ⚡ REACCIÓN */
    await sock.sendMessage(from,{
        react:{
            text:'🫦',
            key:m.key
        }
    })

    /* 🎬 ANIMACIÓN */
    const chaqueta = [

'_Iniciando chaqueta..._',

`╭━━╮╭╭╭╮
┃▔╲┣╈╈╈╈━━━╮
┃┈┈▏.╰╯╯╯╭╮━┫
┃┈--.╭━━━━╈╈━╯
╰━━╯-.                ╰╯`,

`╭━━╮.    ╭╭╭╮
┃▔╲┣━━╈╈╈╈━━╮
┃┈┈▏.    .╰╯╯╯╭╮┫
┃┈--.╭━━━━━━╈╈╯
╰━━╯-.           . ╰╯`,

`              .               .   ╭
╭━━╮╭╭╭╮.           ╭ ╯
┃▔╲┣╈╈╈╈━━━╮╭╯╭
┃┈┈▏.╰╯╯╯╭╮━┫
┃┈--.╭━━━━╈╈━╯╰╮╰
╰━━╯-.        ╰╯...-    ╰ ╮
   .         . .  .  .. . . .  . .. .  ╰

*[ 🔥 ] @${name1} SE HA CORRIDO GRACIAS A @${name2}.*`
    ]

    /* 📩 MENSAJE */
    let sent =
        await sock.sendMessage(from,{
            text:chaqueta[0]
        },{ quoted:m })

    /* 🔄 EDITAR */
    for (
        let i = 1;
        i < chaqueta.length;
        i++
    ) {

        await new Promise(
            r => setTimeout(r, 700)
        )

        await sock.sendMessage(from,{
            text:chaqueta[i],
            mentions:[
                sender,
                who
            ],
            edit:sent.key
        })
    }
}

handler.command = ['chaqueta']
handler.tags = ['juegos']
handler.menu = true
handler.group = true

export default handler