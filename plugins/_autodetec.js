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
  // ✅ ELIMINO EL BLOQUEO DE 'started' (era lo principal que fallaba)
  // Si no, el evento se registra una sola vez y deja de funcionar

  const botName = sock.user?.name || 'ChappieBot'

  // ✅ DETECCIÓN DE ADMINS (PROMOVER / DEGRADAR) - ASEGURADO
  sock.ev.removeAllListeners('group-participants.update') // Limpio eventos duplicados
  sock.ev.on('group-participants.update', async (update) => {
    try {
      const { id, participants, action, author } = update
      if (!id || !id.includes('@g.us')) return

      // SOLO promover / degradar, ignora agregar/eliminar miembros
      if (action !== 'promote' && action !== 'demote') return

      const usuario = participants?.[0]
      if (!usuario) return

      let texto = ''
      let menciones = [usuario]

      if (action === 'promote') {
        texto = `👑 Administrador asignado\n\n👤 @${usuario.split('@')[0]}`
      } else {
        texto = `👤 Administrador removido\n\n👤 @${usuario.split('@')[0]}`
      }

      if (author) {
        texto += `\n👮 Por: @${author.split('@')[0]}`
        menciones.push(author)
      }

      await sock.sendMessage(id, {
        text: texto + `\n\n> ${botName}`,
        mentions: menciones
      }, { quoted: sistema() })

      console.log('✅ DETECTADO: Cambio de admin') // Mensaje de confirmación en consola

    } catch (e) {
      console.log('❌ ERROR ADMIN:', e)
    }
  })

  // ✅ DETECCIÓN DE CAMBIOS DEL GRUPO - ASEGURADO
  sock.ev.removeAllListeners('groups.update') // Limpio eventos duplicates
  sock.ev.on('groups.update', async (actualizaciones) => {
    for (const grupo of actualizaciones) {
      try {
        const { id, subject, desc, announce, restrict, inviteCode, picture, author } = grupo
        if (!id || !id.includes('@g.us')) continue

        let texto = ''
        let menciones = []
        const quien = author || null

        // 📌 Nombre
        if (subject) {
          texto = `✏️ Nombre del grupo cambiado\n📌 Nuevo: ${subject}`
        }
        // 📝 Descripción
        else if (desc !== undefined) {
          texto = '📝 Descripción del grupo modificada'
        }
        // 🔒 Abrir / Cerrar
        else if (announce === true) {
          texto = '🔒 Grupo CERRADO\n(solo admins pueden escribir)'
        } else if (announce === false) {
          texto = '🔓 Grupo ABIERTO\n(todos pueden escribir)'
        }
        // 🔐 Configuración
        else if (restrict === true) {
          texto = '🔐 Edición restringida\n(solo admins pueden editar datos)'
        } else if (restrict === false) {
          texto = '🔓 Edición libre\n(todos pueden editar datos)'
        }
        // 🖼️ Foto
        else if (picture) {
          texto = '🖼️ Foto del grupo actualizada'
        }
        // 🔗 Enlace
        else if (inviteCode) {
          texto = '🔗 Enlace de invitación reiniciado'
        }

        if (!texto) continue

        if (quien) {
          texto += `\n\n👮 Por: @${quien.split('@')[0]}`
          menciones.push(quien)
        }

        await sock.sendMessage(id, {
          text: texto + `\n\n> ${botName}`,
          mentions: menciones
        }, { quoted: sistema() })

        console.log('✅ DETECTADO: Cambio de grupo') // Confirmación en consola

      } catch (e) {
        console.log('❌ ERROR GRUPO:', e)
      }
    }
  })
}

export default handler
