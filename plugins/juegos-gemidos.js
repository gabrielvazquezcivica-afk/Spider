import fs from 'fs'

const audios = [

'https://files.catbox.moe/worv9r.mp3',
'https://files.catbox.moe/nwy6n2.mp3',

]

const handler = async ({
sock,
m,
from,
participants,
sender
}) => {

// 🔒 MODODADMIN
let isBlockedGroup = false

try {

    const db = JSON.parse(
        fs.readFileSync(
            './data/modoadmin.json'
        )
    )

    isBlockedGroup = db[from]

} catch {}

const user = participants?.find(
    p => p.id === sender
)

const isAdmin =
    user?.admin === 'admin' ||
    user?.admin === 'superadmin'

if (
    isBlockedGroup &&
    !isAdmin
) return

try {

    const audio =
        audios[
            Math.floor(
                Math.random() *
                audios.length
            )
        ]

    await sock.sendMessage(
        from,
        {
            react:{
                text:'🎵',
                key:m.key
            }
        }
    )

    await sock.sendMessage(
        from,
        {
            audio:{
                url: audio
            },
            mimetype:'audio/mpeg',
            ptt:true
        },
        {
            quoted:m
        }
    )

    await sock.sendMessage(
        from,
        {
            react:{
                text:'✅',
                key:m.key
            }
        }
    )

} catch (e) {

    console.log(
        'GEM ERROR:',
        e
    )

    await sock.sendMessage(
        from,
        {
            text:

'❌ Error enviando audio.'
},
{
quoted:m
}
)
}
}

handler.command = ['gemidos']
handler.tags = ['juegos']
handler.help = ['gem']
handler.group = true
handler.menu = true

export default handler