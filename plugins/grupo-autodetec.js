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

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    if (!isAdmin) {
        return sock.sendMessage(from, {
            text: '⚠️ Solo administradores pueden usar este comando'
        }, { quoted: m })
    }

    const db = getDB()

    if (!db[from]) {
        db[from] = {
            enabled: false
        }
    }

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
            return sock.sendMessage(from, {
                text: '⚠️ El AutoDetect ya estaba activado'
            }, { quoted: m })
        }

        db[from].enabled = true
        saveDB(db)

        return sock.sendMessage(from, {
            text: '🕸️ AutoDetect activado\n🔎 Se notificarán todos los cambios del grupo'
        }, { quoted: m })
    }

    // 🔴 OFF
    if (option === 'off') {

        if (!db[from].enabled) {
            return sock.sendMessage(from, {
                text: '⚠️ El AutoDetect ya estaba desactivado'
            }, { quoted: m })
        }

        db[from].enabled = false
        saveDB(db)

        return sock.sendMessage(from, {
            text: '🕷️ AutoDetect desactivado'
        }, { quoted: m })
    }

    return sock.sendMessage(from, {
        text: '⚠️ Usa solamente on/off'
    }, { quoted: m })
}

handler.command = ['autodetect']
handler.tags = ['on-off']
handler.group = true
handler.menu = true

export default handler

// 🕸️ DETECTOR DE CAMBIOS DEL GRUPO
export async function before({
    sock,
    groupsUpdate
}) {

    // Si no hay actualización, salimos
    if (!groupsUpdate) return

    const update = groupsUpdate[0]
    const from = update.id + '@g.us'

    const db = getDB()
    if (!db[from]?.enabled) return

    // ❌ Ignorar si es acción del propio bot
    if (update.author === sock.user.id) return

    let mensaje = ''
    let autor = update.author?.split('@')[0] || 'Desconocido'

    // 📌 DETECTAR CADA TIPO DE CAMBIO

    // Cambio de nombre del grupo
    if (update.subject) {
        mensaje = `╭━━━〔 🔔 CAMBIO DETECTADO 〕━━━⬣
┃
┃ 📛 Nombre del grupo actualizado
┃ 👤 Modificado por: @${autor}
┃ ✏️ Nuevo nombre: ${update.subject}
┃
╰━━━━━━━━━━━━━━━━━━━━⬣`
    }

    // Cambio de descripción
    else if (update.desc) {
        mensaje = `╭━━━〔 🔔 CAMBIO DETECTADO 〕━━━⬣
┃
┃ 📝 Descripción del grupo actualizada
┃ 👤 Modificado por: @${autor}
┃
╰━━━━━━━━━━━━━━━━━━⬣`
    }

    // Cambio de foto del grupo
    else if (update.imgUrl) {
        mensaje = `╭━━━〔 🔔 CAMBIO DETECTADO 〕━━━⬣
┃
┃ 🖼️ Foto del grupo actualizada
┃ 👤 Modificado por: @${autor}
┃
╰━━━━━━━━━━━━━━━━━━⬣`
    }

    // Grupo configurado para solo admins enviar mensajes
    else if (update.announce === true) {
        mensaje = `╭━━━〔 🔔 CAMBIO DETECTADO 〕━━━⬣
┃
┃ 🔒 Modo restringido activado
┃ 🛡️ Solo administradores pueden escribir
┃ 👤 Hecho por: @${autor}
┃
╰━━━━━━━━━━━━━━━━━━━━⬣`
    }

    // Grupo abierto para todos escribir
    else if (update.announce === false) {
        mensaje = `╭━━━〔 🔔 CAMBIO DETECTADO 〕━━━⬣
┃
┃ 🔓 Grupo abierto
┃ ✍️ Todos los participantes pueden escribir
┃ 👤 Hecho por: @${autor}
┃
╰━━━━━━━━━━━━━━━━━━━━⬣`
    }

    // Cambio de configuración de edición de info
    else if (update.restrict === true) {
        mensaje = `╭━━━〔 🔔 CAMBIO DETECTADO 〕━━━⬣
┃
┃ 🛡️ Restricción activada
┃ ✏️ Solo admins pueden editar datos del grupo
┃ 👤 Hecho por: @${autor}
┃
╰━━━━━━━━━━━━━━━━━━━━⬣`
    }
    else if (update.restrict === false) {
        mensaje = `╭━━━〔 🔔 CAMBIO DETECTADO 〕━━━⬣
┃
┃ ♻️ Restricción desactivada
┃ ✏️ Todos pueden editar datos del grupo
┃ 👤 Hecho por: @${autor}
┃
╰━━━━━━━━━━━━━━━━━━━━⬣`
    }

    // Cambio de configuración de mensajes temporales
    else if (update.duration) {
        const tiempo = update.duration === 86400 ? '24 Horas' :
                       update.duration === 604800 ? '7 Días' :
                       update.duration === 7776000 ? '90 Días' : 'Desactivado'

        mensaje = `╭━━━〔 🔔 CAMBIO DETECTADO 〕━━━⬣
┃
┃ ⏳ Mensajes temporales actualizados
┃ ⏱️ Tiempo: ${tiempo}
┃ 👤 Hecho por: @${autor}
┃
╰━━━━━━━━━━━━━━━━━━━━⬣`
    }

    // 📩 Enviar aviso si hubo cambio detectado
    if (mensaje) {
        try {
            await sock.sendMessage(from, {
                text: mensaje,
                mentions: [update.author]
            })
        } catch (e) {
            console.log('❌ Error AutoDetect:', e)
        }
    }
          }
          
