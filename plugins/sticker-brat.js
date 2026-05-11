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
        return sock.sendMessage(from,{
            text:
`⚠️ Escribe un texto

Ejemplo:
.brat Hola`
        },{ quoted:m })
    }

    const tmp = os.tmpdir()

    const output = path.join(
        tmp,
        `brat_${Date.now()}.webp`
    )

    try {

        // 🕸️ reacción
        await sock.sendMessage(from,{
            react:{
                text:'🕸️',
                key:m.key
            }
        })

        // ⚡ crear sticker
        await new Promise((resolve, reject) => {

            const ffmpeg = spawn('ffmpeg',[
                '-f','lavfi',
                '-i',
                `color=c=white:s=512x512:d=1`,
                '-vf',
                `drawtext=text='${text.replace(/'/g,"\\'")}':fontcolor=black:fontsize=72:x=35:y=120`,
                '-frames:v','1',
                '-vcodec','libwebp',
                output
            ])

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

        // 🕷️ enviar
        await sock.sendMessage(from,{
            sticker:fs.readFileSync(output)
        },{ quoted:m })

        // ✅ reacción
        await sock.sendMessage(from,{
            react:{
                text:'✅',
                key:m.key
            }
        })

    } catch (err) {

        console.log(
            'BRAT ERROR:',
            err
        )

        await sock.sendMessage(from,{
            text:'❌ Error creando brat'
        },{ quoted:m })

    } finally {

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
