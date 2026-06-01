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

    let texto =
`🕷️ LLAMADO A ADMINISTRADORES

`

    for (const admin of admins) {

        texto +=
`👑 @${admin.id.split('@')[0]}\n`
    }

    await sock.sendMessage(from,{
        text:texto.trim(),
        mentions:admins.map(
            a => a.id
        )
    },{ quoted:m })
}

handler.command = ['admins']
handler.tags = ['grupo']
handler.help = ['admin']
handler.group = true
handler.menu = true

export default handler