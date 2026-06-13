import fs from 'fs'

const dbPath = './data/4vs4.json'

function getDB() {
    try {
        if (!fs.existsSync(dbPath)) return {}
        return JSON.parse(fs.readFileSync(dbPath))
    } catch {
        return {}
    }
}

function saveDB(db) {
    fs.writeFileSync(
        dbPath,
        JSON.stringify(db, null, 2)
    )
}

const handler = async ({
    sock,
    m,
    from,
    sender,
    isGroup
}) => {

    if (!isGroup) return

    let db = getDB()

    if (!db[from]) {
        return sock.sendMessage(from,{
            text:'❌ No hay ninguna sala activa.'
        },{
            quoted:m
        })
    }

    let sala = db[from]

    const titularIndex =
        sala.titulares.indexOf(sender)

    const suplenteIndex =
        sala.suplentes.indexOf(sender)

    if (
        titularIndex === -1 &&
        suplenteIndex === -1
    ) {
        return sock.sendMessage(from,{
            text:'⚠️ No estás anotado.'
        },{
            quoted:m
        })
    }

    await sock.sendMessage(from,{
        react:{
            text:'❌',
            key:m.key
        }
    })

    let mensaje = ''

    // 👥 Quitar titular
    if (titularIndex !== -1) {

        sala.titulares.splice(
            titularIndex,
            1
        )

        // 🔥 Subir suplente
        if (
            sala.suplentes.length > 0
        ) {

            const subir =
                sala.suplentes.shift()

            sala.titulares.push(
                subir
            )

            mensaje =
                '❌ Saliste de la lista.\n🪑 Un suplente subió a titular.'

        } else {

            mensaje =
                '❌ Saliste de la lista.'
        }

    }

    // 🪑 Quitar suplente
    if (suplenteIndex !== -1) {

        sala.suplentes.splice(
            suplenteIndex,
            1
        )

        mensaje =
            '❌ Saliste de la lista.'
    }

    saveDB(db)

    const titulares =
        Array.from(
            { length: 4 },
            (_, i) =>
                sala.titulares[i]
                ? `${i + 1}. @${sala.titulares[i].split('@')[0]}`
                : `${i + 1}.`
        ).join('\n')

    const suplentes =
        Array.from(
            { length: 4 },
            (_, i) =>
                sala.suplentes[i]
                ? `🧧 @${sala.suplentes[i].split('@')[0]}`
                : `🧧.`
        ).join('\n')

    const mentions = [
        ...sala.titulares,
        ...sala.suplentes
    ]

    await sock.sendMessage(from,{
        text:
`⚔️ 4 VS 4

🕒 MX: ${sala.mx}
🇨🇴 COL: ${sala.col}
🇦🇷 ARG: ${sala.arg}

👥 TITULARES:
${titulares}

🪑 SUPLENTES:
${suplentes}

${mensaje}`,
        mentions
    },{
        quoted:m
    })
}

handler.command = ['quitar']
handler.tags = ['ff']
handler.group = true
handler.menu = false

export default handler