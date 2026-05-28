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

function sumarHoras(mx, plus) {

    try {

        const partes = mx.split(':')

        let hora =
            parseInt(partes[0])

        let min =
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

    // 🚫 solo grupos
    if (!isGroup) {

        return sock.sendMessage(from,{
            text:
'⚠️ Solo funciona en grupos.'
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

    // 🇨🇴 +1
    const col =
        mx
        ? sumarHoras(mx, 1)
        : null

    // 🇦🇷 +3
    const ar =
        mx
        ? sumarHoras(mx, 3)
        : null

    // 📋 mensaje
    const text =
mx
? `╭━━━〔 ⚔️ 12 VS 12 〕━━━⬣
┃
┃ 🕒 HORA:
┃ 🇲🇽 MX: ${mx}
┃ 🇨🇴 COL: ${col}
┃ 🇦🇷 ARG: ${ar}
┃
┃ 👥 TITULARES:
┃ 1.
┃ 2.
┃ 3.
┃ 4.
┃ 5.
┃ 6.
┃ 7.
┃ 8.
┃ 9.
┃ 10.
┃ 11.
┃ 12.
┃
┃ 🪑 SUPLENTES:
┃ 1.
┃ 2.
┃ 3.
┃ 4.
┃ 5.
┃ 6.
╰━━━━━━━━━━━━━━━━⬣`
: `📌 EJEMPLO DE USO:

.12vs12 7:00

🕒 HORAS AUTOMÁTICAS:
🇲🇽 MX: 7:00
🇨🇴 COL: 8:00
🇦🇷 ARG: 10:00`

    // 📤 enviar
    await sock.sendMessage(from,{
        text
    },{
        quoted:m
    })
}

handler.command = ['12vs12']
handler.tags = ['ff']
handler.help = ['12vs12 <hora mx>']
handler.group = true
handler.menu = true

export default handler