import fs from 'fs'
import config from '../config.js'

const handler = async ({
    sock,
    m,
    from,
    sender,
    args,
    isGroup
}) => {

    // 🚫 evitar mensajes del bot
    if (m.key.fromMe) return

    // 👑 OWNER
    const senderLid =
        sender.split('@')[0]

    const isOwner =
        config.ownerLid.includes(
            senderLid
        )

    if (!isOwner) {

        return sock.sendMessage(from,{
            text:
'🕷️ Solo el owner puede usar este comando.'
        },{
            quoted:m
        })
    }

    // 🔗 LINK
    const link =
        args[0]

    if (
        !link ||
        !link.includes(
            'chat.whatsapp.com/'
        )
    ) {

        return sock.sendMessage(from,{
            text:
`⚠️ Usa el comando así:

.salir2 https://chat.whatsapp.com/XXXXX`
        },{
            quoted:m
        })
    }

    try {

        /* 🔍 OBTENER CÓDIGO */
        const code =
            link.split(
                'chat.whatsapp.com/'
            )[1]

        if (!code) {

            return sock.sendMessage(from,{
                text:
'❌ Link inválido.'
            },{
                quoted:m
            })
        }

        /* 📥 INFO DEL LINK */
        const info =
            await sock.groupGetInviteInfo(
                code
            )

        const groupId =
            info.id

        const groupName =
            info.subject ||
            'Grupo'

        /* 📢 AVISO */
        await sock.sendMessage(groupId,{
            text:
`╭━━━〔 ⚠️ SPIDER BOT 〕━━━⬣
┃
┃ 🕷️ El bot abandonará
┃ este grupo en unos segundos.
┃
┃ 👋 Gracias por usar
┃ SPIDER BOT.
┃
╰━━━━━━━━━━━━━━━━⬣`
        })

        /* ⏳ ESPERA */
        await new Promise(resolve =>
            setTimeout(resolve, 3000)
        )

        /* 🚪 SALIR */
        await sock.groupLeave(
            groupId
        )

        /* ✅ CONFIRMACIÓN */
        await sock.sendMessage(from,{
            text:
`✅ Salí correctamente de:

📍 ${groupName}`
        },{
            quoted:m
        })

    } catch(e){

        console.log(
            'SALIR2 ERROR:',
            e
        )

        await sock.sendMessage(from,{
            text:
'❌ No pude salir de ese grupo.'
        },{
            quoted:m
        })
    }
}

handler.command = ['salir2']
handler.tags = ['owner']
handler.group = false
handler.menu = true

export default handler