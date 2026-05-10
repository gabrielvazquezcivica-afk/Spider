import fs from 'fs'

const path = './data/autoaceptar.json'

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

// 💾 SAVE
function saveDB(data) {
    fs.writeFileSync(
        path,
        JSON.stringify(data, null, 2)
    )
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

    const db = getDB()

    if (!db[from]) {

        db[from] = {
            enabled:false
        }
    }

    const option =
        args[0]?.toLowerCase()

    // ❓ AYUDA
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
    sock
}) {

    // 🔥 evitar duplicados
    if (global.autoAceptarLoaded) return
    global.autoAceptarLoaded = true

    // 🔄 revisar solicitudes cada 10 segundos
    setInterval(async () => {

        try {

            const db = getDB()

            const groups =
                Object.keys(db)

            for (const groupId of groups) {

                if (!db[groupId]?.enabled)
                    continue

                try {

                    // 📥 solicitudes pendientes
                    const requests =
                        await sock.groupRequestParticipantsList(groupId)

                    if (!requests?.length)
                        continue

                    for (const user of requests) {

                        const jid =
                            user.jid || user.id

                        if (!jid) continue

                        // ✅ aprobar solicitud
                        await sock.groupRequestParticipantsUpdate(
                            groupId,
                            [jid],
                            'approve'
                        )

                        // 📢 aviso
                        await sock.sendMessage(groupId,{
                            text:`@${jid.split('@')[0]} fue aceptado correctamente`,
                            mentions:[jid]
                        })

                        console.log(
                            '🕸️ Usuario aceptado:',
                            jid
                        )
                    }

                } catch (err) {

                    console.log(
                        'AUTOACEPTAR GROUP ERROR:',
                        err
                    )
                }
            }

        } catch (err) {

            console.log(
                'AUTOACEPTAR ERROR:',
                err
            )
        }

    }, 10000)
                        }
