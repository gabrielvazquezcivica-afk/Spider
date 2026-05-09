import fs from 'fs'

const path = './data/modoadmin.json'

// 📥 DB modoadmin
function getDB() {
    try {
        if (!fs.existsSync(path)) return {}
        return JSON.parse(fs.readFileSync(path, 'utf-8'))
    } catch {
        return {}
    }
}

// 🎯 Obtener aleatorios sin repetir
function getRandom(arr, cantidad) {
    let mezclado = [...arr].sort(() => Math.random() - 0.5)
    return mezclado.slice(0, cantidad)
}

// 💬 Frases aleatorias
function frasesAleatorias() {
    const frases = [
        '💘 ¡Destinados a estar juntos!',
        '💖 Tienen mucha química',
        '💞 Se complementan muy bien',
        '❤️ Amor verdadero',
        '💕 La pareja ideal',
        '💓 Conexión especial',
        '💗 Hechos el uno para el otro',
        '💝 ¡Qué bonita combinación!',
        '💟 Nacieron para encontrarse',
        '♥️ Compatibilidad al 100%'
    ]
    return frases[Math.floor(Math.random() * frases.length)]
}

const handler = async ({ sock, m, from, isGroup, participants, sender }) => {

    if (!isGroup) return

    const db = getDB()
    const isBlockedGroup = db[from]

    const user = participants.find(p => p.id === sender)
    const isAdmin = user?.admin === 'admin' || user?.admin === 'superadmin'

    // 🔒 MODODADMIN
    if (isBlockedGroup && !isAdmin) return

    // ✅ SOLUCIÓN DEFINITIVA: Tomamos participantes IGUAL que en tu comando SHIP
    const miembros = participants
        .filter(p => p.id.includes('@s.whatsapp.net') && p.id !== sock.user.id)
        .map(p => p.id)

    // 🚫 Mensaje solo si hay MENOS de 2
    if (miembros.length < 2) {
        return sock.sendMessage(from, {
            text: '⚠️ Se necesitan al menos 2 personas en el grupo'
        }, { quoted: m })
    }

    // ⚡ Reacción
    await sock.sendMessage(from, { react: { text: '💞', key: m.key } })

    let texto = `💘 *TOP 5 PAREJAS DEL GRUPO* 💘\n\n`
    let menciones = []
    let usados = new Set()

    // 🔄 Generar 5 parejas
    for (let i = 1; i <= 5; i++) {
        let u1, u2, valido
        do {
            [u1, u2] = getRandom(miembros, 2)
            valido = u1 !== u2 && !usados.has(`${u1}-${u2}`) && !usados.has(`${u2}-${u1}`)
        } while (!valido)

        usados.add(`${u1}-${u2}`)
        menciones.push(u1, u2)

        texto += `#${i} 👤 @${u1.split('@')[0]} + @${u2.split('@')[0]}\n`
        texto += `   ${frasesAleatorias()}\n\n`
    }

    texto += `> SPIDER BOT 🕷️`

    // 📩 ENVÍO OBLIGATORIO
    return sock.sendMessage(from, {
        text: texto,
        mentions: menciones
    }, { quoted: m })
}

handler.command = ['topparejas']
handler.tags = ['juegos']
handler.group = true
handler.menu = true

export default handler
    
