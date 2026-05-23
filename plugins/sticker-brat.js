import fs from 'fs'
import path from 'path'
import os from 'os'
import { spawn } from 'child_process'

/* ───── DB ───── */
function getDB() {

  try {

    const file =
      './data/modoadmin.json'

    if (!fs.existsSync(file))
      return {}

    return JSON.parse(
      fs.readFileSync(
        file,
        'utf8'
      )
    )

  } catch {

    return {}
  }
}

/* ───── TEXTO RESPONDIDO ───── */
function getQuotedText(m) {

  const ctx =
    m.message
      ?.extendedTextMessage
      ?.contextInfo

  const quoted =
    ctx?.quotedMessage

  if (!quoted)
    return null

  return (
    quoted.conversation ||
    quoted
      ?.extendedTextMessage
      ?.text ||
    quoted
      ?.imageMessage
      ?.caption ||
    quoted
      ?.videoMessage
      ?.caption ||
    null
  )
}

/* ───── WRAP ───── */
function wrapText(
  text,
  maxWidth = 14
) {

  const words =
    text.split(/\s+/)

  const lines = []

  let line = ''

  for (const word of words) {

    const test =
      (line + ' ' + word)
        .trim()

    if (
      test.length > maxWidth
    ) {

      if (line)
        lines.push(line)

      line = word

    } else {

      line = test
    }
  }

  if (line)
    lines.push(line)

  return lines
}

/* ───── FUENTE ───── */
function getFontSize(
  lines
) {

  const total =
    lines.length

  if (total <= 1)
    return 150

  if (total <= 2)
    return 130

  if (total <= 3)
    return 118

  if (total <= 4)
    return 106

  if (total <= 5)
    return 94

  if (total <= 6)
    return 82

  return 70
}

/* ───── CREAR STICKER ───── */
async function createSticker(text) {

  // ❌ quitar emojis
  text = text.replace(
    /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu,
    ''
  ).trim()

  let maxWidth = 14

  if (text.length > 50)
    maxWidth = 16

  if (text.length > 100)
    maxWidth = 18

  if (text.length > 160)
    maxWidth = 20

  const lines =
    wrapText(
      text,
      maxWidth
    )

  const formatted =
    lines.join('\n')

  const fontSize =
    getFontSize(lines)

  const txtFile = path.join(
    os.tmpdir(),
    `brat_${Date.now()}.txt`
  )

  const output = path.join(
    os.tmpdir(),
    `brat_${Date.now()}.webp`
  )

  fs.writeFileSync(
    txtFile,
    formatted,
    'utf8'
  )

  return new Promise(
    (resolve,reject)=>{

    const ff = spawn(
      'ffmpeg',
      [

      // 🔥 MISMO ESTILO
      '-f','lavfi',
      '-i',
      'color=c=white:s=1024x1024',

      '-vf',

`drawtext=
fontfile=/system/fonts/Roboto-Bold.ttf:
textfile='${txtFile}':
fontcolor=black:
fontsize=${fontSize}:
line_spacing=16:
fix_bounds=true:
x=(w-text_w)/2:
y=(h-text_h)/2`,

      '-frames:v','1',

      '-vcodec','libwebp',
      '-lossless','1',
      '-q:v','100',
      '-preset','picture',

      '-y',
      output
    ])

    let err = ''

    ff.stderr.on(
      'data',
      d => {

      err += d.toString()
    })

    ff.on(
      'close',
      code => {

      try {

        fs.unlinkSync(
          txtFile
        )

      } catch {}

      if (code !== 0) {

        console.log(err)

        return reject(
          new Error(
            'FFmpeg falló'
          )
        )
      }

      try {

        const buffer =
          fs.readFileSync(
            output
          )

        fs.unlinkSync(
          output
        )

        resolve(buffer)

      } catch(e){

        reject(e)
      }
    })

    ff.on(
      'error',
      reject
    )
  })
}

/* ───── COMANDO ───── */
const handler = async ({
  sock,
  m,
  from,
  sender,
  isGroup,
  participants,
  args
}) => {

  /* 🔒 MODODADMIN */
  const db = getDB()

  const enabled =
    db[from]

  if (
    enabled &&
    isGroup
  ) {

    const user =
      participants?.find(
        p =>
          p.id === sender
      )

    const isAdmin =
      user?.admin ===
        'admin' ||
      user?.admin ===
        'superadmin'

    if (!isAdmin)
      return
  }

  /* 🔥 TEXTO */
  let text =
    args.join(' ')
      .trim()

  if (!text) {

    const quoted =
      getQuotedText(m)

    if (quoted)
      text = quoted
  }

  if (!text) {

    return sock.sendMessage(
      from,
      {
      text:
`❌ Escribe un texto

Ejemplo:
.brat hola`
    },{
      quoted:m
    })
  }

  /* 🎨 */
  await sock.sendMessage(
    from,
    {
    react:{
      text:'🎨',
      key:m.key
    }
  })

  try {

    const sticker =
      await createSticker(
        text
      )

    /* 📤 */
    await sock.sendMessage(
      from,
      {
      sticker
    },{
      quoted:m
    })

    /* ✅ */
    await sock.sendMessage(
      from,
      {
      react:{
        text:'✅',
        key:m.key
      }
    })

  } catch(e){

    console.log(
      'BRAT ERROR:',
      e
    )

    await sock.sendMessage(
      from,
      {
      text:
'❌ Error al crear sticker'
    },{
      quoted:m
    })
  }
}

handler.command = ['brat']
handler.tags = ['stickers']
handler.help = ['brat <texto>']
handler.menu = true

export default handler