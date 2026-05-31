import fs from 'fs'

const modoadminPath = './data/modoadmin.json'
const propuestasPath = './data/propuestas.json'
const casadosPath = './data/casados.json'

function getDB(path) {
    try {
        if (!fs.existsSync(path)) return {}
        return JSON.parse(fs.readFileSync(path, 'utf-8'))
    } catch {
        return {}
    }
}

function saveDB(path, data) {
    fs.writeFileSync(path, JSON.stringify(data, null, 2))
}

const handler = async ({
    sock,
    m,
    from,
    sender,
    participants,
    isGroup
}) => {

    if (!isGroup) return

    // 🔒 MODODADMIN
const modoadmin = getDB(modoadminPath)

const isBlockedGroup =
    modoadmin[from]

const user =
    participants?.find(
        p => p.id === sender
    )

const isAdmin =
    user?.admin === 'admin' ||
    user?.admin === 'superadmin'

if (
    isBlockedGroup &&
    !isAdmin
) return

    const ctx =
    m.message?.extendedTextMessage
        ?.contextInfo

const mentioned =
    ctx?.mentionedJid?.[0] ||
    ctx?.participant

if (!mentioned) {

    return sock.sendMessage(from,{
        text:
`💍 Debes mencionar o responder a alguien.

Ejemplos:

.casar @usuario

o respondiendo un mensaje:

.casar`
    },{
        quoted:m
    })
}

    if (mentioned === sender) {

        return sock.sendMessage(from,{
            text:'💀 No puedes casarte contigo mismo.'
        },{
            quoted:m
        })
    }

    const casados = getDB(casadosPath)

    if (casados[sender]) {

        return sock.sendMessage(from,{
            text:'💍 Ya estás casado.'
        },{
            quoted:m
        })
    }

    if (casados[mentioned]) {

        return sock.sendMessage(from,{
            text:'💍 Esa persona ya está casada.'
        },{
            quoted:m
        })
    }

    const propuestas = getDB(propuestasPath)

// 💌 propuesta pendiente
if (propuestas[mentioned]) {

    return sock.sendMessage(from,{
        text:
`💌 @${mentioned.split('@')[0]} ya tiene una propuesta pendiente.

⏳ Debe responder primero con:

.aceptar
o
.rechazar`,
        mentions:[mentioned]
    },{
        quoted:m
    })
}

    propuestas[mentioned] = {
        de: sender,
        fecha: Date.now()
    }

    saveDB(propuestasPath, propuestas)

    await sock.sendMessage(from,{
        text:
`💍 PROPOSICIÓN DE MATRIMONIO

❤️ @${sender.split('@')[0]}
quiere casarse con
❤️ @${mentioned.split('@')[0]}

> Responde .aceptar para aceptar
> Responde .rechazar para rechazar`,
        mentions:[
            sender,
            mentioned
        ]
    },{
        quoted:m
    })
}

handler.command = ['casar']
handler.tags = ['juegos']
handler.help = ['casar @usuario']
handler.group = true
handler.menu = true

export default handler