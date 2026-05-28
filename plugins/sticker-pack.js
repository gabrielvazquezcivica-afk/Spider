import fetch from 'node-fetch'
import cheerio from 'cheerio'
import fs from 'fs'

/* 🔒 MODODADMIN */
const modoadminPath = './data/modoadmin.json'

function getDB() {

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

/* 🔍 BUSCADOR */
async function searchStickerPacks(
    searchTerm,
    limit = 5
) {

    try {

        const url =
`https://getstickerpack.com/stickers?query=${encodeURIComponent(searchTerm)}`

        const res =
            await fetch(url, {
                headers: {
                    'User-Agent':
                        'Mozilla/5.0',
                    'Accept':
                        'text/html'
                }
            })

        if (!res.ok)
            throw new Error(
                `HTTP ${res.status}`
            )

        const html =
            await res.text()

        const $ =
            cheerio.load(html)

        const packs = []

        $('.sticker-pack-cols').each(
            (i, el) => {

                if (
                    packs.length >= limit
                ) return

                const linkTag =
                    $(el).find('a')

                const packUrl =
                    linkTag.attr('href')

                const title =
                    $(el)
                        .find('.title')
                        .text()
                        .trim()

                const author =
                    $(el)
                        .find('.username')
                        .text()
                        .trim() ||
                    'Desconocido'

                const trayIcon =
                    $(el)
                        .find('img')
                        .attr('src')

                if (
                    packUrl &&
                    title
                ) {

                    packs.push({
                        title,
                        author,
                        pack_url:
                            packUrl.startsWith('http')
                                ? packUrl
                                : `https://getstickerpack.com${packUrl}`,
                        tray_icon:
                            trayIcon
                    })
                }
            }
        )

        return {
            status: true,
            total: packs.length,
            packs
        }

    } catch (e) {

        return {
            status: false,
            error: e.message
        }
    }
}

/* 🚀 COMANDO */
const handler = async ({
    sock,
    m,
    from,
    sender,
    isGroup,
    participants,
    args
}) => {

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
`🕷️ Usa el comando así:

.pack anime`
        },{
            quoted:m
        })
    }

    /* ⏳ */
    await sock.sendMessage(from,{
        react:{
            text:'🔍',
            key:m.key
        }
    })

    try {

        const result =
            await searchStickerPacks(
                text,
                5
            )

        if (
            !result.status ||
            !result.packs.length
        ) {

            return sock.sendMessage(from,{
                text:
'❌ No encontré packs'
            },{
                quoted:m
            })
        }

        let msg =
`╭━━━〔 🕷️ STICKER SEARCH 〕━━━⬣
┃
┃ 🔎 Búsqueda:
┃ ${text}
┃
┃ 📦 Resultados:
┃`

        result.packs.forEach(
            (p, i) => {

                msg += `

┃ ${i + 1}. ${p.title}
┃ 👤 ${p.author}
┃ 🔗 ${p.pack_url}`
            }
        )

        msg += `

╰━━━━━━━━━━━━━━━━⬣

> SPIDER BOT`

        await sock.sendMessage(from,{
            image:{
                url:
                    result.packs[0].tray_icon
            },
            caption: msg
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

    } catch (e) {

        console.log(
            'PACK ERROR:',
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
'❌ Error buscando packs'
        },{
            quoted:m
        })
    }
}

handler.command = ['pack']
handler.tags = ['stickers']
handler.help = ['pack <texto>']
handler.menu = true
handler.group = true

export default handler