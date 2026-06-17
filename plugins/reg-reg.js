import fs from 'fs'

const path = './data/registros.json'

function getDB() {

    try {

        if (!fs.existsSync(path)) {

            fs.writeFileSync(
                path,
                JSON.stringify({})
            )

            return {}
        }

        return JSON.parse(
            fs.readFileSync(
                path,
                'utf8'
            )
        )

    } catch {

        return {}
    }
}

function saveDB(db) {

    fs.writeFileSync(
        path,
        JSON.stringify(
            db,
            null,
            2
        )
    )
}

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

        const adminDB = JSON.parse(
            fs.readFileSync(
                './data/modoadmin.json'
            )
        )

        isBlockedGroup =
            adminDB[from]

    } catch {}

    const user =
        participants?.find(
            p => p.id === sender
        )

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    if (
        isBlockedGroup &&
        !isAdmin
    ) return

    const db =
        getDB()

    const id =
        sender.split('@')[0]

    // ⚠️ ya registrado
    if (db[id]) {

        return sock.sendMessage(
            from,
            {
                text:
`⚠️ Ya estás registrado.

👤 ${db[id].nombre}
🎂 ${db[id].edad} años`
            },
            {
                quoted:m
            }
        )
    }

    // 📥 argumentos
    const argsText =
        m.body
        ?.trim()
        .split(/\s+/)
        .slice(1)

    if (
        !argsText ||
        argsText.length < 2
    ) {

        return sock.sendMessage(
            from,
            {
                text:
`📝 REGISTRO

Uso:
.reg Nombre Edad

Ejemplo:
.reg Gabo 40`
            },
            {
                quoted:m
            }
        )
    }

    const nombre =
        argsText
        .slice(0, -1)
        .join(' ')

    const edad =
        parseInt(
            argsText[
                argsText.length - 1
            ]
        )

    if (
        !edad ||
        edad < 1 ||
        edad > 100
    ) {

        return sock.sendMessage(
            from,
            {
                text:
'⚠️ Ingresa una edad válida.'
            },
            {
                quoted:m
            }
        )
    }

    // ⚡ reacción
    await sock.sendMessage(
        from,
        {
            react:{
                text:'📝',
                key:m.key
            }
        }
    )

    // 💾 guardar
    db[id] = {

        nombre,
        edad,

        nivel: 1,
        vida: 100,
        dinero: 0,

        fecha:
            Date.now()
    }

    saveDB(db)

    // ✅ mensaje
    await sock.sendMessage(
        from,
        {
            text:
`╭━━━〔 ✅ REGISTRO 〕━━━⬣
┃
┃ 👤 Nombre:
┃ ${nombre}
┃
┃ 🎂 Edad:
┃ ${edad}
┃
┃ ⭐ Nivel:
┃ 1
┃
┃ ❤️ Vida:
┃ 100
┃
┃ 💰 Dinero:
┃ 0
┃
┃ 🎉 Registro completado
┃
╰━━━━━━━━━━━━━━━━⬣

> SPIDER BOT`
        },
        {
            quoted:m
        }
    )

    await sock.sendMessage(
        from,
        {
            react:{
                text:'✅',
                key:m.key
            }
        }
    )
}

handler.command = ['reg']
handler.tags = ['reg']
handler.help = ['reg <nombre> <edad>']
handler.group = true
handler.menu = true

export default handler