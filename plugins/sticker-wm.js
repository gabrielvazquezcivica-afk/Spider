import fs from 'fs'
import path from 'path'
import os from 'os'
import { spawn } from 'child_process'
import pkg from '@whiskeysockets/baileys'

const { downloadContentFromMessage } = pkg

const modoadminPath = './data/modoadmin.json'

// 📥 DB
function getDB() {
    try {
        if (!fs.existsSync(modoadminPath)) return {}
        return JSON.parse(fs.readFileSync(modoadminPath, 'utf-8'))
    } catch {
        return {}
    }
}

// 🧩 convertir stream a buffer
async function streamToBuffer(stream) {
    let buffer = Buffer.from([])

    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
    }

    return buffer
}

// 🏷️ poner metadata
async function addExif(webpBuffer, packname, author) {

    const tmpIn = path.join(os.tmpdir(), `wm_${Date.now()}.webp`)
    const tmpOut = path.join(os.tmpdir(), `wm_${Date.now()}_out.webp`)
    const exifPath = path.join(os.tmpdir(), `wm_${Date.now()}.exif`)

    fs.writeFileSync(tmpIn, webpBuffer)

    const json = {
        "sticker-pack-id": "SPIDER-BOT",
        "sticker-pack-name": packname,
        "sticker-pack-publisher": author,
        "emojis": ["🕷️"]
    }

    const exifAttr = Buffer.from([
        0x49,0x49,0x2A,0x00,
        0x08,0x00,0x00,0x00,
        0x01,0x00,
        0x41,0x57,
        0x07,0x00
    ])

    const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf-8')
    const exif = Buffer.concat([
        exifAttr,
        Buffer.from([
            jsonBuffer.length,0x00,0x00,0x00
        ]),
        jsonBuffer
    ])

    fs.writeFileSync(exifPath, exif)

    await new Promise((resolve, reject) => {

        const ff = spawn('webpmux', [
            '-set',
            'exif',
            exifPath,
            tmpIn,
            '-o',
            tmpOut
        ])

        ff.on('close', code => {
            if (code === 0) resolve()
            else reject(new Error('webpmux error'))
        })

        ff.on('error', reject)
    })

    const result = fs.readFileSync(tmpOut)

    fs.unlinkSync(tmpIn)
    fs.unlinkSync(tmpOut)
    fs.unlinkSync(exifPath)

    return result
}

const handler = async ({
    sock,
    m,
    from,
    sender,
    pushName,
    isGroup,
    participants,
    args
}) => {

    const db = getDB()
    const isBlockedGroup = db[from]

    // 🔒 MODODADMIN
    if (isBlockedGroup && isGroup) {

        const user = participants.find(p => p.id === sender)

        const isAdmin =
            user?.admin === 'admin' ||
            user?.admin === 'superadmin'

        if (!isAdmin) return
    }

    const quoted =
        m.message?.extendedTextMessage?.contextInfo?.quotedMessage

    if (!quoted?.stickerMessage) {
        return sock.sendMessage(from,{
            text:'⚠️ Responde a un sticker'
        },{ quoted:m })
    }

    // 🏷️ nombre
    const wmName =
        args.join(' ').trim() ||
        pushName ||
        'SPIDER BOT'

    await sock.sendMessage(from,{
        react:{ text:'⚔️', key:m.key }
    })

    try {

        // 📥 descargar sticker
        const stream = await downloadContentFromMessage(
            quoted.stickerMessage,
            'sticker'
        )

        const stickerBuffer = await streamToBuffer(stream)

        // 🏷️ agregar exif
        const result = await addExif(
            stickerBuffer,
            wmName,
            'SPIDER BOT'
        )

        // 📤 enviar sticker
        await sock.sendMessage(from,{
            sticker: result
        },{ quoted:m })

        // ✅ reacción
        await sock.sendMessage(from,{
            react:{ text:'✅', key:m.key }
        })

    } catch (e) {

        console.log('ERROR WM:', e)

        return sock.sendMessage(from,{
            text:'❌ Error al cambiar el wm'
        },{ quoted:m })
    }
}

handler.command = ['wm']
handler.tags = ['stickers']
handler.menu = true

export default handler
