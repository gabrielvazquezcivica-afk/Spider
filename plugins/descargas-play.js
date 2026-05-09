import yts from 'yt-search'
import { spawn } from 'child_process'
import fs from 'fs'

const path = './data/modoadmin.json'

function getDB() {
    try {
        if (!fs.existsSync(path)) return {}
        return JSON.parse(fs.readFileSync(path, 'utf-8'))
    } catch {
        return {}
    }
}

const handler = async (ctx) => {

const {
    sock,
    m,
    from,
    args,
    isGroup,
    participants,
    sender
} = ctx

const botName = sock.user?.name || 'SPIDER BOT 🕷️'

/* 🔒 MODODADMIN */
if (isGroup) {

    const db = getDB()
    const isBlockedGroup = db[from]

    const user = participants.find(p => p.id === sender)

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    if (isBlockedGroup && !isAdmin) return
}

const text = args.join(' ').trim()

if (!text) {
    return sock.sendMessage(from,{
        text:'🕷️ 𝐔𝐬𝐨 𝐜𝐨𝐫𝐫𝐞𝐜𝐭𝐨: .𝐩𝐥𝐚𝐲 <𝐧𝐨𝐦𝐛𝐫𝐞 𝐝𝐞 𝐥𝐚 𝐜𝐚𝐧𝐜𝐢𝐨́𝐧>'
    },{ quoted:m })
}

/* ⚡ REACCIÓN SPIDER */
await sock.sendMessage(from,{
    react:{ text:'🔎', key:m.key }
})

try {

const search = await yts(text)
if (!search.videos.length)
    return sock.sendMessage(from,{
        text:'❌ 𝐍𝐨 𝐬𝐞 𝐞𝐧𝐜𝐨𝐧𝐭𝐫𝐚𝐫𝐨𝐧 𝐫𝐞𝐬𝐮𝐥𝐭𝐚𝐝𝐨𝐬 𝐞𝐧 𝐥𝐚 𝐫𝐞𝐝'
    },{ quoted:m })

const video = search.videos[0]

const { title, url, thumbnail, timestamp, views, author } = video

/* 🕷️ PANEL SPIDER (DISEÑO NUEVO) */
await sock.sendMessage(from,{
    image:{ url: thumbnail },
    caption:
`╔══════════════════════╗
║   🕷️ 𝐒𝐏𝐈𝐃𝐄𝐑 𝐌𝐔𝐒𝐈𝐂   🕷️
╚══════════════════════╝

🎵 𝐓𝐢𝐭𝐮𝐥𝐨:
└─ ${title}

👤 𝐀𝐮𝐭𝐨𝐫:
└─ ${author.name || 'Desconocido'}

⏱️ 𝐃𝐮𝐫𝐚𝐜𝐢𝐨́𝐧:
└─ ${timestamp}

👁️ 𝐕𝐢𝐬𝐭𝐚𝐬:
└─ ${views.toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━
🔍 𝐁𝐮𝐬𝐜𝐚𝐧𝐝𝐨...
📡 𝐄𝐱𝐭𝐫𝐚𝐲𝐞𝐧𝐝𝐨 𝐚𝐮𝐝𝐢𝐨...
━━━━━━━━━━━━━━━━━━━━━`
},{ quoted:m })

if (!fs.existsSync('./tmp')) fs.mkdirSync('./tmp')

const file = `./tmp/${Date.now()}.m4a`

const ytdlp = spawn('yt-dlp',[
    '-f','bestaudio[ext=m4a]/bestaudio',
    '--no-playlist',
    '--quiet',
    '-o',file,
    url
])

ytdlp.on('close', async(code)=>{

    if(code !== 0){
        return sock.sendMessage(from,{
            text:'🕷️ 𝐄𝐫𝐫𝐨𝐫: 𝐅𝐚𝐥𝐥𝐨 𝐞𝐧 𝐥𝐚 𝐝𝐞𝐬𝐜𝐚𝐫𝐠𝐚'
        },{ quoted:m })
    }

    await sock.sendMessage(from,{
        audio:{ url:file },
        mimetype:'audio/mp4',
        ptt:false
    },{ quoted:m })

    fs.unlinkSync(file)

    await sock.sendMessage(from,{
        react:{ text:'✅', key:m.key }
    })

})

}catch(e){
console.log(e)
sock.sendMessage(from,{
    text:'🕷️ 𝐒𝐢𝐬𝐭𝐞𝐦𝐚 𝐒𝐩𝐢𝐝𝐞𝐫: 𝐄𝐫𝐫𝐨𝐫 𝐢𝐧𝐭𝐞𝐫𝐧𝐨'
},{ quoted:m })
}

}

handler.command = ['play']
handler.tags = ['descargas']
handler.group = true
handler.menu = true

export default handler
