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

function saveDB(db) {
    fs.writeFileSync(
        pathDB,
        JSON.stringify(db, null, 2)
    )
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

    const user = participants?.find(
        p => p.id === sender
    )

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    if (isBlockedGroup && !isAdmin) return

    const db = getDB()
    const id = sender.split('@')[0]

    if (!db[id]) {
        return sock.sendMessage(from,{
            text:'⚠️ Debes registrarte con .reg'
        },{ quoted:m })
    }

    db[id].vida ??= 100
    db[id].nivel ??= 1
    db[id].exp ??= 0
    db[id].dinero ??= 0

    db[id].cooldowns ??= {}

    const now = Date.now()
    const cd = 30 * 60 * 1000

    if (
        db[id].cooldowns.boss &&
        now < db[id].cooldowns.boss
    ) {
        const left =
            db[id].cooldowns.boss - now

        const mins =
            Math.floor(left / 60000)

        return sock.sendMessage(from,{
            text:
`⏳ Debes esperar ${mins} min`
        },{ quoted:m })
    }

    db[id].cooldowns.boss = now + cd

    const bosses = [
        '🐉 Dragón',
        '👹 Demonio',
        '🤖 Titán',
        '💀 Necromancer'
    ]

    const boss =
        bosses[
            Math.floor(
                Math.random() *
                bosses.length
            )
        ]

    const bossHp =
        Math.floor(Math.random() * 120) + 100

    const bossAtk =
        Math.floor(Math.random() * 26) + 15

    const playerAtk =
        Math.floor(Math.random() * 26) + 10 +
        db[id].nivel * 2

    let msg = ''
    let win = false

    if (playerAtk >= bossAtk) {
        win = true
    }

    if (win) {

        const money =
            Math.floor(
                Math.random() * 2501
            ) + 500

        db[id].dinero += money
        db[id].exp += 80

        msg =
`🏆 Derrotaste al boss

💰 +${money}
⭐ +80 EXP`

    } else {

        const damage =
            Math.floor(
                Math.random() * 31
            ) + 20

        db[id].vida -= damage

        if (db[id].vida < 0)
            db[id].vida = 0

        msg =
`💀 El boss te derrotó

❤️ -${damage} vida`
    }

    let levelup = false

    while (db[id].exp >= 200) {
        db[id].exp -= 200
        db[id].nivel += 1
        levelup = true
    }

    saveDB(db)

    await sock.sendMessage(from,{
        text:
`╭━━━〔 👹 BOSS RAID 〕━━━⬣
┃
┃ Boss:
┃ ${boss}
┃
┃ HP Boss:
┃ ${bossHp}
┃
┃ ⚔️ Tu daño:
┃ ${playerAtk}
┃
┃ ⚔️ Daño boss:
┃ ${bossAtk}
┃
┃
┃ ${msg}
┃
┃ ❤️ Vida:
┃ ${db[id].vida}
┃
┃ 💰 Dinero:
┃ ${db[id].dinero}
${levelup ? '┃ 🎉 Subiste de nivel' : ''}
┃
╰━━━━━━━━━━━━━━━━⬣`
    },{ quoted:m })
}

handler.command = ['boss']
handler.tags = ['rpg']
handler.group = true
handler.menu = true

export default handler