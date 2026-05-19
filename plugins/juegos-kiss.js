import fs from 'fs'

const handler = async ({
  sock,
  m,
  from,
  sender,
  isGroup,
  participants
}) => {

  // ❌ Solo grupos
  if (!isGroup) return

  /* 🔒 MODODADMIN */
  let groupSettings = {
    enabled: false
  }

  const modoadminPath =
    './data/modoadmin.json'

  if (
    fs.existsSync(modoadminPath)
  ) {

    try {

      const data =
        JSON.parse(
          fs.readFileSync(
            modoadminPath
          )
        )

      groupSettings =
        data[from] || {
          enabled: false
        }

    } catch {

      groupSettings = {
        enabled: false
      }
    }
  }

  if (groupSettings.enabled) {

    const user =
      participants.find(
        p => p.id === sender
      )

    const isAdmin =
      user?.admin === 'admin' ||
      user?.admin === 'superadmin'

    if (!isAdmin) return
  }

  /* 👤 TARGET */
  const ctx =
    m.message?.extendedTextMessage?.contextInfo ||
    m.message?.imageMessage?.contextInfo ||
    m.message?.videoMessage?.contextInfo

  let who

  if (
    ctx?.mentionedJid?.length
  ) {

    who =
      ctx.mentionedJid[0]

  } else if (
    ctx?.participant
  ) {

    who =
      ctx.participant

  } else {

    who = sender
  }

  /* ⚡ REACCIÓN */
  await sock.sendMessage(from,{
    react:{
      text:'💋',
      key:m.key
    }
  })

  const name1 =
    sender.split('@')[0]

  const name2 =
    who.split('@')[0]

  /* 📝 TEXO */
  let texto

  if (who !== sender) {

    texto =
`💋 *@${name1}* le dio besos a *@${name2}* ( ˘ ³˘)♥`

  } else {

    texto =
`💋 *@${name1}* se besó solito… falta amor 😳`
  }

  /* 🎞️ VIDEOS */
  const videos = [

    'https://telegra.ph/file/d6ece99b5011aedd359e8.mp4',
    'https://telegra.ph/file/ba841c699e9e039deadb3.mp4',
    'https://telegra.ph/file/6497758a122357bc5bbb7.mp4',
    'https://telegra.ph/file/8c0f70ed2bfd95a125993.mp4',
    'https://telegra.ph/file/826ce3530ab20b15a496d.mp4'
  ]

  const video =
    videos[
      Math.floor(
        Math.random() *
        videos.length
      )
    ]

  /* 📤 ENVIAR */
  await sock.sendMessage(
    from,
    {
      video:{
        url: video
      },
      gifPlayback:true,
      caption:texto,
      mentions:[
        sender,
        who
      ]
    },
    {
      quoted:m
    }
  )
}

handler.command = ['kiss']
handler.tags = ['juegos']
handler.group = true
handler.menu = true

export default handler