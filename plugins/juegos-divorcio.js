import fs from 'fs'

const modoadminPath = './data/modoadmin.json'
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

    const casados =
        getDB(casadosPath)

    const pareja =
        casados[sender]

    if (!pareja) {

        return sock.sendMessage(from,{
            text:
'💔 No estás casado con nadie.'
        },{
            quoted:m
        })
    }

    delete casados[sender]
    delete casados[pareja]

    saveDB(
        casadosPath,
        casados
    )

    await sock.sendMessage(from,{
        text:
`💔 DIVORCIO REALIZADO

❤️‍🩹 @${sender.split('@')[0]}
y
❤️‍🩹 @${pareja.split('@')[0]}

han terminado su matrimonio.`,
        mentions:[
            sender,
            pareja
        ]
    },{
        quoted:m
    })
}

handler.command = ['divorcio']
handler.tags = ['juegos']
handler.help = ['divorcio']
handler.group = true
handler.menu = true

export default handler