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
text:'🕷️ Uso correcto: .play <nombre de la canción>'
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
text:'❌ No se encontraron resultados en la red'
},{ quoted:m })

const video = search.videos[0]

const { title, url, thumbnail, timestamp, views, author } = video

/* 🕷️ PANEL SPIDER - BORDES DE UNA LÍNEA */
await sock.sendMessage(from,{
image:{ url: thumbnail },
caption:
`╭━━━━━━━━━━━━╮
┃   🕷️ SPIDER 🕷️   ┃
╰━━━━━━━━━━━━╯

🎵 Título:
└─ ${title}

👤 Autor:
└─ ${author.name || 'Desconocido'}

⏱️ Duración:
└─ ${timestamp}

👁️ Vistas:
└─ ${views.toLocaleString()}

╭━━━━━━━━━━━━╮
┃ 🔍 Buscando... ┃
┃ 📡 Cargando... ┃
╰━━━━━━━━━━━━╯`
},{ quoted:m })

if (!fs.existsSync('./tmp')) fs.mkdirSync('./tmp', { recursive: true })

const file = `./tmp/${Date.now()}.m4a`

// Comando optimizado para mayor velocidad
const ytdlp = spawn('yt-dlp',[
'-f','bestaudio[ext=m4a]',
'--no-playlist',
'--quiet',
'--no-warnings',
'--force-ipv4',
'-o',file,
url
])

ytdlp.on('close', async(code)=>{

if(code !== 0){    
    return sock.sendMessage(from,{    
        text:'🕷️ Error: Fallo en la descarga'    
    },{ quoted:m })    
}    

await sock.sendMessage(from,{    
    audio:{ url:file },    
    mimetype:'audio/mp4',    
    ptt:false    
},{ quoted:m })    

setTimeout(() => {
    if (fs.existsSync(file)) fs.unlinkSync(file)
}, 3000)

await sock.sendMessage(from,{    
    react:{ text:'✅', key:m.key }    
})

})

}catch(e){
console.log(e)
sock.sendMessage(from,{
text:'🕷️ Sistema Spider: Error interno'
},{ quoted:m })
}

}

handler.command = ['play']
handler.tags = ['descargas']
handler.group = true
handler.menu = true

export default handler
