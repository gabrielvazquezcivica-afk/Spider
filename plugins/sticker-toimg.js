import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { downloadContentFromMessage } from '@whiskeysockets/baileys'

const modoadminPath = './data/modoadmin.json'

function getModoadmin() {
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

const handler = async (ctx) => {

    const {
        sock,
        m,
        from,
        sender,
        isGroup,
        participants
    } = ctx

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

    const quoted =
        m.message?.extendedTextMessage
            ?.contextInfo
            ?.quotedMessage

    if (
        !quoted ||
        !quoted.stickerMessage
    ) {

        return sock.sendMessage(from,{
            text:'⚠️ Responde a un sticker.'
        },{ quoted:m })
    }

    await sock.sendMessage(from,{
        react:{
            text:'🕷️',
            key:m.key
        }
    })

    try {

        const stream =
            await downloadContentFromMessage(
                quoted.stickerMessage,
                'sticker'
            )

        let buffer =
            Buffer.from([])

        for await (
            const chunk of stream
        ) {

            buffer =
                Buffer.concat([
                    buffer,
                    chunk
                ])
        }

        if (
            !fs.existsSync('./tmp')
        ) {

            fs.mkdirSync('./tmp')
        }

        const id =
            Date.now()

        const input =
            path.join(
                './tmp',
                `${id}.webp`
            )

        fs.writeFileSync(
            input,
            buffer
        )

        // 📷 STICKER NORMAL
        if (
            !quoted.stickerMessage.isAnimated
        ) {

            const output =
                path.join(
                    './tmp',
                    `${id}.png`
                )

            exec(
                `ffmpeg -y -i "${input}" "${output}"`,
                async err => {

                    if (err) {

                        return sock.sendMessage(from,{
                            text:'❌ Error convirtiendo sticker.'
                        },{ quoted:m })
                    }

                    await sock.sendMessage(from,{
                        image:{
                            url:output
                        }
                    },{ quoted:m })

                    try {

                        fs.unlinkSync(input)
                        fs.unlinkSync(output)

                    } catch {}
                }
            )

        } else {

            // 🎥 STICKER ANIMADO

            const output =
                path.join(
                    './tmp',
                    `${id}.mp4`
                )

            exec(
                `ffmpeg -y -i "${input}" -movflags faststart -pix_fmt yuv420p "${output}"`,
                async err => {

                    if (err) {

                        return sock.sendMessage(from,{
                            text:'❌ Error convirtiendo sticker.'
                        },{ quoted:m })
                    }

                    await sock.sendMessage(from,{
                        video:{
                            url:output
                        },
                        gifPlayback:true
                    },{ quoted:m })

                    try {

                        fs.unlinkSync(input)
                        fs.unlinkSync(output)

                    } catch {}
                }
            )
        }

    } catch (e) {

        console.log(e)

        return sock.sendMessage(from,{
            text:'❌ No pude procesar el sticker.'
        },{ quoted:m })
    }
}

handler.command = ['toimg']
handler.tags = ['sticker']
handler.menu = true

export default handler