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

    if (!isGroup) {
        return sock.sendMessage(from,{
            text:'⚠️ Este comando solo funciona en grupos'
        },{ quoted:m })
    }

    const senderNum = onlyNumber(sender)

    const userData = participants.find(p =>
        onlyNumber(p.id) === senderNum
    )

    const isAdmin =
        userData?.admin === 'admin' ||
        userData?.admin === 'superadmin'

    if (!isAdmin) {
        return sock.sendMessage(from,{
            text:'⚠️ Solo administradores'
        },{ quoted:m })
    }

    const ctx = m.message?.extendedTextMessage?.contextInfo

    const userRaw =
        ctx?.mentionedJid?.[0] ||
        ctx?.participant

    if (!userRaw) {
        return sock.sendMessage(from,{
            text:'⚠️ Menciona o responde a un usuario'
        },{ quoted:m })
    }

    const userNum = onlyNumber(userRaw)

    const targetData = participants.find(p =>
        onlyNumber(p.id) === userNum
    )

    const alreadyAdmin =
        targetData?.admin === 'admin' ||
        targetData?.admin === 'superadmin'

    if (alreadyAdmin) {
        return sock.sendMessage(from,{
            text:`⚠️ @${userNum} ya es admin`,
            mentions:[normalizeJid(userRaw)]
        },{ quoted:m })
    }

    await sock.sendMessage(from,{
        react:{ text:'👑', key:m.key }
    })

    try {

        await sock.groupParticipantsUpdate(
            from,
            [normalizeJid(userRaw)],
            'promote'
        )

        await sock.sendMessage(from,{
            text:
`👑 @${userNum} ahora es administrador

> por ${pushName}`,
            mentions:[normalizeJid(userRaw)]
        },{ quoted:m })

    } catch (e) {

        console.log('❌ Error promote:', e)

        return sock.sendMessage(from,{
            text:'❌ No pude promover al usuario'
        },{ quoted:m })
    }
}

handler.command = ['promote']
handler.tags = ['grupo']
handler.group = true
handler.menu = true

export default handler
