import fs from 'fs'
import path from 'path'
import os from 'os'
import { spawn } from 'child_process'

const handler = async ({
    sock,
    m,
    from,
    args,
    participants,
    sender
}) => {

    // 🔒 MODODADMIN
    let isBlockedGroup = false

    try {

        const db = JSON.parse(
            fs.readFileSync('./data/modoadmin.json')
        )

        isBlockedGroup = db[from]

    } catch {}

    const user = participants?.find(
        p => p.id === sender
    )

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    // 🔥 silencioso
    if (isBlockedGroup && !isAdmin) return

    const text = args.join(' ').trim()

    if (!text) {
        return sock.sendMessage(from, {
            text: '⚠️ Escribe un texto\n\nEjemplo:\n.brat Hola'
        }, { quoted: m })
    }

    const tmp = os.tmpdir()

    const input = path.join(
        tmp,
        `brat_${Date.now()}.png`
    )

    const output = path.join(
        tmp,
        `brat_${Date.now()}.webp`
    )

    try {

        // ⏳ reacción
        await sock.sendMessage(from, {
            react: {
                text: '🕸️',
                key: m.key
            }
        })

        // 🖼️ crear svg
        const svg = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
<style>
.text {
    fill: black;
    font-size: 72px;
    font-family: Arial, sans-serif;
    font-weight: bold;
}
</style>

<rect width="100%" height="100%" fill="white"/>

<text
x="30"
y="120"
class="text"
>
${text}
</text>
</svg>
`

        fs.writeFileSync(input, svg)

        // ⚡ convertir a webp
        await new Promise((resolve, reject) => {

            const ffmpeg = spawn(
                'ffmpeg',
                [
                    '-i', input,
                    '-vf',
                    'scale=512:512',
                    '-vcodec',
                    'libwebp',
                    output
                ]
            )

            ffmpeg.on(
                'error',
                reject
            )

            ffmpeg.on(
                'close',
                code => {

                    if (code === 0)
                        resolve()

                    else
                        reject(
                            new Error(
                                'FFmpeg error'
                            )
                        )
                }
            )
        })

        // 🕷️ enviar sticker
        await sock.sendMessage(from, {
            sticker: fs.readFileSync(output)
        }, { quoted: m })

        // ✅ reacción
        await sock.sendMessage(from, {
            react: {
                text: '✅',
                key: m.key
            }
        })

    } catch (err) {

        console.log(
            'BRAT ERROR:',
            err
        )

        await sock.sendMessage(from, {
            text: '❌ Error creando brat'
        }, { quoted: m })

    } finally {

        try {
            fs.unlinkSync(input)
        } catch {}

        try {
            fs.unlinkSync(output)
        } catch {}
    }
}

handler.command = ['brat']
handler.tags = ['stickers']
handler.menu = true
handler.group = true

export default handler
