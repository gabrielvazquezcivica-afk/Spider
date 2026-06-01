import fs from 'fs'

const path = './data/autoaceptar.json'

function getDB() {
try {
if (!fs.existsSync(path)) return {}
return JSON.parse(fs.readFileSync(path, 'utf-8'))
} catch {
return {}
}
}

function saveDB(data) {
fs.writeFileSync(
path,
JSON.stringify(data, null, 2)
)
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

const user =
    participants?.find(
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

if (!option) {

    return sock.sendMessage(from,{
        text:

`🕸️ AUTOACEPTAR

.autoaceptar on
.autoaceptar off`
},{ quoted:m })
}

if (option === 'on') {

    db[from].enabled = true
    saveDB(db)

    return sock.sendMessage(from,{
        text:'✅ Autoaceptar activado'
    },{ quoted:m })
}

if (option === 'off') {

    db[from].enabled = false
    saveDB(db)

    return sock.sendMessage(from,{
        text:'❌ Autoaceptar desactivado'
    },{ quoted:m })
}

return sock.sendMessage(from,{
    text:'⚠️ Usa on/off'
},{ quoted:m })

}

handler.command = ['autoaceptar']
handler.tags = ['on-off']
handler.group = true
handler.menu = true

export default handler

export async function before({
sock
}) {

if (started) return
started = true

const procesando =
    new Set()

setInterval(async () => {

    const db = getDB()

    for (const groupId of Object.keys(db)) {

        if (!db[groupId]?.enabled)
            continue

        if (
            procesando.has(groupId)
        ) continue

        procesando.add(groupId)

        try {

            const requests =
                await sock.groupRequestParticipantsList(
                    groupId
                )

            if (
                !requests ||
                !requests.length
            ) {

                procesando.delete(groupId)
                continue
            }

            const users =
                requests.map(
                    x => x.jid
                )

            await sock.groupRequestParticipantsUpdate(
                groupId,
                users,
                'approve'
            )

            // 👤 SOLO UNO
            if (users.length === 1) {

                const user =
                    users[0]

                await sock.sendMessage(groupId,{
                    text:

`🕸️ AUTOACEPTAR

✅ @${user.split('@')[0]} fue aceptado automáticamente.`,
mentions:[user]
})

            } else {

                const lista =
                    users
                    .map(
                        u =>
                        `👤 @${u.split('@')[0]}`
                    )
                    .join('\n')

                await sock.sendMessage(groupId,{
                    text:

`🕸️ AUTOACEPTAR

✅ Se aceptaron automáticamente ${users.length} solicitudes.

${lista}`,
mentions:users
})
}

        } catch (err) {

            // 🚫 grupo eliminado
            if (
                err?.message?.includes(
                    'item-not-found'
                )
            ) {

                const db =
                    getDB()

                delete db[groupId]

                saveDB(db)

                procesando.delete(groupId)
                continue
            }

            // 🚫 forbidden
            if (
                err?.data === 403 ||
                err?.message?.includes(
                    'forbidden'
                )
            ) {

                procesando.delete(groupId)
                continue
            }

            // 🚫 rate limit
            if (
                err?.data === 429 ||
                err?.message?.includes(
                    'rate-overlimit'
                )
            ) {

                procesando.delete(groupId)
                continue
            }

            console.log(
                'AUTOACEPTAR ERROR:',
                err
            )

        } finally {

            procesando.delete(groupId)
        }
    }

}, 15000) // 15 segundos

}