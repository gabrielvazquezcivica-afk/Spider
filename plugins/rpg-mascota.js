import fs from 'fs'

const regDB = './data/registros.json'
const petDB = './data/mascotas.json'

const pets = [
    { name:'🐭 Ratón', price:2000 },
    { name:'🐱 Gato', price:5000 },
    { name:'🐶 Perro', price:15000 },
    { name:'🦊 Zorro', price:50000 },
    { name:'🐺 Lobo', price:120000 },
    { name:'🐯 Tigre', price:500000 },
    { name:'🦁 León', price:1500000 },
    { name:'🐉 Dragón bebé', price:3000000 },
    { name:'🔥 Fénix', price:6000000 },
    { name:'🌌 Dragón celestial', price:10000000 }
]

function readJSON(path) {
    try {
        if (!fs.existsSync(path)) {
            fs.writeFileSync(path, JSON.stringify({}))
            return {}
        }
        return JSON.parse(fs.readFileSync(path,'utf8'))
    } catch {
        return {}
    }
}

function saveJSON(path,data) {
    fs.writeFileSync(
        path,
        JSON.stringify(data,null,2)
    )
}

const handler = async ({
    sock,
    m,
    from,
    sender,
    args,
    participants
}) => {

    // MODODADMIN
    let isBlockedGroup = false

    try {
        const db = JSON.parse(
            fs.readFileSync('./data/modoadmin.json')
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

    if (isBlockedGroup && !isAdmin) return

    const regs = readJSON(regDB)
    const petsDB = readJSON(petDB)

    const id = sender.split('@')[0]

    if (!regs[id]) {
        return sock.sendMessage(from,{
            text:'⚠️ Debes registrarte.'
        },{ quoted:m })
    }

    // Mostrar tienda
    if (!args.length) {

        let txt =
`╭━━━〔 🐾 TIENDA MASCOTAS 〕━━━⬣
┃
`

        pets.forEach((pet,i)=>{
            txt += `┃ ${i+1}. ${pet.name}\n`
            txt += `┃ 💰 ${pet.price}\n┃\n`
        })

        txt +=
`┃ Comprar:
┃ .pet comprar <número>
┃
╰━━━━━━━━━━━━━━━━⬣`

        return sock.sendMessage(from,{
            text:txt
        },{ quoted:m })
    }

    const sub =
        args[0].toLowerCase()

    if (
        sub === 'comprar'
    ) {
        const num =
            parseInt(args[1])

        if (
            !num ||
            num < 1 ||
            num > pets.length
        ) {
            return sock.sendMessage(from,{
                text:'⚠️ Mascota inválida.'
            },{ quoted:m })
        }

        if (petsDB[id]) {
            return sock.sendMessage(from,{
                text:'⚠️ Ya tienes una mascota.'
            },{ quoted:m })
        }

        const pet = pets[num-1]

        if (
            regs[id].dinero < pet.price
        ) {
            return sock.sendMessage(from,{
                text:'⚠️ No tienes suficiente dinero.'
            },{ quoted:m })
        }

        regs[id].dinero -= pet.price

        petsDB[id] = {
            pet: pet.name,
            price: pet.price,
            level: 1
        }

        saveJSON(regDB, regs)
        saveJSON(petDB, petsDB)

        return sock.sendMessage(from,{
            text:
`╭━━━〔 🐾 COMPRA 〕━━━⬣
┃
┃ Compraste:
┃ ${pet.name}
┃
┃ 💰 -${pet.price}
┃
╰━━━━━━━━━━━━━━━━⬣`
        },{ quoted:m })
    }
}

handler.command = ['pet']
handler.tags = ['rpg']
handler.group = true
handler.menu = true

export default handler