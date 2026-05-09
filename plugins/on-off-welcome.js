import fs from 'fs'

const path = './data/welcome.json'
const welcomePath = './data/setwelcome.json'
const byePath = './data/setbye.json'

// 📥 DB welcome
function getDB() {
    try {
        if (!fs.existsSync(path)) return {}
        return JSON.parse(fs.readFileSync(path, 'utf-8'))
    } catch {
        return {}
    }
}

// 📥 DB textos
function getTextDB(file) {
    try {
        if (!fs.existsSync(file)) return {}
        return JSON.parse(fs.readFileSync(file, 'utf-8'))
    } catch {
        return {}
    }
}

// 💾 guardar
function saveDB(data) {
    fs.writeFileSync(path, JSON.stringify(data, null, 2))
}

const BOT_IMAGE =
'https://i.postimg.cc/VsSqN5RG/19d8fec1698683dde758218220caa31e.jpg'

// 🎵 AUDIOS
const welcomeAudio =
'https://files.catbox.moe/t73rbs.mp3'

const byeAudio =
'https://files.catbox.moe/swqi7e.mp3'

const handler = async ({
    sock,
    m,
    from,
    args,
    isGroup,
    participants,
    sender
}) => {

    if (!isGroup) return

    // 🔐 SOLO ADMINS
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
            welcome: false
        }
    }

    const option = args[0]?.toLowerCase()

    // ❓ AYUDA
    if (!option) {
        return sock.sendMessage(from,{
            text:
`🕷️ Uso correcto:

.welcome on
.welcome off`
        },{ quoted:m })
    }

    // 🟢 ON
    if (option === 'on') {

        if (db[from].welcome) {
            return sock.sendMessage(from,{
                text:'⚠️ Las bienvenidas ya estaban activadas'
            },{ quoted:m })
        }

        db[from].welcome = true
        saveDB(db)

        return sock.sendMessage(from,{
            text:'🕸️ Sistema de bienvenida activado'
        },{ quoted:m })
    }

    // 🔴 OFF
    if (option === 'off') {

        if (!db[from].welcome) {
            return sock.sendMessage(from,{
                text:'⚠️ Las bienvenidas ya estaban desactivadas'
            },{ quoted:m })
        }

        db[from].welcome = false
        saveDB(db)

        return sock.sendMessage(from,{
            text:'🕷️ Sistema de bienvenida desactivado'
        },{ quoted:m })
    }

    return sock.sendMessage(from,{
        text:'⚠️ Usa solamente on/off'
    },{ quoted:m })
}

handler.command = ['welcome']
handler.tags = ['on-off']
handler.group = true
handler.menu = true

export default handler

// 🕷️ EVENTO ENTRADA/SALIDA
export async function before({
    sock,
    update
}) {

    // 🔥 FIX
    if (!Array.isArray(update)) {
        update = [update]
    }

    const db = getDB()

    const welcomeDB = getTextDB(welcomePath)
    const byeDB = getTextDB(byePath)

    for (const group of update) {

        // 🔥 FIX ERROR
        if (!group || !group.id) continue

        const id = group.id

        if (!db[id]?.welcome) continue

        let metadata = {}

        try {
            metadata = await sock.groupMetadata(id)
        } catch {}

        const groupName = metadata.subject || 'Grupo'
        const members = metadata.participants?.length || 0

        // 🔥 FIX PARTICIPANTS
        const users = Array.isArray(group.participants)
            ? group.participants
            : []

        for (const user of users) {

            let image = BOT_IMAGE

            // 📸 FOTO USUARIO
            try {
                image = await sock.profilePictureUrl(user, 'image')
            } catch {

                // 📸 FOTO GRUPO
                try {
                    image = await sock.profilePictureUrl(id, 'image')
                } catch {
                    image = BOT_IMAGE
                }
            }

            // 🟢 ENTRADA
            if (group.action === 'add') {

                let text =
welcomeDB[id] ||
`╭━━━〔 🕷️ SPIDER SYSTEM 〕━━━⬣
┃
┃ 🕸️ Nuevo usuario detectado
┃ 👤 @user
┃ 👥 Miembros: @members
┃
┃ ⚡ Bienvenido a @group
╰━━━━━━━━━━━━━━━━⬣`

                text = text
                    .replace(/@user/g, `@${user.split('@')[0]}`)
                    .replace(/@group/g, groupName)
                    .replace(/@members/g, members)

                await sock.sendMessage(id,{
                    image:{ url:image },
                    caption:text,
                    mentions:[user]
                })

                // 🎵 AUDIO
                await sock.sendMessage(id,{
                    audio:{ url: welcomeAudio },
                    mimetype:'audio/mp4',
                    ptt:false
                })
            }

            // 🔴 SALIDA
            if (group.action === 'remove') {

                let text =
byeDB[id] ||
`╭━━━〔 🕷️ SPIDER SYSTEM 〕━━━⬣
┃
┃ ☠️ Usuario desconectado
┃ 👤 @user
┃ 👥 Miembros: @members
┃
┃ 🕷️ Salió de @group
╰━━━━━━━━━━━━━━━━⬣`

                text = text
                    .replace(/@user/g, `@${user.split('@')[0]}`)
                    .replace(/@group/g, groupName)
                    .replace(/@members/g, members)

                await sock.sendMessage(id,{
                    image:{ url:image },
                    caption:text,
                    mentions:[user]
                })

                // 🎵 AUDIO
                await sock.sendMessage(id,{
                    audio:{ url: byeAudio },
                    mimetype:'audio/mp4',
                    ptt:false
                })
            }
        }
    }
                                           }
