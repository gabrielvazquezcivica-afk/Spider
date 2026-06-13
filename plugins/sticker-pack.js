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

// 🎲 mezclar array
function shuffle(arr) {

    const array = [...arr]

    for (
        let i = array.length - 1;
        i > 0;
        i--
    ) {

        const j = Math.floor(
            Math.random() * (i + 1)
        )

        ;[
            array[i],
            array[j]
        ] = [
            array[j],
            array[i]
        ]
    }

    return array
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

        // 🎲 pack aleatorio
        const packs =
            data.resultado.packs

        const pack =
            packs[
                Math.floor(
                    Math.random() *
                    packs.length
                )
            ]

        const stickers =
            shuffle(
                pack.stickers
            ).slice(0,5)

        await sock.sendMessage(from,{
            text:
`╭━━━〔 🔍 STICKER PACK 〕━━━⬣
┃
┃ 📦 PACK:
┃ ${pack.title}
┃
┃ 👤 AUTOR:
┃ ${pack.author}
┃
┃ 🎯 STICKERS:
┃ ${pack.stickers.length}
┃
┃ 🔍 BÚSQUEDA:
┃ ${query}
┃
┃ 🔗 LINK:
┃ ${pack.pack_url}
╰━━━━━━━━━━━━━━━━⬣

> 🕸️ SPIDER BOT`
        },{
            quoted:m
        })

        // 📤 enviar 5 stickers aleatorios
        for (
            const url
            of stickers
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

            } catch (e) {

                console.log(
                    'ERROR STICKER:',
                    e
                )
            }
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
            'PACK ERROR:',
            e
        )

        await sock.sendMessage(from,{
            text:
'❌ Error buscando packs.'
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