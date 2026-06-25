import fs from 'fs'

const antiBotPath = './data/antibot.json'

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

    let sender =
        m.key.participant ||
        m.key.remoteJid

    const msgId = m.key.id || ''

    console.log('MSG ID:', msgId)
    console.log('SENDER:', sender)

    let isBot = false

    // Detectar bots clásicos Baileys
    if (
        msgId.startsWith('3EB0') &&
        msgId.length === 22
    ) {
        isBot = true
    }

    if (!isBot) return false

    try {
        const metadata =
            await sock.groupMetadata(from)

        console.log(
            'BOT ID:',
            sock.user.id
        )

        console.log(
            'PARTICIPANTS:',
            metadata.participants.map(p => ({
                id: p.id,
                admin: p.admin
            }))
        )

        const me =
            metadata.participants.find(
                p =>
                    p.id === sock.user.id ||
                    p.id.split(':')[0] ===
                    sock.user.id.split(':')[0]
            )

        console.log('ME:', me)

        const botAdmin =
            me?.admin === 'admin' ||
            me?.admin === 'superadmin'

        await sock.sendMessage(from,{
            text:
`🤖 Bot detectado

@${sender.split('@')[0]} fue detectado como bot.`,
            mentions:[sender]
        })

        if (!botAdmin) {
            console.log(
                'ERROR: EL BOT NO ES ADMIN'
            )
            return true
        }

        // limpiar sender por si trae device ID
        if (sender.includes(':')) {
            sender =
                sender.split(':')[0] +
                '@s.whatsapp.net'
        }

        try {
            await sock.groupParticipantsUpdate(
                from,
                [sender],
                'remove'
            )

            console.log(
                'USUARIO EXPULSADO'
            )

        } catch (e) {
            console.log(
                'REMOVE ERROR:',
                e
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