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

    // 📌 texto
    const text =
        args.join(' ').trim()

    // 👥 menciones
    const mentions =
        participants.map(
            p => p.id
        )

    // ⚡ reacción
    await sock.sendMessage(from,{
        react:{
            text:'📢',
            key:m.key
        }
    })

    // 📋 mensaje
    const msg =
text
? `╭━━━〔 📢 HONOR 〕━━━⬣
┃
┃ ⚠️ No olviden hacer
┃ el honor que se les pide.
┃
┃ 📝 ${text}
┃
╰━━━━━━━━━━━━━━━━⬣`
: `╭━━━〔 📢 HONOR 〕━━━⬣
┃
┃ ⚠️ No olviden hacer
┃ el honor que se les pide.
┃
╰━━━━━━━━━━━━━━━━⬣`

    // 📤 enviar
    await sock.sendMessage(from,{
        text: msg,
        mentions
    },{
        quoted:m
    })
}

handler.command = ['honor']
handler.tags = ['ff']
handler.help = ['honor <mensaje>']
handler.group = true
handler.menu = true

export default handler