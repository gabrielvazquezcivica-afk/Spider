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

    // 🔒 MODOADMIN
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
`🔍 BUSCADOR DE STICKERS

Ejemplo:
.packs gato
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

        const pack =
            data.resultado.packs[0]

        const total =
            pack.stickers.length

        await sock.sendMessage(from,{
            text:
`╭━━━〔 🔍 STICKER SEARCH 〕━━━⬣
┃
┃ 📦 PACK:
┃ ${pack.title}
┃
┃ 👤 AUTOR:
┃ ${pack.author}
┃
┃ 🎯 RESULTADOS:
┃ ${total} stickers
┃
┃ 📝 BÚSQUEDA:
┃ ${query}
╰━━━━━━━━━━━━━━━━⬣

> 🕸️ SPIDER BOT`
        },{
            quoted:m
        })

        // 📤 enviar primeros 5
        const enviar =
            pack.stickers.slice(0,5)

        for (
            const url
            of enviar
        ) {

            try {

                const res =
                    await axios.get(
                        url,
                        {
                            responseType:
                            'arraybuffer'
                        }
                    )

                await sock.sendMessage(
                    from,
                    {
                        sticker:
                        Buffer.from(
                            res.data
                        )
                    }
                )

            } catch {}

        }

        // ✅ reacción final
        await sock.sendMessage(from,{
            react:{
                text:'✅',
                key:m.key
            }
        })

    } catch (e) {

        console.log(
            'STICKER SEARCH:',
            e
        )

        await sock.sendMessage(from,{
            text:
'❌ Error buscando stickers.'
        },{
            quoted:m
        })
    }
}

handler.command = ['pack']
handler.tags = ['stickers']
handler.help = ['s <tema>']
handler.menu = true

export default handler