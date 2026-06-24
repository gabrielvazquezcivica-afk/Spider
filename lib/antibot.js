import fs from 'fs'

const antiBotPath = './data/antibot.json'

// cache temporal
global.botTracker = global.botTracker || {}

export async function verificarAntibot({
    sock,
    m,
    from,
    isGroup
}) {
    if (!isGroup) return false
    if (!m?.key) return false
    if (m.key.fromMe) return false

    let db = {}

    try {
        db = JSON.parse(
            fs.readFileSync(
                antiBotPath,
                'utf8'
            )
        )
    } catch {}

    if (!db[from]) return false

    const sender =
        m.key.participant ||
        m.key.remoteJid

    const msgId = m.key.id || ''

    const msg =
        m.message?.conversation ||
        m.message?.extendedTextMessage?.text ||
        m.message?.imageMessage?.caption ||
        ''

    let score = 0

    // 1. Baileys clásico
    if (
        msgId.startsWith('3EB0') &&
        msgId.length === 22
    ) score += 10

    // 2. Comandos típicos de bots
    const botCommands = [
        '.menu',
        '.play',
        '.owner',
        '.sticker',
        '.ai'
    ]

    if (
        botCommands.some(cmd =>
            msg.startsWith(cmd)
        )
    ) {
        score += 2
    }

    // 3. Flood detector
    const now = Date.now()

    if (!global.botTracker[sender]) {
        global.botTracker[sender] = []
    }

    global.botTracker[sender].push(now)

    global.botTracker[sender] =
        global.botTracker[sender].filter(
            t => now - t < 5000
        )

    if (
        global.botTracker[sender].length >= 8
    ) {
        score += 6
    }

    // 4. Mensajes vacíos sospechosos
    if (!m.message) {
        score += 4
    }

    // Umbral
    if (score < 8) return false

    try {
        const metadata =
            await sock.groupMetadata(from)

        const me =
            metadata.participants.find(
                p => p.id === sock.user.id
            )

        const botAdmin =
            me?.admin === 'admin' ||
            me?.admin === 'superadmin'

        await sock.sendMessage(from,{
            text:
`🤖 Bot sospechoso detectado

@${sender.split('@')[0]}`,
            mentions:[sender]
        })

        if (botAdmin) {
            await sock.groupParticipantsUpdate(
                from,
                [sender],
                'remove'
            )
        }

        return true

    } catch (e) {
        console.log(
            'ANTIBOT ERROR:',
            e
        )
        return false
    }
}