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

/* 📥 SCRAPER */
async function tiktokScraper(url) {

    try {

        const key64 =
            'c2FzdWtl'

        const decodedKey =
            Buffer
                .from(
                    key64,
                    'base64'
                )
                .toString('utf-8')

        const { data } =
            await axios.get(
`https://api.evogb.org/dl/tiktok?url=${encodeURIComponent(url)}&key=${decodedKey}`
            )

        if (!data.status)
            return {
                status:false
            }

        return {

            status:true,

            title:
                data.data.title,

            author:
                data.data.author.nickname,

            user:
                data.data.author.unique_id,

            duration:
                data.data.duration,

            likes:
                data.data.stats.likes,

            shares:
                data.data.stats.shares,

            download:
                data.data.dl
        }

    } catch {

        return {
            status:false
        }
    }
}

/* 🚀 COMANDO */
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

    /* 📥 URL */
    let query =
        args.join(' ').trim()

    if (!query) {

        return sock.sendMessage(from,{
            text:
`╭━━━〔 🎬 SPIDER TIKTOK 〕━━━⬣
┃
┃ ⚡ Ingresa un link de TikTok
┃
┃ 📌 Ejemplo:
┃ .tiktok https://vm.tiktok.com/xxxxx
┃
╰━━━━━━━━━━━━━━━━⬣`
        },{
            quoted:m
        })
    }

    /* ⚡ REACCIÓN */
    await sock.sendMessage(from,{
        react:{
            text:'⚡',
            key:m.key
        }
    })

    /* 📥 DESCARGAR */
    const res =
        await tiktokScraper(query)

    if (!res.status) {

        await sock.sendMessage(from,{
            react:{
                text:'❌',
                key:m.key
            }
        })

        return sock.sendMessage(from,{
            text:
'❌ Error al procesar el enlace'
        },{
            quoted:m
        })
    }

    /* 🖼️ INFO */
    let ui =
`╭━━━〔 🎬 SPIDER TIKTOK 〕━━━⬣
┃
┃ 📝 𝐓𝐈𝐓𝐔𝐋𝐎:
┃ ${res.title?.slice(0,100) || 'Sin título'}
┃
┃ 👤 𝐀𝐔𝐓𝐎𝐑:
┃ ${res.author} (@${res.user})
┃
┃ ⏱️ 𝐃𝐔𝐑𝐀𝐂𝐈𝐎𝐍:
┃ ${res.duration}
┃
┃ ❤️ 𝐋𝐈𝐊𝐄𝐒:
┃ ${Number(res.likes).toLocaleString()}
┃
┃ 🔄 𝐒𝐇𝐀𝐑𝐄𝐒:
┃ ${Number(res.shares).toLocaleString()}
┃
┃ ⚡ Descargando video...
╰━━━━━━━━━━━━━━━━⬣`

    /* 📤 VIDEO */
    await sock.sendMessage(from,{
        video:{
            url:res.download
        },
        caption:ui,
        mimetype:'video/mp4',
        fileName:'spider-tiktok.mp4'
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
}

handler.command = ['tt']
handler.tags = ['descargas']
handler.group = true
handler.menu = true

export default handler