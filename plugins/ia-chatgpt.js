import fetch from 'node-fetch'
import fs from 'fs'

/* 🚀 COMANDO */
const handler = async ({
    sock,
    m,
    from,
    participants,
    sender,
    args,
    command
}) => {

    // 🔒 MODODADMIN
    let isBlockedGroup = false

    try {

        const db = JSON.parse(
            fs.readFileSync('./data/modoadmin.json')
        )

        isBlockedGroup = db[from]

    } catch {}

    const user = participants?.find(
        p => p.id === sender
    )

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    // 🔥 silencioso
    if (isBlockedGroup && !isAdmin)
        return

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
handler.group = true

export default handler