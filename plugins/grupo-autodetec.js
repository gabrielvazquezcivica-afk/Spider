import fs from 'fs'

const path = './data/autodetect.json'

// 📥 DB
function getDB() {
    try {
        if (!fs.existsSync(path)) return {}
        return JSON.parse(fs.readFileSync(path, 'utf-8'))
    } catch {
        return {}
    }
}

// 💾 guardar
function saveDB(data) {
    fs.writeFileSync(path, JSON.stringify(data, null, 2))
}

const handler = async ({
    sock,
    m,
    from,
    args,
    participants,
    sender,
    isGroup
}) => {

    if (!isGroup) return

    // 🔐 solo admins
    const user = participants.find(p => p.id === sender)
    const isAdmin = user?.admin === 'admin' || user?.admin === 'superadmin'

    if (!isAdmin) {
        return sock.sendMessage(from, {
            text: '⚠️ Solo administradores pueden usar este comando'
        }, { quoted: m })
    }

    const db = getDB()
    if (!db[from]) db[from] = { enabled: false }

    const option = args[0]?.toLowerCase()

    // ❓ ayuda
    if (!option) {
        return sock.sendMessage(from, {
            text:
`🕷️ Uso correcto:

.autodetect on
.autodetect off`
        }, { quoted: m })
    }

    // 🟢 ON
    if (option === 'on') {
        if (db[from].enabled) {
            return sock.sendMessage(from, { text: '⚠️ El AutoDetect ya estaba activado' }, { quoted: m })
        }
        db[from].enabled = true
        saveDB(db)
        return sock.sendMessage(from, { text: '🕸️ AutoDetect activado\n🔎 Se notificarán todos los cambios del grupo' }, { quoted: m })
    }

    // 🔴 OFF
    if (option === 'off') {
        if (!db[from].enabled) {
            return sock.sendMessage(from, { text: '⚠️ El AutoDetect ya estaba desactivado' }, { quoted: m })
        }
        db[from].enabled = false
        saveDB(db)
        return sock.sendMessage(from, { text: '🕷️ AutoDetect desactivado' }, { quoted: m })
    }

    return sock.sendMessage(from, { text: '⚠️ Usa solamente on/off' }, { quoted: m })
}

handler.command = ['autodetect']
handler.tags = ['on-off']
handler.group = true
handler.menu = true

export default handler

