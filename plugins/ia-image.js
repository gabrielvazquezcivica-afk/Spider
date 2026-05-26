import fetch from 'node-fetch'
import fs from 'fs'

/* 🔒 MODODADMIN */
const path = './data/modoadmin.json'

function getDB() {

    try {

        if (!fs.existsSync(path))
            return {}

        return JSON.parse(
            fs.readFileSync(
                path,
                'utf-8'
            )
        )

    } catch {

        return {}
    }
}

const handler = async (ctx) => {

    const {
        sock,
        m,
        from,
        args,
        isGroup,
        participants,
        sender
    } = ctx

    /* 🔒 MODODADMIN */
    if (isGroup) {

        const db =
            getDB()

        const isBlockedGroup =
            db[from]

        const user =
            participants.find(
                p => p.id === sender
            )

        const isAdmin =
            user?.admin === 'admin' ||
            user?.admin === 'superadmin'

        if (
            isBlockedGroup &&
            !isAdmin
        ) return
    }

    const text =
        args.join(' ').trim()

    if (!text) {

        return sock.sendMessage(from,{
            text:
`╭━━━〔 🧠 SPIDER AI IMAGE 〕━━━⬣
┃
┃ ⚡ Escribe un prompt
┃
┃ 📌 Ejemplo:
┃ .iaimage Cyberpunk City
┃
╰━━━━━━━━━━━━━━━━⬣`
        },{
            quoted:m
        })
    }

    /* ⚡ REACCIÓN */
    await sock.sendMessage(from,{
        react:{
            text:'🧬',
            key:m.key
        }
    })

    try {

        const key =
            'sasuke'

        const res =
            await fetch(
`https://api.evogb.org/ai/nanobanana?prompt=${encodeURIComponent(text)}&key=${key}`
            )

        if (!res.ok)
            throw new Error()

        const contentType =
            res.headers.get('content-type')

        let imageUrl

        if (
            contentType &&
            contentType.includes(
                'application/json'
            )
        ) {

            const json =
                await res.json()

            imageUrl =
                json.result

        } else {

            imageUrl =
                res.url
        }

        const ui =
`╭━━━〔 🧠 SPIDER AI IMAGE 〕━━━⬣
┃
┃ 📝 PROMPT:
┃ ${text}
┃
┃ ⚡ Estado:
┃ Imagen generada
┃
┃ 🧪 Modelo:
┃ Nanobanana v3
┃
╰━━━━━━━━━━━━━━━━⬣`

        await sock.sendMessage(from,{
            image:{
                url:imageUrl
            },
            caption:ui
        },{
            quoted:m
        })

        /* ✅ */
        await sock.sendMessage(from,{
            react:{
                text:'✨',
                key:m.key
            }
        })

    } catch(e){

        console.log(
            'AI IMAGE ERROR:',
            e
        )

        await sock.sendMessage(from,{
            react:{
                text:'❌',
                key:m.key
            }
        })

        sock.sendMessage(from,{
            text:
'❌ Error al generar imagen'
        },{
            quoted:m
        })
    }
}

handler.command = ['iaimage']
handler.tags = ['ia']
handler.group = true
handler.menu = true

export default handler