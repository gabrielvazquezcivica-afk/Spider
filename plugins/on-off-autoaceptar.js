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

// 💾 GUARDAR
function saveDB(data) {
    fs.writeFileSync(path, JSON.stringify(data, null, 2))
}

let started = false

const handler = async ({
    sock,
    m,
    from,
    isGroup,
    participants,
    sender,
    args
}) => {

    if (!isGroup) {
        return sock.sendMessage(from,{
            text:'⚠️ Solo funciona en grupos'
        },{ quoted:m })
    }

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

// 🕷️ AUTOACEPTAR REAL
export async function before({
    sock
}) {

    if (started) return
    started = true

    setInterval(async () => {

        try {

            const db = getDB()

            for (const groupId of Object.keys(db)) {

                if (!db[groupId]?.enabled) continue

                try {

                    // 🔥 OBTENER SOLICITUDES
                    const requests =
                        await sock.groupRequestParticipantsList(groupId)

                    if (!requests?.length) continue

                    for (const user of requests) {

                        try {

                            // 🔥 APROBAR
                            await sock.groupRequestParticipantsUpdate(
                                groupId,
                                [user.jid],
                                'approve'
                            )

                            // 🔥 AVISO
                            await sock.sendMessage(groupId,{
                                text:
`🕸️ @${user.jid.split('@')[0]} fue aceptado correctamente`,
                                mentions:[user.jid]
                            })

                        } catch (err) {
                            console.log('Error aprobando:', err)
                        }
                    }

                } catch {}
            }

        } catch (err) {
            console.log('Error autoaceptar:', err)
        }

    }, 5000) // cada 5 segundos
}
