function normalizeJid(u) {
    return typeof u === 'string' ? u : u?.id
}

function onlyNumber(jid = '') {
    return normalizeJid(jid)?.replace(/[^0-9]/g, '')
}

const handler = async ({
    sock,
    m,
    from,
    sender,
    isGroup,
    participants,
    pushName
}) => {

    // ❌ solo grupos
    if (!isGroup) {
        return sock.sendMessage(from,{
            text:'⚠️ Este comando solo funciona en grupos'
        },{ quoted:m })
    }

    // 👤 admin real
    const senderNum = onlyNumber(sender)

    const userData = participants.find(p =>
        onlyNumber(p.id) === senderNum
    )

    const isAdmin =
        userData?.admin === 'admin' ||
        userData?.admin === 'superadmin'

    if (!isAdmin) {
        return sock.sendMessage(from,{
            text:'🕷️ Solo los administradores pueden usar este comando'
        },{ quoted:m })
    }

    // 👤 usuario mencionado
    const ctx = m.message?.extendedTextMessage?.contextInfo

    const userRaw =
        ctx?.mentionedJid?.[0] ||
        ctx?.participant

    if (!userRaw) {
        return sock.sendMessage(from,{
            text:
`⚠️ Debes mencionar o responder a un usuario

Ejemplo:
.demote @usuario`
        },{ quoted:m })
    }

    const userNum = onlyNumber(userRaw)

    // ⚡ reacción
    await sock.sendMessage(from,{
        react:{ text:'⭐', key:m.key }
    })

    try {

        // ⬇️ quitar admin
        await sock.groupParticipantsUpdate(
            from,
            [normalizeJid(userRaw)],
            'demote'
        )

        // 📩 mensaje
        await sock.sendMessage(from,{
            text:
`╭━━━〔 🕸️ SPIDER SYSTEM 〕━━━⬣
┃
┃ ☠️ Administrador removido
┃ 👤 Usuario: @${userNum}
┃ 🕷️ removido por:
┃ ${pushName}
╰━━━━━━━━━━━━━━━━⬣

> SPIDER BOT`,
            mentions:[normalizeJid(userRaw)]
        },{ quoted:m })

    } catch (e) {

        console.log('❌ Error demote:', e)

        return sock.sendMessage(from,{
            text:'❌ No pude quitarle admin al usuario'
        },{ quoted:m })
    }
}

handler.command = ['demote']
handler.tags = ['grupo']
handler.group = true
handler.menu = true

export default handler
