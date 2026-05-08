let started = false

export const handler = async () => {}

// ───── QUOTED SISTEMA (CHAPPIEBOT ─────      
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

  // ✅ DETECTAR CAMBIOS DE ADMIN (PROMOVER / QUITAR)
  sock.ev.on('group-participants.update', async (update) => {
    try {
      const { id, participants, action, author } = update
      if (!id || !id.endsWith('@g.us')) return
      // SOLO promover y degradar, ignora lo demás
      if (!['promote', 'demote'].includes(action)) return

      const usuario = participants?.[0]
      if (!usuario) return

      let texto = ''
      let menciones = [usuario]

      if (action === 'promote') {
        texto = `👑 Administrador asignado\n\n👤 @${usuario.split('@')[0]}`
      } else if (action === 'demote') {
        texto = `👤 Administrador removido\n\n👤 @${usuario.split('@')[0]}`
      }

      // Quien lo hizo
      if (author) {
        texto += `\n👮 Por: @${author.split('@')[0]}`
        menciones.push(author)
      }

      await sock.sendMessage(id, {
        text: texto + `\n\n> ${botName}`,
        mentions: menciones
      }, { quoted: sistema() })

    } catch (e) {
      console.log('❌ ERROR ADMIN:', e)
    }
  })

  // ✅ DETECTAR CAMBIOS DEL GRUPO (NOMBRE, DESCRIPCIÓN, FOTO, ABRIR/CERRAR, ETC)
  sock.ev.on('groups.update', async (actualizaciones) => {
    for (const grupo of actualizaciones) {
      try {
        const {
          id,
          subject,
          desc,
          announce,
          restrict,
          inviteCode,
          picture,
          author
        } = grupo

        if (!id || !id.endsWith('@g.us')) continue

        let quienCambio = author || null
        let texto = ''
        let menciones = []

        // 📌 Nombre cambiado
        if (subject) {
          texto = `✏️ Nombre del grupo actualizado\n📌 Nuevo: ${subject}`
        }
        // 📝 Descripción cambiada
        else if (desc !== undefined) {
          texto = '📝 Descripción del grupo modificada'
        }
        // 🔒 Grupo cerrado / abierto
        else if (announce === true) {
          texto = '🔒 Grupo CERRADO\n(solo administradores pueden escribir)'
        }
        else if (announce === false) {
          texto = '🔓 Grupo ABIERTO\n(todos pueden escribir)'
        }
        // 🔐 Configuración restringida / libre
        else if (restrict === true) {
          texto = '🔐 Configuración restringida\n(solo admins pueden editar datos)'
        }
        else if (restrict === false) {
          texto = '🔓 Configuración libre\n(todos pueden editar datos)'
        }
        // 🖼️ Foto cambiada
        else if (picture) {
          texto = '🖼️ Foto del grupo actualizada'
        }
        // 🔗 Enlace reiniciado
        else if (inviteCode) {
          texto = '🔗 Enlace de invitación reiniciado'
        }

        if (!texto) continue

        // Agregar quién lo hizo
        if (quienCambio) {
          texto += `\n\n👮 Por: @${quienCambio.split('@')[0]}`
          menciones.push(quienCambio)
        }

        await sock.sendMessage(id, {
          text: texto + `\n\n> ${botName}`,
          mentions: menciones
        }, { quoted: sistema() })

      } catch (e) {
        console.log('❌ ERROR GRUPO:', e)
      }
    }
  })
}

export default handler
