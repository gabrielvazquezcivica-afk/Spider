import fs from 'fs'
import fetch from 'node-fetch'

// ───── DB ─────
const afkPath = './data/afk.json'

let afkDB = {}

if (!fs.existsSync(afkPath)) {
    fs.writeFileSync(
        afkPath,
        JSON.stringify({})
    )
}

try {

    afkDB = JSON.parse(
        fs.readFileSync(afkPath)
    )

} catch {

    afkDB = {}
}

const saveAFK = () => {

    fs.writeFileSync(
        afkPath,
        JSON.stringify(
            afkDB,
            null,
            2
        )
    )
}

// ───── TIEMPO ─────
const msToTime = (ms) => {

    let s = Math.floor(ms / 1000)
    let m = Math.floor(s / 60)
    let h = Math.floor(m / 60)

    s %= 60
    m %= 60

    return `${h ? h + 'h ' : ''}${m ? m + 'm ' : ''}${s}s`
}

// ───── QUOTED PRO ─────
const sistema = async (
    sock,
    from,
    titulo = 'SPIDER BOT 🕷️'
) => {

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

// ───── 🔒 MODO ADMIN ─────
const checkModoAdmin = async (
    sock,
    from,
    sender,
    isGroup
) => {

    let groupSettings = {
        enabled: false
    }

    const modoadminPath =
        './data/modoadmin.json'

    if (fs.existsSync(modoadminPath)) {

        try {

            const modoadminData =
                JSON.parse(
                    fs.readFileSync(
                        modoadminPath
                    )
                )

            groupSettings =
                modoadminData[from] || {
                    enabled: false
                }

        } catch {

            groupSettings = {
                enabled: false
            }
        }
    }

    if (
        groupSettings.enabled &&
        isGroup
    ) {

        let isAdmin = false

        try {

            const metadata =
                await sock.groupMetadata(from)

            const participants =
                metadata.participants || []

            isAdmin =
                participants.some(
                    p =>
                        p.id === sender &&
                        (
                            p.admin === 'admin' ||
                            p.admin === 'superadmin'
                        )
                )

        } catch {

            isAdmin = false
        }

        if (!isAdmin)
            return false
    }

    return true
}

// ───── COMANDO AFK ─────
const handler = async ({
    sock,
    m,
    sender,
    from,
    isGroup
}) => {

    // 🔒 modo admin
    const permitido =
        await checkModoAdmin(
            sock,
            from,
            sender,
            isGroup
        )

    if (!permitido)
        return

    const text =
        m.message?.conversation ||
        m.message?.extendedTextMessage?.text ||
        ''

    const reason =
        text.replace(
            /^\.?afk\s*/i,
            ''
        ) || 'Sin razón'

    if (!afkDB[from]) {
        afkDB[from] = {}
    }

    afkDB[from][sender] = {
        reason,
        time: Date.now()
    }

    saveAFK()

    await sock.sendMessage(from,{
        react:{
            text:'😴',
            key:m.key
        }
    })

    await sock.sendMessage(from,{
        text:
`😴 AFK ACTIVADO

📌 Razón:
${reason}`
    },{
        quoted: await sistema(
            sock,
            from,
            'AFK 💤'
        )
    })
}

// ───── BEFORE ─────
export async function before({
    sock,
    m,
    from,
    sender,
    isGroup
}) {

    try {

        if (!m?.message)
            return false

        const permitido =
            await checkModoAdmin(
                sock,
                from,
                sender,
                isGroup
            )

        if (!permitido)
            return false

        if (!afkDB[from])
            return false

        const text =
            m.message.conversation ||
            m.message.extendedTextMessage?.text ||
            m.message.imageMessage?.caption ||
            m.message.videoMessage?.caption ||
            ''

        // 👋 quitar AFK
        if (
            afkDB[from][sender] &&
            !text.startsWith('.afk')
        ) {

            const tiempo =
                msToTime(
                    Date.now() -
                    afkDB[from][sender].time
                )

            delete afkDB[from][sender]

            saveAFK()

            await sock.sendMessage(from,{
                react:{
                    text:'👋',
                    key:m.key
                }
            })

            await sock.sendMessage(from,{
                text:
`👋 AFK DESACTIVADO

⏱️ Tiempo ausente:
${tiempo}`
            },{
                quoted: await sistema(
                    sock,
                    from,
                    'AFK OFF 👋'
                )
            })
        }

        // 🔍 menciones
        const ctx =
            m.message?.extendedTextMessage
                ?.contextInfo

        let mentioned = []

        if (ctx?.mentionedJid) {

            mentioned.push(
                ...ctx.mentionedJid
            )
        }

        if (ctx?.participant) {

            mentioned.push(
                ctx.participant
            )
        }

        mentioned = [
            ...new Set(mentioned)
        ]

        for (const user of mentioned) {

            if (!afkDB[from][user])
                continue

            const tiempo =
                msToTime(
                    Date.now() -
                    afkDB[from][user].time
                )

            await sock.sendMessage(from,{
                text:
`😴 USUARIO AFK

👤 @${user.split('@')[0]}

📌 Razón:
${afkDB[from][user].reason}

⏱️ Tiempo:
${tiempo}`,
                mentions:[user]
            },{
                quoted: await sistema(
                    sock,
                    from,
                    'Usuario AFK 💤'
                )
            })
        }

    } catch (e) {

        console.log(
            'AFK ERROR:',
            e
        )
    }

    return false
}

// ───── CONFIG ─────
handler.command = ['afk']
handler.tags = ['tools']
handler.help = ['afk <razón>']
handler.menu = true

export default handler
