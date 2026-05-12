const handler = async ({
    sock,
    m,
    from,
    isGroup,
    participants,
    sender,
    command
}) => {

    if (!isGroup) {
        return sock.sendMessage(from, {
            text: '⚠️ Este comando solo funciona en grupos.'
        }, { quoted: m })
    }

    // 🔐 verificar admin
    const user = participants.find(
        p => p.id === sender
    )

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    if (!isAdmin) {
        return sock.sendMessage(from, {
            text: '⚠️ Solo administradores pueden usar este comando.'
        }, { quoted: m })
    }

    try {

        // 🔒 cerrar grupo
        if (command === 'cerrar') {

            await sock.groupSettingUpdate(
                from,
                'announcement'
            )

            return sock.sendMessage(from, {
                text:
`𝐄𝐋 𝐆𝐑𝐔𝐏𝐎 𝐅𝐔𝐄 𝐂𝐄𝐑𝐑𝐀𝐃𝐎

> 𝘱𝘰𝘳 @${sender.split('@')[0]}`,
                mentions: [sender]
            }, { quoted: m })
        }

        // 🔓 abrir grupo
        if (command === 'abrir') {

            await sock.groupSettingUpdate(
                from,
                'not_announcement'
            )

            return sock.sendMessage(from, {
                text:
`𝐄𝐋 𝐆𝐑𝐔𝐏𝐎 𝐅𝐔𝐄 𝐀𝐁𝐈𝐄𝐑𝐓𝐎

> 𝘱𝘰𝘳 @${sender.split('@')[0]}`,
                mentions: [sender]
            }, { quoted: m })
        }

    } catch (e) {

        console.log(
            '❌ ERROR ABRIR/CERRAR:',
            e
        )

        return sock.sendMessage(from, {
            text: '❌ Ocurrió un error.'
        }, { quoted: m })
    }
}

handler.command = ['abrir', 'cerrar']
handler.tags = ['grupo']
handler.group = true
handler.menu = true

export default handler
