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
    sender
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
`🕷️ SPIDER IA

Ejemplo:
.copilot ¿Quién creó Spider Bot?`
        },{ quoted:m })
    }

    // ⚡ reacción
    await sock.sendMessage(from,{
        react:{
            text:'💬',
            key:m.key
        }
    })

    try {

        const { data } =
            await axios.get(
                `https://api.delirius.store/ia/copilot?query=${encodeURIComponent(text)}`
            )

        if (!data?.text) {

            throw new Error(
                'Sin respuesta'
            )
        }

        await sock.sendMessage(from,{
            text:
`╭━━━〔 🕷️ SPIDER AI 〕━━━⬣

${data.text}

╰━━━━━━━━━━━━━━━━⬣`
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
            'ERROR COPILOT:',
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
'⚠️ Spider AI no pudo responder en este momento'
        },{ quoted:m })
    }
}

handler.command = ['copilot']
handler.tags = ['ia']
handler.menu = true
handler.group = true

export default handler