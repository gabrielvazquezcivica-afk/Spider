import config from '../config.js'

function onlyNumber(jid = '') {
  return jid.toString().replace(/[^0-9]/g, '')
}

const handler = async ({
  sock,
  m,
  from,
  sender,
  isGroup,
  participants,
  args
}) => {

  if (!isGroup) return

  const senderLid = onlyNumber(sender)

  const isOwner =
    config.ownerLid.includes(senderLid)

  if (!isOwner) {
    return sock.sendMessage(from, {
      text: '🕷️ Solo el owner puede usar este comando.'
    }, { quoted: m })
  }

  const botNumber =
    sock.user.id.split(':')[0] +
    '@s.whatsapp.net'

  const botData =
    participants.find(
      p => p.id === botNumber
    )

  const botAdmin =
    botData?.admin === 'admin' ||
    botData?.admin === 'superadmin'

  if (!botAdmin) {
    return sock.sendMessage(from, {
      text: '❌ Debo ser administrador.'
    }, { quoted: m })
  }

  if (
    !args[0] ||
    !/^(si|sí|confirmar)$/i.test(args[0])
  ) {
    return sock.sendMessage(from, {
      text:
`☠️ KICKALL

Este comando expulsará a todos los miembros.

Confirma con:

.kickall si`
    }, { quoted: m })
  }

  try {

    const usuarios =
      participants
        .filter(user => {

          const isBot =
            user.id === botNumber

          const isOwnerUser =
            config.ownerLid.includes(
              onlyNumber(user.id)
            )

          return (
            !isBot &&
            !isOwnerUser
          )
        })
        .map(user => user.id)

    if (!usuarios.length) {
      return sock.sendMessage(from, {
        text: '⚠️ No encontré usuarios para expulsar.'
      }, { quoted: m })
    }

    await sock.groupParticipantsUpdate(
      from,
      usuarios,
      'remove'
    )

    await sock.sendMessage(from, {
      text:
`✅ Limpieza completada

👢 Expulsados: ${usuarios.length}`
    }, { quoted: m })

  } catch (e) {

    console.log(
      'KICKALL ERROR:',
      e
    )

    await sock.sendMessage(from, {
      text:
'❌ Error al expulsar miembros.'
    }, { quoted: m })
  }
}

handler.command = ['kickall']
handler.tags = ['owner']
handler.help = ['kickall si']
handler.group = true
handler.menu = true

export default handler