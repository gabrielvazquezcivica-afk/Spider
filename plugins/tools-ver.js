import { downloadContentFromMessage } from '@whiskeysockets/baileys'
import fs from 'fs'

// ───── QUOTED PRO SPIDER ─────
const sistema = async (sock, from, titulo = '🕷️ SPIDER BOT') => {

    let nombreGrupo = 'Chat'
    let thumbnail = null

    try {

        if (from.endsWith('@g.us')) {

            const metadata =
                await sock.groupMetadata(from)

            nombreGrupo =
                metadata.subject || 'Grupo'

            try {

                const pp =
                    await sock.profilePictureUrl(
                        from,
                        'image'
                    )

                const res =
                    await fetch(pp)

                const buffer =
                    await res.arrayBuffer()

                thumbnail =
                    Buffer.from(buffer)

            } catch {}
        }

    } catch {}

    return {
        key: {
            fromMe: false,
            participant: '0@s.whatsapp.net',
            remoteJid: 'status@broadcast'
        },
        message: {
            extendedTextMessage: {
                text: titulo,
                title: 'SPIDER BOT',
                description: nombreGrupo,
                jpegThumbnail: thumbnail,
                previewType: 0
            }
        }
    }
}

const handler = async ({
    sock,
    m,
    from,
    isGroup,
    participants,
    sender
}) => {

    /* 🔒 MODODADMIN */
    const modoadminPath =
        './data/modoadmin.json'

    let groupSettings = {}

    if (fs.existsSync(modoadminPath)) {

        groupSettings = JSON.parse(
            fs.readFileSync(
                modoadminPath,
                'utf-8'
            )
        )
    }

    const isBlockedGroup =
        groupSettings[from]

    if (isBlockedGroup && isGroup) {

        const user =
            participants.find(
                p => p.id === sender
            )

        const isAdmin =
            user?.admin === 'admin' ||
            user?.admin === 'superadmin'

        if (!isAdmin) return
    }

    /* ⚡ REACCIÓN */
    await sock.sendMessage(from,{
        react:{
            text:'👀',
            key:m.key
        }
    })

    /* 🔍 MENSAJE CITADO */
    const ctx =
        m.message?.extendedTextMessage
            ?.contextInfo

    const quoted =
        ctx?.quotedMessage

    if (!quoted) {

        return sock.sendMessage(from,{
            text:'📸 Responde a una foto'
        },{
            quoted:m
        })
    }

    const type =
        Object.keys(quoted)[0]

    const q =
        quoted[type]

    /* 🧠 MIME */
    const mime =
        q?.mimetype || ''

    if (
        !mime ||
        !mime.includes('image')
    ) {

        return sock.sendMessage(from,{
            text:'❌ Responde a una foto válida'
        },{
            quoted:m
        })
    }

    /* ⛔ MEDIAKEY */
    if (!q.mediaKey) {

        return sock.sendMessage(from,{
            text:'❌ No se pudo obtener la imagen'
        },{
            quoted:m
        })
    }

    try {

        /* 🔽 DESCARGAR */
        const stream =
            await downloadContentFromMessage(
                q,
                'image'
            )

        let buffer =
            Buffer.from([])

        for await (const chunk of stream) {

            buffer =
                Buffer.concat([
                    buffer,
                    chunk
                ])
        }

        /* 📸 ENVIAR */
        await sock.sendMessage(from,{
            image: buffer
        },{
            quoted: await sistema(
                sock,
                from,
                '🕷️ FOTO RECUPERADA'
            )
        })

    } catch (e) {

        console.log(
            'ERROR VER:',
            e
        )

        return sock.sendMessage(from,{
            text:'❌ Error al recuperar la imagen'
        },{
            quoted:m
        })
    }
}

handler.command = ['ver']
handler.tags = ['tools']
handler.help = ['ver']
handler.menu = true

export default handler
