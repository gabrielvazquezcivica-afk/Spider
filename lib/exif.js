import fs from 'fs'
import path from 'path'
import os from 'os'
import webp from 'node-webpmux'

export async function writeExif(buffer, packname, author) {
    const img = new webp.Image()

    const tempIn = path.join(os.tmpdir(), `in-${Date.now()}.webp`)
    const tempOut = path.join(os.tmpdir(), `out-${Date.now()}.webp`)

    fs.writeFileSync(tempIn, buffer)

    await img.load(tempIn)

    const json = {
        'sticker-pack-id': 'TibuBot',
        'sticker-pack-name': packname,
        'sticker-pack-publisher': author,
        emojis: ['🦈']
    }

    const exifAttr = Buffer.from([
        0x49, 0x49, 0x2A, 0x00,
        0x08, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x41, 0x57,
        0x07, 0x00
    ])

    const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf-8')
    const exif = Buffer.concat([
        exifAttr,
        Buffer.from([
            jsonBuffer.length & 0xff,
            (jsonBuffer.length >> 8) & 0xff,
            (jsonBuffer.length >> 16) & 0xff,
            (jsonBuffer.length >> 24) & 0xff
        ]),
        jsonBuffer
    ])

    img.exif = exif
    await img.save(tempOut)

    const result = fs.readFileSync(tempOut)

    fs.unlinkSync(tempIn)
    fs.unlinkSync(tempOut)

    return result
}