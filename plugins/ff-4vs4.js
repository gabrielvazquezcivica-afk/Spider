import fs from 'fs'

const path = './data/modoadmin.json'

function getDB() {

    try {

        if (!fs.existsSync(path))
            return {}

        return JSON.parse(
            fs.readFileSync(path, 'utf-8')
        )

    } catch {

        return {}
    }
}

function sumarHoraMX(mx) {

    try {

        const partes = mx.split(':')

        let hora =
            parseInt(partes[0])

        let min =
            partes[1] || '00'

        hora += 1

        if (hora >= 24)
            hora = 0

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

    // 🚫 solo grupos
    if (!isGroup) {

        return sock.sendMessage(from,{
            text:
'⚠️ Este comando solo funciona en grupos.'
        },{
            quoted:m
        })
    }

    /* 🔒 MODODADMIN */
    const db = getDB()

    const isBlockedGroup =
        db[from]

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

    // ⚔️ reacción
    await sock.sendMessage(from,{
        react:{
            text:'⚔️',
            key:m.key
        }
    })

    // 🕒 hora MX
    const mx =
        args[0] || null

    // 🇨🇴 automática
    const col =
        mx
        ? sumarHoraMX(mx)
        : null

    // 📋 lista
    const text =
mx
? `╭━━━〔 ⚔️ 4 VS 4 〕━━━⬣
┃
┃ 🕒 HORA:
┃ 🇲🇽 MX: ${mx}
┃ 🇨🇴 COL: ${col}
┃
┃ 👥 TITULARES:
┃ 1.
┃ 2.
┃ 3.
┃ 4.
┃
┃ 🪑 SUPLENTES:
┃ 1.
┃ 2.
┃
╰━━━━━━━━━━━━━━━━⬣`
: `╭━━━〔 ⚔️ 4 VS 4 〕━━━⬣
┃
┃ 👥 TITULARES:
┃ 1.
┃ 2.
┃ 3.
┃ 4.
┃
┃ 🪑 SUPLENTES:
┃ 1.
┃ 2.
┃
┣━━━━━━━━━━━━━━━━⬣
┃ 📌 EJEMPLO:
┃ .4vs4 7:00
╰━━━━━━━━━━━━━━━━⬣`

    // 📤 enviar
    await sock.sendMessage(from,{
        text
    },{
        quoted:m
    })
}

handler.command = ['4vs4']
handler.tags = ['ff']
handler.help = ['4vs4 <hora mx>']
handler.group = true
handler.menu = true

export default handler