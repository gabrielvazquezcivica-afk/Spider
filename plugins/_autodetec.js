let started = false

export const handler = async () => {}

// ───── QUOTED SISTEMA (CHAPPIEBOT) ─────      
const sistema = (titulo = 'ChappieBot 🏜️') => ({      
  key: {      
    fromMe: false,      
    participant: '0@s.whatsapp.net',      
    remoteJid: 'status@broadcast'      
  },      
  message: {      
    orderMessage: {      
      itemCount: 1,      
      message: titulo,      
      footerText: 'ChappieBot',      
      surface: 2,      
      sellerJid: '0@s.whatsapp.net'      
    }      
  }      
})      
// ─────────────────────────────────────

handler.before = async (m, { sock }) => {
  if (started) return
  started = true

  const botName = sock.user?.name || 'ChappieBot'

  /* ───── DETECTAR CAMBIOS DE ADMINISTRADORES ───── */
  sock.ev.on('group-participants.update', async (update) => {
    try {
      const { id, participants, action, author } = update
      if (!id || !id.endsWith('@g.us')) return
      // SOLO detectamos promover / degradar, lo demás (agregar/eliminar/entrar/salir) está fuera
      if (!['promote', 'demote'].includes(action)) return

      const user = participants?.[0]
      if (typeof user !== 'string' || typeof author !== 'string') return

      const text =
        action === 'promote'
          ? `👑 Administrador asignado\n\n👤 @${user.split('@')[0]}\n👮 Por: @${author.split('@')[0]}`
          : `👤 Administrador removido\n\n👤 @${user.split('@')[0]}\n👮 Por: @${author.split('@')[0]}`

      await sock.sendMessage(
        id,
        {
          text: text + `\n\n> ${botName}`,
          mentions: [user, author]
        },
        { quoted: sistema() }
      )
    } catch (e) {
      console.log('AUTO-DETECT ADMIN ERROR:', e)
    }
  })

  /* ───── DETECTAR CAMBIOS GENERALES DEL GRUPO ───── */
  sock.ev.on('groups.update', async (updates) => {
    for (const g of updates) {
      try {
        const {
          id,
          subject,
          desc,
          announce,
          restrict,
          inviteCode,
          picture,
          author,
          participants
        } = g

        if (!id || !id.endsWith('@g.us')) continue

        let actor = author || participants?.[0] || null
        let text = ''
        let mentions = []

        // 📌 Cambio de nombre
        if (subject) {
          text = `✏️ Nombre del grupo cambiado\n📌 Nuevo: ${subject}`
        }
        // 📝 Cambio de descripción
        else if (desc !== undefined) {
          text = '📝 Descripción del grupo modificada'
        }
        // 🔒 Grupo cerrado / abierto
        else if (announce === true) {
          text = '🔒 El grupo fue cerrado\n(solo administradores pueden enviar mensajes)'
        }
        else if (announce === false) {
          text = '🔓 El grupo fue abierto\n(todos pueden enviar mensajes)'
        }
        // 🔐 Configuración de edición
        else if (restrict === true) {
          text = '🔐 Configuración restringida\n(solo admins pueden editar datos)'
        }
        else if (restrict === false) {
          text = '🔓 Configuración libre\n(todos pueden editar datos)'
        }
        // 🖼️ Foto del grupo
        else if (picture) {
          text = '🖼️ Foto del grupo actualizada'
        }
        // 🔗 Código de invitación reiniciado
        else if (inviteCode) {
          text = '🔗 Código de invitación del grupo reiniciado'
        }

        if (!text) continue

        // Agregar quién realizó el cambio
        if (actor && typeof actor === 'string') {
          text += `\n\n👮 Por: @${actor.split('@')[0]}`
          mentions.push(actor)
        }

        await sock.sendMessage(
          id,
          {
            text: text + `\n\n> ${botName}`,
            mentions
          },
          { quoted: sistema() }
        )

      } catch (e) {
        console.log('AUTO-DETECT GROUP UPDATE ERROR:', e)
      }
    }
  })
}

export default handler
