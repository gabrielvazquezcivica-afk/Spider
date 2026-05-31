import fs from 'fs'

const handler = async ({
    sock,
    m,
    from,
    isGroup,
    participants
}) => {

    if (m.key.fromMe) return

    if (!isGroup) {

        return sock.sendMessage(from, {
            text: '⚠️ Este comando solo funciona en grupos.'
        }, {
            quoted: m
        })
    }

    // 👑 ADMIN REAL
    const sender =
        m.key.participant || m.key.remoteJid

    const user =
        participants.find(
            p => p.id === sender
        )

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    if (!isAdmin) {

        return sock.sendMessage(from, {
            text: '🕷️ Solo los administradores pueden usar este comando.'
        }, {
            quoted: m
        })
    }

    await sock.sendMessage(from, {
        react: {
            text: '👻',
            key: m.key
        }
    })

    try {

        const chatsPath =
            './data/chats.json'

        let chats = {}

        if (fs.existsSync(chatsPath)) {

            chats = JSON.parse(
                fs.readFileSync(
                    chatsPath,
                    'utf-8'
                )
            )
        }

        const fantasmas = []

        for (const p of participants) {

            const isGroupAdmin =
                p.admin === 'admin' ||
                p.admin === 'superadmin'

            if (isGroupAdmin)
                continue

            const mensajes =
                chats[p.id] || 0

            if (mensajes <= 0) {

                fantasmas.push(p.id)
            }
        }

        if (!fantasmas.length) {

            return sock.sendMessage(from, {
                text:
`╭━━━〔 👻 FANTASMAS 〕━━━⬣
┃
┃ ✅ No se encontraron
┃ usuarios fantasmas.
┃
╰━━━━━━━━━━━━━━━━⬣

⚠️ Nota:
El sistema cuenta mensajes desde que el bot fue agregado al grupo.`
            }, {
                quoted: m
            })
        }

        const lista =
            fantasmas.map(
                v => `👻 @${v.split('@')[0]}`
            ).join('\n')

        await sock.sendMessage(from, {
            text:
`╭━━━〔 👻 FANTASMAS 〕━━━⬣
┃
┃ 📊 Total encontrados:
┃ ${fantasmas.length}
┃
╰━━━━━━━━━━━━━━━━⬣

${lista}

⚠️ Nota:
Este resultado no puede ser 100% exacto.

El bot comienza a registrar actividad desde que fue agregado al grupo, por lo que usuarios que hablaron antes de la entrada del bot podrían aparecer como fantasmas hasta que vuelvan a enviar un mensaje.

> SPIDER BOT`,
            mentions: fantasmas
        }, {
            quoted: m
        })

    } catch (e) {

        console.log(
            'FANTASMAS ERROR:',
            e
        )

        await sock.sendMessage(from, {
            text:
'❌ Ocurrió un error al revisar los fantasmas.'
        }, {
            quoted: m
        })
    }
}

handler.command = ['fantasmas']
handler.tags = ['grupo']
handler.group = true
handler.menu = true
handler.admin = true

export default handler