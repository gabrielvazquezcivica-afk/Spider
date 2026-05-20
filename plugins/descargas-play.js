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
'🎵 Usa:\n.play nombre de la canción'
        },{ quoted:m })
    }

    /* ⚡ REACCIÓN */
    await sock.sendMessage(from,{
        react:{
            text:'🎧',
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
'❌ No encontré resultados'
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

        /* 📡 API */
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

        /* 🖼️ INFO */
        await sock.sendMessage(from,{
            image:{ url: thumbnail },
            caption:
`╭━━━〔 🎵 SPIDER PLAY 〕━━━⬣
┃
┃ 🎶 ${title}
┃
┃ 👤 𝐂𝐀𝐍𝐀𝐋:
┃ ${author.name || 'Desconocido'}
┃
┃ ⏱️ 𝐃𝐔𝐑𝐀𝐂𝐈𝐎𝐍:
┃ ${timestamp}
┃
┃ 👁️ 𝐕𝐈𝐒𝐈𝐓𝐀𝐒:
┃ ${views.toLocaleString()}
┃
┃ ⚡ Descargando audio...
╰━━━━━━━━━━━━━━━━⬣`
        },{ quoted:m })

        /* 🎧 AUDIO */
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
'❌ Ocurrió un error al descargar la canción'
        },{ quoted:m })
    }
}

handler.command = ['play']
handler.tags = ['descargas']
handler.group = true
handler.menu = true

export default handler