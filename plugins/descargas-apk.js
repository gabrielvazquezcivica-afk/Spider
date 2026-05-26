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
`╭─〔 🕷️ SPIDER APK 🕷️ 〕─╮
│
│ 📥 Uso correcto:
│ .${command} WhatsApp
│
│ ⚡ Descarga APKs rápido
╰────────────────╯`
    },{
      quoted:m
    })
  }

  /* ⏳ */
  await sock.sendMessage(from,{
    react:{
      text:'⏳',
      key:m.key
    }
  })

  try {

    /* 🔑 API */
    const apiKey =
      Buffer
        .from(
          'ZWt1c2Fz',
          'base64'
        )
        .toString('utf-8')
        .split('')
        .reverse()
        .join('')

    /* 🔍 BUSCAR APK */
    const resSearch =
      await fetch(
`https://api.evogb.org/search/apk?query=${encodeURIComponent(text)}&key=${apiKey}`
      )

    const jsonSearch =
      await resSearch.json()

    if (
      !jsonSearch.status ||
      !jsonSearch.data
    ) {

      await sock.sendMessage(from,{
        react:{
          text:'❌',
          key:m.key
        }
      })

      return sock.sendMessage(from,{
        text:
'❌ No encontré esa aplicación.'
      },{
        quoted:m
      })
    }

    const app =
      jsonSearch.data

    /* 📥 DESCARGA */
    const resDownload =
      await fetch(
`https://api.delirius.store/download/apk?query=${encodeURIComponent(app.name)}`
      )

    const jsonDownload =
      await resDownload.json()

    if (
      !jsonDownload.status ||
      !jsonDownload.data
    ) {

      await sock.sendMessage(from,{
        react:{
          text:'❌',
          key:m.key
        }
      })

      return sock.sendMessage(from,{
        text:
'❌ Error descargando APK.'
      },{
        quoted:m
      })
    }

    const dlUrl =
      jsonDownload.data.download

    /* 🎨 INFO */
    let info =
`╭━━━〔 📦 SPIDER APK 〕━━⬣
┃
┃ 📱 Nombre:
┃ ${app.name}
┃
┃ ⚖️ Tamaño:
┃ ${app.size}
┃
┃ 📅 Actualizado:
┃ ${app.lastUpdated}
┃
┃ ⚡ Estado:
┃ Descargando APK...
┃
╰━━━━━━━━━━━━━━━━⬣

> SPIDER BOT`

    /* 🖼️ PORTADA */
    await sock.sendMessage(from,{
      image:{
        url: app.banner
      },
      caption: info
    },{
      quoted:m
    })

    /* 📦 APK */
    await sock.sendMessage(from,{
      document:{
        url: dlUrl
      },
      mimetype:
'application/vnd.android.package-archive',
      fileName:
`${app.name}.apk`
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
      'APK ERROR:',
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

handler.command = ['apk']
handler.tags = ['descargas']
handler.help = ['apk <nombre>']
handler.group = true
handler.menu = true

export default handler