import fs from 'fs'

const PATH_DB = './data/mute.json'

// 📥 Leer base de datos
function getDB() {
    try {
        if (!fs.existsSync(PATH_DB)) return {}
        return JSON.parse(fs.readFileSync(PATH_DB, 'utf-8'))
    } catch {
        return {}
    }
}

// 🔍 FUNCIÓN PRINCIPAL: Vigila, borra mensajes y bloquea comandos
export async function verificarMuteados({ sock, m, from, sender, isGroup }) {
    if (!isGroup) return
    if (!m.message) return

    const db = getDB()
    if (!db[from]) return

    const estaMuteado = db[from].includes(sender)
    if (!estaMuteado) return

    // 🗑️ Borrar mensaje automáticamente
    try {
        await sock.sendMessage(from, { delete: m.key })
    } catch {}

    // ❌ Bloquear cualquier comando si está muteado
    return true
}
