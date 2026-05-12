import fs from 'fs'

const path = './data/antilink.json'

// 📥 DB
function getDB() {
    try {
        if (!fs.existsSync(path)) return {}
        return JSON.parse(
            fs.readFileSync(path, 'utf-8')
        )
    } catch {
        return {}
    }
}

// 🔎 detectar links
function isLink(text = '') {

    const regex =
/(?:https?:\/\/|www\.|chat\.whatsapp\.com|wa\.me|t\.me|discord\.gg|discord\.com\/invite|instagram\.com|facebook\.com|fb\.watch|twitter\.com|x\.com|tiktok\.com|youtube\.com|youtu\.be|threads\.net|twitch\.tv|kick\.com|mediafire\.com|mega\.nz|bit\.ly|tinyurl\.com|[\w-]+\.(com|net|org|io|co|gg|tv|app|site|store|online))(\/\S*)?/gi

    return regex.test(text)
}

// 🕷️ VERIFICAR
export async function verificarAntiLink({
    sock,
    m,
    from,
    sender,
    isGroup
}) {

    try {

        if (!isGroup) return false

        if (m.key.fromMe) return false

        const db = getDB()

        // ❌ apagado
        if (!db[from]?.enabled) {
            return false
        }

        // 📩 texto
        const text =
            m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            m.message?.imageMessage?.caption ||
            m.message?.videoMessage?.caption ||
            ''

        if (!text) return false

        // ❌ no link
        if (!isLink(text)) {
            return false
        }

        // 👥 metadata
        let metadata = {}

        try {
            metadata =
                await sock.groupMetadata(from)
        } catch {}

        const participants =
            metadata.participants || []

        const user =
            participants.find(
                p => p.id === sender
            )

        const isAdmin =
            user?.admin === 'admin' ||
            user?.admin === 'superadmin'

        // 👑 admins inmunes
        if (isAdmin) return false

        // 🗑️ borrar
        await sock.sendMessage(from, {
            delete: m.key
        })

        // ⚠️ aviso
        await sock.sendMessage(from, {
            text:
`🕷️ @${sender.split('@')[0]} los links están prohibidos`,
            mentions: [sender]
        })

        return true

    } catch (e) {

        console.log(
            '❌ Error AntiLink:',
            e
        )

        return false
    }
              }
