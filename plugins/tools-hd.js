import fs from 'fs'
import path from 'path'
import os from 'os'
import { spawn } from 'child_process'
import { downloadContentFromMessage } from '@whiskeysockets/baileys'

const handler = async ({
    sock,
    m,
    from,
    sender,
    isGroup,
    participants
}) => {

    // 🔒 MODODADMIN
    let isBlockedGroup = false

    try {
        const db = JSON.parse(
            fs.readFileSync(
                './data/modoadmin.json',
                'utf8'
            )
        )

        isBlockedGroup = db[from]
    } catch {}

    const user = participants?.find(
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

    // 📥 quoted
    const quoted =
        m.message?.extendedTextMessage?.contextInfo ||
        m.message?.imageMessage?.contextInfo

    const qmsg = quoted?.quotedMessage

    const imgMsg =
        m.message?.imageMessage ||
        qmsg?.imageMessage ||
        qmsg?.viewOnceMessageV2?.message?.imageMessage

    if (!imgMsg) {
        return sock.sendMessage(from,{
            text:'📸 Responde a una imagen para mejorarla en HD'
        },{ quoted:m })
    }

    await sock.sendMessage(from,{
        react:{
            text:'✨',
            key:m.key
        }
    })

    let input = ''
    let output = ''

    try {

        // 📥 descargar
        const stream =
            await downloadContentFromMessage(
                imgMsg,
                'image'
            )

        let buffer = Buffer.alloc(0)

        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }

        const tmp = os.tmpdir()

        input = path.join(
            tmp,
            `hd_in_${Date.now()}.jpg`
        )

        output = path.join(
            tmp,
            `hd_out_${Date.now()}.jpg`
        )

        fs.writeFileSync(input, buffer)

        // 🎨 mejorar imagen
        await new Promise((resolve, reject) => {

            const ffmpeg = spawn(
                'ffmpeg',
                [
                    '-i', input,
                    '-vf',
                    'eq=brightness=0.04:contrast=1.18:saturation=1.12,unsharp=5:5:1.3',
                    '-q:v', '2',
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
                            new Error('FFmpeg error')
                        )
                }
            )
        })

        // 📤 enviar
        await sock.sendMessage(from,{
            image:
                fs.readFileSync(output),
            caption:
`✨ Imagen mejorada en HD

> SPIDER BOT`
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
            text:
'❌ No pude mejorar la imagen'
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

handler.command = ['hd']
handler.tags = ['tools']
handler.menu = true
handler.group = true

export default handler