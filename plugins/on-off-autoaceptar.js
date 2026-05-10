import fs from 'fs'

const path = './data/autoaceptar.json'

// 📥 DB
function getDB() {
    try {
        if (!fs.existsSync(path)) return {}
        return JSON.parse(fs.readFileSync(path, 'utf-8'))
    } catch {
        return {}
    }
}

// 💾 SAVE
function saveDB(data) {
    fs.writeFileSync(path, JSON.stringify(data, null, 2))
}

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
            enabled:false
        }
    }

    const option = args[0]?.toLowerCase()

    if (!option) {
        return sock.sendMessage(from,{
            text:
`🕷️ Uso correcto:

.autoaceptar on
.autoaceptar off`
        },{ quoted:m })
    }

    // 🟢 ON
    if (option === 'on') {

        if (db[from].enabled) {
            return sock.sendMessage(from,{
                text:'⚠️ El autoaceptar ya estaba activado'
            },{ quoted:m })
        }

        db[from].enabled = true
        saveDB(db)

        return sock.sendMessage(from,{
            text:'🕸️ Autoaceptar activado'
        },{ quoted:m })
    }

    // 🔴 OFF
    if (option === 'off') {

        if (!db[from].enabled) {
            return sock.sendMessage(from,{
                text:'⚠️ El autoaceptar ya estaba desactivado'
            },{ quoted:m })
        }

        db[from].enabled = false
        saveDB(db)

        return sock.sendMessage(from,{
            text:'🕷️ Autoaceptar desactivado'
        },{ quoted:m })
    }

    return sock.sendMessage(from,{
        text:'⚠️ Usa solamente on/off'
    },{ quoted:m })
}

handler.command = ['autoaceptar']
handler.tags = ['on-off']
handler.group = true
handler.menu = true

export default handler

// 🕷️ AUTOACEPTAR SOLICITUDES
export async function before({
    sock,
    update
}) {

    if (!Array.isArray(update)) {
        update = [update]
    }

    const db = getDB()

    for (const group of update) {

        if (!group || !group.id) continue

        const id = group.id

        if (!db[id]?.enabled) continue

        // 🔥 solicitudes
        const users = Array.isArray(group.participants)
            ? group.participants
            : []

        for (const user of users) {

            try {

                // ✅ aceptar solicitud
                await sock.groupRequestParticipantsUpdate(
                    id,
                    [user],
                    'approve'
                )

                // 📢 aviso
                await sock.sendMessage(id,{
                    text:`✅ @${user.split('@')[0]} fue aceptado correctamente`,
                    mentions:[user]
                })

            } catch (err) {
                console.log('Error autoaceptar:', err)
            }
        }
    }
              }
