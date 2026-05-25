import config from '../config.js'

const handler = async ({
  sock,
  m,
  from,
  sender,
  isGroup,
  args
}) => {

  // 🚫 evitar mensajes del bot
  if (m.key.fromMe) return

  // ❌ solo grupos
  if (!isGroup) {
    return sock.sendMessage(from, {
      text: '⚠️ Este comando solo funciona en grupos.'
    }, { quoted: m })
  }

  // 👑 validar owner
  const senderLid =
    sender.split('@')[0]

  const isOwner =
    config.ownerLid.includes(senderLid)

  if (!isOwner) {
    return sock.sendMessage(from, {
      text: '🕷️ Solo el owner puede usar este comando.'
    }, { quoted: m })
  }

  // ⚠️ validar args
  if (args.length < 2) {
    return sock.sendMessage(from, {
      text:
`⚠️ Usa el comando así:

.aviso https://chat.whatsapp.com/XXXX Mensaje del aviso`
    }, { quoted: m })
  }

  // 🔗 link
  const link = args[0]

  // 📝 mensaje
  const text =
    args.slice(1).join(' ').trim()

  // ❌ validar link
  if (
    !link.includes(
      'chat.whatsapp.com/'
    )
  ) {

    return sock.sendMessage(from, {
      text:
'❌ Link de grupo inválido.'
    }, { quoted: m })
  }

  // ⚡ reacción
  await sock.sendMessage(from, {
    react: {
      text: '📢',
      key: m.key
    }
  })

  try {

    // 🔑 obtener código
    const code =
      link.split(
        'chat.whatsapp.com/'
      )[1]

    // 👥 obtener jid grupo
    const groupInfo =
      await sock.groupGetInviteInfo(code)

    const targetGroup =
      groupInfo.id

    // 👥 metadata grupo destino
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

    // 📤 enviar aviso
    await sock.sendMessage(targetGroup, {
      text:
`📢 *AVISO IMPORTANTE*

${text}

> SPIDER BOT`,
      mentions
    })

    // ✅ reacción
    await sock.sendMessage(from, {
      react: {
        text: '✅',
        key: m.key
      }
    })

    // 📩 confirmación
    await sock.sendMessage(from, {
      text:
`✅ Aviso enviado a:

${metadata.subject}`
    }, { quoted: m })

  } catch (e) {

    console.log(
      'ERROR AVISO:',
      e
    )

    return sock.sendMessage(from, {
      text:
'❌ No pude enviar el aviso.'
    }, { quoted: m })
  }
}

handler.command = ['aviso']
handler.tags = ['owner']
handler.group = true
handler.menu = true

export default handler