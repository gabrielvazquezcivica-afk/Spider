import fs from 'fs'

const path = './data/warns.json'

function getDB() {

    try {

        if (!fs.existsSync(path))
            return {}

        return JSON.parse(
            fs.readFileSync(path,'utf-8')
        )

    } catch {

        return {}
    }
}

function onlyNumber(jid = '') {

    return jid.replace(/[^0-9]/g,'')
}

const handler = async (ctx) => {

    const {
        sock,
        m,
        from,
        isGroup
    } = ctx

    if (!isGroup) {

        return sock.sendMessage(from,{
            text:'⚠️ Este comando solo funciona en grupos'
        },{ quoted:m })
    }

    const db = getDB()

    if (
        !db[from] ||
        Object.keys(db[from]).length === 0
    ) {

        return sock.sendMessage(from,{
            text:'✅ No hay usuarios advertidos en este grupo'
        },{ quoted:m })
    }

    /* 📋 LISTA */
    let text =
`⚠️ LISTA DE ADVERTENCIAS

`

    let mentions = []

    for (const user in db[from]) {

        const warns =
            db[from][user]?.warns || 0

        text +=
`👤 @${onlyNumber(user)}
> Advertencias: ${warns}/3

`

        mentions.push(user)
    }

    await sock.sendMessage(from,{
        text,
        mentions
    },{ quoted:m })
}

handler.command = ['warnlist']
handler.tags = ['grupo']
handler.group = true
handler.menu = true

export default handler