// 🕸️ DETECTOR DIRECTO - NO DEPENDE DE TU INDEX
export async function before({ sock }) {
    // ⚡ CONECTAMOS DIRECTO AL EVENTO (ESTO ES LO QUE FALTABA)
    sock.ev.on('groups.update', async (actualizaciones) => {

        if (!actualizaciones || actualizaciones.length === 0) return

        const db = getDB()
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net'

        for (const update of actualizaciones) {
            const groupId = update.id + '@g.us'

            // ❌ SI ESTÁ DESACTIVADO EN ESTE GRUPO -> SALIR
            if (!db[groupId]?.enabled) continue

            // ❌ IGNORAR CAMBIOS HECHOS POR EL BOT
            if (update.author === botId || update.author === sock.user.id) continue

            let mensaje = ''
            const autor = update.author ? update.author.split('@')[0] : 'Desconocido'

            try {

                // ─── DETECTAR TODOS LOS CAMBIOS ───

                // 📛 CAMBIO DE NOMBRE
                if (update.subject) {
                    mensaje = `╭━━━〔 🔔 CAMBIO DETECTADO 〕━━━⬣
┃
┃ 📛 NOMBRE DEL GRUPO ACTUALIZADO
┃ 👤 Modificado por: @${autor}
┃ ✏️ Nuevo: ${update.subject}
┃
╰━━━━━━━━━━━━━━━━━━━━⬣`
                }

                // 📝 CAMBIO DE DESCRIPCIÓN
                else if (update.desc !== undefined) {
                    mensaje = `╭━━━〔 🔔 CAMBIO DETECTADO 〕━━━⬣
┃
┃ 📝 DESCRIPCIÓN MODIFICADA
┃ 👤 Hecho por: @${autor}
┃
╰━━━━━━━━━━━━━━━━━━━━⬣`
                }

                // 🖼️ CAMBIO DE FOTO
                else if (update.imgUrl !== undefined) {
                    mensaje = `╭━━━〔 🔔 CAMBIO DETECTADO 〕━━━⬣
┃
┃ 🖼️ FOTO DEL GRUPO CAMBIADA
┃ 👤 Modificada por: @${autor}
┃
╰━━━━━━━━━━━━━━━━━━━━⬣`
                }

                // 🔒 SOLO ADMINS PUEDEN ESCRIBIR
                else if (update.announce === true) {
                    mensaje = `╭━━━〔 🔔 CAMBIO DETECTADO 〕━━━⬣
┃
┃ 🔒 MODO RESTRINGIDO ACTIVADO
┃ 🛡️ Solo administradores pueden escribir
┃ 👤 Hecho por: @${autor}
┃
╰━━━━━━━━━━━━━━━━━━━━⬣`
                }

                // 🔓 TODOS PUEDEN ESCRIBIR
                else if (update.announce === false) {
                    mensaje = `╭━━━〔 🔔 CAMBIO DETECTADO 〕━━━⬣
┃
┃ 🔓 GRUPO ABIERTO
┃ ✍️ Todos los participantes pueden escribir
┃ 👤 Hecho por: @${autor}
┃
╰━━━━━━━━━━━━━━━━━━━━⬣`
                }

                // 🛡️ SOLO ADMINS EDITAN DATOS
                else if (update.restrict === true) {
                    mensaje = `╭━━━〔 🔔 CAMBIO DETECTADO 〕━━━⬣
┃
┃ 🛡️ RESTRICCIÓN ACTIVADA
┃ ✏️ Solo admins pueden editar datos
┃ 👤 Hecho por: @${autor}
┃
╰━━━━━━━━━━━━━━━━━━━━⬣`
                }
                else if (update.restrict === false) {
                    mensaje = `╭━━━〔 🔔 CAMBIO DETECTADO 〕━━━⬣
┃
┃ ♻️ RESTRICCIÓN DESACTIVADA
┃ ✏️ Todos pueden editar datos
┃ 👤 Hecho por: @${autor}
┃
╰━━━━━━━━━━━━━━━━━━━━⬣`
                }

                // ⏳ MENSAJES TEMPORALES
                else if (update.duration !== undefined) {
                    const tiempo = update.duration === 86400 ? '24 Horas' :
                                   update.duration === 604800 ? '7 Días' :
                                   update.duration === 7776000 ? '90 Días' : 'Desactivados'

                    mensaje = `╭━━━〔 🔔 CAMBIO DETECTADO 〕━━━⬣
┃
┃ ⏳ MENSAJES TEMPORALES
┃ ⏱️ Duración: ${tiempo}
┃ 👤 Hecho por: @${autor}
┃
╰━━━━━━━━━━━━━━━━━━━━⬣`
                }

                // 👑 PROMOCIÓN A ADMIN
                else if (update.promote && update.promote.length > 0) {
                    const usuario = update.promote[0].split('@')[0]
                    mensaje = `╭━━━〔 🔔 CAMBIO DETECTADO 〕━━━⬣
┃
┃ 👑 USUARIO PROMOVIDO A ADMIN
┃ 👤 Nuevo admin: @${usuario}
┃ 🛡️ Hecho por: @${autor}
┃
╰━━━━━━━━━━━━━━━━━━━━⬣`
                }

                // 📉 DEGRADACIÓN DE ADMIN
                else if (update.demote && update.demote.length > 0) {
                    const usuario = update.demote[0].split('@')[0]
                    mensaje = `╭━━━〔 🔔 CAMBIO DETECTADO 〕━━━⬣
┃
┃ 📉 USUARIO DEGRADADO DE ADMIN
┃ 👤 Usuario: @${usuario}
┃ 🛡️ Hecho por: @${autor}
┃
╰━━━━━━━━━━━━━━━━━━━━⬣`
                }

                // 📩 ENVIAR AVISO SI HAY CAMBIO
                if (mensaje) {
                    await sock.sendMessage(groupId, {
                        text: mensaje,
                        mentions: [update.author, ...(update.promote || []), ...(update.demote || [])]
                    })
                }

            } catch (err) {
                console.log('❌ ERROR AUTODETECT:', err)
            }
        }
    })
    }
                            
