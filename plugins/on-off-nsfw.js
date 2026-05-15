import fs from 'fs'

const path = './data/nsfw.json'

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

function saveDB(data) {

    fs.writeFileSync(
        path,
        JSON.stringify(data,null,2)
    )
}

const handler = async (ctx) => {

    const {
        sock,
        m,
        from,
        isGroup,
        participants,
        sender,
        args
    } = ctx

    if (!isGroup) {

        return sock.sendMessage(from,{
            text:'⚠️ Este comando solo funciona en grupos'
        },{ quoted:m })
    }

    /* 👑 SOLO ADMINS */
    const user =
        participants.find(
            p => p.id === sender
        )

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    if (!isAdmin) {

        return sock.sendMessage(from,{
            text:'⚠️ Solo administradores pueden usar este comando'
        },{ quoted:m })
    }

    const option =
        args[0]?.toLowerCase()

    /* ❓ AYUDA */
    if (
        !option ||
        !['on','off'].includes(option)
    ) {

        return sock.sendMessage(from,{
            text:
`🔞 CONFIGURACIÓN NSFW

• .nsfw on
Activa comandos +18

• .nsfw off
Desactiva comandos +18`
        },{ quoted:m })
    }

    const db = getDB()

    /* ✅ ACTIVAR */
    if (option === 'on') {

        if (db[from]) {

            return sock.sendMessage(from,{
                text:'⚠️ El modo NSFW ya está activado'
            },{ quoted:m })
        }

        db[from] = true

        saveDB(db)

        await sock.sendMessage(from,{
            react:{
                text:'🔞',
                key:m.key
            }
        })

        return sock.sendMessage(from,{
            text:
`🔞 El contenido NSFW fue activado
> Por @${sender.split('@')[0]}`,
            mentions:[sender]
        },{ quoted:m })
    }

    /* ❌ DESACTIVAR */
    if (option === 'off') {

        if (!db[from]) {

            return sock.sendMessage(from,{
                text:'⚠️ El modo NSFW ya está desactivado'
            },{ quoted:m })
        }

        delete db[from]

        saveDB(db)

        await sock.sendMessage(from,{
            react:{
                text:'✅',
                key:m.key
            }
        })

        return sock.sendMessage(from,{
            text:
`✅ El contenido NSFW fue desactivado
> Por @${sender.split('@')[0]}`,
            mentions:[sender]
        },{ quoted:m })
    }
}

handler.command = ['nsfw']
handler.tags = ['on-off']
handler.group = true
handler.menu = true

export default handler