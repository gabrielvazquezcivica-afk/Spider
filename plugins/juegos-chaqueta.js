import fs from 'fs'

export const handler = async (
    m,
    {
        sock,
        from,
        sender,
        isGroup,
        reply
    }
) => {

    if (!isGroup)
        return reply(
            '🚫 Este comando solo funciona en grupos'
        )

    /* 🔒 MODODADMIN */
    let groupSettings = {
        enabled:false
    }

    const modoadminPath =
        './data/modoadmin.json'

    if (fs.existsSync(modoadminPath)) {

        try {

            const modoadminData =
                JSON.parse(
                    fs.readFileSync(
                        modoadminPath
                    )
                )

            groupSettings =
                modoadminData[from] || {
                    enabled:false
                }

        } catch {

            groupSettings = {
                enabled:false
            }
        }
    }

    if (groupSettings.enabled && isGroup) {

        try {

            const metadata =
                await sock.groupMetadata(from)

            const participants =
                metadata.participants || []

            const isAdmin =
                participants.some(
                    p =>
                        p.id === sender &&
                        (
                            p.admin === 'admin' ||
                            p.admin === 'superadmin'
                        )
                )

            if (!isAdmin) return

        } catch {}
    }

    /* 👥 PARTICIPANTES */
    const metadata =
        await sock.groupMetadata(from)

    const participants =
        metadata.participants || []

    /* 🎯 OBJETIVO */
    let who

    const ctx =
        m.message?.extendedTextMessage
            ?.contextInfo

    if (ctx?.participant) {

        who = ctx.participant

    } else if (
        ctx?.mentionedJid?.length
    ) {

        who = ctx.mentionedJid[0]

    } else {

        who = sender
    }

    /* 🏷️ NOMBRES */
    const target =
        participants.find(
            p => p.id === who
        )

    const senderContact =
        participants.find(
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

*[ 🔥 ] @${sender.split('@')[0]} SE HA CORRIDO GRACIAS A @${who.split('@')[0]}.*`
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