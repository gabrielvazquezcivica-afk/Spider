import axios from 'axios'
import fs from 'fs'
import path from 'path'

const nsfwPath =
    path.resolve(
        './data/nsfw.json'
    )

/* 🔞 APIS */
const apis = [

'https://api.waifu.pics/nsfw/waifu',
'https://api.waifu.im/search?included_tags=ecchi',
'https://nekos.life/api/v2/img/lewd'

]

const handler = async (ctx) => {

    const {
        sock,
        m,
        from,
        isGroup
    } = ctx

    /* 🔞 NSFW SYSTEM */
    let nsfw = false

    if (
        fs.existsSync(nsfwPath)
    ) {

        try {

            const data =
                JSON.parse(
                    fs.readFileSync(
                        nsfwPath
                    )
                )

            nsfw =
                data[from] || false

        } catch {

            nsfw = false
        }
    }

    if (
        isGroup &&
        !nsfw
    ) {

        return sock.sendMessage(from,{
            text:
`🔞 El NSFW no está activado en este grupo

• Un administrador puede activarlo con:
.nsfw on`
        },{ quoted:m })
    }

    /* ⚡ REACCIÓN */
    await sock.sendMessage(from,{
        react:{
            text:'🕑',
            key:m.key
        }
    })

    let img = null

    /* 🔍 BUSCAR IMG */
    for (const api of apis) {

        try {

            const res =
                await axios.get(
                    api,
                    {
                        timeout:10000
                    }
                )

            img =
                res.data?.url ||
                res.data?.image ||
                res.data?.images?.[0]?.url ||
                res.data?.data?.[0]?.url

            if (img)
                break

        } catch {}
    }

    if (!img) {

        return sock.sendMessage(from,{
            text:'❌ Ninguna API respondió con imagen'
        },{ quoted:m })
    }

    /* 📥 DESCARGAR */
    let buffer

    try {

        buffer = Buffer.from(

            (
                await axios.get(
                    img,
                    {
                        responseType:
                            'arraybuffer'
                    }
                )
            ).data

        )

    } catch {

        return sock.sendMessage(from,{
            text:'❌ Error al descargar la imagen'
        },{ quoted:m })
    }

    const txt =
`🔥 PACK NSFW 🔥

> Usa .pack para otro`

    /* ✅ REACCIÓN */
    await sock.sendMessage(from,{
        react:{
            text:'✅',
            key:m.key
        }
    })

    /* 📤 ENVIAR */
    await sock.sendMessage(from,{
        image:buffer,
        caption:txt
    },{ quoted:m })
}

handler.command = ['pack']
handler.tags = ['nsfw']
handler.menu = true
handler.group = true

export default handler