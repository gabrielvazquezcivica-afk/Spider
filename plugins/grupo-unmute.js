import fs from 'fs'

const PATH_DB = './data/mute.json'

// 📥 Leer DB
function getDB() {
    try {
        if (!fs.existsSync(PATH_DB)) return {}
        return JSON.parse(fs.readFileSync(PATH_DB, 'utf-8'))
    } catch {
        return {}
    }
}

// 💾 Guardar DB
function saveDB(data) {
    fs.writeFileSync(PATH_DB, JSON.stringify(data, null, 2))
}

const handler = async ({ sock, m, from, participants, sender, isGroup }) => {
    if (!isGroup) return

    // 🔐 Solo administradores
    const user = participants.find(p => p.id === sender)
    const isAdmin = user?.admin === 'admin' || user?.admin === 'superadmin'
    if (!isAdmin) return sock.sendMessage(from, { text: '⚠️ Solo administradores pueden usar este comando' }, { quoted: m })

    // 👤 Obtener usuario objetivo
    const ctx = m.message?.extendedTextMessage?.contextInfo
    const target = ctx?.mentionedJid?.[0] || ctx?.participant
    if (!target) return sock.sendMessage(from, { text: '⚠️ Menciona o responde al usuario' }, { quoted: m })

    if (target === sender) return sock.sendMessage(from, { text: '⚠️ No puedes desmutearte a ti mismo' }, { quoted: m })

    const db = getDB()
    if (!db[from] || !db[from].includes(target)) return sock.sendMessage(from, { text: 'ℹ️ Este usuario no está muteado' }, { quoted: m })

    // ✅ Desmutear
    db[from] = db[from].filter(u => u !== target)
    saveDB(db)

    return sock.sendMessage(from, {
        text: `🕷️ Usuario desmuteado\n\n👤 @${target.split('@')[0]}\n✅ Ya puede enviar mensajes normalmente`,
        mentions: [target]
    }, { quoted: m })
}

handler.command = ['unmute']
handler.tags = ['grupo']
handler.group = true
handler.menu = true

export default handler
  
