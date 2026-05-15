// 🕷️ SPIDER BOT - PINTEREST
// Adaptado a Spider Bot

import axios from 'axios'
import baileys from '@whiskeysockets/baileys'
import fs from 'fs'

const path = './data/modoadmin.json'

// 📥 DB
function getDB() {
    try {
        if (!fs.existsSync(path)) return {}
        return JSON.parse(fs.readFileSync(path, 'utf-8'))
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

    /* 🔒 MODODADMIN */
    if (isGroup) {

        const db = getDB()
        const isBlockedGroup = db[from]

        const user = participants.find(
            p => p.id === sender
        )

        const isAdmin =
            user?.admin === 'admin' ||
            user?.admin === 'superadmin'

        if (isBlockedGroup && !isAdmin)
            return
    }

    const text = args.join(' ').trim()

    if (!text) {
        return sock.sendMessage(from,{
            text:
`⚠️ Ingresa lo que quieres buscar

Ejemplo:
.pinterest Messi`
        },{ quoted:m })
    }

    // ⚡ reacción
    await sock.sendMessage(from,{
        react:{
            text:'🔍',
            key:m.key
        }
    })

    try {

        const api =
`https://api.delirius.store/search/pinterest?text=${encodeURIComponent(text)}`

        const { data } =
            await axios.get(api)

        if (
            !data.status ||
            !data.results ||
            !data.results.length
        ) {

            await sock.sendMessage(from,{
                react:{
                    text:'❌',
                    key:m.key
                }
            })

            return sock.sendMessage(from,{
                text:'❌ No se encontraron imágenes'
            },{ quoted:m })
        }

        // 📸 máximo 6
        const results =
            data.results.slice(0,6)

        const medias =
            results.map(url => ({
                type:'image',
                data:{ url }
            }))

        // 🕷️ caption
        const caption =
`╭━━━〔 🕷️ SPIDER PINTEREST 〕━━━⬣
┃ 🔎 Búsqueda:
┃ ${text}
╰━━━━━━━━━━━━━━━━⬣`

        // 📦 enviar álbum
        await sendAlbumMessage(
            sock,
            from,
            medias,
            {
                caption,
                quoted:m,
                delay:700
            }
        )

        // ✅ reacción final
        await sock.sendMessage(from,{
            react:{
                text:'✅',
                key:m.key
            }
        })

    } catch (e) {

        console.log('Pinterest Error:', e)

        await sock.sendMessage(from,{
            react:{
                text:'⚠️',
                key:m.key
            }
        })

        sock.sendMessage(from,{
            text:'❌ Error al buscar imágenes'
        },{ quoted:m })
    }
}

// 📦 FUNCIÓN ÁLBUM
async function sendAlbumMessage(
    sock,
    jid,
    medias,
    options = {}
) {

    const {
        delay = 500,
        caption = '',
        quoted = null
    } = options

    const album =
        baileys.generateWAMessageFromContent(
            jid,
            {
                messageContextInfo:{},
                albumMessage:{
                    expectedImageCount:
                        medias.filter(
                            m => m.type === 'image'
                        ).length,

                    expectedVideoCount:
                        medias.filter(
                            m => m.type === 'video'
                        ).length,

                    contextInfo: quoted ? {
                        remoteJid:
                            quoted.key.remoteJid,

                        fromMe:
                            quoted.key.fromMe,

                        stanzaId:
                            quoted.key.id,

                        participant:
                            quoted.key.participant ||
                            quoted.key.remoteJid,

                        quotedMessage:
                            quoted.message
                    } : {}
                }
            },
            {}
        )

    await sock.relayMessage(
        jid,
        album.message,
        {
            messageId: album.key.id
        }
    )

    for (let i = 0; i < medias.length; i++) {

        const {
            type,
            data
        } = medias[i]

        const msg =
            await baileys.generateWAMessage(
                jid,
                {
                    [type]: data,
                    ...(i === 0
                        ? { caption }
                        : {})
                },
                {
                    upload:
                        sock.waUploadToServer
                }
            )

        msg.message.messageContextInfo = {
            messageAssociation:{
                associationType:1,
                parentMessageKey:album.key
            }
        }

        await sock.relayMessage(
            jid,
            msg.message,
            {
                messageId: msg.key.id
            }
        )

        await new Promise(
            resolve =>
                setTimeout(resolve, delay)
        )
    }
}

handler.command = ['pinterest']
handler.tags = ['search']
handler.menu = true
handler.group = true

export default handler