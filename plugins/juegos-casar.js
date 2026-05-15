import fs from 'fs'

const marryPath = './data/casados.json'
const modoadminPath = './data/modoadmin.json'

if (!fs.existsSync(marryPath)) {
    fs.writeFileSync(
        marryPath,
        JSON.stringify({})
    )
}

function getDB() {

    try {

        return JSON.parse(
            fs.readFileSync(marryPath)
        )

    } catch {

        return {}
    }
}

function saveDB(data) {

    fs.writeFileSync(
        marryPath,
        JSON.stringify(data, null, 2)
    )
}

function getModoAdmin() {

    try {

        if (!fs.existsSync(modoadminPath))
            return {}

        return JSON.parse(
            fs.readFileSync(modoadminPath)
        )

    } catch {

        return {}
    }
}

const pendientes = {}

const handler = async ({
    sock,
    m,
    from,
    sender,
    participants,
    isGroup,
    command
}) => {

    if (!isGroup) return

    /* 🔒 MODODADMIN */
    const modoadmin =
        getModoAdmin()

    const isBlockedGroup =
        modoadmin[from]

    if (isBlockedGroup) {

        const user =
            participants.find(
                p => p.id === sender
            )

        const isAdmin =
            user?.admin === 'admin' ||
            user?.admin === 'superadmin'

        if (!isAdmin) return
    }

    /* =========================
       💍 CASAR
    ========================== */

    if (command === 'casar') {

        const ctx =
            m.message?.extendedTextMessage?.contextInfo

        const userRaw =
            ctx?.mentionedJid?.[0] ||
            ctx?.participant

        if (!userRaw) {

            return sock.sendMessage(from,{
                text:
`💍 Menciona o responde a alguien

Ejemplo:
.casar @usuario`
            },{ quoted:m })
        }

        if (userRaw === sender) {

            return sock.sendMessage(from,{
                text:
'💀 No puedes casarte contigo mismo'
            },{ quoted:m })
        }

        const db = getDB()

        // 🔒 ya casado
        if (db[sender]) {

            return sock.sendMessage(from,{
                text:
`💍 Ya estás casado con @${db[sender].split('@')[0]}`,
                mentions:[db[sender]]
            },{ quoted:m })
        }

        if (db[userRaw]) {

            return sock.sendMessage(from,{
                text:
`💍 Esa persona ya está casada con @${db[userRaw].split('@')[0]}`,
                mentions:[db[userRaw]]
            },{ quoted:m })
        }

        // 🔒 pendiente
        if (pendientes[userRaw]) {

            return sock.sendMessage(from,{
                text:
'⚠️ Esa persona ya tiene una propuesta pendiente'
            },{ quoted:m })
        }

        pendientes[userRaw] = {
            pareja: sender,
            grupo: from,
            tiempo: Date.now()
        }

        await sock.sendMessage(from,{
            react:{
                text:'💍',
                key:m.key
            }
        })

        return sock.sendMessage(from,{
            text:
`💍 @${sender.split('@')[0]} quiere casarse con @${userRaw.split('@')[0]}

📝 Responde con:

• .aceptar
• .rechazo

⏳ Tienes 2 minutos`,
            mentions:[
                sender,
                userRaw
            ]
        },{ quoted:m })
    }

    /* =========================
       ❌ RECHAZO
    ========================== */

    if (command === 'rechazo') {

        const pending =
            pendientes[sender]

        if (!pending) {

            return sock.sendMessage(from,{
                text:
'⚠️ No tienes propuestas pendientes'
            },{ quoted:m })
        }

        if (pending.grupo !== from)
            return

        // ⏰ expiración
        if (
            Date.now() - pending.tiempo >
            120000
        ) {

            delete pendientes[sender]

            return sock.sendMessage(from,{
                text:
'⌛ La propuesta expiró'
            },{ quoted:m })
        }

        delete pendientes[sender]

        await sock.sendMessage(from,{
            react:{
                text:'💔',
                key:m.key
            }
        })

        return sock.sendMessage(from,{
            text:
`💔 @${sender.split('@')[0]} rechazó la propuesta`,
            mentions:[sender]
        },{ quoted:m })
    }

    /* =========================
       ✅ ACEPTAR
    ========================== */

    if (command === 'aceptar') {

        const pending =
            pendientes[sender]

        if (!pending) {

            return sock.sendMessage(from,{
                text:
'⚠️ No tienes propuestas pendientes'
            },{ quoted:m })
        }

        if (pending.grupo !== from)
            return

        // ⏰ expiración
        if (
            Date.now() - pending.tiempo >
            120000
        ) {

            delete pendientes[sender]

            return sock.sendMessage(from,{
                text:
'⌛ La propuesta expiró'
            },{ quoted:m })
        }

        const db = getDB()

        // 🔒 validar otra vez
        if (db[sender]) {

            delete pendientes[sender]

            return sock.sendMessage(from,{
                text:
'💍 Ya estás casado'
            },{ quoted:m })
        }

        if (db[pending.pareja]) {

            delete pendientes[sender]

            return sock.sendMessage(from,{
                text:
'💍 La otra persona ya está casada'
            },{ quoted:m })
        }

        db[sender] = pending.pareja
        db[pending.pareja] = sender

        saveDB(db)

        delete pendientes[sender]

        await sock.sendMessage(from,{
            react:{
                text:'💖',
                key:m.key
            }
        })

        return sock.sendMessage(from,{
            text:
`💒 MATRIMONIO COMPLETADO 💒

💍 @${pending.pareja.split('@')[0]}
❤️
💍 @${sender.split('@')[0]}

✨ Ahora están casados`,
            mentions:[
                pending.pareja,
                sender
            ]
        },{ quoted:m })
    }
}

handler.command = [
    'casar',
    'aceptar',
    'rechazo'
]

handler.tags = ['juegos']
handler.group = true
handler.menu = true

export default handler
