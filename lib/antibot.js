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

    const sender =
        m.key.participant ||
        m.key.remoteJid

    const msgId = m.key.id || ''

    let isBot = false

    // Baileys viejo
    if (msgId.startsWith('3EB0'))
        isBot = true

    // Baileys moderno
    if (msgId.startsWith('BAE5'))
        isBot = true

    // IDs raros
    if (msgId.length > 30)
        isBot = true

    if (!isBot) return false

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
`🤖 Bot detectado

@${sender.split('@')[0]} fue detectado como bot.`,
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