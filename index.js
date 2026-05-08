import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { connect } from './lib/connection.js'
import config from './config.js'

// 📁 rutas
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const pluginsPath = path.join(__dirname, 'plugins')

// 📦 plugins
let plugins = []
let sockGlobal

// 🔒 MODODADMIN FILE
const modoadminPath = './data/modoadmin.json'

function getModoadmin() {
    try {
        if (!fs.existsSync(modoadminPath)) return {}
        return JSON.parse(fs.readFileSync(modoadminPath, 'utf-8'))
    } catch {
        return {}
    }
}

// 🔄 cargar plugins
async function loadPlugins() {
    plugins = []

    const files = fs.readdirSync(pluginsPath).filter(f => f.endsWith('.js'))

    for (const file of files) {
        try {
            const module = await import(`file://${path.join(pluginsPath, file)}?update=${Date.now()}`)
            const handler = module.default

            // ✅ AGARRAR before()
            if (typeof handler === 'function') {

                if (module.before) {
                    handler.before = module.before
                }

                plugins.push(handler)
            }

        } catch (err) {
            console.log(chalk.red(`Error en plugin ${file}:`), err)
        }
    }

    global.plugins = plugins
    console.log(chalk.green(`✅ Plugins cargados: ${plugins.length}`))
}

// 👀 recarga automática
fs.watch(pluginsPath, async (_, file) => {
    if (file?.endsWith('.js')) {
        console.log(chalk.yellow(`♻️ Recargando ${file}...`))
        await loadPlugins()
    }
})

// 🚀 iniciar bot
async function start() {

    if (sockGlobal?.ev) {
        try {
            sockGlobal.ev.removeAllListeners()
        } catch {}
    }

    const sock = await connect()
    sockGlobal = sock

    console.clear()

    console.log(
        chalk.redBright.bold(`
███████╗██████╗ ██╗██████╗ ███████╗██████╗ 
██╔════╝██╔══██╗██║██╔══██╗██╔════╝██╔══██╗
███████╗██████╔╝██║██║  ██║█████╗  ██████╔╝
╚════██║██╔═══╝ ██║██║  ██║██╔══╝  ██╔══██╗
███████║██║     ██║██████╔╝███████╗██║  ██║
╚══════╝╚═╝     ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝
        `)
    )

    console.log(chalk.greenBright('\n⚡ SPIDER BOT ACTIVO\n'))

    await loadPlugins()

    const startTime = Date.now()

    // 🕷️ WELCOME/BYE + AUTODETECT
    sock.ev.on('group-participants.update', async (update) => {

        try {

            for (const plugin of plugins) {

                if (typeof plugin.before === 'function') {

                    await plugin.before({
                        sock,
                        update
                    })
                }
            }

        } catch (err) {

            console.log(
                chalk.red('Error welcome/bye:'),
                err
            )
        }
    })

    // 🕷️ DETECTAR CAMBIOS DEL GRUPO
    sock.ev.on('groups.update', async (update) => {

        try {

            for (const plugin of plugins) {

                if (typeof plugin.before === 'function') {

                    await plugin.before({
                        sock,
                        groupsUpdate: update
                    })
                }
            }

        } catch (err) {

            console.log(
                chalk.red('Error autodetect:'),
                err
            )
        }
    })

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return

        const m = messages[0]
        if (!m.message) return

        const msgTime = (m.messageTimestamp || 0) * 1000
        if (msgTime < startTime) return

        setImmediate(async () => {
            try {

                const from = m.key.remoteJid
                const isGroup = from.endsWith('@g.us')
                const sender = m.key.participant || from

                const msg =
                    m.message.conversation ||
                    m.message.extendedTextMessage?.text ||
                    m.message.imageMessage?.caption ||
                    m.message.videoMessage?.caption ||
                    ''

                let pushName = m.pushName || 'Usuario'
                let groupName = 'Privado'
                let groupMetadata = null
                let participants = []

                // 🔥 SIN CACHE
                if (isGroup) {
                    try {
                        groupMetadata = await sock.groupMetadata(from)
                        participants = groupMetadata.participants
                        groupName = groupMetadata.subject
                    } catch {
                        participants = []
                    }
                }

                // 🔥 BEFORE GLOBAL
                for (const plugin of plugins) {

                    if (
    typeof plugin.before === 'function' &&
    !plugin.before.toString().includes('group.participants')
) {

    await plugin.before({
        sock,
        m,
        from,
        isGroup,
        sender,
        participants,
        groupMetadata
    })
                    }
                }

                if (!msg) return
                if (!msg.startsWith(config.prefix)) return

                const args = msg.slice(config.prefix.length).trim().split(/ +/)
                const command = args.shift().toLowerCase()

                // 🔒 MODODADMIN
                const modoadmin = getModoadmin()
                const isBlockedGroup = isGroup && modoadmin[from]

                console.log(
                    chalk.cyan(`\n📌 Comando: ${command}`) +
                    chalk.yellow(`\n👤 Usuario: ${pushName}`) +
                    chalk.green(`\n📍 Lugar: ${groupName}\n`)
                )

                for (const handler of plugins) {

                    if (!handler.command) continue

                    const commands = Array.isArray(handler.command)
                        ? handler.command
                        : [handler.command]

                    if (!commands.includes(command)) continue

                    if (handler.group && !isGroup) continue
                    if (handler.private && isGroup) continue

                    // 🔥 BLOQUEO MODODADMIN
                    const isGroupCommand = handler.group === true

                    if (isBlockedGroup && !isGroupCommand) {

                        const user = participants.find(p => p.id === sender)

                        const isAdmin =
                            user?.admin === 'admin' ||
                            user?.admin === 'superadmin'

                        if (!isAdmin) return
                    }

                    if (handler.admin) {

                        const user = participants.find(p => p.id === sender)

                        const isAdmin =
                            user?.admin === 'admin' ||
                            user?.admin === 'superadmin'

                        if (!isAdmin) continue
                    }

                    if (handler.owner) {
                        if (!config.owner.includes(sender)) continue
                    }

                    await handler({
                        sock,
                        m,
                        args,
                        command,
                        from,
                        isGroup,
                        sender,
                        pushName,
                        participants,
                        groupMetadata
                    })
                }

            } catch (err) {
                console.log(chalk.red('Error:'), err)
            }
        })
    })

    sock.ev.on('connection.update', ({ connection }) => {
        if (connection === 'close') {
            console.log(chalk.red('🔄 Reiniciando bot...'))
            setTimeout(start, 2000)
        }
    })
}

start()
