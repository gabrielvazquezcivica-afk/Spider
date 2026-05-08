import fs from 'fs'
import { exec } from 'child_process'
import fetch from 'node-fetch'

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
            text: '🎵 Usa: .play nombre de la canción'
        }, { quoted: m })
    }

    // 🔒 MODODADMIN (solo admins pueden usar si está activo)
    const modoadmin = getModoadmin()
    const blocked = isGroup && modoadmin[from]

    if (blocked) {
        const groupMeta = await sock.groupMetadata(from)
        const user = groupMeta.participants.find(p => p.id === sender)

        const isAdmin =
            user?.admin === 'admin' ||
            user?.admin === 'superadmin'

        if (!isAdmin) return
    }

    const query = args.join(' ')
    const file = `./tmp/${Date.now()}.mp3`

    await sock.sendMessage(from, {
        react: { text: '🔎', key: m.key }
    })

    try {

        // 🔥 obtener info con yt-dlp
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
            const url = info.webpage_url
            const thumbnail = info.thumbnail

            // 🔥 descargar audio rápido
            const dlCmd = `yt-dlp -x --audio-format mp3 -o "${file}" "ytsearch1:${query}"`

            exec(dlCmd, async (err2) => {

                if (err2) {
                    return sock.sendMessage(from, {
                        text: '❌ Error descargando audio'
                    }, { quoted: m })
                }

                const buffer = fs.readFileSync(file)

                await sock.sendMessage(from, {
                    image: { url: thumbnail },
                    caption:
`🎵 *SPIDER PLAY*

📌 Título: ${title}
⏱ Duración: ${duration}s
🔗 Link: ${url}

> Reproduciendo...`
                }, { quoted: m })

                await sock.sendMessage(from, {
                    audio: buffer,
                    mimetype: 'audio/mpeg'
                }, { quoted: m })

                fs.unlinkSync(file)
            })
        })

    } catch (e) {
        console.log(e)
        sock.sendMessage(from, {
            text: '❌ Error en el play'
        }, { quoted: m })
    }
}

handler.command = ['play']
handler.tags = ['descargas']
handler.menu = true

export default handler
