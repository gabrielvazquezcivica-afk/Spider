const handler = async ({
    sock,
    m,
    from,
    isGroup,
    participants,
    sender,
    pushName
}) => {

    // ❌ solo grupos
    if (!isGroup) {
        return sock.sendMessage(from,{
            text:'⚠️ Este comando solo funciona en grupos'
        },{ quoted:m })
    }

    // 👑 verificar admin
    const user = participants.find(
        p => p.id === sender
    )

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    if (!isAdmin) {
        return sock.sendMessage(from,{
            text:'🕷️ Solo administradores pueden usar este comando'
        },{ quoted:m })
    }

    // ⚡ reacción
    await sock.sendMessage(from,{
        react:{ text:'🔄', key:m.key }
    })

    try {

        // 🔥 resetear link
        await sock.groupRevokeInvite(from)

        // 🔗 nuevo link
        const code =
            await sock.groupInviteCode(from)

        const newLink =
            `https://chat.whatsapp.com/${code}`

        // ✅ mensaje
        await sock.sendMessage(from,{
            text:
`╭━━━〔 🕷️ SPIDER SYSTEM 〕━━━⬣
┃ 🔗 Link restablecido
┃
┃ 👤 Por:
┃ ${pushName}
┃
┃ 🌐 Nuevo link:
┃ ${newLink}
╰━━━━━━━━━━━━━━━━⬣`,
        },{ quoted:m })

        // ✅ reacción final
        await sock.sendMessage(from,{
            react:{ text:'✅', key:m.key }
        })

    } catch (e) {

        console.log(
            'RESET LINK ERROR:',
            e
        )

        return sock.sendMessage(from,{
            text:'❌ No pude restablecer el link del grupo'
        },{ quoted:m })
    }
}

handler.command = ['resetlink']
handler.tags = ['grupo']
handler.group = true
handler.menu = true

export default handler