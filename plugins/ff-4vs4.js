import fs from 'fs'

const dbPath = './data/4vs4.json'
const modoAdminPath = './data/modoadmin.json'

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

function getModoAdmin() {
    try {
        if (!fs.existsSync(modoAdminPath))
            return {}

        return JSON.parse(
            fs.readFileSync(
                modoAdminPath,
                'utf8'
            )
        )

    } catch {
        return {}
    }
}

function sumarHoras(mx, plus) {

    try {

        const partes = mx.split(':')

        let hora =
            parseInt(partes[0])

        const min =
            partes[1] || '00'

        hora += plus

        if (hora >= 24)
            hora -= 24

        return `${hora}:${min}`

    } catch {

        return '--:--'
    }
}

const handler = async ({
    sock,
    m,
    from,
    sender,
    isGroup,
    participants,
    args
}) => {

    if (!isGroup) {

        return sock.sendMessage(from,{
            text:'⚠️ Solo funciona en grupos.'
        },{
            quoted:m
        })
    }

    // 🔒 MODOADMIN
    const modoAdmin =
        getModoAdmin()

    const isBlockedGroup =
        modoAdmin[from]

    const user =
        participants.find(
            p => p.id === sender
        )

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    if (
        isBlockedGroup &&
        !isAdmin
    ) return

    await sock.sendMessage(from,{
        react:{
            text:'⚔️',
            key:m.key
        }
    })

    const mx =
        args[0]

    if (!mx) {

        return sock.sendMessage(from,{
            text:
`📌 EJEMPLO:

.4vs4 7:00`
        },{
            quoted:m
        })
    }

    const col =
        sumarHoras(mx,1)

    const arg =
        sumarHoras(mx,3)

    const db =
        getDB()

    // 🔥 REEMPLAZA LA SALA DEL GRUPO
    db[from] = {

        hora: mx,
        mx,
        col,
        arg,

        titulares: [],

        suplentes: [],

        lleno: false,

        creado:
            Date.now()
    }

    saveDB(db)

    const text =
`╭━━━〔 ⚔️ 4 VS 4 〕━━━⬣
┃
┃ 🕒 HORA:
┃ 🇲🇽 MX: ${mx}
┃ 🇨🇴 COL: ${col}
┃ 🇦🇷 ARG: ${arg}
┃
┃ 👥 TITULARES:
┃ 1.
┃ 2.
┃ 3.
┃ 4.
┃
┃ 🪑 SUPLENTES:
┃ 🧧.
┃ 🧧.
┃ 🧧.
┃ 🧧.
╰━━━━━━━━━━━━━━━━⬣

📌 Usa:

.part
Para anotarte`

    await sock.sendMessage(from,{
        text
    },{
        quoted:m
    })
}

handler.command = ['4vs4']
handler.tags = ['ff']
handler.help = ['4vs4']
handler.group = true
handler.menu = true

export default handler