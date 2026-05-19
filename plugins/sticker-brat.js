import fs from 'fs'
import axios from 'axios'
import { writeExifImg } from '../lib/sticker.js'

const handler = async ({
  sock,
  m,
  from,
  args,
  participants,
  sender
}) => {

  /* 🔒 MODODADMIN */
  let isBlockedGroup = false

  try {

    const db = JSON.parse(
      fs.readFileSync(
        './data/modoadmin.json',
        'utf-8'
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

  if (isBlockedGroup && !isAdmin)
    return

  const text =
    args.join(' ').trim()

  if (!text) {

    return sock.sendMessage(from,{
      text:
`❌ Escribe un texto

Ejemplo:
.brat Hola`
    },{ quoted:m })
  }

  /* ⚡ reacción */
  await sock.sendMessage(from,{
    react:{
      text:'🎨',
      key:m.key
    }
  })

  try {

    /* 🔥 API BRAT */
    const res = await axios.get(
      `https://brat.caliphdev.com/api/brat?text=${encodeURIComponent(text)}`,
      {
        responseType:'arraybuffer'
      }
    )

    const imgBuffer =
      Buffer.from(res.data)

    /* 🕷️ sticker REAL */
    const sticker =
      await writeExifImg(
        imgBuffer,
        {
          packname:'SPIDER BOT',
          author:'SoyGabo'
        }
      )

    await sock.sendMessage(from,{
      sticker:{
        url: sticker
      }
    },{ quoted:m })

    /* ✅ reacción */
    await sock.sendMessage(from,{
      react:{
        text:'✅',
        key:m.key
      }
    })

  } catch (e) {

    console.log(
      'BRAT ERROR:',
      e
    )

    await sock.sendMessage(from,{
      text:'❌ Error al generar sticker brat'
    },{ quoted:m })
  }
}

handler.command = ['brat']
handler.tags = ['stickers']
handler.help = ['brat <texto>']
handler.menu = true
handler.group = true

export default handler