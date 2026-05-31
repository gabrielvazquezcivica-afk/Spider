import fs from 'fs'

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

    const casados =
        getDB(casadosPath)

    if (
        casados[sender] ||
        casados[propuesta.de]
    ) {

        delete propuestas[sender]

        saveDB(
            propuestasPath,
            propuestas
        )

        return sock.sendMessage(from,{
            text:
'❌ Uno de los usuarios ya está casado.'
        },{
            quoted:m
        })
    }

    casados[sender] =
        propuesta.de

    casados[propuesta.de] =
        sender

    saveDB(
        casadosPath,
        casados
    )

    delete propuestas[sender]

    saveDB(
        propuestasPath,
        propuestas
    )

    await sock.sendMessage(from,{
        text:
`💒 MATRIMONIO REALIZADO

❤️ @${propuesta.de.split('@')[0]}
🤝
❤️ @${sender.split('@')[0]}

¡Felicitaciones! 🎉`,
        mentions:[
            propuesta.de,
            sender
        ]
    },{
        quoted:m
    })
}

handler.command = ['aceptar']
handler.group = true
handler.menu = false

export default handler