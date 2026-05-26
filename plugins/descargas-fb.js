import axios from 'axios'
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

    const query =
        args.join(' ').trim()

    if (!query) {

        return sock.sendMessage(from,{
            text:
`╭━━━〔 📘 SPIDER FACEBOOK 〕━━━⬣
┃
┃ ⚡ Ingresa un link de Facebook
┃
┃ 📌 Ejemplo:
┃ .fb https://facebook.com/xxxx
┃
╰━━━━━━━━━━━━━━━━⬣`
        },{
            quoted:m
        })
    }

    await sock.sendMessage(from,{
        react:{
            text:'⏳',
            key:m.key
        }
    })

    try {

        const key =
            Buffer
                .from(
                    'ZWt1c2Fz',
                    'base64'
                )
                .toString('utf-8')
                .split('')
                .reverse()
                .join('')

        const endpoint =
`https://api.evogb.org/dl/facebook?url=${encodeURIComponent(query)}&key=${key}`

        const { data } =
            await axios.get(endpoint)

        if (!data.status) {

            await sock.sendMessage(from,{
                react:{
                    text:'❌',
                    key:m.key
                }
            })

            return sock.sendMessage(from,{
                text:
'❌ No pude descargar el video'
            },{
                quoted:m
            })
        }

        const video =
            data.resultados?.[0]?.url

        if (!video) {

            return sock.sendMessage(from,{
                text:
'❌ No encontré el enlace'
            },{
                quoted:m
            })
        }

        const ui =
`╭━━━〔 📘 SPIDER FACEBOOK 〕━━━⬣
┃
┃ ⚡ Descargando video...
┃
┃ 📥 Procesando archivo
┃ 🔥 Calidad optimizada
┃
╰━━━━━━━━━━━━━━━━⬣`

        await sock.sendMessage(from,{
            video:{ url:video },
            caption:ui,
            mimetype:'video/mp4'
        },{
            quoted:m
        })

        await sock.sendMessage(from,{
            react:{
                text:'✅',
                key:m.key
            }
        })

    } catch(e){

        console.log(
            'FB ERROR:',
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
'❌ Error al descargar'
        },{
            quoted:m
        })
    }
}

handler.command = ['fb']
handler.tags = ['descargas']
handler.group = true
handler.menu = true

export default handler