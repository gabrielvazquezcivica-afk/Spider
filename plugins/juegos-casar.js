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

    if (modoadmin[from]?.enabled) {

        const user = participants?.find(
            p => p.id === sender
        )

        const isAdmin =
            user?.admin === 'admin' ||
            user?.admin === 'superadmin'

        if (!isAdmin) return
    }

    const mentioned =
        m.message?.extendedTextMessage
            ?.contextInfo
            ?.mentionedJid?.[0]

    if (!mentioned) {

        return sock.sendMessage(from,{
            text:
`💍 Debes mencionar a alguien.

Ejemplo:
.casar @usuario`
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
handler.group = true
handler.menu = true

export default handler