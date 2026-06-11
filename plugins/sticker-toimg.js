import fs from 'fs'
import os from 'os'
import path from 'path'
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
                './data/modoadmin.json',
                'utf8'
            )
        )

        isBlockedGroup =
            db[from]?.enabled || db[from]

    } catch {}

    const user =
        participants?.find(
            p => p.id === sender
        )

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    if (
        isBlockedGroup &&
        !isAdmin
    ) return

    const quoted =
        m.message?.extendedTextMessage
            ?.contextInfo
            ?.quotedMessage

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

        await sock.sendMessage(from,{
            react:{
                text:'⏳',
                key:m.key
            }
        })

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

        input =
            path.join(
                tmp,
                `stk_${Date.now()}.webp`
            )

        fs.writeFileSync(
            input,
            buffer
        )

        // 🖼️ STICKER NORMAL
        if (!sticker.isAnimated) {

            output =
                path.join(
                    tmp,
                    `img_${Date.now()}.png`
                )

            await new Promise(
                (
                    resolve,
                    reject
                ) => {

                    const proc =
                        spawn(
                            'dwebp',
                            [
                                input,
                                '-o',
                                output
                            ]
                        )

                    proc.on(
                        'error',
                        reject
                    )

                    proc.on(
                        'close',
                        code => {

                            if (
                                code === 0
                            ) resolve()

                            else reject()
                        }
                    )
                }
            )

            await sock.sendMessage(from,{
                image:
                    fs.readFileSync(
                        output
                    )
            },{ quoted:m })

        } else {

            // 🎞️ STICKER ANIMADO

            output =
                path.join(
                    tmp,
                    `gif_${Date.now()}.gif`
                )

            await new Promise(
                (
                    resolve,
                    reject
                ) => {

                    const proc =
                        spawn(
                            'ffmpeg',
                            [
                                '-y',
                                '-i',
                                input,
                                output
                            ]
                        )

                    proc.on(
                        'error',
                        reject
                    )

                    proc.on(
                        'close',
                        code => {

                            if (
                                code === 0
                            ) resolve()

                            else reject()
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

                fs.unlinkSync(
                    input
                )
            }

        } catch {}

        try {

            if (
                output &&
                fs.existsSync(output)
            ) {

                fs.unlinkSync(
                    output
                )
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