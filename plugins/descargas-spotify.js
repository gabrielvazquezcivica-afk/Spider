import fetch from 'node-fetch'
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
  sender,
  command
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

    // 🔥 silencioso
    if (
      isBlockedGroup &&
      !isAdmin
    ) return
  }

  const text =
    args.join(' ').trim()

  if (!text) {

    return sock.sendMessage(from,{
      text:
`『 ⚡ SPIDER SYSTEM ⚡ 』

> 🎵 Ingresa nombre o link
> 💡 Ejemplo:
.${command} Bad Bunny`
    },{
      quoted:m
    })
  }

  /* ⚡ REACCIÓN */
  await sock.sendMessage(from,{
    react:{
      text:'⚡',
      key:m.key
    }
  })

  try {

    const b =
      s => Buffer
        .from(s,'base64')
        .toString('utf-8')

    const api =
      b(
        'aHR0cHM6Ly9hcGkuZXZvZ2Iub3Jn'
      )

    const key =
      b(
        'c2FzdWtl'
      )

    let trackUrl =
      text

    const isUrl =
      text.match(
/^(https?:\/\/)?(open\.spotify\.com|spotify\.link)\/.+$/gi
      )

    /* 🔍 BUSCAR */
    if (!isUrl) {

      const searchRes =
        await fetch(
`${api}/search/spotify?query=${encodeURIComponent(text)}&key=${key}`
        )

      const searchData =
        await searchRes.json()

      if (
        !searchData.status ||
        !searchData.result.length
      ) {

        await sock.sendMessage(from,{
          react:{
            text:'❌',
            key:m.key
          }
        })

        return sock.sendMessage(from,{
          text:
'*🏮 [ ERROR ]* No encontrado.'
        },{
          quoted:m
        })
      }

      trackUrl =
        searchData.result[0].link
    }

    /* 📥 DESCARGAR */
    const dlRes =
      await fetch(
`${api}/dl/spotify?url=${encodeURIComponent(trackUrl)}&key=${key}`
      )

    const dlData =
      await dlRes.json()

    if (!dlData.status) {

      await sock.sendMessage(from,{
        react:{
          text:'❌',
          key:m.key
        }
      })

      return sock.sendMessage(from,{
        text:
'*🏮 [ FALLO ]* Error descargando audio.'
      },{
        quoted:m
      })
    }

    const info =
      dlData.data

    /* 🎨 INFO */
    let txt =
`┏━━━━━━━━━━━━━━━━━━┓
┃   🎧 *SPIDER SPOTIFY* 🎧
┣━━━━━━━━━━━━━━━━━━┛
┃
┃ 🎵 *Título:* ${info.name}
┃ 👤 *Artista:* ${info.artist}
┃ 💿 *Álbum:* ${info.album}
┃ ⏱️ *Tiempo:* ${info.duration}
┃
┃ ⚙️ *Estado:* 🟢 Descargado
┃
┣━━━━━━━━━━━━━━━━━━┓
┃ 🕷️ *SPIDER BOT*
┃ ⚡ *Sistema activo*
┗━━━━━━━━━━━━━━━━━━┛`

    /* 🖼️ PORTADA */
    await sock.sendMessage(from,{
      image:{
        url:
          info.imageHD ||
          info.image
      },
      caption: txt
    },{
      quoted:m
    })

    /* 🎧 AUDIO */
    await sock.sendMessage(from,{
      audio:{
        url: info.url
      },
      mimetype:'audio/mpeg',
      fileName:`${info.name}.mp3`,
      ptt:false
    },{
      quoted:m
    })

    /* 🔥 */
    await sock.sendMessage(from,{
      react:{
        text:'🔥',
        key:m.key
      }
    })

  } catch (e) {

    console.log(
      'SPOTIFY ERROR:',
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
'❌ Ocurrió un error.'
    },{
      quoted:m
    })
  }
}

handler.command = ['spotify']
handler.tags = ['descargas']
handler.help = ['spotify <texto>']
handler.group = true
handler.menu = true

export default handler