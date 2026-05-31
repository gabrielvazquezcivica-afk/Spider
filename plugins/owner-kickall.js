import config from '../config.js'

// ───── HELPERS ─────
function onlyNumber(jid = '') {
  return jid?.toString().replace(/[^0-9]/g, '')
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

  if (m.key.fromMe) return

  // 👑 OWNER
  const senderLid =
    onlyNumber(sender)

  const isOwner =
    config.ownerLid.includes(
      senderLid
    )

  if (!isOwner) {

    return sock.sendMessage(from,{
      text:
'🕷️ Solo el owner puede usar este comando.'
    },{
      quoted:m
    })
  }

  if (!isGroup) {

    return sock.sendMessage(from,{
      text:
'❌ Este comando solo funciona en grupos.'
    },{
      quoted:m
    })
  }

  // 🤖 BOT ADMIN
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

    return sock.sendMessage(from,{
      text:
'❌ Debo ser administrador para usar este comando.'
    },{
      quoted:m
    })
  }

  // ⚠️ CONFIRMACIÓN
  if (
    !args[0] ||
    !/^(si|sí|confirmar)$/i.test(
      args[0]
    )
  ) {

    return sock.sendMessage(from,{
      text:
`╭━━━〔 ☠️ KICKALL 〕━━━⬣
┃
┃ ⚠️ Este comando expulsará
┃ a todos los miembros
┃ del grupo.
┃
┃ 📌 Confirmar:
┃ .kick2 si
┃
╰━━━━━━━━━━━━━━━━⬣`
    },{
      quoted:m
    })
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

      return sock.sendMessage(from,{
        text:
'⚠️ No encontré usuarios para expulsar.'
      },{
        quoted:m
      })
    }

    await sock.sendMessage(from,{
      react:{
        text:'☠️',
        key:m.key
      }
    })

    await sock.groupParticipantsUpdate(
      from,
      usuarios,
      'remove'
    )

    await sock.sendMessage(from,{
      react:{
        text:'✅',
        key:m.key
      }
    })

    await sock.sendMessage(from,{
      text:
`╭━━━〔 ☠️ KICKALL 〕━━━⬣
┃
┃ ✅ Limpieza completada
┃ 👢 Expulsados:
┃ ${usuarios.length}
┃
╰━━━━━━━━━━━━━━━━⬣`
    },{
      quoted:m
    })

  } catch (e) {

    console.log(
      'KICKALL ERROR:',
      e
    )

    await sock.sendMessage(from,{
      react:{
        text:'❌',
        key:m.key
      }
    })

    await sock.sendMessage(from,{
      text:
`╭━━━〔 ❌ ERROR 〕━━━⬣
┃
┃ No pude expulsar
┃ a los miembros.
┃
┃ Verifica que el bot
┃ sea administrador.
┃
╰━━━━━━━━━━━━━━━━⬣`
    },{
      quoted:m
    })
  }
}

handler.command = ["kick2
handler.tags = ['owner']
handler.help = ['kick2 si']
handler.group = true
handler.menu = false

export default handler