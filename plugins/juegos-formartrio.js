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
    participants.length < 3
  ) {

    return sock.sendMessage(from,{
      text:'❌ Se necesitan mínimo 3 personas.'
    },{
      quoted:m
    })
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

  let user3 =
    users[
      Math.floor(
        Math.random() * users.length
      )
    ]

  /* 🚫 evitar repetidos */
  while (
    user2 === user1
  ) {

    user2 =
      users[
        Math.floor(
          Math.random() * users.length
        )
      ]
  }

  while (
    user3 === user1 ||
    user3 === user2
  ) {

    user3 =
      users[
        Math.floor(
          Math.random() * users.length
        )
      ]
  }

  /* 📩 mensaje */
  await sock.sendMessage(from,{

    text:
`💞 @${user1.split('@')[0]}, @${user2.split('@')[0]} y @${user3.split('@')[0]} harían un trío perfecto 😳🔥`,

    mentions:[
      user1,
      user2,
      user3
    ]

  },{
    quoted:m
  })
}

handler.command = ['formartrio']
handler.tags = ['juegos']
handler.help = ['formartrio']
handler.menu = true

export default handler