import config from '../config.js'

const handler = async ({
  sock,
  m,
  from,
  sender,
  args
}) => {

  // 👑 OWNER
  const senderLid =
    sender.split('@')[0]

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

  // ⚠️ validar
  if (args.length < 2) {

    return sock.sendMessage(from,{
      text:
`⚠️ Usa así:

.aviso LINK mensaje

Ejemplo:
.aviso https://chat.whatsapp.com/XXXX Hola grupo`
    },{
      quoted:m
    })
  }

  // 🔗 link
  const link =
    args[0]

  // 📝 mensaje
  const text =
    args.slice(1)
      .join(' ')
      .trim()

  // ❌ validar
  if (
    !link.includes(
      'chat.whatsapp.com/'
    )
  ) {

    return sock.sendMessage(from,{
      text:
'❌ Link inválido.'
    },{
      quoted:m
    })
  }

  // ⚡ reacción
  await sock.sendMessage(from,{
    react:{
      text:'📢',
      key:m.key
    }
  })

  try {

    // 🔑 código
    const code =
      link.split(
        'chat.whatsapp.com/'
      )[1]

    // 📡 obtener info
    const invite =
      await sock.groupGetInviteInfo(
        code
      )

    // 👥 ID grupo
    const targetGroup =
      invite.id

    // 👥 metadata
    const metadata =
      await sock.groupMetadata(
        targetGroup
      )

    const participants =
      metadata.participants || []

    // 📢 menciones
    const mentions =
      participants.map(
        p => p.id
      )

    // 📤 aviso
    await sock.sendMessage(targetGroup,{
      text:
`📢 *AVISO IMPORTANTE*

${text}

> SPIDER BOT`,
      mentions
    })

    // ✅ reacción
    await sock.sendMessage(from,{
      react:{
        text:'✅',
        key:m.key
      }
    })

    // 📩 confirmación
    await sock.sendMessage(from,{
      text:
`✅ Aviso enviado a:

${metadata.subject}`
    },{
      quoted:m
    })

  } catch(e){

    console.log(
      'ERROR AVISO:',
      e
    )

    return sock.sendMessage(from,{
      text:
'❌ El bot no está en ese grupo o el link es inválido.'
    },{
      quoted:m
    })
  }
}

handler.command = ['aviso']
handler.tags = ['owner']
handler.menu = true

export default handler