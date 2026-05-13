import fs from 'fs'
import fetch from 'node-fetch'

// ───── DB ─────
const afkPath = './data/afk.json'
const modoadminPath = './data/modoadmin.json'

let afkDB = {}

if (!fs.existsSync(afkPath)) {
    fs.writeFileSync(afkPath, JSON.stringify({}))
}

try {
    afkDB = JSON.parse(fs.readFileSync(afkPath))
} catch {
    afkDB = {}
}

const saveAFK = () => {
    fs.writeFileSync(
        afkPath,
        JSON.stringify(afkDB, null, 2)
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

// ───── QUOTED SPIDER ─────
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

                const res = await fetch(pp)

                const buffer =
                    await res.arrayBuffer()

                thumbnail = Buffer.from(buffer)

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
async function checkModoAdmin(
    sock,
    from,
    sender,
    isGroup
) {

    try {

        if (!isGroup)
            return true

        let db = {}

        if (fs.existsSync(modoadminPath)) {

            db = JSON.parse(
                fs.readFileSync(
                    modoadminPath,
                    'utf-8'
                )
            )
        }

        const enabled =
            db[from]?.enabled ||
            db[from] === true

        if (!enabled)
            return true

        const metadata =
            await sock.groupMetadata(from)

        const user =
            metadata.participants.find(
                p => p.id === sender
            )

        const isAdmin =
            user?.admin === 'admin' ||
            user?.admin === 'superadmin'

        return isAdmin

    } catch {

        return true
    }
}

// ───── COMANDO AFK ─────
const handler = async ({
    sock,
    m,
    from,
    sender,
    isGroup,
    args
}) => {

    // 🔒 modoadmin
    const permitido =
        await checkModoAdmin(
            sock,
            from,
            sender,
            isGroup
        )

    if (!permitido) return

    const reason =
        args.join(' ').trim() ||
        'Sin razón'

    if (!afkDB[from]) {
        afkDB[from] = {}
    }

    afkDB[from][sender] = {
        reason,
        time: Date.now()
    }

    saveAFK()

    // ⚡ reacción
    await sock.sendMessage(from,{
        react:{
            text:'😴',
            key:m.key
        }
    })

    // 📩 mensaje
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
handler.before = async ({
    sock,
    m,
    from,
    sender,
    isGroup
}) => {

    try {

        if (!m?.message)
            return false

        // 🔒 modoadmin
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

        // 📄 texto
        const text =
            m.message.conversation ||
            m.message.extendedTextMessage?.text ||
            m.message.imageMessage?.caption ||
            m.message.videoMessage?.caption ||
            ''

        // 👋 quitar afk
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

handler.command = ['afk']
handler.tags = ['tools']
handler.help = ['afk']
handler.menu = true

export default handler
