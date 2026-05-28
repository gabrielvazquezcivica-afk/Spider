const REPORT_GROUP =
  '120363425574166728@g.us'

// ───── HELPERS ─────
function onlyNumber (jid = '') {
  return jid?.toString().replace(/[^0-9]/g, '')
}

const handler = async ({
  sock,
  m,
  from,
  sender,
  isGroup,
  pushName,
  args
}) => {

  // 🚫 evitar mensajes del bot
  if (m.key.fromMe) return

  // ❌ solo grupos
  if (!isGroup) {

    return sock.sendMessage(from, {
      text:
'⚠️ Este comando solo funciona en grupos.'
    }, { quoted: m })
  }

  // 📝 texto reporte
  const text =
    args.join(' ').trim()

  if (!text) {

    return sock.sendMessage(from, {
      text:
`╭━━━〔 🚨 REPORTE 〕━━━⬣
┃
┃ 📌 Uso correcto:
┃ .reporte <mensaje>
┃
┃ 📝 Ejemplo:
┃ .reporte El bot no responde
┃
╰━━━━━━━━━━━━━━━━⬣`
    }, { quoted: m })
  }

  // 📊 metadata grupo
  let metadata

  try {

    metadata =
      await sock.groupMetadata(from)

  } catch {

    return sock.sendMessage(from, {
      text:
'❌ Error obteniendo grupo.'
    }, { quoted: m })
  }

  const groupName =
    metadata.subject

  // ⏳ reacción
  await sock.sendMessage(from, {
    react: {
      text: '📩',
      key: m.key
    }
  })

  try {

    // 📤 enviar reporte
    await sock.sendMessage(REPORT_GROUP, {

      text:
`╭━━━〔 🚨 REPORTE 〕━━━⬣
┃
┃ 👤 Usuario:
┃ ${pushName}
┃
┃ 📞 Número:
┃ ${onlyNumber(sender)}
┃
┃ 👥 Grupo:
┃ ${groupName}
┃
┃ 📝 Reporte:
┃ ${text}
┃
╰━━━━━━━━━━━━━━━━⬣

> SPIDER BOT`

    })

    // ✅ reacción éxito
    await sock.sendMessage(from, {
      react: {
        text: '✅',
        key: m.key
      }
    })

    // 📩 confirmación
    await sock.sendMessage(from, {
      text:
`╭━━━〔 ✅ REPORTE ENVIADO 〕━━━⬣
┃
┃ 📩 Tu reporte fue enviado
┃ 👮 Los owners lo revisarán
┃
╰━━━━━━━━━━━━━━━━⬣

> SPIDER BOT`
    }, { quoted: m })

  } catch (e) {

    console.log(
      'REPORTE ERROR:',
      e
    )

    // ❌ reacción
    await sock.sendMessage(from, {
      react: {
        text: '❌',
        key: m.key
      }
    })

    return sock.sendMessage(from, {
      text:
`╭━━━〔 ❌ ERROR REPORTE 〕━━━⬣
┃
┃ ⚠️ No pude enviar el reporte
┃ 🔄 Intenta nuevamente
┃
╰━━━━━━━━━━━━━━━━⬣`
    }, { quoted: m })
  }
}

handler.command = ['reporte']
handler.tags = ['informacion']
handler.help = ['reporte <texto>']
handler.group = true
handler.menu = true

export default handler