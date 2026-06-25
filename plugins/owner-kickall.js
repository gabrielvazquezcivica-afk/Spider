import config from '../config.js'

const handler = async ({
    sock,
    m,
    from,
    sender,
    participants
}) => {

    // Solo owner
    if (!config.owner.includes(sender)) {
        return sock.sendMessage(from,{
            text:'⚠️ Solo el owner puede usar este comando.'
        },{ quoted:m })
    }

    if (!participants?.length) {
        return sock.sendMessage(from,{
            text:'⚠️ No pude obtener participantes.'
        },{ quoted:m })
    }

    await sock.sendMessage(from,{
        text:'💀 Expulsando miembros...'
    },{ quoted:m })

    const botId =
        sock.user.id.includes(':')
            ? sock.user.id.split(':')[0] + '@s.whatsapp.net'
            : sock.user.id

    const toKick = participants
        .filter(p => {
            // no bot
            if (p.id === botId) return false

            // no owner
            if (config.owner.includes(p.id))
                return false

            // no admins
            if (
                p.admin === 'admin' ||
                p.admin === 'superadmin'
            ) return false

            return true
        })
        .map(p => p.id)

    if (!toKick.length) {
        return sock.sendMessage(from,{
            text:'⚠️ No hay usuarios para expulsar.'
        },{ quoted:m })
    }

    try {

        for (const user of toKick) {
            try {
                await sock.groupParticipantsUpdate(
                    from,
                    [user],
                    'remove'
                )
            } catch (e) {
                console.log(
                    'KICK ERROR:',
                    user,
                    e
                )
            }
        }

        await sock.sendMessage(from,{
            text:`✅ Expulsados ${toKick.length} usuarios`
        })

    } catch (e) {
        console.log(e)

        await sock.sendMessage(from,{
            text:'❌ Error al expulsar.'
        },{ quoted:m })
    }
}

handler.command = ['low']
handler.tags = ['owner']
handler.group = true
handler.menu = false
handler.owner = true

export default handler