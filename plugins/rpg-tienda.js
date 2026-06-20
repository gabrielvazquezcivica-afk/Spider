import fs from 'fs'

const handler = async ({
    sock,
    m,
    from,
    participants,
    sender
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

    await sock.sendMessage(from,{
        text:
`╭━━━〔 🛒 TIENDA 〕━━━⬣
┃
┃ 1) +10 ❤️  → $250
┃ 2) +25 ❤️  → $700
┃ 3) +50 ❤️  → $1800
┃ 4) +100 ❤️ → $5000
┃
┃ Comprar:
┃ .buy <número>
┃
┃ Ejemplo:
┃ .buy 2
┃
╰━━━━━━━━━━━━━━━━⬣`
    },{ quoted:m })
}

handler.command = ['tienda']
handler.tags = ['rpg']
handler.group = true
handler.menu = true

export default handler