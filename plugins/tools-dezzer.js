import axios from 'axios'
import fs from 'fs'

/* 🔒 MODODADMIN */
const modoadminPath =
  './data/modoadmin.json'

function getDB() {

  try {

    if (!fs.existsSync(modoadminPath))
      return {}

    return JSON.parse(
      fs.readFileSync(
        modoadminPath,
        'utf-8'
      )
    )

  } catch {

    return {}
  }
}

const handler = async ({
    sock,
    m,
    from,
    args,
    isGroup,
    participants,
    sender
}) => {

    if (m.key.fromMe) return

    /* 🔒 MODODADMIN */
    if (isGroup) {

        const db =
            getDB()

        const isBlockedGroup =
            db[from]

        const user =
            participants?.find(
                p => p.id === sender
            )

        const isAdmin =
            user?.admin === 'admin' ||
            user?.admin === 'superadmin'

        if (
            isBlockedGroup &&
            !isAdmin
        ) return
    }

    const query =
        args.join(' ').trim()

    if (!query) {

        return sock.sendMessage(from, {
            text:
`🎵 DEEZER DOWNLOADER 🎵

────────────────────

📌 Uso:

.deezer Hay Lupita`
        }, {
            quoted: m
        })
    }

    await sock.sendMessage(from, {
        react: {
            text: '🕒',
            key: m.key
        }
    })

    try {

        const searchApi =
            'https://api.evogb.org/search/deezer'

        const dlApi =
            'https://api.evogb.org/dl/deezer'

        const searchResponse =
            await axios.get(
                `${searchApi}?query=${encodeURIComponent(query)}&limit=1`
            )

        const searchResult =
            searchResponse.data

        if (
            !searchResult?.status ||
            !searchResult?.data?.length
        ) {

            await sock.sendMessage(from, {
                react: {
                    text: '❌',
                    key: m.key
                }
            })

            return sock.sendMessage(from, {
                text:
'❌ No se encontraron resultados.'
            }, {
                quoted: m
            })
        }

        const track =
            searchResult.data[0]

        const dlResponse =
            await axios.get(
                `${dlApi}?url=${encodeURIComponent(track.url)}`
            )

        const dlResult =
            dlResponse.data

        if (
            !dlResult?.status ||
            !dlResult?.data?.dl
        ) {

            throw new Error()
        }

        const info =
`🎵 DEEZER DOWNLOADER

━━━━━━━━━━━━━━━━━━

🎶 Título:
${dlResult.data.title}

👤 Artista:
${dlResult.data.artist}

💿 Álbum:
${dlResult.data.album}

📅 Año:
${dlResult.data.release_date}

⏳ Duración:
${dlResult.data.duration}

━━━━━━━━━━━━━━━━━━`

        await sock.sendMessage(from, {
            image: {
                url: dlResult.data.cover
            },
            caption: info
        }, {
            quoted: m
        })

        await sock.sendMessage(from, {
            audio: {
                url: dlResult.data.dl
            },
            mimetype: 'audio/mpeg',
            fileName:
                `${dlResult.data.title}.mp3`
        }, {
            quoted: m
        })

        await sock.sendMessage(from, {
            react: {
                text: '🔥',
                key: m.key
            }
        })

    } catch (e) {

        console.log(
            'DEEZER ERROR:',
            e
        )

        await sock.sendMessage(from, {
            react: {
                text: '❌',
                key: m.key
            }
        })

        await sock.sendMessage(from, {
            text:
'❌ Ocurrió un error al descargar la canción.'
        }, {
            quoted: m
        })
    }
}

handler.command = ['music']
handler.tags = ['descargas']
handler.help = ['deezer <texto>']
handler.group = true
handler.menu = true

export default handler