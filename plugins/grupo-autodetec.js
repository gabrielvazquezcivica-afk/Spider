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

// 🕸️ DETECTOR DE CAMBIOS (VERSIÓN CORREGIDA)
export async function before({
    sock,
    groupsUpdate
}) {

    // ❌ Si no hay datos, salimos
    if (!groupsUpdate || groupsUpdate.length === 0) return

    // 📌 Extraemos los datos correctamente
    const update = groupsUpdate[0]
    const groupId = update.id + '@g.us'

    const db = getDB()
    if (!db[groupId]?.enabled) return

    // ❌ Ignorar cambios hechos por el propio bot
    const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net'
    if (update.author === botNumber || update.author === sock.user.id) return

    let mensaje = ''
    const autor = update.author ? update.author.split('@')[0] : 'Desconocido'

    try {

        // ─── DETECTAR TODOS LOS CAMBIOS ───

        // 📛 Cambio de NOMBRE
        if (update.subject) {
            mensaje = `╭━━━〔 🔔 CAMBIO DETECTADO 〕━━━⬣
┃
┃ 📛 NOMBRE DEL GRUPO ACTUALIZADO
┃ 👤 Modificado por: @${autor}
┃ ✏️ Nuevo: ${update.subject}
┃
╰━━━━━━━━━━━━━━━━━━━━⬣`
        }

        // 📝 Cambio de DESCRIPCIÓN
        else if (update.desc) {
            mensaje = `╭━━━〔 🔔 CAMBIO DETECTADO 〕━━━⬣
┃
┃ 📝 DESCRIPCIÓN MODIFICADA
┃ 👤 Hecho por: @${autor}
┃
╰━━━━━━━━━━━━━━━━━━━━⬣`
        }

        // 🖼️ Cambio de FOTO
        else if (update.imgUrl !== undefined) {
            mensaje = `╭━━━〔 🔔 CAMBIO DETECTADO 〕━━━⬣
┃
┃ 🖼️ FOTO DEL GRUPO CAMBIADA
┃ 👤 Modificada por: @${autor}
┃
╰━━━━━━━━━━━━━━━━━━━━⬣`
        }

        // 🔒 Cambio a SOLO ADMINS PUEDEN ESCRIBIR
        else if (update.announce === true) {
            mensaje = `╭━━━〔 🔔 CAMBIO DETECTADO 〕━━━⬣
┃
┃ 🔒 MODO RESTRINGIDO ACTIVADO
┃ 🛡️ Solo administradores pueden escribir
┃ 👤 Hecho por: @${autor}
┃
╰━━━━━━━━━━━━━━━━━━━━⬣`
        }

        // 🔓 Cambio a TODOS PUEDEN ESCRIBIR
        else if (update.announce === false) {
            mensaje = `╭━━━〔 🔔 CAMBIO DETECTADO 〕━━━⬣
┃
┃ 🔓 GRUPO ABIERTO
┃ ✍️ Todos los participantes pueden escribir
┃ 👤 Hecho por: @${autor}
┃
╰━━━━━━━━━━━━━━━━━━━━⬣`
        }

        // 🛡️ Cambio RESTRICCIÓN DE EDICIÓN
        else if (update.restrict === true) {
            mensaje = `╭━━━〔 🔔 CAMBIO DETECTADO 〕━━━⬣
┃
┃ 🛡️ RESTRICCIÓN ACTIVADA
┃ ✏️ Solo admins pueden editar datos del grupo
┃ 👤 Hecho por: @${autor}
┃
╰━━━━━━━━━━━━━━━━━━━━⬣`
        }
        else if (update.restrict === false) {
            mensaje = `╭━━━〔 🔔 CAMBIO DETECTADO 〕━━━⬣
┃
┃ ♻️ RESTRICCIÓN DESACTIVADA
┃ ✏️ Todos pueden editar datos del grupo
┃ 👤 Hecho por: @${autor}
┃
╰━━━━━━━━━━━━━━━━━━━━⬣`
        }

        // ⏳ Cambio MENSAJES TEMPORALES
        else if (update.duration !== undefined) {
            let tiempo = 'Desactivados'
            if (update.duration === 86400) tiempo = '24 Horas'
            if (update.duration === 604800) tiempo = '7 Días'
            if (update.duration === 7776000) tiempo = '90 Días'

            mensaje = `╭━━━〔 🔔 CAMBIO DETECTADO 〕━━━⬣
┃
┃ ⏳ MENSAJES TEMPORALES
┃ ⏱️ Tiempo: ${tiempo}
┃ 👤 Hecho por: @${autor}
┃
╰━━━━━━━━━━━━━━━━━━━━⬣`
        }

        // 👑 PROMOCIÓN / DEGRADACIÓN DE ADMINS
        else if (update.promote || update.demote) {
            const accion = update.promote ? 'PROMOVIDO A ADMIN' : 'DEGRADADO DE ADMIN'
            const usuario = update.promote ? update.promote[0] : update.demote[0]
            const numUser = usuario.split('@')[0]

            mensaje = `╭━━━〔 🔔 CAMBIO DETECTADO 〕━━━⬣
┃
┃ 👑 USUARIO ${accion}
┃ 👤 Modificado: @${numUser}
┃ 🛡️ Hecho por: @${autor}
┃
╰━━━━━━━━━━━━━━━━━━━━⬣`
        }

        // 📩 Si hay mensaje, lo enviamos
        if (mensaje) {
            await sock.sendMessage(groupId, {
                text: mensaje,
                mentions: update.author ? [update.author, ...(update.promote || update.demote || [])] : []
            })
        }

    } catch (e) {
        console.log('❌ Error AutoDetect:', e)
    }
        }
