const handler = async (ctx) => {

    const {
        sock,
        from,
        pushName,
        m
    } = ctx

    const plugins =
        global.plugins || []

    if (
        !Array.isArray(plugins) ||
        plugins.length === 0
    ) {

        return sock.sendMessage(from,{
            text:'❌ No hay plugins cargados.'
        },{ quoted:m })
    }

    /* ⚡ REACCIÓN */
    await sock.sendMessage(from,{
        react:{
            text:'🔞',
            key:m.key
        }
    })

    const botName =
        '𝐒𝐩𝐢𝐝𝐞𝐫-𝐁𝐨𝐭'

    const frases = [

`😏 @${m.key.participant?.split('@')[0] || from.split('@')[0]} hoy viniste peligroso...`,

`🔥 @${m.key.participant?.split('@')[0] || from.split('@')[0]} anda buscando puro pecado`,

`🫦 @${m.key.participant?.split('@')[0] || from.split('@')[0]} abrió el menú prohibido`,

`💀 @${m.key.participant?.split('@')[0] || from.split('@')[0]} ya mejor ve a dormir`,

`👀 @${m.key.participant?.split('@')[0] || from.split('@')[0]} cuidado que te descubren`
    ]

    const frase =
        frases[
            Math.floor(
                Math.random() *
                frases.length
            )
        ]

    let cmds = []

    for (const plugin of plugins) {

        if (
            !plugin.menu ||
            !plugin.command
        ) continue

        const tag =
            plugin.tags?.[0]

        if (tag !== 'nsfw')
            continue

        const commandList =
            Array.isArray(plugin.command)
                ? plugin.command
                : [plugin.command]

        cmds.push(...commandList)
    }

    cmds = [...new Set(cmds)].sort()

    let menu =
`╭────────────────╮
│ 🔞 MENU +18 🔞
╰────────────────╯

> ${frase}

╭────────────────╮`

    for (const cmd of cmds) {

        menu +=
`\n│ ⚠️ .${cmd}`
    }

    menu +=
`\n╰────────────────╯

> 🕷️ ${botName}`

    await sock.sendMessage(from,{
        image:{
            url:'https://i.postimg.cc/k4hvPdLR/file-000000008160722fad60047fba4dd52d.png'
        },
        caption:menu,
        mentions:[
            m.key.participant || from
        ]
    },{ quoted:m })
}

handler.command = ['menu2']
handler.tags = ['informacion']
handler.menu = true

export default handler