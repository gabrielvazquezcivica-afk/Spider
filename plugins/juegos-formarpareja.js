import fs from 'fs'

/* ───── DB MODODADMIN ───── */
function getDB() {

  try {

    const pathDB =
      './data/modoadmin.json'

    if (!fs.existsSync(pathDB))
      return {}

    return JSON.parse(
      fs.readFileSync(
        pathDB,
        'utf-8'
      )
    )

  } catch {

    return {}
  }
}

const handler = async ({
  sock,
  m,
  from,
  isGroup,
  sender,
  participants
}) => {

  /* 🔒 MODODADMIN */
  const db = getDB()

  const isBlockedGroup =
    db[from]

  if (
    isBlockedGroup &&
    isGroup
  ) {

    const user =
      participants?.find(
        p => p.id === sender
      )

    const isAdmin =
      user?.admin === 'admin' ||
      user?.admin === 'superadmin'

    if (!isAdmin) return
  }

  /* 👥 mínimo */
  if (
    !participants ||
    participants.length < 2
  ) {

    return sock.sendMessage(from,{
      text:'❌ Se necesitan mínimo 2 personas.'
    },{ quoted:m })
  }

  /* 👤 usuarios */
  const users =
    participants.map(v => v.id)

  /* 🎲 random */
  const user1 =
    users[
      Math.floor(
        Math.random() * users.length
      )
    ]

  let user2 =
    users[
      Math.floor(
        Math.random() * users.length
      )
    ]

  /* 🚫 evitar mismo */
  while (user1 === user2) {

    user2 =
      users[
        Math.floor(
          Math.random() * users.length
        )
      ]
  }

  /* 💬 frases */
  const frases = [

    '💘 haría bonita pareja con 💘',

    '💍 debería casarse con 💍',

    '😘 se besaría con 😘',

    '❤️ hacen linda pareja ❤️',

    '😍 andan enamorados 😍',

    '💕 se ven bien juntos 💕',

    '💞 ya deberían ser novios 💞',

    '👀 se miran con amor 👀',

    '✨ son almas gemelas ✨',

    '🔥 tienen química 🔥',

    '🌹 nacieron para estar juntos 🌹',

    '🥺 seguramente se gustan 🥺',

    '😏 ya se traen ganas 😏',

    '💖 serían pareja perfecta 💖'
  ]

  const frase =
    frases[
      Math.floor(
        Math.random() * frases.length
      )
    ]

  /* 📩 mensaje */
  await sock.sendMessage(from,{

    text:
`@${user1.split('@')[0]} ${frase} @${user2.split('@')[0]}`,

    mentions:[
      user1,
      user2
    ]

  },{ quoted:m })
}

handler.command = ['formarpareja']
handler.tags = ['juegos']
handler.help = ['formarpareja']
handler.menu = true

export default handler