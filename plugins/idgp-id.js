const handler = async ({
    sock,
    m,
    from
}) => {

    // 🚫 evitar mensajes del bot
    if (m.key.fromMe) return

    // ❌ solo grupos
    if (!from.endsWith('@g.us')) {

        return sock.sendMessage(from,{
            text:
'⚠️ Este comando solo funciona en grupos.'
        },{
            quoted:m
        })
    }

    // 📤 enviar ID
    await sock.sendMessage(from,{
        text:
`╭━━━〔 🆔 ID GRUPO 〕━━━⬣
┃
┃ 📌 ID del grupo:
┃
┃ ${from}
┃
╰━━━━━━━━━━━━━━━━⬣

> SPIDER BOT`
    },{
        quoted:m
    })
}

handler.command = ['idgp']
handler.tags = ['grupo']
handler.help = ['idgp']
handler.group = true
handler.menu = true

export default handler