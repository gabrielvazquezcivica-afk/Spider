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

    // ⚡ 1. reacción inmediata
    await sock.sendMessage(from, {
        react: { text: '🎧', key: m.key }
    })

    try {

        // ⚡ 2. obtener info (rápido)
        const infoCmd = `yt-dlp -j "ytsearch1:${query}"`

        exec(infoCmd, async (err, stdout) => {

            if (err) {
                return sock.sendMessage(from, {
                    text: '❌ No encontré la canción'
                }, { quoted: m })
            }

            const info = JSON.parse(stdout)

            const title = info.title
            const duration = info.duration
            const thumbnail = info.thumbnail
            const url = info.webpage_url

            // ⚡ 3. enviar info INMEDIATO
            await sock.sendMessage(from, {
                image: { url: thumbnail },
                caption:
`🎵 *SPIDER PLAY*

📌 ${title}
⏱ ${duration}s
🔗 ${url}

⏳ Descargando audio...`
            }, { quoted: m })

            // ⚡ 4. descarga en paralelo (NO BLOQUEA INFO)
            const dlCmd = `
yt-dlp -f bestaudio \
--extract-audio \
--audio-format mp3 \
--output "${file}" \
--no-playlist \
"ytsearch1:${query}"
            `

            exec(dlCmd, async (err2) => {

                if (err2) {
                    return sock.sendMessage(from, {
                        text: '❌ Error descargando audio'
                    }, { quoted: m })
                }

                const buffer = fs.readFileSync(file)

                // ⚡ 5. enviar audio final
                await sock.sendMessage(from, {
                    audio: buffer,
                    mimetype: 'audio/mpeg'
                }, { quoted: m })

                fs.unlinkSync(file)
            })
        })

    } catch (e) {
        console.log(e)
    }
}

handler.command = ['play']
handler.tags = ['descargas']
handler.menu = true

export default handler
