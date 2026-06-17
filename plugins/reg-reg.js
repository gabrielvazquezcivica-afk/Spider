import fs from 'fs'

const pathDB = './data/registros.json'

function getDB() {

try {

    if (!fs.existsSync(pathDB)) {

        fs.writeFileSync(
            pathDB,
            JSON.stringify({})
        )

        return {}
    }

    return JSON.parse(
        fs.readFileSync(
            pathDB,
            'utf8'
        )
    )

} catch {

    return {}
}

}

function saveDB(db) {

fs.writeFileSync(
    pathDB,
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
args,
participants
}) => {

// 🔒 MODODADMIN
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

const db = getDB()

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
🎂 ${db[id].edad} años
⭐ Nivel ${db[id].nivel}`
},
{
quoted:m
}
)
}

// 📝 ejemplo
if (!args || args.length < 2) {

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

const edad =
    parseInt(
        args[args.length - 1]
    )

const nombre =
    args
    .slice(0, -1)
    .join(' ')

if (
    !nombre ||
    isNaN(edad)
) {

    return sock.sendMessage(
        from,
        {
            text:

`⚠️ Formato incorrecto.

Ejemplo:
.reg Gabo 40`
},
{
quoted:m
}
)
}

if (
    edad < 1 ||
    edad > 100
) {

    return sock.sendMessage(
        from,
        {
            text:

'⚠️ Ingresa una edad válida entre 1 y 100.'
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