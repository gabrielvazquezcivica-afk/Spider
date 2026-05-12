import fs from 'fs'
import path from 'path'
import os from 'os'
import webp from 'node-webpmux'
import { downloadContentFromMessage } from '@whiskeysockets/baileys'

const handler = async ({
  sock,
  m,
  from,
  isGroup,
  sender,
  args,
  pushName
}) => {

  /* ───── 🔒 MODODADMIN REAL ───── */
  const modoadminPath = './data/modoadmin.json'

  let modoadmin = {}

  try {

    if (fs.existsSync(modoadminPath)) {

      modoadmin =
        JSON.parse(
          fs.readFileSync(
            modoadminPath,
            'utf-8'
          )
        )
    }

  } catch {}

  const isBlockedGroup =
    isGroup &&
    modoadmin[from]

  if (isBlockedGroup) {

    let isAdmin = false

    try {

      const metadata =
        await sock.groupMetadata(from)

      const participants =
        metadata.participants || []

      const user =
        participants.find(
          p => p.id === sender
        )

      isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    } catch {}

    // 🔇 silencioso
    if (!isAdmin) return
  }

  /* ───── 📝 TEXTO WM ───── */
  let texto =
    args.join(' ').trim()

  // 🔥 si no pone texto usa nombre WA
  if (!texto) {
    texto = pushName || 'WhatsApp'
  }

  /* ───── 🔎 STICKER RESPONDIDO ───── */
  const ctx =
    m.message?.extendedTextMessage?.contextInfo

  const quoted =
    ctx?.quotedMessage

  if (!quoted || !quoted.stickerMessage) {

    return sock.sendMessage(from,{
      text:'❌ Responde a un sticker'
    },{ quoted:m })
  }

  let input
  let output

  try {

    /* ───── ⚡ REACCIÓN ───── */
    await sock.sendMessage(from,{
      react:{
        text:'🕷️',
        key:m.key
      }
    })

    /* ───── 📥 DESCARGAR STICKER ───── */
    const stream =
      await downloadContentFromMessage(
        quoted.stickerMessage,
        'sticker'
      )

    let buffer =
      Buffer.alloc(0)

    for await (const chunk of stream) {

      buffer =
        Buffer.concat([buffer, chunk])
    }

    /* ───── 📂 TEMP ───── */
    const tmp =
      os.tmpdir()

    input =
      path.join(
        tmp,
        `wm_in_${Date.now()}.webp`
      )

    output =
      path.join(
        tmp,
        `wm_out_${Date.now()}.webp`
      )

    fs.writeFileSync(input, buffer)

    /* ───── 🧷 WEBP ───── */
    const img =
      new webp.Image()

    await img.load(input)

    /* ───── 🧠 EXIF ───── */
    const exifData = {
      'sticker-pack-id':
        `spider-${Date.now()}`,

      'sticker-pack-name':
        texto,

      'sticker-pack-publisher':
        '',

      emojis: ['🕷️']
    }

    const exif =
      Buffer.from(
        JSON.stringify(exifData),
        'utf-8'
      )

    const exifAttr =
      Buffer.concat([
        Buffer.from([
          0x49,0x49,0x2A,0x00,
          0x08,0x00,0x00,0x00
        ]),

        Buffer.from([
          0x01,0x00
        ]),

        Buffer.from([
          0x41,0x57,
          0x07,0x00
        ]),

        Buffer.from([
          exif.length & 0xff,
          (exif.length >> 8) & 0xff,
          (exif.length >> 16) & 0xff,
          (exif.length >> 24) & 0xff
        ]),

        Buffer.from([
          0x16,0x00,0x00,0x00
        ]),

        exif
      ])

    img.exif = exifAttr

    await img.save(output)

    /* ───── 📤 ENVIAR ───── */
    await sock.sendMessage(from,{
      sticker:
        fs.readFileSync(output)
    },{ quoted:m })

    /* ───── ✅ REACCIÓN FINAL ───── */
    await sock.sendMessage(from,{
      react:{
        text:'✅',
        key:m.key
      }
    })

  } catch (e) {

    console.error(
      'WM ERROR:',
      e
    )

    await sock.sendMessage(from,{
      text:'❌ Error procesando el sticker'
    },{ quoted:m })

  } finally {

    /* ───── 🧹 LIMPIAR ───── */
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

handler.command = ['wm']
handler.tags = ['stickers']
handler.menu = true
handler.group = false

export default handler
