import yts from 'yt-search'
import { spawn } from 'child_process'
import fs from 'fs'

const path = './data/modoadmin.json'

// 📥 DB modoadmin
function getDB() {
    try {
        if (!fs.existsSync(path)) return {}
        return JSON.parse(fs.readFileSync(path, 'utf-8'))
    } catch {
        return {}
    }
}

export const handler = async (m, { sock, from, args, reply, isGroup, participants, sender }) => {

const botName = sock.user?.name || 'Spider Bot'

/* 🔒 MODODADMIN (MISMO SISTEMA SHIP) */
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
    return reply('🎧 Uso: .play <canción>')
}

/* ⚡ REACCIÓN INMEDIATA */
await sock.sendMessage(from,{
    react:{ text:'🎧', key:m.key }
})

try {

/* 🔎 SEARCH RÁPIDO */
const search = await yts(text)
if (!search.videos.length) return reply('❌ No encontré resultados')

const video = search.videos[0]
const { title, url, thumbnail, timestamp, views, author } = video

/* 📢 INFO INMEDIATA */
await sock.sendMessage(from,{
    image:{ url: thumbnail },
    caption:
`╭━━━〔 🎶 ${botName} 〕━━━⬣
┃ 🎵 ${title}
┃ 👤 ${author.name}
┃ ⏱ ${timestamp}
┃ 👁 ${views.toLocaleString()}
┃
┃ ⬇️ Descargando audio...
╰━━━━━━━━━━━━━━⬣`
},{ quoted:m })

/* 📁 TMP */
if (!fs.existsSync('./tmp')) {
    fs.mkdirSync('./tmp')
}

const file = `./tmp/${Date.now()}.m4a`

/* 🚀 DESCARGA RÁPIDA */
const ytdlp = spawn('yt-dlp',[
    '-f','bestaudio[ext=m4a]/bestaudio',
    '--no-playlist',
    '--quiet',
    '-o',file,
    url
])

ytdlp.on('close', async(code)=>{

    if(code !== 0){
        return reply('❌ Error descargando audio')
    }

    try {

        await sock.sendMessage(from,{
            audio: { url: file },
            mimetype:'audio/mp4',
            ptt:false
        },{ quoted:m })

        fs.unlinkSync(file)

        await sock.sendMessage(from,{
            react:{ text:'✅', key:m.key }
        })

    } catch (err) {
        console.log('SEND ERROR:', err)
        reply('❌ Error enviando audio')
    }

})

}catch(e){
console.log('PLAY ERROR:',e)
reply('❌ Error en el play')
}

}

handler.command = ['play']
handler.tags = ['descargas']
handler.group = true
handler.menu = true

export default handler
