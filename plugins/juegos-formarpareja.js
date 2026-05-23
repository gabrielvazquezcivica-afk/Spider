const handler = async ({
  sock,
  m,
  from,
  participants
}) => {

  if (!participants || participants.length < 2) {

    return sock.sendMessage(from,{
      text:'❌ Se necesitan mínimo 2 personas.'
    },{ quoted:m })
  }

  /* 👥 usuarios */
  const users =
    participants.map(v => v.id)

  /* 🎲 aleatorios */
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

  /* 📩 */
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