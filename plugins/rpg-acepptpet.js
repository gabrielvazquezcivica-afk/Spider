import fs from 'fs'

const petDB = './data/mascotas.json'
const fightDB = './data/peleasmascota.json'

function readJSON(path) {
    try {
        if (!fs.existsSync(path)) {
            fs.writeFileSync(path, JSON.stringify({}))
            return {}
        }
        return JSON.parse(fs.readFileSync(path, 'utf8'))
    } catch {
        return {}
    }
}

function saveJSON(path,data){
    fs.writeFileSync(path, JSON.stringify(data,null,2))
}

const handler = async ({
    sock,
    m,
    from,
    sender
}) => {

    const fights = readJSON(fightDB)
    const pets = readJSON(petDB)

    const fight = fights[from]

    if (!fight)
        return sock.sendMessage(from,{
            text:'⚠️ No hay pelea pendiente.'
        },{ quoted:m })

    if (!fight.pending)
        return sock.sendMessage(from,{
            text:'⚠️ Ya comenzó.'
        },{ quoted:m })

    if (sender !== fight.target)
        return sock.sendMessage(from,{
            text:'⚠️ No es para ti.'
        },{ quoted:m })

    const pet1 = pets[fight.challenger.split('@')[0]]
    const pet2 = pets[fight.target.split('@')[0]]

    fight.pending = false
    fight.active = true

    fight.hp1 = 100 + ((pet1.level || 1) * 20)
    fight.hp2 = 100 + ((pet2.level || 1) * 20)

    fight.turn = fight.challenger

    saveJSON(fightDB, fights)

    await sock.sendMessage(from,{
        text:
`╭━━━〔 🐾 BATALLA 〕━━━⬣
┃
┃ ${pet1.pet}
┃ ❤️ ${fight.hp1}
┃
┃ ${pet2.pet}
┃ ❤️ ${fight.hp2}
┃
┃ Turno:
┃ @${fight.turn.split('@')[0]}
┃
┃ Usa:
┃ .ataquepet
┃
╰━━━━━━━━━━━━━━━━⬣`,
        mentions:[
            fight.turn
        ]
    },{ quoted:m })
}

handler.command = ['acceptpet']
handler.group = true
export default handler