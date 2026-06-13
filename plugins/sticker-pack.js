
import fs from 'fs'
import axios from 'axios'

const modoAdminPath = './data/modoadmin.json'

function getModoAdmin() {

    try {

        if (!fs.existsSync(modoAdminPath))
            return {}

        return JSON.parse(
            fs.readFileSync(
                modoAdminPath,
                'utf8'
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
    sender,
    participants,
    isGroup,
    args
}) => {

    // 🔒 MODODADMIN
    const db =
        getModoAdmin()

    const isBlockedGroup =
        db[from]

    const user =
        participants?.find(
            p => p.id === sender
        )

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    if (
        isGroup &&
        isBlockedGroup &&
        !isAdmin
    ) return

    const query =
        args.join(' ').trim()

    if (!query) {

        return sock.sendMessage(from,{
            text:
`🔍 BUSCADOR DE PACKS

Ejemplo:
.pack gato
.pack anime
.pack meme`
        },{
            quoted:m
        })
    }

    try {

        // 🔍 reacción
        await sock.sendMessage(from,{
            react:{
                text:'🔍',
                key:m.key
            }
        })

        const {
            data
        } = await axios.get(
            'https://fare.ink/search/s',
            {
                params:{
                    q:query
                }
            }
        )

        if (
            !data.status ||
            !data.resultado?.packs?.length
        ) {

            return sock.sendMessage(from,{
                text:
'❌ No se encontraron resultados.'
            },{
                quoted:m
            })
        }

        let texto =
`╭━━━〔 🔍 STICKER PACK SEARCH 〕━━━⬣
┃
┃ 🔎 BÚSQUEDA:
┃ ${query}
┃
┃ 📦 RESULTADOS:
┃ ${data.resultado.total_results}
┃
╰━━━━━━━━━━━━━━━━⬣
`

        data.resultado.packs
        .slice(0,5)
        .forEach((pack,i)=>{

            texto += `

╭─〔 ${i+1} 〕
│ 📦 ${pack.title}
│ 👤 ${pack.author}
│ 🎯 ${pack.stickers.length} stickers
│ 🔗 ${pack.pack_url}
╰────────────`
        })

        texto += `

> 🕸️ SPIDER BOT`

        await sock.sendMessage(from,{
            text:texto
        },{
            quoted:m
        })

        // ✅ reacción
        await sock.sendMessage(from,{
            react:{
                text:'✅',
                key:m.key
            }
        })

    } catch (e) {

        console.log(
            'PACK ERROR:',
            e
        )

        await sock.sendMessage(from,{
            text:
'❌ Error obteniendo información del pack.'
        },{
            quoted:m
        })
    }
}

handler.command = ['pack']
handler.tags = ['stickers']
handler.help = ['pack <tema>']
handler.menu = true

export default handler