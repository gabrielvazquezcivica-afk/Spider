import fs from 'fs'

const petDB = './data/mascotas.json'

function getPetDB() {
    try {
        if (!fs.existsSync(petDB)) {
            fs.writeFileSync(
                petDB,
                JSON.stringify({})
            )
            return {}
        }

        return JSON.parse(
            fs.readFileSync(
                petDB,
                'utf8'
            )
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
        const db = JSON.parse(
            fs.readFileSync(
                './data/modoadmin.json'
            )
        )
        isBlockedGroup = db[from]
    } catch {}

    const adminUser =
        participants?.find(
            p => p.id === sender
        )

    const isAdmin =
        adminUser?.admin === 'admin' ||
        adminUser?.admin === 'superadmin'

    if (
        isBlockedGroup &&
        !isAdmin
    ) return

    const pets = getPetDB()
    const id = sender.split('@')[0]

    if (!pets[id]) {
        return sock.sendMessage(from,{
            text:
'⚠️ No tienes mascota.\nUsa .pet para comprar una.'
        },{ quoted:m })
    }

    const pet = pets[id]

    const bonus =
        (pet.level || 1) * 5

    await sock.sendMessage(from,{
        react:{
            text:'🐾',
            key:m.key
        }
    })

    await sock.sendMessage(from,{
        text:
`╭━━━〔 🐾 MI MASCOTA 〕━━━⬣
┃
┃ Mascota:
┃ ${pet.pet}
┃
┃ ⭐ Nivel:
┃ ${pet.level || 1}
┃
┃ 💰 Valor:
┃ ${pet.price}
┃
┃ ⚔️ Bonus:
┃ +${bonus}
┃
╰━━━━━━━━━━━━━━━━⬣`
    },{ quoted:m })
}

handler.command = ['mimascota']
handler.tags = ['rpg']
handler.group = true
handler.menu = true

export default handler