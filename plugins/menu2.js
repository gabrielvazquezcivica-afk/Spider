const handler = async (ctx) => {

    const {
        sock,
        from,
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

    const userTag =
        (m.key.participant || from)
            .split('@')[0]

    const frases = [

`😏 @${userTag} hoy viniste peligroso...`,

`🔥 @${userTag} anda buscando puro pecado`,

`🫦 @${userTag} abrió el menú prohibido`,

`💀 @${userTag} ya mejor ve a dormir`,

`👀 @${userTag} cuidado que te descubren`

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

    const imageUrl =
'https://i.postimg.cc/XYxFffwT/file-00000000cfac71f79671ee98bb3dd23d.png'

    try {

        await sock.sendMessage(from,{
            image:{
                url:imageUrl
            },
            caption:menu,
            mentions:[
                m.key.participant || from
            ]
        },{ quoted:m })

    } catch (e) {

        console.log(
            'MENU2 IMG ERROR:',
            e?.message || e
        )

        await sock.sendMessage(from,{
            text:menu,
            mentions:[
                m.key.participant || from
            ]
        },{ quoted:m })
    }
}

handler.command = ['menu2']
handler.tags = ['informacion']
handler.menu = true

export default handler