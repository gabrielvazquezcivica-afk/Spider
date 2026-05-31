import fs from 'fs'

const propuestasPath =
    './data/propuestas.json'

function getDB(path) {
    try {
        if (!fs.existsSync(path))
            return {}

        return JSON.parse(
            fs.readFileSync(
                path,
                'utf-8'
            )
        )
    } catch {
        return {}
    }
}

function saveDB(path, data) {
    fs.writeFileSync(
        path,
        JSON.stringify(
            data,
            null,
            2
        )
    )
}

const handler = async ({
    sock,
    m,
    from,
    sender
}) => {

    const propuestas =
        getDB(propuestasPath)

    const propuesta =
        propuestas[sender]

    if (!propuesta) {

        return sock.sendMessage(from,{
            text:
'❌ No tienes propuestas pendientes.'
        },{
            quoted:m
        })
    }

    delete propuestas[sender]

    saveDB(
        propuestasPath,
        propuestas
    )

    await sock.sendMessage(from,{
        text:
`💔 Propuesta rechazada.

@${sender.split('@')[0]}
rechazó la propuesta de
@${propuesta.de.split('@')[0]}`,
        mentions:[
            sender,
            propuesta.de
        ]
    },{
        quoted:m
    })
}

handler.command = ['rechazar']
handler.group = true
handler.menu = false

export default handler