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

    const user = participants?.find(p => p.id === sender)
    const isAdmin = user?.admin === 'admin' || user?.admin === 'superadmin'

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

    // 🎥 máximo 10s
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
            react: { text: '⏳', key: m.key }
        })

        // 📥 descargar media
        const type = isVideo ? 'video' : 'image'
        const stream = await downloadContentFromMessage(media, type)

        let buffer = Buffer.alloc(0)
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }

        const tmp = os.tmpdir()
        input = path.join(tmp, `stk_${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`)
        output = path.join(tmp, `stk_${Date.now()}.webp`)

        fs.writeFileSync(input, buffer)

        // ⚡ FFMPEG - SIN RELLENOS NI BORDES
        await new Promise((resolve, reject) => {
            const args = isVideo
            ? [
                '-i', input,
                '-vcodec', 'libwebp',
                '-vf', 'scale=w=512:h=512:force_original_aspect_ratio=decrease:flags=lanczos,fps=15',
                '-loop', '0',
                '-ss', '00:00:00',
                '-t', '06',
                '-preset', 'picture',
                '-an',
                '-vsync', '0',
                '-q:v', '90',
                output
            ]
            : [
                '-i', input,
                '-vf', 'scale=w=512:h=512:force_original_aspect_ratio=decrease:flags=lanczos',
                '-vcodec', 'libwebp',
                '-q:v', '90',
                output
            ]

            const ffmpeg = spawn('ffmpeg', args)

            ffmpeg.on('error', reject)
            ffmpeg.on('close', code => {
                if (code === 0) resolve()
                else reject(new Error('FFmpeg error'))
            })
        })

        // 🕷️ enviar sticker
        await sock.sendMessage(from, {
            sticker: fs.readFileSync(output)
        }, { quoted: m })

        // ✅ reacción
        await sock.sendMessage(from, {
            react: { text: '✅', key: m.key }
        })

    } catch (err) {
        console.log('STICKER ERROR:', err)
        await sock.sendMessage(from, {
            text: '❌ Error creando sticker'
        }, { quoted: m })

    } finally {
        try { if (input) fs.unlinkSync(input) } catch {}
        try { if (output) fs.unlinkSync(output) } catch {}
    }
}

handler.command = ['s']
handler.tags = ['stickers']
handler.menu = true
handler.group = true

export default handler
