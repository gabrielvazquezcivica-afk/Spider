import fs from 'fs'

const nsfwPath = './data/nsfw.json'
const modoadminPath = './data/modoadmin.json'
const autoaceptarPath = './data/autoaceptar.json'
const antilinkPath = './data/antilink.json'
const welcomePath = './data/welcome.json'

function getDB(path) {

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
    participants
}) => {

    if (!isGroup) return

    const user =
        participants?.find(
            p => p.id === sender
        )

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    if (!isAdmin) {

        return sock.sendMessage(from,{
            text:'⚠️ Solo los administradores pueden usar este comando.'
        },{ quoted:m })
    }

    // ⚡ REACCIÓN
    await sock.sendMessage(from,{
        react:{
            text:'📋',
            key:m.key
        }
    })

    let metadata

    try {

        metadata =
            await sock.groupMetadata(from)

    } catch {

        return sock.sendMessage(from,{
            text:'❌ No pude obtener la información del grupo.'
        },{ quoted:m })
    }

    const nsfwDB =
        getDB(nsfwPath)

    const modoadminDB =
        getDB(modoadminPath)

    const autoaceptarDB =
        getDB(autoaceptarPath)

const antilinkDB =
    getDB(antilinkPath)

    const welcomeDB =
        getDB(welcomePath)

    const nsfw =
        nsfwDB[from]
            ? '🟢 Activado'
            : '🔴 Desactivado'

const antilink =
    antilinkDB[from]
        ? '🟢 Activado'
        : '🔴 Desactivado'

    const modoadmin =
        modoadminDB[from]
            ? '🟢 Activado'
            : '🔴 Desactivado'

    const autoaceptar =
        autoaceptarDB[from]?.enabled
            ? '🟢 Activado'
            : '🔴 Desactivado'

    const welcome =
        welcomeDB[from]
            ? '🟢 Activado'
            : '🔴 Desactivado'

    let pp

    try {

        pp =
            await sock.profilePictureUrl(
                from,
                'image'
            )

    } catch {

        pp =
            'https://i.imgur.com/4M34hi2.png'
    }

    const texto =
`╭━━━〔 🕷️ INFO GRUPO 🕷️ 〕━━━⬣
┃
┃ 📌 Nombre:
┃ ${metadata.subject}
┃
┃ 👥 Miembros:
┃ ${metadata.participants.length}
┃
┣━━━━━━━━━━━━━━⬣
┃ 🔞 NSFW:
┃ ${nsfw}
┃
┃ 🛡️ Modo Admin:
┃ ${modoadmin}
┃
┃ 🤖 Autoaceptar:
┃ ${autoaceptar}
┃
┃ 🔗 Antilink:
┃ ${antilink}
┃
┃ 👋 Welcome:
┃ ${welcome}
┣━━━━━━━━━━━━━━⬣
┃ 📍 ID:
┃ ${from}
┃
╰━━━━━━━━━━━━━━━━⬣

> 𝐁𝐘 𝐒𝐎𝐘𝐆𝐀𝐁𝐎 `

    await sock.sendMessage(from,{
        image:{
            url: pp
        },
        caption: texto
    },{ quoted:m })
}

handler.command = ['infogrupo']
handler.tags = ['grupo']
handler.help = ['infogrupo']
handler.group = true
handler.menu = true

export default handler