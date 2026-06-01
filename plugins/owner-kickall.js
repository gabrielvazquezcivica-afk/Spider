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
  args
}) => {

  if (!isGroup) return

  const senderNum =
    onlyNumber(sender)

  const isOwner =
    config.ownerLid.includes(senderNum)

  if (!isOwner) {
    return sock.sendMessage(from, {
      text: '🕷️ Solo el owner puede usar este comando.'
    }, { quoted: m })
  }

  if (
    !args[0] ||
    !/^(si|sí|confirmar)$/i.test(args[0])
  ) {
    return sock.sendMessage(from, {
      text:
`☠️ KICKALL

Este comando expulsará a todos los miembros del grupo.

Confirma con:

.kickall si`
    }, { quoted: m })
  }

  try {

    const metadata =
      await sock.groupMetadata(from)

    const participants =
      metadata.participants || []

    const groupOwner =
      metadata.owner || ''

    const usuarios =
      participants
        .map(p => p.id)
        .filter(id => {

          const isGroupOwner =
            id === groupOwner

          const isCommandOwner =
            onlyNumber(id) === senderNum

          const isBot =
            id === sock.user.id

          const isGlobalOwner =
            config.ownerLid.includes(
              onlyNumber(id)
            )

          return (
            !isGroupOwner &&
            !isCommandOwner &&
            !isBot &&
            !isGlobalOwner
          )
        })

    if (!usuarios.length) {
      return sock.sendMessage(from, {
        text:
          '⚠️ No encontré usuarios para expulsar.'
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
`❌ Error al expulsar miembros.

Posibles causas:
• El bot no es administrador.
• WhatsApp bloqueó la acción.
• Algunos usuarios no pudieron ser eliminados.`
    }, { quoted: m })
  }
}

handler.command = [
  'kickall',
  'eliminaratodos',
  'sacaratodos'
]

handler.tags = ['owner']
handler.help = ['kickall si']
handler.group = true
handler.menu = true

export default handler