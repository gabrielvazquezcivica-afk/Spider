import fetch from 'node-fetch'
import fs from 'fs'

/* 🔒 MODODADMIN */
const modoadminPath = './data/modoadmin.json'

function getModoadmin() {

    try {

        if (!fs.existsSync(modoadminPath))
            return {}

        return JSON.parse(
            fs.readFileSync(
                modoadminPath,
                'utf-8'
            )
        )

    } catch {

        return {}
    }
}

/* 🚀 COMANDO */
const handler = async ({
    sock,
    m,
    from,
    sender,
    isGroup,
    participants,
    args,
    command
}) => {

    /* 🔒 MODODADMIN */
    const db = getModoadmin()

    const isBlockedGroup =
        db[from]?.enabled

    if (
        isBlockedGroup &&
        isGroup
    ) {

        const user =
            participants?.find(
                p => p.id === sender
            )

        const isAdmin =
            user?.admin === 'admin' ||
            user?.admin === 'superadmin'

        if (!isAdmin)
            return
    }

    /* 📝 TEXTO */
    let text =
        args.join(' ').trim()

    if (!text) {

        text =
            m.message?.extendedTextMessage
                ?.contextInfo
                ?.quotedMessage
                ?.conversation ||

            m.message?.extendedTextMessage
                ?.contextInfo
                ?.quotedMessage
                ?.extendedTextMessage
                ?.text ||

            null
    }

    if (!text) {

        return sock.sendMessage(from,{
            text:
`💬 Ingresa una consulta

Ejemplo:
.${command} ¿Quién es Messi?`
        },{
            quoted:m
        })
    }

    /* ⏳ REACCIÓN */
    await sock.sendMessage(from,{
        react:{
            text:'💬',
            key:m.key
        }
    })

    try {

        const res =
            await fetch(
`https://api.delirius.store/ia/chatgpt?q=${encodeURIComponent(text)}`
            )

        const json =
            await res.json()

        if (
            !json.status ||
            !json.data
        ) {

            await sock.sendMessage(from,{
                react:{
                    text:'❌',
                    key:m.key
                }
            })

            return sock.sendMessage(from,{
                text:
'⚠️ Error de API'
            },{
                quoted:m
            })
        }

        /* 📤 RESPUESTA */
        await sock.sendMessage(from,{
            text: json.data
        },{
            quoted:m
        })

        /* ✅ */
        await sock.sendMessage(from,{
            react:{
                text:'✅',
                key:m.key
            }
        })

    } catch(e){

        console.log(
            'CHATGPT ERROR:',
            e
        )

        await sock.sendMessage(from,{
            react:{
                text:'❌',
                key:m.key
            }
        })

        await sock.sendMessage(from,{
            text:
'🛑 Error al consultar IA'
        },{
            quoted:m
        })
    }
}

handler.command = ['chatgpt']
handler.tags = ['ia']
handler.help = ['ia <texto>']
handler.menu = true

export default handler