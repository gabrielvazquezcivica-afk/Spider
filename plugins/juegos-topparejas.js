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

// 🎯 Obtener elementos aleatorios sin repetir
function getRandom(arr, cantidad) {
    let mezclado = [...arr].sort(() => Math.random() - 0.5)
    return mezclado.slice(0, cantidad)
}

// 💬 Frases aleatorias para las parejas
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

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    // 🔒 MODODADMIN: solo admins pueden usar comandos normales
    if (isBlockedGroup && !isAdmin) return

    // 📌 Filtramos solo usuarios normales (sin bots)
    const miembros = participants
        .filter(u => !u.id.includes('@g.us') && u.id !== sock.user.id)
        .map(u => u.id)

    // 🚫 Si hay menos de 2 personas, no se puede
    if (miembros.length < 2) {
        return sock.sendMessage(from, {
            text: '⚠️ Se necesitan al menos 2 personas en el grupo para generar parejas'
        }, { quoted: m })
    }

    // ⚡ Reacción
    await sock.sendMessage(from, {
        react: { text: '💞', key: m.key }
    })

    let texto = `💘 *TOP 5 PAREJAS DEL GRUPO* 💘\n\n`
    let menciones = []
    let parejasUsadas = new Set() // Evitar parejas repetidas

    // 🔄 Generar 5 parejas únicas
    for (let i = 1; i <= 5; i++) {
        let u1, u2, parejaValida

        // Buscar pareja que no se haya usado ni sea la misma persona
        do {
            [u1, u2] = getRandom(miembros, 2)
            parejaValida = u1 !== u2 && !parejasUsadas.has(`${u1}-${u2}`) && !parejasUsadas.has(`${u2}-${u1}`)
        } while (!parejaValida)

        parejasUsadas.add(`${u1}-${u2}`)
        menciones.push(u1, u2)

        texto += `#${i} 👤 @${u1.split('@')[0]} + @${u2.split('@')[0]}\n`
        texto += `   ${frasesAleatorias()}\n\n`
    }

    texto += `> SPIDER BOT 🕷️`

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
      
