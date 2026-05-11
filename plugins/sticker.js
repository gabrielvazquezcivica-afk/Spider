import fs from 'fs'
import path from 'path'
import os from 'os'
import { spawn } from 'child_process'
import { downloadContentFromMessage } from '@whiskeysockets/baileys'

const handler = async ({
    sock,
    m,
    from,
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

    // 📥 quoted
    const quoted =
        m.message?.extendedTextMessage?.contextInfo ||
        m.message?.imageMessage?.contextInfo ||
        m.message?.videoMessage?.contextInfo

    const qmsg = quoted?.quotedMessage

    const media =
        m.message?.imageMessage ||
        m.message?.videoMessage ||
        qmsg?.imageMessage ||
        qmsg?.videoMessage ||
        qmsg?.viewOnceMessageV2?.message?.imageMessage ||
        qmsg?.viewOnceMessageV2?.message?.videoMessage

    if (!media) {
        return sock.sendMessage(from, {
            text: '⚠️ Responde a una imagen o video'
        }, { quoted: m })
    }

    const isVideo = !!media.seconds

    if (isVideo && media.seconds > 10) {
        return sock.sendMessage(from, {
            text: '⚠️ El video debe durar máximo 10 segundos'
        }, { quoted: m })
    }

    let input = ''
    let output = ''

    try {

        // ⏳ reacción
        await sock.sendMessage(from, {
            react: {
                text: '⏳',
                key: m.key
            }
        })

        // 📥 descargar
        const type = isVideo ? 'video' : 'image'

        const stream = await downloadContentFromMessage(
            media,
            type
        )

        let buffer = Buffer.alloc(0)

        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }

        const tmp = os.tmpdir()

        input = path.join(
            tmp,
            `stk_${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`
        )

        output = path.join(
            tmp,
            `stk_${Date.now()}.webp`
        )

        fs.writeFileSync(input, buffer)

        // ⚡ ffmpeg
        await new Promise((resolve, reject) => {

            const args = isVideo
                ? [
                    '-i', input,
                    '-vf',
                    'scale=512:512:force_original_aspect_ratio=decrease:flags=lanczos,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white@0.0,fps=15',
                    '-c:v', 'libwebp',
                    '-loop', '0',
                    '-an',
                    '-vsync', '0',
                    '-t', '6',
                    output
                ]
                : [
                    '-i', input,
                    '-vf',
                    'scale=512:512:force_original_aspect_ratio=decrease:flags=lanczos,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white@0.0',
                    '-c:v', 'libwebp',
                    output
                ]

            const ffmpeg = spawn('ffmpeg', args)

            ffmpeg.stderr.on('data', data => {
                console.log(
                    'FFMPEG:',
                    data.toString()
                )
            })

            ffmpeg.on('error', reject)

            ffmpeg.on('close', code => {

                if (code === 0) resolve()
                else reject(
                    new Error('FFmpeg error')
                )
            })
        })

        // 🕷️ enviar
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
            'STICKER ERROR:',
            err
        )

        await sock.sendMessage(from, {
            text: '❌ Error creando sticker'
        }, { quoted: m })

    } finally {

        try {
            if (input) fs.unlinkSync(input)
        } catch {}

        try {
            if (output) fs.unlinkSync(output)
        } catch {}
    }
}

handler.command = ['s']
handler.tags = ['stickers']
handler.menu = true
handler.group = true

export default handler
