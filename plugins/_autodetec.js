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

// 🧠 CACHE
const groupCache = new Map()

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

      // 📥 guardar metadata
      try {

        const metadata = await sock.groupMetadata(id)

        groupCache.set(id, {
          subject: metadata.subject,
          desc: metadata.desc,
          announce: metadata.announce,
          restrict: metadata.restrict
        })

      } catch {}

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

      // 👮 autor
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

        const id = update.id

        if (!id || !id.endsWith('@g.us')) continue

        let metadata

        try {
          metadata = await sock.groupMetadata(id)
        } catch {
          continue
        }

        const old = groupCache.get(id) || {}

        const subject = metadata.subject
        const desc = metadata.desc
        const announce = metadata.announce
        const restrict = metadata.restrict

        const actor =
          update.author ||
          update.participants?.[0]

        let mentions = []
        let text = ''

        // ✏️ NOMBRE
        if (
          old.subject &&
          old.subject !== subject
        ) {

          text =
`🕷️ Nombre del grupo actualizado

📛 Nuevo nombre:
${subject}`
        }

        // 📝 DESCRIPCIÓN
        else if (
          old.desc !== undefined &&
          old.desc !== desc
        ) {

          text =
`🕸️ La descripción del grupo
fue modificada`
        }

        // 🔒 CERRADO
        else if (
          old.announce !== undefined &&
          old.announce !== announce
        ) {

          text = announce
            ? `🕷️ El grupo fue cerrado

🔒 Solo administradores
pueden enviar mensajes`
            : `🕸️ El grupo fue abierto

⚡ Todos los miembros
pueden enviar mensajes`
        }

        // 🔐 EDICIÓN
        else if (
          old.restrict !== undefined &&
          old.restrict !== restrict
        ) {

          text = restrict
            ? `🕷️ La edición del grupo fue restringida`
            : `🕸️ La edición del grupo fue abierta`
        }

        // 👮 actor
        if (text && actor) {

          text += `

👮 Acción realizada por:
@${actor.split('@')[0]}`

          mentions.push(actor)
        }

        // 📩 enviar
        if (text) {

          await sock.sendMessage(id,{
            text: `${text}

> ${botName}`,
            mentions
          },{ quoted:sistema() })
        }

        // 💾 guardar cache
        groupCache.set(id,{
          subject,
          desc,
          announce,
          restrict
        })
      }

    } catch (e) {

      console.log('AUTO GROUP ERROR:', e)
    }
  })

  // 🖼️ FOTO DEL GRUPO
  sock.ev.on('groups.upsert', async (groups) => {

    try {

      for (const group of groups) {

        const id = group.id

        if (!id || !id.endsWith('@g.us')) continue

        const old = groupCache.get(id) || {}

        let metadata

        try {
          metadata = await sock.groupMetadata(id)
        } catch {
          continue
        }

        const pic = await sock.profilePictureUrl(id, 'image')
          .catch(() => null)

        if (
          old.picture &&
          old.picture !== pic
        ) {

          await sock.sendMessage(id,{
            text:
`🕷️ La foto del grupo fue actualizada

> ${botName}`
          },{ quoted:sistema() })
        }

        groupCache.set(id,{
          ...old,
          picture: pic
        })
      }

    } catch (e) {

      console.log('AUTO PHOTO ERROR:', e)
    }
  })
}

export default handler
