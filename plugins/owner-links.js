import config from '../config.js'

function onlyNumber(jid = '') {
    return jid.toString().replace(/[^0-9]/g, '')
}

const handler = async ({
    sock,
    m,
    from,
    sender
}) => {

    const senderNum =
        onlyNumber(sender)

    const isOwner =
        config.ownerLid.includes(senderNum)

    if (!isOwner) {

        return sock.sendMessage(from,{
            text:'🕷️ Solo el owner puede usar este comando.'
        },{ quoted:m })
    }

    await sock.sendMessage(from,{
        react:{
            text:'📋',
            key:m.key
        }
    })

    try {

        const groups =
            await sock.groupFetchAllParticipating()

        const groupList =
            Object.values(groups)

        if (!groupList.length) {

            return sock.sendMessage(from,{
                text:'❌ No encontré grupos.'
            },{ quoted:m })
        }

        let texto =
`╭━━━〔 🕷️ LISTA DE GRUPOS 🕷️ 〕━━━⬣

📊 Total: ${groupList.length} grupos

`

        for (let i = 0; i < groupList.length; i++) {

            const group =
                groupList[i]

            try {

                const code =
                    await sock.groupInviteCode(
                        group.id
                    )

                const link =
                    `https://chat.whatsapp.com/${code}`

                texto +=
`╭─〔 ${i + 1} 〕─⬣
┃ 📌 ${group.subject}
┃ 👥 ${group.size || 0} miembros
┃ 🔗 ${link}
╰────────⬣

`

            } catch {

                texto +=
`╭─〔 ${i + 1} 〕─⬣
┃ 📌 ${group.subject}
┃ 👥 ${group.size || 0} miembros
┃ 🔒 No pude obtener enlace
╰────────⬣

`
            }

            // Evitar mensajes demasiado largos
            if (texto.length > 3500) {

                await sock.sendMessage(from,{
                    text: texto
                },{ quoted:m })

                texto = ''
            }
        }

        if (texto.length) {

            await sock.sendMessage(from,{
                text: texto
            },{ quoted:m })
        }

    } catch (e) {

        console.log(
            'LISTGROUPS ERROR:',
            e
        )

        await sock.sendMessage(from,{
            text:'❌ Error al obtener los grupos.'
        },{ quoted:m })
    }
}

handler.command = ['botlink']
handler.tags = ['owner']
handler.help = ['listgrupos']
handler.menu = true

export default handler