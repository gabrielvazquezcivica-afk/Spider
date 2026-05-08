// ✅ CÓDIGO ADAPTADO EXACTAMENTE A TU INDEX.JS
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

// ✅ AQUÍ ESTÁ LA CLAVE: TU INDEX PASA LOS DATOS AQUÍ
handler.before = async ({ sock, m, update }) => {
  const botName = sock.user?.name || 'ChappieBot'

  // ─── CASO 1: VIENE DE group-participants.update ───
  if (update) {
    const datos = update[0]
    const { id, participants, action, author } = datos

    if (!id || !id.endsWith('@g.us')) return
    // SOLO detectamos promover / degradar (ignoramos agregar/eliminar miembros)
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

    return
  }

  // ─── CASO 2: VIENE DE MENSAJES / groups.update ───
  if (!m || !m.key) return
  const id = m.key.remoteJid
  if (!id || !id.endsWith('@g.us')) return

  // 🔍 OBTENEMOS EL ESTADO ACTUAL DEL GRUPO PARA COMPARAR CAMBIOS
  if (!started) {
    started = true
    let estadoAnterior = {}

    // ⏱️ REVISAMOS CAMBIOS CADA 1.5 SEGUNDOS
    setInterval(async () => {
      try {
        const datosGrupo = await sock.groupMetadata(id)
        if (!datosGrupo) return

        const { subject, desc, announce, restrict, inviteCode, picture, id: gid } = datosGrupo

        // 📌 PRIMERA VEZ: GUARDAMOS ESTADO
        if (!estadoAnterior[gid]) {
          estadoAnterior[gid] = { subject, desc, announce, restrict, inviteCode, picture }
          return
        }

        const ant = estadoAnterior[gid]
        let texto = ''
        let menciones = []

        // ✏️ NOMBRE
        if (ant.subject !== subject) {
          texto = `✏️ Nombre del grupo cambiado\n📌 Nuevo: ${subject}`
          ant.subject = subject
        }
        // 📝 DESCRIPCIÓN
        else if (ant.desc !== desc) {
          texto = '📝 Descripción del grupo modificada'
          ant.desc = desc
        }
        // 🔒 ABRIR / CERRAR
        else if (ant.announce !== announce) {
          texto = announce 
            ? '🔒 Grupo CERRADO (solo admins escriben)' 
            : '🔓 Grupo ABIERTO (todos escriben)'
          ant.announce = announce
        }
        // 🔐 RESTRICCIÓN DE EDICIÓN
        else if (ant.restrict !== restrict) {
          texto = restrict 
            ? '🔐 Edición restringida (solo admins editan datos)' 
            : '🔓 Edición libre (todos editan datos)'
          ant.restrict = restrict
        }
        // 🖼️ FOTO
        else if (ant.picture !== picture) {
          texto = '🖼️ Foto del grupo actualizada'
          ant.picture = picture
        }
        // 🔗 ENLACE
        else if (ant.inviteCode !== inviteCode) {
          texto = '🔗 Enlace de invitación reiniciado'
          ant.inviteCode = inviteCode
        }

        if (!texto) return

        // 📤 ENVIAMOS MENSAJE
        await sock.sendMessage(gid, {
          text: texto + `\n\n> ${botName}`,
          mentions
        }, { quoted: sistema() })

      } catch (e) { /* error silencioso */ }
    }, 1500)
  }
}

export default handler
  
