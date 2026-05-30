import config from '../config.js'

const handler = async ({
    sock,
    m,
    from,
    sender,
    args
}) => {

    if (m.key.fromMe) return

    const senderLid =
        sender.split('@')[0]

    const isOwner =
        config.ownerLid.includes(senderLid)

    if (!isOwner) {
        return sock.sendMessage(from, {
            text: '🕷️ Solo el owner puede usar este comando.'
        }, { quoted: m })
    }

    const link = args[0]

    if (
        !link ||
        !link.includes('chat.whatsapp.com/')
    ) {
        return sock.sendMessage(from, {
            text:
`⚠️ Usa el comando así:

.salir2 https://chat.whatsapp.com/XXXXX`
        }, { quoted: m })
    }

    await sock.sendMessage(from, {
        react: {
            text: '⏳',
            key: m.key
        }
    })

    try {

        const code =
            link.split('chat.whatsapp.com/')[1]
            ?.split('?')[0]

        if (!code) {
            throw new Error('Código inválido')
        }

        // Obtener información del grupo
        const info =
            await sock.groupGetInviteInfo(code)

        const groupId = info.id
        const groupName =
            info.subject || 'Grupo'

        // Aviso al grupo
        await sock.sendMessage(groupId, {
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

        await new Promise(resolve =>
            setTimeout(resolve, 3000)
        )

        await sock.groupLeave(groupId)

        await sock.sendMessage(from, {
            react: {
                text: '✅',
                key: m.key
            }
        })

        await sock.sendMessage(from, {
            text:
`✅ Salí correctamente de:

📍 ${groupName}`
        }, { quoted: m })

    } catch (e) {

        console.log(
            'SALIR2 ERROR:',
            e
        )

        await sock.sendMessage(from, {
            react: {
                text: '❌',
                key: m.key
            }
        })

        await sock.sendMessage(from, {
            text:
`❌ No pude obtener información del enlace.

Posibles causas:
• El enlace expiró.
• El enlace fue reiniciado.
• WhatsApp bloqueó la consulta.
• El bot no puede acceder a ese grupo mediante el link.`
        }, { quoted: m })
    }
}

handler.command = ['salir2']
handler.tags = ['owner']
handler.menu = true

export default handler