import fs from 'fs'

const pathDB = './data/registros.json'

function getDB() {
    try {
        if (!fs.existsSync(pathDB)) {
            fs.writeFileSync(pathDB, JSON.stringify({}))
            return {}
        }

        return JSON.parse(
            fs.readFileSync(pathDB, 'utf8')
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
    participants
}) => {

    // MODODADMIN
    let isBlockedGroup = false

    try {
        const adminDB = JSON.parse(
            fs.readFileSync(
                './data/modoadmin.json',
                'utf8'
            )
        )

        isBlockedGroup = adminDB[from]
    } catch {}

    const adminUser =
        participants?.find(
            p => p.id === sender
        )

    const isSenderAdmin =
        adminUser?.admin === 'admin' ||
        adminUser?.admin === 'superadmin'

    if (
        isBlockedGroup &&
        !isSenderAdmin
    ) return

    let target = sender

    const quoted =
        m.message?.extendedTextMessage
        ?.contextInfo

    if (quoted?.participant) {
        target = quoted.participant
    }

    const mentioned =
        quoted?.mentionedJid

    if (
        mentioned &&
        mentioned.length
    ) {
        target = mentioned[0]
    }

    const db = getDB()
    const id = target.split('@')[0]

    if (!db[id]) {
        return sock.sendMessage(
            from,
            {
                text:
'⚠️ Ese usuario no está registrado.'
            },
            {
                quoted: m
            }
        )
    }

    const data = db[id]

    const participant =
        participants?.find(
            p => p.id === target
        )

    const isAdmin =
        participant?.admin === 'admin' ||
        participant?.admin === 'superadmin'

    const rango =
        isAdmin
        ? 'Admin 👑'
        : 'Miembro 👤'

    const caption =
`╭━━━〔 👤 PERFIL 〕━━━⬣
┃
┃ 🆔 ID:
┃ ${id}
┃
┃ 👤 Nombre:
┃ ${data.nombre}
┃
┃ 🎂 Edad:
┃ ${data.edad}
┃
┃ ⭐ Nivel:
┃ ${data.nivel}
┃
┃ ❤️ Vida:
┃ ${data.vida}
┃
┃ 💰 Dinero:
┃ ${data.dinero}
┃
┃ 🎖️ Rango:
┃ ${rango}
┃
╰━━━━━━━━━━━━━━━━⬣`

    try {

        const pfp =
            await sock.profilePictureUrl(
                target,
                'image'
            )

        await sock.sendMessage(
            from,
            {
                image: {
                    url: pfp
                },
                caption
            },
            {
                quoted: m
            }
        )

    } catch {

        await sock.sendMessage(
            from,
            {
                text: caption
            },
            {
                quoted: m
            }
        )
    }
}

handler.command = ['perfil']
handler.tags = ['reg']
handler.help = ['perfil']
handler.group = true
handler.menu = true

export default handler