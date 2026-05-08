import fs from 'fs'
import { exec } from 'child_process'

const modoadminPath = './data/modoadmin.json'

function getModoadmin() {
    try {
        if (!fs.existsSync(modoadminPath)) return {}
        return JSON.parse(fs.readFileSync(modoadminPath, 'utf-8'))
    } catch {
        return {}
    }
}

const handler = async ({ sock, m, from, args, isGroup, sender }) => {

    if (!args[0]) {
        return sock.sendMessage(from, {
            text: '🎵 Usa: .play canción'
        }, { quoted: m })
    }

    const modoadmin = getModoadmin()
    const blocked = isGroup && modoadmin[from]

    if (blocked) {
        const meta = await sock.groupMetadata(from)
        const user = meta.participants.find(p => p.id === sender)

        const isAdmin =
            user?.admin === 'admin' ||
            user?.admin === 'superadmin'

        if (!isAdmin) return
    }

    const query = args.join(' ')
    const file = `./tmp/${Date.now()}.mp3`

    await sock.sendMessage(from, {
        react: { text: '🎧', key: m.key }
    })

    try {

        // 🔥 UN SOLO PROCESO (MUCHO MÁS RÁPIDO)
        const cmd = `
yt-dlp -f bestaudio \
--extract-audio \
--audio-format mp3 \
--audio-quality 0 \
--output "${file}" \
--no-playlist \
"ytsearch1:${query}"
        `

        exec(cmd, async (err) => {

            if (err) {
                return sock.sendMessage(from, {
                    text: '❌ No se pudo descargar la canción'
                }, { quoted: m })
            }

            const buffer = fs.readFileSync(file)

            await sock.sendMessage(from, {
                audio: buffer,
                mimetype: 'audio/mpeg'
            }, { quoted: m })

            fs.unlinkSync(file)
        })

    } catch (e) {
        console.log(e)
        sock.sendMessage(from, {
            text: '❌ Error en play'
        }, { quoted: m })
    }
}

handler.command = ['play']
handler.tags = ['descargas']
handler.menu = true

export default handler
