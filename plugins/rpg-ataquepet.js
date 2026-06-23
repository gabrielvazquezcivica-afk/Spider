import fs from 'fs'

const petDB = './data/mascotas.json'
const regDB = './data/registros.json'
const fightDB = './data/peleasmascota.json'

function readJSON(path){
    try{
        if(!fs.existsSync(path)){
            fs.writeFileSync(path,JSON.stringify({}))
            return {}
        }
        return JSON.parse(fs.readFileSync(path,'utf8'))
    }catch{
        return {}
    }
}

function saveJSON(path,data){
    fs.writeFileSync(path,JSON.stringify(data,null,2))
}

function bar(hp,maxhp){
    const filled=Math.floor((hp/maxhp)*10)
    return '🟩'.repeat(filled)+'⬜'.repeat(10-filled)
}

const handler = async ({
    sock,
    m,
    from,
    sender
}) => {

    const fights = readJSON(fightDB)
    const pets = readJSON(petDB)
    const regs = readJSON(regDB)

    const fight = fights[from]

    if (!fight || !fight.active)
        return sock.sendMessage(from,{
            text:'⚠️ No hay pelea.'
        },{ quoted:m })

    if (
        sender !== fight.challenger &&
        sender !== fight.target
    ) {
        return
    }

    if (fight.turn !== sender)
        return sock.sendMessage(from,{
            text:'⚠️ No es tu turno.'
        },{ quoted:m })

    const attackerPet =
        sender === fight.challenger
        ? pets[fight.challenger.split('@')[0]]
        : pets[fight.target.split('@')[0]]

    const level =
        attackerPet.level || 1

    const damage =
        Math.floor(Math.random()*13)+8+(level*3)

    let winner = null

    if (sender === fight.challenger) {
        fight.hp2 -= damage
        fight.turn = fight.target
        if (fight.hp2 <= 0)
            winner = fight.challenger
    } else {
        fight.hp1 -= damage
        fight.turn = fight.challenger
        if (fight.hp1 <= 0)
            winner = fight.target
    }

    if (winner) {

        const winId =
            winner.split('@')[0]

        regs[winId].dinero += fight.bet

        pets[winId].exp =
            (pets[winId].exp || 0) + 50

        pets[winId].level =
            pets[winId].level || 1

        while (pets[winId].exp >= 200) {
            pets[winId].exp -= 200
            pets[winId].level++
        }

        saveJSON(regDB, regs)
        saveJSON(petDB, pets)

        delete fights[from]
        saveJSON(fightDB, fights)

        return sock.sendMessage(from,{
            text:
`🏆 Ganador:
@${winId}

💰 Premio:
${fight.bet}

⭐ Mascota subió experiencia`,
            mentions:[winner]
        },{ quoted:m })
    }

    saveJSON(fightDB, fights)

    await sock.sendMessage(from,{
        text:
`╭━━━〔 🐾 ATAQUE 〕━━━⬣
┃
┃ 💥 Daño:
┃ ${damage}
┃
┃ HP1:
┃ ${fight.hp1}
┃
┃ ${bar(fight.hp1,200)}
┃
┃ HP2:
┃ ${fight.hp2}
┃
┃ ${bar(fight.hp2,200)}
┃
┃ Turno:
┃ @${fight.turn.split('@')[0]}
┃
╰━━━━━━━━━━━━━━━━⬣`,
        mentions:[fight.turn]
    },{ quoted:m })
}

handler.command = ['ataquepet']
handler.group = true
export default handler