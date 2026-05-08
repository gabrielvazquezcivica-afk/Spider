let started = false

export const handler = async () => {}

// ───── QUOTED SISTEMA SPIDER ─────
const sistema = (titulo = '🕷️ Spider Bot') => ({
  key: {
    fromMe: false,
    participant: '0@s.whatsapp.net',
    remoteJid: 'status@broadcast'
  },
  message: {
    orderMessage: {
      itemCount: 1,
      message: titulo,
      footerText: 'Spider Bot',
      surface: 2,
      sellerJid: '0@s.whatsapp.net'
    }
  }
})
// ────────────────────────────────

handler.before = async (m, { sock }) => {

  if (started) return
  started = true

  const botName = sock.user?.name || 'Spider Bot'

  // 👑 PROMOTE / DEMOTE
  sock.ev.on('group-participants.update', async (update) => {

    try {

      const {
        id,
        participants,
        action,
        author
      } = update

      if (!id || !id.endsWith('@g.us')) return

      if (!['promote', 'demote'].includes(action)) return

      const user = participants?.[0]

      if (!user) return

      let text = ''

      // 🟢 promote
      if (action === 'promote') {

        text =
`🕷️ Nuevo administrador detectado

👑 Usuario:
@${user.split('@')[0]}`
      }

      // 🔴 demote
      if (action === 'demote') {

        text =
`🕸️ Administrador removido

☠️ Usuario:
@${user.split('@')[0]}`
      }

      // 👮 actor
      if (author) {

        text += `

👮 Acción realizada por:
@${author.split('@')[0]}`
      }

      await sock.sendMessage(id,{
        text: `${text}

> ${botName}`,
        mentions: [user, author].filter(Boolean)
      },{ quoted:sistema() })

    } catch (e) {

      console.log('AUTO ADMIN ERROR:', e)
    }
  })

  // ⚙️ CAMBIOS DEL GRUPO
  sock.ev.on('groups.update', async (updates) => {

    try {

      for (const update of updates) {

        const {
          id,
          subject,
          desc,
          announce,
          restrict,
          author
        } = update

        if (!id || !id.endsWith('@g.us')) continue

        let text = ''

        // ✏️ nombre
        if (subject) {

          text =
`🕷️ Nombre del grupo actualizado

📛 Nuevo nombre:
${subject}`
        }

        // 📝 descripción
        else if (desc !== undefined) {

          text =
`🕸️ La descripción del grupo
fue modificada`
        }

        // 🔒 cerrado
        else if (announce === true) {

          text =
`🕷️ El grupo fue cerrado

🔒 Solo administradores
pueden enviar mensajes`
        }

        // 🔓 abierto
        else if (announce === false) {

          text =
`🕸️ El grupo fue abierto

⚡ Todos los miembros
pueden enviar mensajes`
        }

        // 🔐 restringido
        else if (restrict === true) {

          text =
`🕷️ La edición del grupo
fue restringida`
        }

        // 🔓 edición libre
        else if (restrict === false) {

          text =
`🕸️ La edición del grupo
fue habilitada`
        }

        // ❌ nada
        if (!text) continue

        // 👮 actor
        if (author) {

          text += `

👮 Acción realizada por:
@${author.split('@')[0]}`
        }

        await sock.sendMessage(id,{
          text: `${text}

> ${botName}`,
          mentions: author ? [author] : []
        },{ quoted:sistema() })
      }

    } catch (e) {

      console.log('AUTO GROUP ERROR:', e)
    }
  })

  // 🖼️ FOTO GRUPO
  sock.ev.on('groups.update', async (updates) => {

    try {

      for (const update of updates) {

        const {
          id,
          picture,
          author
        } = update

        if (!id || !picture) continue

        let text =
`🕷️ La foto del grupo fue actualizada`

        if (author) {

          text += `

👮 Acción realizada por:
@${author.split('@')[0]}`
        }

        await sock.sendMessage(id,{
          text: `${text}

> ${botName}`,
          mentions: author ? [author] : []
        },{ quoted:sistema() })
      }

    } catch (e) {

      console.log('AUTO PHOTO ERROR:', e)
    }
  })
}

export default handler
