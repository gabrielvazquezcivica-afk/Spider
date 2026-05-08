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

/* 🔥 IMPORTANTE: formato compatible con tu index */
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

const botName = sock.user?.name || 'Spider Bot'

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
        text:'🎧 Uso: .play <canción>'
    },{ quoted:m })
}

/* ⚡ REACCIÓN */
await sock.sendMessage(from,{
    react:{ text:'🎧', key:m.key }
})

try {

const search = await yts(text)
if (!search.videos.length)
    return sock.sendMessage(from,{ text:'❌ No encontrado' },{ quoted:m })

const video = search.videos[0]

const { title, url, thumbnail, timestamp, views, author } = video

await sock.sendMessage(from,{
    image:{ url: thumbnail },
    caption:
`╭━━━〔 🎶 SPIDER MUSIC 〕━━━⬣
┃ 🎵 ${title}
┃ 👤 ${author.name}
┃ ⏱ ${timestamp}
┃ 👁 ${views.toLocaleString()}
┃
┃ ⬇️ Descargando...
╰━━━━━━━━━━━━━━⬣`
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
            text:'❌ Error descargando'
        },{ quoted:m })
    }

    await sock.sendMessage(from,{
        audio:{ url:file },
        mimetype:'audio/mp4',
        ptt:false
    },{ quoted:m })

    fs.unlinkSync(file)

})

}catch(e){
console.log(e)
sock.sendMessage(from,{
    text:'❌ Error en play'
},{ quoted:m })
}

}

handler.command = ['play']
handler.tags = ['descargas']
handler.group = true
handler.menu = true

export default handler
