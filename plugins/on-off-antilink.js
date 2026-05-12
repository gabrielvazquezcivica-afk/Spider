import fs from 'fs'
import path from 'path'

const settingsPath =
path.join(process.cwd(), 'data/antilink.json')

// ───── LEER SETTINGS ─────
function loadSettings() {
  if (!fs.existsSync(settingsPath)) return {}

  try {
    return JSON.parse(
      fs.readFileSync(settingsPath)
    )
  } catch {
    return {}
  }
}

// ───── GUARDAR SETTINGS ─────
function saveSettings(settings) {
  fs.writeFileSync(
    settingsPath,
    JSON.stringify(settings, null, 2)
  )
}

// 🔎 DETECTAR LINKS
function isLink(text = '') {

  const regex =
/(?:https?:\/\/|ftp:\/\/|file:\/\/|www\.|chat\.whatsapp\.com|wa\.me|t\.me|telegram\.me|discord\.gg|discord\.com\/invite|instagram\.com|facebook\.com|fb\.watch|twitter\.com|x\.com|tiktok\.com|youtube\.com|youtu\.be|snapchat\.com|threads\.net|twitch\.tv|kick\.com|mediafire\.com|mega\.nz|linktr\.ee|bit\.ly|tinyurl\.com|goo\.gl|[\w-]+\.(com|net|org|xyz|info|biz|me|io|co|gg|tv|us|uk|ru|mx|es|app|site|online|store|tech|dev))(\/\S*)?/gi

  return regex.test(text)
}

// ───── HANDLER ─────
export const handler = async (
  m,
  {
    sock,
    from,
    isGroup,
    participants,
    sender,
    args
  }
) => {

  if (!isGroup) {
    return sock.sendMessage(from,{
      text:'⚠️ Solo funciona en grupos'
    },{ quoted:m })
  }

  // 🔐 SOLO ADMINS
  const user = participants.find(
    p => p.id === sender
  )

  const isAdmin =
    user?.admin === 'admin' ||
    user?.admin === 'superadmin'

  if (!isAdmin) {
    return sock.sendMessage(from,{
      text:'⚠️ Solo administradores pueden usar este comando'
    },{ quoted:m })
  }

  if (!args || args.length === 0) {
    return sock.sendMessage(from,{
      text:'⚠️ Uso: .antilink on | off'
    },{ quoted:m })
  }

  const state =
    args[0].toLowerCase()

  if (!['on','off'].includes(state)) {
    return sock.sendMessage(from,{
      text:'⚠️ Uso: .antilink on | off'
    },{ quoted:m })
  }

  const settings = loadSettings()

  if (!settings[from]) {
    settings[from] = {}
  }

  if (
    settings[from].antilink ===
    (state === 'on')
  ) {
    return sock.sendMessage(from,{
      text:
`⚠️ El antilink ya estaba ${state.toUpperCase()}`
    },{ quoted:m })
  }

  settings[from].antilink =
    state === 'on'

  saveSettings(settings)

  return sock.sendMessage(from,{
    text:
`✅ Antilink ahora está ${state.toUpperCase()}`
  },{ quoted:m })
}

// ───── BEFORE HANDLER ─────
let started = false

handler.before = async (
  _,
  { sock }
) => {

  if (started) return
  started = true

  sock.ev.on(
    'messages.upsert',
    async ({ messages }) => {

      const m = messages[0]

      if (!m?.message) return
      if (m.key.fromMe) return

      const from =
        m.key.remoteJid

      if (!from?.endsWith('@g.us')) return

      const settings =
        loadSettings()

      const groupSettings =
        settings[from] || {}

      if (!groupSettings.antilink) return

      // 👤 SENDER
      const sender =
        m.key.participant ||
        m.key.remoteJid

      if (!sender) return

      // 📝 TEXTO
      const text =
        m.message.conversation ||
        m.message.extendedTextMessage?.text ||
        m.message.imageMessage?.caption ||
        m.message.videoMessage?.caption ||
        ''

      if (!text) return

      // 🔎 DETECTAR LINK
      if (!isLink(text)) return

      try {

        // 📊 METADATA
        const metadata =
          await sock.groupMetadata(from)

        const participants =
          metadata.participants || []

        // 👤 USER
        const userData =
          participants.find(
            p => p.id === sender
          )

        const isAdmin =
          userData?.admin === 'admin' ||
          userData?.admin === 'superadmin'

        // 🔥 ADMINS LIBRES
        if (isAdmin) return

        // 🤖 BOT ADMIN
        const botNumber =
          sock.user.id.split(':')[0] +
          '@s.whatsapp.net'

        const botData =
          participants.find(
            p => p.id === botNumber
          )

        const botAdmin =
          botData?.admin === 'admin' ||
          botData?.admin === 'superadmin'

        if (!botAdmin) return

        // 🗑️ BORRAR MENSAJE
        await sock.sendMessage(from,{
          delete:{
            remoteJid: from,
            fromMe: false,
            id: m.key.id,
            participant: sender
          }
        })

        // ⚠️ AVISO
        await sock.sendMessage(from,{
          text:
`⚠️ @${sender.split('@')[0]} no se permiten links en este grupo`,
          mentions:[sender]
        })

      } catch (e) {

        console.log(
          '❌ Error antilink:',
          e
        )
      }
    }
  )
}

handler.command = ['antilink']
handler.tags = ['on-off']
handler.group = true
handler.admin = true
handler.menu = true

export default handler
