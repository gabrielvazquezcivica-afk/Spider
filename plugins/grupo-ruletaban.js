const frases = [
    '💀 La araña decidió tu destino...',
    '🕷️ Spider te atrapó en su telaraña',
    '☠️ Mala suerte...',
    '⚰️ Hoy no era tu día',
    '🩸 Eliminado por Spider System',
    '🎯 La ruleta apuntó hacia ti'
]

function random(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
}

const handler = async ({
    sock,
    m,
    from,
    participants,
    sender,
    isGroup
}) => {

    if (!isGroup) return

    // 🔐 SOLO ADMINS
    const user = participants.find(
        p => p.id === sender
    )

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    if (!isAdmin) {
        return sock.sendMessage(from,{
            text:'⚠️ Solo administradores pueden usar este comando'
        },{ quoted:m })
    }

    // 👥 usuarios válidos
    const users = participants
        .filter(p => p.id !== sender)
        .map(p => p.id)

    if (!users.length) {
        return sock.sendMessage(from,{
            text:'⚠️ No hay usuarios para la ruleta'
        },{ quoted:m })
    }

    // 🎯 usuario random
    const target =
        users[Math.floor(Math.random() * users.length)]

    const frase = random(frases)

    // 🎲 reacción
    await sock.sendMessage(from,{
        react:{
            text:'🎲',
            key:m.key
        }
    })

    // 📢 aviso
    await sock.sendMessage(from,{
        text:
`🎰 RULETA SPIDER 🎰

👤 @${target.split('@')[0]}

${frase}

☠️ Será eliminado del grupo...`,
        mentions:[target]
    },{ quoted:m })

    // ⏳ espera
    await new Promise(resolve =>
        setTimeout(resolve, 3000)
    )

    try {

        // 🚫 ban
        await sock.groupParticipantsUpdate(
            from,
            [target],
            'remove'
        )

        await sock.sendMessage(from,{
            text:
`🕷️ Usuario eliminado

👤 @${target.split('@')[0]}`,
            mentions:[target]
        })

    } catch {

        await sock.sendMessage(from,{
            text:
'❌ No pude eliminar al usuario\n\n⚠️ Verifica que el bot sea admin'
        },{ quoted:m })
    }
}

handler.command = ['ruletaban']
handler.tags = ['grupo']
handler.group = true
handler.menu = true

export default handler
