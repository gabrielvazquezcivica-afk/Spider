import fs from 'fs'
import path from 'path'
import os from 'os'
import { spawn } from 'child_process'
import { downloadContentFromMessage } from '@whiskeysockets/baileys'

const handler = async ({
    sock,
    m,
    from,
    isGroup,
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

    if (isBlockedGroup && !isAdmin) return

    /* ───── MEDIA ───── */
    const quoted =
        m.message?.extendedTextMessage?.contextInfo ||
        m.message?.imageMessage?.contextInfo ||
        m.message?.videoMessage?.contextInfo

    const qmsg = quoted?.quotedMessage

    const msg =
        m.message?.imageMessage ||
        m.message?.videoMessage ||
        qmsg?.imageMessage ||
        qmsg?.videoMessage ||
        qmsg?.viewOnceMessageV2?.message?.imageMessage ||
        qmsg?.viewOnceMessageV2?.message?.videoMessage

    if (!msg) {

        return sock.sendMessage(from,{
            text:'⚠️ Responde a una imagen o video'
        },{ quoted:m })
    }

    const isVideo = !!msg.seconds

    // 🎥 MAX 10S
    if (isVideo && msg.seconds > 10) {

        return sock.sendMessage(from,{
            text:'⚠️ El video debe durar máximo 10 segundos'
        },{ quoted:m })
    }

    let input
    let output

    try {

        // ⏳
        await sock.sendMessage(from,{
            react:{
                text:'⏳',
                key:m.key
            }
        })

        // 📥 DESCARGAR
        const type = isVideo ? 'video' : 'image'

        const stream =
            await downloadContentFromMessage(
                msg,
                type
            )

        let buffer = Buffer.alloc(0)

        for await (const chunk of stream) {

            buffer = Buffer.concat([
                buffer,
                chunk
            ])
        }

        const tmp = os.tmpdir()

        input = path.join(
            tmp,
            `stk_${Date.now()}.${
                isVideo ? 'mp4' : 'jpg'
            }`
        )

        output = path.join(
            tmp,
            `stk_${Date.now()}.webp`
        )

        fs.writeFileSync(input, buffer)

        // ⚡ FFMPEG RÁPIDO
        await new Promise((resolve, reject) => {

            const args = isVideo

? [
    '-i', input,
    '-vf',
    'scale=320:320:force_original_aspect_ratio=decrease,fps=10',
    '-vcodec', 'libwebp',
    '-lossless', '1',
    '-loop', '0',
    '-preset', 'default',
    '-an',
    '-vsync', '0',
    '-t', '6',
    output
]

: [
    '-i', input,
    '-vf',
    'scale=512:512:force_original_aspect_ratio=decrease',
    '-vcodec', 'libwebp',
    output
]

                : [
                    '-i', input,
                    '-vf',
                    'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:-1:-1:color=0x00000000',
                    output
                ]

            const ffmpeg =
                spawn('ffmpeg', args)

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

        // 🕷️ STICKER ANIMADO
        await sock.sendMessage(from,{
            sticker:
                fs.readFileSync(output)
        },{ quoted:m })

        // ✅
        await sock.sendMessage(from,{
            react:{
                text:'✅',
                key:m.key
            }
        })

    } catch (err) {

        console.log(
            'STICKER ERROR:',
            err
        )

        sock.sendMessage(from,{
            text:'❌ Error creando sticker'
        },{ quoted:m })

    } finally {

        try {
            if (input)
                fs.unlinkSync(input)
        } catch {}

        try {
            if (output)
                fs.unlinkSync(output)
        } catch {}
    }
}

handler.command = ['s']
handler.tags = ['stickers']
handler.menu = true
handler.group = true

export default handler
