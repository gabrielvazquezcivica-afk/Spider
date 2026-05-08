import fs from 'fs'

const path = './data/antilink.json'

// 📥 DB
function getDB() {
    try {
        if (!fs.existsSync(path)) return {}
        return JSON.parse(fs.readFileSync(path, 'utf-8'))
    } catch {
        return {}
    }
}

// 💾 guardar
function saveDB(data) {
    fs.writeFileSync(path, JSON.stringify(data, null, 2))
}

// 🔎 detectar links
function isLink(text = '') {

    const regex =
/(?:https?:\/\/|ftp:\/\/|file:\/\/|www\.|chat\.whatsapp\.com|wa\.me|t\.me|telegram\.me|discord\.gg|discord\.com\/invite|instagram\.com|facebook\.com|fb\.watch|twitter\.com|x\.com|tiktok\.com|youtube\.com|youtu\.be|snapchat\.com|threads\.net|twitch\.tv|kick\.com|mediafire\.com|mega\.nz|linktr\.ee|bit\.ly|tinyurl\.com|goo\.gl|[\w-]+\.(com|net|org|xyz|info|biz|me|io|co|gg|tv|us|uk|ru|mx|es|app|site|online|store|tech|dev))(\/\S*)?/gi

    return regex.test(text)
}

const handler = async ({
    sock,
    m,
    from,
    args,
    participants,
    sender,
    isGroup
}) => {

    if (!isGroup) return

    // 🔐 solo admins
    const user = participants.find(p => p.id === sender)

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    if (!isAdmin) {
        return sock.sendMessage(from,{
            text:'⚠️ Solo administradores pueden usar este comando'
        },{ quoted:m })
    }

    const db = getDB()

    if (!db[from]) {
        db[from] = {
            enabled: false
        }
    }

    const option = args[0]?.toLowerCase()

    // ❓ ayuda
    if (!option) {
        return sock.sendMessage(from,{
            text:
`🕷️ Uso correcto:

.antilink on
.antilink off`
        },{ quoted:m })
    }

    // 🟢 ON
    if (option === 'on') {

        if (db[from].enabled) {
            return sock.sendMessage(from,{
                text:'⚠️ El antilink ya estaba activado'
            },{ quoted:m })
        }

        db[from].enabled = true
        saveDB(db)

        return sock.sendMessage(from,{
            text:'🕸️ AntiLink activado'
        },{ quoted:m })
    }

    // 🔴 OFF
    if (option === 'off') {

        if (!db[from].enabled) {
            return sock.sendMessage(from,{
                text:'⚠️ El antilink ya estaba desactivado'
            },{ quoted:m })
        }

        db[from].enabled = false
        saveDB(db)

        return sock.sendMessage(from,{
            text:'🕷️ AntiLink desactivado'
        },{ quoted:m })
    }

    return sock.sendMessage(from,{
        text:'⚠️ Usa solamente on/off'
    },{ quoted:m })
}

handler.command = ['antilink']
handler.tags = ['on-off']
handler.group = true
handler.menu = true

export default handler

// 🕸️ detector
export async function before({
    sock,
    m,
    from,
    isGroup,
    participants,
    sender
}) {

    if (!isGroup) return

    const db = getDB()

    if (!db[from]?.enabled) return

    // ❌ ignorar mensajes del bot
    if (m.key.fromMe) return

    const text =
        m.message?.conversation ||
        m.message?.extendedTextMessage?.text ||
        m.message?.imageMessage?.caption ||
        ''

    if (!text) return

    if (!isLink(text)) return

    const user = participants.find(p => p.id === sender)

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    // 🔥 admins no afectados
    if (isAdmin) return

    try {

        // 🗑️ borrar mensaje
        await sock.sendMessage(from,{
            delete:m.key
        })

        // ⚠️ aviso
        await sock.sendMessage(from,{
            text:`🕷️ @${sender.split('@')[0]} no se permiten links en este grupo`,
            mentions:[sender]
        })

    } catch (e) {
        console.log('❌ Error AntiLink:', e)
    }
          }
