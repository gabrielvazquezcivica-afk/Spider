import yts from 'yt-search'
import axios from 'axios'
import fs from 'fs'

/* 🔒 MODODADMIN */
const modoadminPath =
  './data/modoadmin.json'

function getDB() {

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
  args,
  isGroup,
  participants,
  sender
}) => {

  /* 🔒 MODODADMIN */
  if (isGroup) {

    const db =
      getDB()

    const isBlockedGroup =
      db[from]

    const user =
      participants?.find(
        p => p.id === sender
      )

    const isAdmin =
      user?.admin === 'admin' ||
      user?.admin === 'superadmin'

    if (
      isBlockedGroup &&
      !isAdmin
    ) return
  }

  /* 📝 TEXTO */
  const text =
    args.join(' ').trim()

  if (!text) {

    return sock.sendMessage(from,{
      text:
`🎵 Escribe el nombre de una canción

Ejemplo:
.play Bad Bunny`
    },{
      quoted:m
    })
  }

  /* 🎧 REACCIÓN */
  await sock.sendMessage(from,{
    react:{
      text:'🎧',
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

    const {
      title,
      url,
      thumbnail,
      timestamp,
      views,
      author
    } = video

    /* 🌐 API */
    const api =
`https://api.delirius.store/download/ytmp3?url=${encodeURIComponent(url)}`

    const { data } =
      await axios.get(api)

    if (
      !data.status ||
      !data.data ||
      !data.data.download
    ) {

      await sock.sendMessage(from,{
        react:{
          text:'❌',
          key:m.key
        }
      })

      return sock.sendMessage(from,{
        text:
'❌ No pude descargar el audio.'
      },{
        quoted:m
      })
    }

    const audio =
      data.data.download

    /* 🎨 DISEÑO */
    const info =
`╭─────〔 🎵 SPIDER PLAY 〕─────⬣

🎶 𝐓𝐈𝐓𝐔𝐋𝐎
➜ ${title}

👤 𝐀𝐑𝐓𝐈𝐒𝐓𝐀
➜ ${author?.name || 'Desconocido'}

⏱️ 𝐃𝐔𝐑𝐀𝐂𝐈𝐎𝐍
➜ ${timestamp}

👁️ 𝐕𝐈𝐒𝐈𝐓𝐀𝐒
➜ ${views.toLocaleString()}

🔗 𝐋𝐈𝐍𝐊
➜ ${url}

━━━━━━━━━━━━━━━━━━
⬇️ Procesando descarga...
🎧 Espera un momento...

🕸️ 𝐒𝐏𝐈𝐃𝐄𝐑 𝐌𝐔𝐒𝐈𝐂
╰──────────────────⬣`

    /* 🖼️ PORTADA */
    await sock.sendMessage(from,{
      image:{
        url: thumbnail
      },
      caption: info
    },{
      quoted:m
    })

    /* 🎧 AUDIO */
    await sock.sendMessage(from,{
      audio:{
        url: audio
      },
      mimetype:'audio/mpeg',
      fileName:`${title}.mp3`,
      ptt:false
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

  } catch (e) {

    console.log(
      'PLAY ERROR:',
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
'❌ Ocurrió un error al descargar la canción.'
    },{
      quoted:m
    })
  }
}

handler.command = ['play']
handler.tags = ['descargas']
handler.group = true
handler.menu = true
handler.help = ['play <texto>']

export default handler