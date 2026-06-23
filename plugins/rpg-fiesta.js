import fs from 'fs'

const regDB = './data/registros.json'

const fiestas = {
    casa: {
        nombre: '🏠 Fiesta en Casa',
        costo: 5000,
        exp: 25
    },
    antro: {
        nombre: '🎶 Fiesta en Antro',
        costo: 50000,
        exp: 80
    },
    mansion: {
        nombre: '🏛️ Fiesta en Mansión',
        costo: 500000,
        exp: 180
    },
    yate: {
        nombre: '🛥️ Fiesta en Yate',
        costo: 3000000,
        exp: 500
    },
    isla: {
        nombre: '🏝️ Fiesta en Isla Privada',
        costo: 15000000,
        exp: 1200
    }
}

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

function saveJSON(path, data) {
    fs.writeFileSync(
        path,
        JSON.stringify(data, null, 2)
    )
}

const sleep = ms =>
    new Promise(resolve =>
        setTimeout(resolve, ms)
    )

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

    if (
        isBlockedGroup &&
        !isAdmin
    ) return

    const regs = readJSON(regDB)
    const id = sender.split('@')[0]

    if (!regs[id]) {
        return sock.sendMessage(from,{
            text:'⚠️ Debes registrarte.'
        },{ quoted:m })
    }

    if (!args.length) {
        return sock.sendMessage(from,{
            text:
`╭━━━〔 🎉 FIESTAS 〕━━━⬣
┃
┃ 🏠 casa → 5,000
┃ 🎶 antro → 50,000
┃ 🏛️ mansion → 500,000
┃ 🛥️ yate → 3,000,000
┃ 🏝️ isla → 15,000,000
┃
┃ Usa:
┃ .fiesta casa
┃
╰━━━━━━━━━━━━━━━━⬣`
        },{ quoted:m })
    }

    const tipo =
        args[0].toLowerCase()

    const fiesta =
        fiestas[tipo]

    if (!fiesta) {
        return sock.sendMessage(from,{
            text:'⚠️ Fiesta inválida.'
        },{ quoted:m })
    }

    if (
        regs[id].dinero <
        fiesta.costo
    ) {
        return sock.sendMessage(from,{
            text:'⚠️ No tienes suficiente dinero.'
        },{ quoted:m })
    }

    regs[id].dinero -= fiesta.costo

    let exp = fiesta.exp
    let bonus = 0

    if (Math.random() < 0.20) {
        bonus = Math.floor(
            fiesta.costo * 0.30
        )
        regs[id].dinero += bonus
    }

    regs[id].exp =
        (regs[id].exp || 0) + exp

    regs[id].nivel =
        regs[id].nivel || 1

    let levelup = false

    while (regs[id].exp >= 200) {
        regs[id].exp -= 200
        regs[id].nivel++
        levelup = true
    }

    saveJSON(regDB, regs)

    const invitados =
        participants
            ?.map(p => p.id)
            .filter(id => id !== sender) || []

    // ANIMACIÓN
    await sock.sendMessage(from,{
        text:'🍾 Preparando la fiesta...'
    },{ quoted:m })

    await sleep(1200)

    await sock.sendMessage(from,{
        text:'🎶 Encendiendo música...'
    })

    await sleep(1200)

    await sock.sendMessage(from,{
        text:'🍻 Llegando invitados...'
    })

    await sleep(1200)

    await sock.sendMessage(from,{
        text:
`╭━━━〔 🎉 FIESTA 〕━━━⬣
┃
┃ ${fiesta.nombre}
┃
┃ 💸 Gastaste:
┃ ${fiesta.costo}
┃
┃ ⭐ EXP:
┃ +${exp}
${bonus ? `┃ 🎁 Bonus:\n┃ +${bonus}` : ''}
${levelup ? '┃ 🎉 SUBISTE DE NIVEL' : ''}
┃
┃ @${id}
┃ los invitó a su fiesta en
┃ ${tipo.toUpperCase()}
┃
┃ > DIVIÉRTANSE 🍾
┃
╰━━━━━━━━━━━━━━━━⬣`,
        mentions:[
            sender,
            ...invitados
        ]
    },{ quoted:m })
}

handler.command = ['fiesta']
handler.group = true
handler.menu = true
handler.tags = ['rpg']

export default handler