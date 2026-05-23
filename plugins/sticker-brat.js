import fs from 'fs'
import path from 'path'
import os from 'os'
import { spawn } from 'child_process'

/* ───── MODODADMIN DB ───── */
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

/* ───── WRAP REAL ───── */
function wrapText(
  text,
  max = 18
) {

  const words =
    text.split(' ')

  const lines = []

  let line = ''

  for (const word of words) {

    const test =
      (line + ' ' + word)
        .trim()

    if (
      test.length > max
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

/* ───── TAMAÑO ───── */
function getFontSize(
  lines
) {

  const amount =
    lines.length

  if (amount <= 1)
    return 95

  if (amount <= 2)
    return 82

  if (amount <= 3)
    return 74

  if (amount <= 4)
    return 66

  if (amount <= 5)
    return 58

  if (amount <= 6)
    return 50

  return 42
}

/* ───── CREAR STICKER ───── */
async function createSticker(text) {

  // 🔥 emojis compatibles
  text = text
    .replace(/\n/g,' ')
    .trim()

  let width = 18

  if (text.length > 60)
    width = 22

  if (text.length > 120)
    width = 26

  if (text.length > 200)
    width = 30

  const lines =
    wrapText(text,width)

  const finalText =
    lines.join('\n')

  const fontSize =
    getFontSize(lines)

  const txt = path.join(
    os.tmpdir(),
    `brat_${Date.now()}.txt`
  )

  const output = path.join(
    os.tmpdir(),
    `brat_${Date.now()}.webp`
  )

  fs.writeFileSync(
    txt,
    finalText,
    'utf8'
  )

  return new Promise(
    (resolve,reject)=>{

    const ff = spawn(
      'ffmpeg',
      [

      // 🔥 estilo REAL
      '-f','lavfi',
      '-i',
      'color=c=white:s=1024x1024',

      '-vf',

`drawtext=
fontfile=/system/fonts/NotoSans-Bold.ttf:
textfile='${txt}':
fontsize=${fontSize}:
fontcolor=black:
line_spacing=12:
text_shaping=1:
fix_bounds=true:
x=(w-text_w)/2:
y=(h-text_h)/2`,

      '-frames:v','1',

      '-vcodec','libwebp',
      '-lossless','1',
      '-q:v','100',
      '-preset','drawing',

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
        fs.unlinkSync(txt)
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
.brat hola 😹`
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