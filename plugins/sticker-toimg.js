import fs from 'fs'
import path from 'path'
import os from 'os'
import sharp from 'sharp'
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
            fs.readFileSync(
                './data/modoadmin.json'
            )
        )

        isBlockedGroup = db[from]

    } catch {}

    const user =
        participants?.find(
            p => p.id === sender
        )

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    // 🔥 silencioso
    if (
        isBlockedGroup &&
        !isAdmin
    ) return

    // 📥 Sticker citado
    const ctx =
        m.message?.extendedTextMessage
            ?.contextInfo

    const quoted =
        ctx?.quotedMessage

    const sticker =
        quoted?.stickerMessage

    if (!sticker) {

        return sock.sendMessage(from,{
            text:'⚠️ Responde a un sticker.'
        },{ quoted:m })
    }

    let input = ''
    let output = ''

    try {

        // ⏳ reacción
        await sock.sendMessage(from,{
            react:{
                text:'⏳',
                key:m.key
            }
        })

        // 📥 descargar
        const stream =
            await downloadContentFromMessage(
                sticker,
                'sticker'
            )

        let buffer =
            Buffer.alloc(0)

        for await (
            const chunk of stream
        ) {

            buffer =
                Buffer.concat([
                    buffer,
                    chunk
                ])
        }

        const tmp =
            os.tmpdir()

        // 🖼️ STICKER NORMAL
        if (
            !sticker.isAnimated
        ) {

            const image =
                await sharp(buffer)
                .png()
                .toBuffer()

            await sock.sendMessage(from,{
                image
            },{ quoted:m })

        } else {

            // 🎥 STICKER ANIMADO

            input =
                path.join(
                    tmp,
                    `stk_${Date.now()}.webp`
                )

            output =
                path.join(
                    tmp,
                    `stk_${Date.now()}.mp4`
                )

            fs.writeFileSync(
                input,
                buffer
            )

            await new Promise(
                (
                    resolve,
                    reject
                ) => {

                    const ffmpeg =
                        spawn(
                            'ffmpeg',
                            [
                                '-y',
                                '-i',
                                input,
                                '-movflags',
                                'faststart',
                                '-pix_fmt',
                                'yuv420p',
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

                            if (
                                code === 0
                            ) resolve()

                            else reject(
                                new Error(
                                    'FFmpeg'
                                )
                            )
                        }
                    )
                }
            )

            await sock.sendMessage(from,{
                video:
                    fs.readFileSync(
                        output
                    ),
                gifPlayback:true
            },{ quoted:m })
        }

        // ✅ reacción
        await sock.sendMessage(from,{
            react:{
                text:'✅',
                key:m.key
            }
        })

    } catch (err) {

        console.log(
            'TOIMG ERROR:',
            err
        )

        await sock.sendMessage(from,{
            text:'❌ Error convirtiendo el sticker.'
        },{ quoted:m })

    } finally {

        try {

            if (
                input &&
                fs.existsSync(input)
            ) {

                fs.unlinkSync(input)
            }

        } catch {}

        try {

            if (
                output &&
                fs.existsSync(output)
            ) {

                fs.unlinkSync(output)
            }

        } catch {}
    }
}

handler.command = ['toimg']
handler.help = ['toimg']
handler.tags = ['stickers']
handler.menu = true
handler.group = true

export default handler