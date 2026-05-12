import fs from 'fs'
import path from 'path'
import os from 'os'
import ffmpeg from 'fluent-ffmpeg'
import pkg from 'node-webpmux'

const { Image } = pkg

const modoadminPath = './data/modoadmin.json'

// 📥 DB modoadmin
function getDB() {
    try {
        if (!fs.existsSync(modoadminPath)) return {}
        return JSON.parse(fs.readFileSync(modoadminPath, 'utf-8'))
    } catch {
        return {}
    }
}

// 🏷️ cambiar metadata sticker
async function addExif(webpPath, packname, author) {

    const img = new Image()

    const stickerPackId =
        'SPIDER-BOT'

    const json = {
        'sticker-pack-id': stickerPackId,
        'sticker-pack-name': packname,
        'sticker-pack-publisher': author,
        emojis: ['🕷️']
    }

    const exifAttr = Buffer.from([
        0x49, 0x49, 0x2A, 0x00,
        0x08, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x41, 0x57,
        0x07, 0x00
    ])

    const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8')

    const exif = Buffer.concat([
        exifAttr,
        Buffer.from([
            jsonBuffer.length,
            0x00, 0x00, 0x00
        ]),
        jsonBuffer
    ])

    exif.writeUIntLE(jsonBuffer.length, 14, 4)

    await img.load(webpPath)

    img.exif = exif

    await img.save(webpPath)
}

const handler = async ({
    sock,
    m,
    from,
    sender,
    isGroup,
    participants,
    pushName,
    args
}) => {

    // 🔒 MODODADMIN
    const db = getDB()

    const isBlockedGroup = isGroup && db[from]

    if (isBlockedGroup) {

        const user = participants.find(
            p => p.id === sender
        )

        const isAdmin =
            user?.admin === 'admin' ||
            user?.admin === 'superadmin'

        if (!isAdmin) return
    }

    // 📌 sticker citado
    const quoted =
        m.message?.extendedTextMessage
            ?.contextInfo
            ?.quotedMessage

    if (!quoted?.stickerMessage) {
        return sock.sendMessage(from,{
            text:
`⚠️ Responde a un sticker

Ejemplo:
.wm
.wm Mundo`
        },{ quoted:m })
    }

    // ⚡ reacción
    await sock.sendMessage(from,{
        react:{
            text:'⚔️',
            key:m.key
        }
    })

    try {

        const stickerMsg =
            quoted.stickerMessage

        const media =
            await sock.downloadMediaMessage({
                message:{
                    stickerMessage: stickerMsg
                }
            })

        const tmpInput =
            path.join(
                os.tmpdir(),
                `wm_${Date.now()}.webp`
            )

        const tmpOutput =
            path.join(
                os.tmpdir(),
                `wm_out_${Date.now()}.webp`
            )

        fs.writeFileSync(tmpInput, media)

        // 🔥 reconstruir webp
        await new Promise((resolve, reject) => {

            ffmpeg(tmpInput)
                .outputOptions([
                    '-vcodec libwebp',
                    '-lossless 1',
                    '-qscale 1',
                    '-preset default'
                ])
                .save(tmpOutput)
                .on('end', resolve)
                .on('error', reject)
        })

        const wm =
            args.join(' ').trim() ||
            pushName

        await addExif(
            tmpOutput,
            wm,
            'SPIDER BOT'
        )

        const finalSticker =
            fs.readFileSync(tmpOutput)

        await sock.sendMessage(from,{
            sticker: finalSticker
        },{ quoted:m })

        // 🧹 limpiar
        fs.unlinkSync(tmpInput)
        fs.unlinkSync(tmpOutput)

        // ✅ reacción final
        await sock.sendMessage(from,{
            react:{
                text:'✅',
                key:m.key
            }
        })

    } catch (e) {

        console.log('❌ ERROR WM:', e)

        return sock.sendMessage(from,{
            text:'❌ No pude cambiar el wm del sticker'
        },{ quoted:m })
    }
}

handler.command = ['wm']
handler.tags = ['stickers']
handler.group = false
handler.menu = true

export default handler
