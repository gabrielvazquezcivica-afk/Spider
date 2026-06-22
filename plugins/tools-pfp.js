import fs from 'fs'

const handler = async ({
    sock,
    m,
    from,
    sender,
    participants
}) => {

    // 🔒 MODODADMIN
    let isBlockedGroup = false

    try {
        const db = JSON.parse(
            fs.readFileSync(
                './data/modoadmin.json',
                'utf8'
            )
        )

        isBlockedGroup = db[from]
    } catch {}

    const user = participants?.find(
        p => p.id === sender
    )

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    if (
        isBlockedGroup &&
        !isAdmin
    ) return

    let target = sender

    // 📌 mencionado
    const mentioned =
        m.message?.extendedTextMessage
            ?.contextInfo
            ?.mentionedJid

    if (mentioned?.length) {
        target = mentioned[0]
    }

    // 📌 respondido
    const quoted =
        m.message?.extendedTextMessage
            ?.contextInfo
            ?.participant

    if (quoted) {
        target = quoted
    }

    try {

        await sock.sendMessage(from,{
            react:{
                text:'🖼️',
                key:m.key
            }
        })

        const pfp =
            await sock.profilePictureUrl(
                target,
                'image'
            )

        await sock.sendMessage(from,{
            image:{ url: pfp },
            caption:
`🕷️ Foto de perfil

👤 ${target.split('@')[0]}`
        },{ quoted:m })

        await sock.sendMessage(from,{
            react:{
                text:'✅',
                key:m.key
            }
        })

    } catch (e) {

        console.log(
            'PFP ERROR:',
            e
        )

        await sock.sendMessage(from,{
            text:
'❌ Ese usuario no tiene foto de perfil o no pude obtenerla.'
        },{ quoted:m })
    }
}

handler.command = ['pfp']
handler.tags = ['tools']
handler.menu = true
handler.group = true

export default handler