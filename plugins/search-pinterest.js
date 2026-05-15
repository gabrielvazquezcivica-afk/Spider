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

const handler = async ({
    sock,
    m,
    from,
    args,
    isGroup,
    participants,
    sender
}) => {

    /* 🔒 MODODADMIN */
    if (isGroup) {

        const db = getDB()
        const isBlockedGroup = db[from]

        const user = participants.find(
            p => p.id === sender
        )

        const isAdmin =
            user?.admin === 'admin' ||
            user?.admin === 'superadmin'

        if (isBlockedGroup && !isAdmin)
            return
    }

    const text = args.join(' ').trim()

    if (!text) {
        return sock.sendMessage(from,{
            text:
`🕷️ Uso correcto:

.pin gato
.pinterest messi`
        },{ quoted:m })
    }

    // ⚡ reacción
    await sock.sendMessage(from,{
        react:{ text:'🔎', key:m.key }
    })

    try {

        const api =
`https://api.delirius.store/search/pinterest?text=${encodeURIComponent(text)}`

        const { data } =
            await axios.get(api)

        if (
            !data?.status ||
            !data?.results?.length
        ) {

            return sock.sendMessage(from,{
                text:'❌ No encontré imágenes'
            },{ quoted:m })
        }

        // 🔥 máximo 6
        const results =
            data.results.slice(0, 6)

        // 📸 primera imagen con info
        await sock.sendMessage(from,{
            image:{ url: results[0] },
            caption:
`╭━━━〔 🕷️ SPIDER PINTEREST 〕━━━⬣
┃ 🔎 Búsqueda:
┃ ${text}
┃
┃ 📸 Resultados:
┃ ${results.length}
╰━━━━━━━━━━━━━━━━⬣`
        },{ quoted:m })

        // 📸 restantes rápidas
        for (let i = 1; i < results.length; i++) {

            await sock.sendMessage(from,{
                image:{ url: results[i] }
            })
        }

        // ✅ reacción final
        await sock.sendMessage(from,{
            react:{ text:'✅', key:m.key }
        })

    } catch (e) {

        console.log(
            'Pinterest Error:',
            e
        )

        sock.sendMessage(from,{
            text:'❌ Error al buscar imágenes'
        },{ quoted:m })
    }
}

handler.command = ['pinterest']
handler.tags = ['search']
handler.group = true
handler.menu = true

export default handler