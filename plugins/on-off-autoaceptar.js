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

const procesando = new Set()

setInterval(async () => {

    try {

        const db = getDB()

        for (const groupId of Object.keys(db)) {

            if (!db[groupId]?.enabled) continue

            if (procesando.has(groupId)) continue

            procesando.add(groupId)

            try {

                // 📋 metadata
                const metadata =
                    await sock.groupMetadata(groupId)

                // 🤖 verificar que el bot siga siendo admin
                const bot =
                    metadata.participants.find(
                        p =>
                            p.id === sock.user.id ||
                            p.id === sock.user.jid
                    )

                const botAdmin =
                    bot?.admin === 'admin' ||
                    bot?.admin === 'superadmin'

                if (!botAdmin) {
                    procesando.delete(groupId)
                    continue
                }

                // 🔥 solicitudes pendientes
                const requests =
                    await sock.groupRequestParticipantsList(groupId)

                if (!requests?.length) {

                    procesando.delete(groupId)
                    continue
                }

                const users =
                    requests.map(
                        u => u.jid
                    )

                try {

                    // ✅ aprobar todos juntos
                    await sock.groupRequestParticipantsUpdate(
                        groupId,
                        users,
                        'approve'
                    )

                    await sock.sendMessage(groupId,{
                        text:

`🕸️ AUTOACEPTAR

✅ Se aprobaron automáticamente ${users.length} solicitudes.`
})

                } catch (err) {

                    console.log(
                        'Error aprobando lote:',
                        err
                    )

                    // 🔥 respaldo usuario por usuario
                    for (const jid of users) {

                        try {

                            await sock.groupRequestParticipantsUpdate(
                                groupId,
                                [jid],
                                'approve'
                            )

                        } catch (e) {

                            console.log(
                                'Error aprobando usuario:',
                                jid,
                                e
                            )
                        }
                    }
                }

            } catch (err) {

                // 🚫 ignorar grupos que devuelven forbidden
                if (
                    err?.data === 403 ||
                    err?.message?.includes('forbidden')
                ) {

                    procesando.delete(groupId)
                    continue
                }

                console.log(
                    'Error obteniendo solicitudes:',
                    err
                )

            } finally {

                procesando.delete(groupId)
            }
        }

    } catch (err) {

        console.log(
            'Error autoaceptar:',
            err
        )
    }

}, 5000) // ⚡ cada 5 segundos

}