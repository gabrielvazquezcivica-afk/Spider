import fs from 'fs'

const dbPath = './data/4vs4.json'

function getDB() {
    try {
        if (!fs.existsSync(dbPath)) return {}
        return JSON.parse(fs.readFileSync(dbPath))
    } catch {
        return {}
    }
}

function saveDB(db) {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))
}

const handler = async ({ sock, m, from, sender, isGroup }) => {

    if (!isGroup) return

    let db = getDB()

    if (!db[from]) {
        return sock.sendMessage(from, {
            text: '❌ No hay ninguna sala activa.'
        }, { quoted: m })
    }

    let sala = db[from]

    // 🔴 COMANDO .quitar
    if (m.text === '.quitar') {

        const estabaEnTitulares = sala.titulares.includes(sender)
        const estabaEnSuplentes = sala.suplentes.includes(sender)

        if (!estabaEnTitulares && !estabaEnSuplentes) {
            return sock.sendMessage(from, {
                text: '⚠️ No estás en la lista.'
            }, { quoted: m })
        }

        sala.titulares = sala.titulares.filter(u => u !== sender)
        sala.suplentes = sala.suplentes.filter(u => u !== sender)

        saveDB(db)

        return sock.sendMessage(from, {
            text: '🗑️ Te eliminaste de la lista correctamente.'
        }, { quoted: m })
    }

    // 🔴 SI YA ESTÁ EN LISTA
    if (
        sala.titulares.includes(sender) ||
        sala.suplentes.includes(sender)
    ) {
        return sock.sendMessage(from, {
            text: '⚠️ Ya estás anotado.'
        }, { quoted: m })
    }

    await sock.sendMessage(from, {
        react: {
            text: '⚔️',
            key: m.key
        }
    })

    let mensaje = ''

    if (sala.titulares.length < 4) {

        sala.titulares.push(sender)
        mensaje = '✅ Entraste como TITULAR.'

    } else if (sala.suplentes.length < 4) {

        sala.suplentes.push(sender)
        mensaje = '🪑 La lista principal está llena.\nHas entrado como SUPLENTE.'

    } else {

        return sock.sendMessage(from, {
            text: '🚫 La sala ya está llena.'
        }, { quoted: m })
    }

    saveDB(db)

    const titulares = Array.from({ length: 4 }, (_, i) =>
        sala.titulares[i]
            ? `${i + 1}. @${sala.titulares[i].split('@')[0]}`
            : `${i + 1}.`
    ).join('\n')

    const suplentes = Array.from({ length: 4 }, (_, i) =>
        sala.suplentes[i]
            ? `🧧 @${sala.suplentes[i].split('@')[0]}`
            : `🧧.`
    ).join('\n')

    const mentions = [...sala.titulares, ...sala.suplentes]

    await sock.sendMessage(from, {
        text:
`⚔️ 4 VS 4

🕒 MX: ${sala.mx}
🇨🇴 COL: ${sala.col}
🇦🇷 ARG: ${sala.arg}

👥 TITULARES:
${titulares}

🪑 SUPLENTES:
${suplentes}

${mensaje}`,
        mentions
    }, { quoted: m })
}

handler.command = ['part', 'quitar']
handler.tags = ['ff']
handler.group = true
handler.menu = false

export default handler