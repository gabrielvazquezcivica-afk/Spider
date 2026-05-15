import axios from 'axios'
import fs from 'fs'

const modoadminPath = './data/modoadmin.json'

// 🔒 MODODADMIN
function getModoAdmin() {

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

const handler = async ({
    sock,
    m,
    from,
    args,
    isGroup,
    participants,
    sender,
    command
}) => {

    /* 🔒 MODODADMIN */
    if (isGroup) {

        const modoadmin =
            getModoAdmin()

        const isBlockedGroup =
            modoadmin[from]

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
`🕷️ SPIDER YTMP3

Ejemplo:
.${command} https://youtu.be/5M_n2UCe7DQ`
        },{ quoted:m })
    }

    // ⚡ reacción
    await sock.sendMessage(from,{
        react:{
            text:'⏳',
            key:m.key
        }
    })

    try {

        const { data } =
            await axios.get(
                `https://api.delirius.store/download/ytmp3?url=${encodeURIComponent(text)}`
            )

        if (
            !data?.status ||
            !data?.data
        ) {

            throw new Error(
                'Sin datos'
            )
        }

        const {
            title,
            author,
            image,
            download
        } = data.data

        // 🕷️ panel spider
        await sock.sendMessage(from,{
            image:{ url:image },
            caption:
`╭━━━〔 🕷️ SPIDER YTMP3 〕━━━⬣

🎵 ${title}

👤 Canal:
${author}

📥 Enviando audio...

╰━━━━━━━━━━━━━━━━⬣`
        },{ quoted:m })

        // 🎧 audio
        await sock.sendMessage(from,{
            audio:{ url:download },
            mimetype:'audio/mpeg',
            fileName:`${title}.mp3`,
            ptt:false
        },{ quoted:m })

        // ✅ reacción final
        await sock.sendMessage(from,{
            react:{
                text:'✅',
                key:m.key
            }
        })

    } catch (e) {

        console.log(
            'ERROR YTMP3:',
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
'⚠️ No pude descargar el audio'
        },{ quoted:m })
    }
}

handler.command = ['ytmp3']
handler.tags = ['descargas']
handler.group = true
handler.menu = true

export default handler