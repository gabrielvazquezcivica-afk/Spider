import fs from 'fs'

const file = './data/autoaceptar.json'

function getDB() {

    try {

        if (!fs.existsSync(file))
            return {}

        return JSON.parse(
            fs.readFileSync(
                file,
                'utf8'
            )
        )

    } catch {

        return {}
    }
}

function saveDB(db) {

    fs.writeFileSync(
        file,
        JSON.stringify(
            db,
            null,
            2
        )
    )
}

let iniciado = false

const handler = async ({
    sock,
    m,
    from,
    isGroup,
    participants,
    sender,
    args
}) => {

    if (!isGroup) return

    const user =
        participants.find(
            p => p.id === sender
        )

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    if (!isAdmin) {

        return sock.sendMessage(from,{
            text:'❌ Solo administradores.'
        },{ quoted:m })
    }

    await sock.sendMessage(from,{
        react:{
            text:'🕸️',
            key:m.key
        }
    })

    const db = getDB()

    if (!db[from]) {

        db[from] = {
            enabled:false
        }
    }

    const option =
        args[0]?.toLowerCase()

    if (!option) {

        return sock.sendMessage(from,{
            text:
`🕷️ AUTOACEPTAR

.autoaceptar on
.autoaceptar off`
        },{ quoted:m })
    }

    // 🟢 ACTIVAR
    if (option === 'on') {

        if (db[from].enabled) {

            return sock.sendMessage(from,{
                text:'⚠️ El autoaceptar ya está activado.'
            },{ quoted:m })
        }

        db[from].enabled = true

        saveDB(db)

        return sock.sendMessage(from,{
            text:'✅ Autoaceptar activado.'
        },{ quoted:m })
    }

    // 🔴 DESACTIVAR
    if (option === 'off') {

        if (!db[from].enabled) {

            return sock.sendMessage(from,{
                text:'⚠️ El autoaceptar ya está desactivado.'
            },{ quoted:m })
        }

        db[from].enabled = false

        saveDB(db)

        return sock.sendMessage(from,{
            text:'❌ Autoaceptar desactivado.'
        },{ quoted:m })
    }

    return sock.sendMessage(from,{
        text:'⚠️ Usa solamente on/off.'
    },{ quoted:m })
}

handler.command = ['autoaceptar']
handler.tags = ['grupo']
handler.menu = true
handler.group = true

export default handler

// ====================================
// AUTOACEPTAR
// ====================================

export async function before({
    sock
}) {

    if (iniciado)
        return

    iniciado = true

    setInterval(async ()=>{

        try {

            const db =
                getDB()

            for (
                const groupId
                of Object.keys(db)
            ) {

                if (
                    !db[groupId]?.enabled
                ) continue

                try {

                    const requests =
                        await sock.groupRequestParticipantsList(
                            groupId
                        )

                    if (
                        !requests ||
                        !requests.length
                    ) continue

                    const users =
                        requests.map(
                            x => x.jid
                        )

                    // ✅ aceptar todos
                    await sock.groupRequestParticipantsUpdate(
                        groupId,
                        users,
                        'approve'
                    )

                    // 📢 menciones
                    const lista =
                        users.map(
                            x => `• @${x.split('@')[0]}`
                        ).join('\n')

                    if (
                        users.length === 1
                    ) {

                        await sock.sendMessage(
                            groupId,
                            {
                                text:
`✅ Se aceptó automáticamente la siguiente solicitud:

${lista}`,
                                mentions: users
                            }
                        )

                    } else {

                        await sock.sendMessage(
                            groupId,
                            {
                                text:
`✅ Se aceptaron automáticamente ${users.length} solicitudes:

${lista}`,
                                mentions: users
                            }
                        )
                    }

                } catch (e) {

                    console.log(
                        'AUTOACEPTAR ERROR:',
                        e
                    )
                }
            }

        } catch (e) {

            console.log(
                'AUTOACEPTAR:',
                e
            )
        }

    },10000) // revisar cada 10 segundos
}