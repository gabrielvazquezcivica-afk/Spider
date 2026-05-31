import fetch from 'node-fetch'
import yts from 'yt-search'
import fs from 'fs'

/* 🔒 MODODADMIN */
const modoadminPath =
  './data/modoadmin.json'

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

/* 🚀 COMANDO */
const handler = async ({
  sock,
  m,
  from,
  sender,
  isGroup,
  participants,
  args
}) => {

  // 🔒 MODODADMIN
  let isBlockedGroup = false

  try {

    const db = getModoadmin()

    isBlockedGroup =
      db[from]

  } catch {}

  const user =
    participants?.find(
      p => p.id === sender
    )

  const isAdmin =
    user?.admin === 'admin' ||
    user?.admin === 'superadmin'

  // 🔥 silencioso
  if (
    isBlockedGroup &&
    !isAdmin
  ) return

  /* 📝 TEXTO */
  let text =
    args.join(' ').trim()

  if (!text) {

    return sock.sendMessage(from,{
      text:
`🎬 Escribe el nombre del video

Ejemplo:
.play2 Maluma`
    },{
      quoted:m
    })
  }

  /* ⏳ REACCIÓN */
  await sock.sendMessage(from,{
    react:{
      text:'🕒',
      key:m.key
    }
  })

  try {

    /* 🔍 BUSCAR */
    const search =
      await yts(text)

    if (
      !search ||
      !search.videos ||
      !search.videos.length
    ) {

      await sock.sendMessage(from,{
        react:{
          text:'❌',
          key:m.key
        }
      })

      return sock.sendMessage(from,{
        text:
'❌ No encontré resultados.'
      },{
        quoted:m
      })
    }

    const video =
      search.videos[0]

    const videoUrl =
      video.url

    /* 🌐 API */
    const endpoint =
      Buffer
        .from(
          'aHR0cHM6Ly9hcGkuZGVsaXJpdXMuc3RvcmUvZG93bmxvYWQv',
          'base64'
        )
        .toString('utf-8')

    const api =
`${endpoint}ytmp4?url=${encodeURIComponent(videoUrl)}&format=360p`

    const res =
      await fetch(api)

    const json =
      await res.json()

console.log(JSON.stringify(json, null, 2))

    if (
      !json.status ||
      !json.data
    ) {

      await sock.sendMessage(from,{
        react:{
          text:'❌',
          key:m.key
        }
      })

      return sock.sendMessage(from,{
        text:
'❌ Error descargando video.'
      },{
        quoted:m
      })
    }

    const yt =
      json.data

    /* 🎨 INFO */
    const info =
`╭━━━〔 🎬 PLAY2 SPIDER 〕━━⬣
┃
┃ 📀 Título:
┃ ${yt.title}
┃
┃ 👤 Autor:
┃ ${yt.author}
┃
┃ ⏱️ Duración:
┃ ${video.timestamp}
┃
┃ 👀 Visitas:
┃ ${video.views.toLocaleString()}
┃
╰━━━━━━━━━━━━━━━━⬣

> SPIDER BOT`

    /* 📤 ENVIAR */
    await sock.sendMessage(from,{
      video:{
        url: yt.download
      },
      mimetype:'video/mp4',
      caption: info
    },{
      quoted:m
    })

    /* ✅ */
    await sock.sendMessage(from,{
      react:{
        text:'✅',
        key:m.key
      }
    })

  } catch(e){

    console.log(
      'PLAY2 ERROR:',
      e
    )

    await sock.sendMessage(from,{
      react:{
        text:'❌',
        key:m.key
      }
    })

    await sock.sendMessage(from,{
      text:
'❌ Error al descargar.'
    },{
      quoted:m
    })
  }
}

handler.command = ['play2']
handler.tags = ['descargas']
handler.help = ['play2 <texto>']
handler.menu = true
handler.group = true

export default handler