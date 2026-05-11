import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import ffmpeg from 'fluent-ffmpeg'
import pkg from 'wa-sticker-formatter'

const { Sticker, StickerTypes } = pkg

const tempDir = './tmp'

// 📁 CREAR TMP
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir)
}

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

    const quoted =
        m.message?.extendedTextMessage?.contextInfo?.quotedMessage

    if (!quoted) {

        return sock.sendMessage(from,{
            text:'⚠️ Responde a una imagen o video'
        },{ quoted:m })
    }

    const isImage =
        quoted.imageMessage

    const isVideo =
        quoted.videoMessage

    if (!isImage && !isVideo) {

        return sock.sendMessage(from,{
            text:'⚠️ Solo imágenes o videos'
        },{ quoted:m })
    }

    // 🎥 LIMIT VIDEO
    if (
        isVideo &&
        quoted.videoMessage.seconds > 10
    ) {

        return sock.sendMessage(from,{
            text:'⚠️ El video máximo es de 10 segundos'
        },{ quoted:m })
    }

    try {

        await sock.sendMessage(from,{
            react:{
                text:'🕸️',
                key:m.key
            }
        })

        const media = await sock.downloadMediaMessage({
            key: m.message.extendedTextMessage.contextInfo.stanzaId
                ? {
                    remoteJid: from,
                    id: m.message.extendedTextMessage.contextInfo.stanzaId,
                    participant:
                        m.message.extendedTextMessage.contextInfo.participant
                }
                : m.key,
            message: quoted
        })

        const input =
            path.join(
                tempDir,
                `${Date.now()}`
            )

        const output =
            path.join(
                tempDir,
                `${Date.now()}.webp`
            )

        // 🖼️ IMAGE
        if (isImage) {

            fs.writeFileSync(
                `${input}.jpg`,
                media
            )

            const sticker = new Sticker(
                fs.readFileSync(`${input}.jpg`),
                {
                    pack: 'SPIDER BOT',
                    author: '🕷️',
                    type: StickerTypes.FULL,
                    quality: 100
                }
            )

            const buffer =
                await sticker.toBuffer()

            await sock.sendMessage(from,{
                sticker: buffer
            },{ quoted:m })

            fs.unlinkSync(`${input}.jpg`)
        }

        // 🎥 VIDEO
        if (isVideo) {

            fs.writeFileSync(
                `${input}.mp4`,
                media
            )

            await new Promise((resolve, reject) => {

                ffmpeg(`${input}.mp4`)
                    .outputOptions([
                        '-vcodec libwebp',
                        '-vf scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:-1:-1:color=white@0.0',
                        '-loop 0',
                        '-ss 00:00:00',
                        '-t 00:00:10',
                        '-preset default',
                        '-an',
                        '-vsync 0'
                    ])
                    .save(output)
                    .on('end', resolve)
                    .on('error', reject)
            })

            await sock.sendMessage(from,{
                sticker: fs.readFileSync(output)
            },{ quoted:m })

            fs.unlinkSync(`${input}.mp4`)
            fs.unlinkSync(output)
        }

    } catch (err) {

        console.log(err)

        sock.sendMessage(from,{
            text:'❌ Error creando sticker'
        },{ quoted:m })
    }
}

handler.command = ['s']
handler.tags = ['stickers']
handler.group = true
handler.menu = true

export default handler
