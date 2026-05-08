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

      if (typeof user !== 'string') return

      let text = ''

      if (action === 'promote') {

        text =
`🕷️ Nuevo administrador detectado

👑 Usuario:
@${user.split('@')[0]}`

      } else {

        text =
`🕸️ Administrador removido

☠️ Usuario:
@${user.split('@')[0]}`
      }

      if (author) {

        text += `

👮 Acción realizada por:
@${author.split('@')[0]}`
      }

      await sock.sendMessage(
        id,
        {
          text: `${text}

> ${botName}`,
          mentions: [user, author].filter(Boolean)
        },
        { quoted: sistema() }
      )

    } catch (e) {

      console.log('AUTO-DETECT ADMIN ERROR:', e)
    }
  })

  // ⚙️ CAMBIOS DEL GRUPO
  sock.ev.on('groups.update', async (updates) => {

    for (const g of updates) {

      try {

        const {
          id,
          subject,
          desc,
          announce,
          restrict,
          author,
          picture
        } = g

        if (!id || !id.endsWith('@g.us')) continue

        let text = ''
        let mentions = []

        // 🔒 grupo cerrado
        if (announce === true) {

          text =
`🕷️ El grupo fue cerrado

🔒 Ahora solo los administradores
pueden enviar mensajes`
        }

        // 🔓 grupo abierto
        else if (announce === false) {

          text =
`🕸️ El grupo fue abierto

⚡ Todos los miembros ya pueden hablar`
        }

        // 🔐 edición solo admins
        else if (restrict === true) {

          text =
`🕷️ La edición del grupo fue restringida

🔒 Solo administradores pueden editar
información del grupo`
        }

        // 🔓 edición libre
        else if (restrict === false) {

          text =
`🕸️ La edición del grupo fue abierta

⚡ Todos los miembros pueden editar
información del grupo`
        }

        // ✏️ nombre
        else if (subject) {

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

        // 🖼️ foto
        else if (picture) {

          text =
`🕷️ La foto del grupo fue actualizada`
        }

        if (!text) continue

        // 👮 autor
        if (author) {

          text += `

👮 Acción realizada por:
@${author.split('@')[0]}`

          mentions.push(author)
        }

        await sock.sendMessage(
          id,
          {
            text: `${text}

> ${botName}`,
            mentions
          },
          { quoted: sistema() }
        )

      } catch (e) {

        console.log('AUTO-DETECT GROUP ERROR:', e)
      }
    }
  })
}

export default handler
