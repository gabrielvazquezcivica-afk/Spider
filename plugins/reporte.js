import config from '../config.js'

const handler = async ({
    sock,
    m,
    from,
    sender,
    pushName,
    isGroup,
    participants,
    args
}) => {

    // 🚫 solo grupos
    if (!isGroup) {

        return sock.sendMessage(from,{
            text:
'⚠️ Este comando solo funciona en grupos.'
        },{
            quoted:m
        })
    }

    // 📝 texto
    const text =
        args.join(' ').trim()

    if (!text) {

        return sock.sendMessage(from,{
            text:
`⚠️ Usa el comando así:

.reporte mensaje`
        },{
            quoted:m
        })
    }

    // 📊 metadata
    let metadata

    try {

        metadata =
            await sock.groupMetadata(from)

    } catch {

        return sock.sendMessage(from,{
            text:
'❌ Error obteniendo grupo.'
        },{
            quoted:m
        })
    }

    const groupName =
        metadata.subject

    // ⚡ reacción
    await sock.sendMessage(from,{
        react:{
            text:'📩',
            key:m.key
        }
    })

    try {

        // 👑 enviar a owners
        for (const owner of config.owner) {

            await sock.sendMessage(owner,{
                text:
`╭━━━〔 🚨 REPORTE 〕━━━⬣
┃
┃ 👤 Usuario:
┃ ${pushName}
┃
┃ 📞 Número:
┃ ${sender.split('@')[0]}
┃
┃ 👥 Grupo:
┃ ${groupName}
┃
┃ 📝 Reporte:
┃ ${text}
┃
╰━━━━━━━━━━━━━━━━⬣

> SPIDER BOT`
            })
        }

        // ✅ confirmación
        await sock.sendMessage(from,{
            text:
`╭━━━〔 ✅ REPORTE ENVIADO 〕━━━⬣
┃
┃ 📩 Tu reporte fue enviado
┃ 👮 Los owners lo revisarán
┃
╰━━━━━━━━━━━━━━━━⬣

> SPIDER BOT`
        },{
            quoted:m
        })

        // ✅ reacción
        await sock.sendMessage(from,{
            react:{
                text:'✅',
                key:m.key
            }
        })

    } catch (e) {

        console.log(
            'REPORTE ERROR:',
            e
        )

        await sock.sendMessage(from,{
            react:{
                text:'❌',
                key:m.key
            }
        })

        await sock.sendMessage(from,{
            text:
'❌ Error enviando reporte.'
        },{
            quoted:m
        })
    }
}

handler.command = ['reporte']
handler.tags = ['informacion']
handler.help = ['reporte <texto>']
handler.group = true
handler.menu = true

export default handler