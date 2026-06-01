const handler = async ({
    sock,
    m,
    from,
    sender,
    participants,
    isGroup
}) => {

    if (!isGroup) return

    const user =
        participants?.find(
            p => p.id === sender
        )

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    if (!isAdmin) {

        return sock.sendMessage(from,{
            text:'⚠️ Solo los administradores pueden usar este comando.'
        },{ quoted:m })
    }

    const admins =
        participants.filter(
            p =>
                p.admin === 'admin' ||
                p.admin === 'superadmin'
        )

    if (!admins.length) {

        return sock.sendMessage(from,{
            text:'❌ No encontré administradores.'
        },{ quoted:m })
    }

    // ⚡ Reacción
    await sock.sendMessage(from,{
        react:{
            text:'📢',
            key:m.key
        }
    })

    // 📸 Foto del grupo
    let pp = null

    try {

        pp = await sock.profilePictureUrl(
            from,
            'image'
        )

    } catch {

        pp = 'https://i.imgur.com/4M34hi2.png'
    }

    const listaAdmins =
        admins.map(
            a =>
            `👑 @${a.id.split('@')[0]}`
        ).join('\n')

    const texto =
`╭━━━〔 🕷️ LLAMADO STAFF 🕷️ 〕━━━⬣
┃
┃ 📢 Se solicita la atención
┃ de los administradores.
┃
┣━━━━━━━━━━━━━━⬣
${listaAdmins}
┣━━━━━━━━━━━━━━⬣
┃ 👤 Solicitado por:
┃ @${sender.split('@')[0]}
┃
╰━━━━━━━━━━━━━━━━⬣`

    await sock.sendMessage(from,{
        image:{
            url: pp
        },
        caption:texto,
        mentions:[
            sender,
            ...admins.map(
                a => a.id
            )
        ]
    },{ quoted:m })
}

handler.command = ['admin']
handler.tags = ['grupo']
handler.help = ['admin']
handler.group = true
handler.menu = true

export default handler