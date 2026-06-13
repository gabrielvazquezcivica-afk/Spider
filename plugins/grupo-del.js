const handler = async ({
    sock,
    m,
    from,
    isGroup,
    participants,
    sender
}) => {

    // 🔒 solo grupos
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

    // 📌 verificar respuesta
    const quoted =
        m.message?.extendedTextMessage?.contextInfo

    if (!quoted?.stanzaId) {
        return sock.sendMessage(from, {
            text: '⚠️ Responde al mensaje que quieres borrar.'
        }, { quoted: m })
    }

    try {

        // 🗑️ borrar mensaje citado
        await sock.sendMessage(from, {
            delete: {
                remoteJid: from,
                fromMe: false,
                id: quoted.stanzaId,
                participant: quoted.participant
            }
        })

        // 🗑️ borrar mensaje del comando
        await sock.sendMessage(from, {
            delete: {
                remoteJid: from,
                fromMe: true,
                id: m.key.id
            }
        })

    } catch (e) {

        console.log(
            '❌ ERROR DELETE:',
            e
        )

        return sock.sendMessage(from, {
            text: '❌ No pude borrar el mensaje.'
        }, { quoted: m })
    }
}

handler.command = ['del']
handler.tags = ['grupo']
handler.group = true
handler.menu = true

export default handler