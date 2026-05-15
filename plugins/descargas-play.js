import yts from 'yt-search'
import axios from 'axios'
import fs from 'fs'

const path = './data/modoadmin.json'

function getDB() {
    try {
        if (!fs.existsSync(path)) return {}
        return JSON.parse(fs.readFileSync(path, 'utf-8'))
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

    const botName =
        sock.user?.name || 'SPIDER BOT 🕷️'

    /* 🔒 MODODADMIN */
    if (isGroup) {

        const db = getDB()

        const isBlockedGroup =
            db[from]

        const user =
            participants.find(
                p => p.id === sender
            )

        const isAdmin =
            user?.admin === 'admin' ||
            user?.admin === 'superadmin'

        if (isBlockedGroup && !isAdmin)
            return
    }

    const text =
        args.join(' ').trim()

    if (!text) {

        return sock.sendMessage(from,{
            text:
'🕷️ Uso correcto: .play <nombre de la canción>'
        },{ quoted:m })
    }

    /* ⚡ REACCIÓN */
    await sock.sendMessage(from,{
        react:{
            text:'🔎',
            key:m.key
        }
    })

    try {

        /* 🔍 BUSCAR VIDEO */
        const search =
            await yts(text)

        if (!search.videos.length) {

            return sock.sendMessage(from,{
                text:
'❌ No se encontraron resultados'
            },{ quoted:m })
        }

        const video =
            search.videos[0]

        const {
            title,
            url,
            thumbnail,
            timestamp,
            views,
            author
        } = video

        /* 📡 API YTMP3 */
        const api =
            `https://api.delirius.store/download/ytmp3?url=${encodeURIComponent(url)}`

        const { data } =
            await axios.get(api)

        if (
            !data.status ||
            !data.data ||
            !data.data.download
        ) {

            return sock.sendMessage(from,{
                text:
'❌ No pude descargar el audio'
            },{ quoted:m })
        }

        const audio =
            data.data.download

        /* 🕷️ PANEL */
        await sock.sendMessage(from,{
            image:{ url: thumbnail },
            caption:
`╭━━━━━━━━━━━━╮
┃ 🕷️ SPIDER 🕷️ ┃
╰━━━━━━━━━━━━╯

🎵 ${title}

👤 ${author.name || 'Desconocido'}
⏱️ ${timestamp}
👁️ ${views.toLocaleString()}

╭━━━━━━━━━━━━╮
┃ ⚡ Audio listo
╰━━━━━━━━━━━━╯`
        },{ quoted:m })

        /* 🎧 ENVIAR AUDIO */
        await sock.sendMessage(from,{
            audio:{ url: audio },
            mimetype:'audio/mpeg',
            fileName:`${title}.mp3`,
            ptt:false
        },{ quoted:m })

        /* ✅ REACCIÓN */
        await sock.sendMessage(from,{
            react:{
                text:'✅',
                key:m.key
            }
        })

    } catch (e) {

        console.log('PLAY ERROR:', e)

        sock.sendMessage(from,{
            text:
'🕷️ Sistema Spider: Error interno'
        },{ quoted:m })
    }
}

handler.command = ['play']
handler.tags = ['descargas']
handler.group = true
handler.menu = true

export default handler