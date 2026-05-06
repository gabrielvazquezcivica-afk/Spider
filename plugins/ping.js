const handler = async ({ sock, m, from }) => {
    const start = Date.now()

    // ⚡ reacción instantánea (latencia real)
    await sock.sendMessage(from, {
        react: { text: '🏓', key: m.key }
    })

    const speed = Date.now() - start

    // 🚀 respuesta final
    await sock.sendMessage(from, {
        text: `🏓 *Pong*

⚡ Velocidad: ${speed} ms
🚀 Estado: ${speed < 200 ? 'Rápido' : speed < 500 ? 'Normal' : 'Lento'}

> SPIDER BOT`
    }, { quoted: m })
}

// ⚙️ configuración del comando
handler.command = ['p']
handler.help = ['p']
handler.tags = ['informacion']
handler.menu = true

export default handler
