import fs from 'fs'
import fetch from 'node-fetch'
import FormData from 'form-data'
import crypto from 'crypto'

const handler = async ({
    sock,
    m,
    from,
    participants,
    sender
}) => {

    // MODODADMIN
    let isBlockedGroup = false

    try {
        const adminDB = JSON.parse(
            fs.readFileSync(
                './data/modoadmin.json',
                'utf8'
            )
        )

        isBlockedGroup = adminDB[from]
    } catch {}

    const user = participants?.find(
        p => p.id === sender
    )

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    if (
        isBlockedGroup &&
        !isAdmin
    ) return

    const key = Buffer.from(
        'c2FzdWtl',
        'base64'
    ).toString('utf-8')

    const quoted =
        m.message?.extendedTextMessage?.contextInfo
            ?.quotedMessage

    const media =
        m.message?.imageMessage ||
        quoted?.imageMessage

    if (!media) {
        return sock.sendMessage(from,{
            text:
`⚠️ Responde o envía una imagen

Ejemplo:
.hd`
        },{ quoted:m })
    }

    await sock.sendMessage(from,{
        react:{
            text:'⏳',
            key:m.key
        }
    })

    try {

        const stream =
            await import('@whiskeysockets/baileys')
                .then(async mod =>
                    mod.downloadContentFromMessage(
                        media,
                        'image'
                    )
                )

        let buffer = Buffer.alloc(0)

        for await (const chunk of stream) {
            buffer = Buffer.concat([
                buffer,
                chunk
            ])
        }

        const filename =
            'img-' +
            crypto.randomBytes(8).toString('hex') +
            '.jpg'

        const form =
            new FormData()

        form.append(
            'file',
            buffer,
            {
                filename,
                contentType:'image/jpeg'
            }
        )

        const upload =
            await fetch(
                `https://api.evogb.org/tools/upload?key=${key}`,
                {
                    method:'POST',
                    body:form,
                    headers:{
                        ...form.getHeaders()
                    }
                }
            )

        const uploadJson =
            await upload.json()

        if (
            !uploadJson.status ||
            !uploadJson.url
        ) {
            throw new Error(
                'upload fail'
            )
        }

        const res =
            await fetch(
                `https://api.evogb.org/tools/upscale?method=url&url=${encodeURIComponent(uploadJson.url)}&key=${key}`
            )

        const contentType =
            res.headers.get('content-type')

        if (
            contentType &&
            contentType.includes(
                'application/json'
            )
        ) {
            throw new Error(
                'api fail'
            )
        }

        const img =
            await res.buffer()

        await sock.sendMessage(from,{
            image: img,
            caption:
`╭━━━〔 🖼️ HD IMAGE 〕━━━⬣
┃
┃ ✅ Imagen mejorada
┃ ⚡ Upscale completado
╰━━━━━━━━━━━━━━━━⬣`
        },{ quoted:m })

        await sock.sendMessage(from,{
            react:{
                text:'✅',
                key:m.key
            }
        })

    } catch (e) {

        console.log(
            'HD ERROR:',
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
'❌ Error mejorando imagen.'
        },{ quoted:m })
    }
}

handler.command = ['hd']
handler.tags = ['tools']
handler.group = true
handler.menu = true

export default handler