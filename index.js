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

// 🔄 cargar plugins
async function loadPlugins() {
    plugins = []

    const files = fs.readdirSync(pluginsPath).filter(f => f.endsWith('.js'))

    for (const file of files) {
        try {
            const module = await import(`file://${path.join(pluginsPath, file)}?update=${Date.now()}`)
            const handler = module.default

            if (typeof handler === 'function') {
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
    if (file.endsWith('.js')) {
        console.log(chalk.yellow(`♻️ Recargando ${file}...`))
        await loadPlugins()
    }
})

// 🚀 iniciar bot
async function start() {

    const sock = await connect()

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

    const groupCache = new Map()

    // 🔥 MARCA DE INICIO (anti mensajes antiguos)
    const startTime = Date.now()

    // 📩 eventos
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return

        const m = messages[0]
        if (!m.message) return

        // 🔥 IGNORAR MENSAJES ANTIGUOS
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
                    ''

                if (!msg) return

                const prefix = config.prefix

                // 🔥 SOLO COMANDOS
                if (!msg.startsWith(prefix)) return

                const args = msg.slice(prefix.length).trim().split(/ +/)
                const command = args.shift().toLowerCase()

                let pushName = m.pushName || 'Usuario'
                let groupName = 'Privado'

                let groupMetadata = null
                let participants = []

                if (isGroup) {
                    if (!groupCache.has(from)) {
                        groupMetadata = await sock.groupMetadata(from)
                        groupCache.set(from, groupMetadata)
                    } else {
                        groupMetadata = groupCache.get(from)
                    }

                    groupName = groupMetadata.subject
                    participants = groupMetadata.participants
                }

                // 🖨️ LOG
                console.log(
                    chalk.cyan(`\n📌 Comando: ${command}`) +
                    chalk.yellow(`\n👤 Usuario: ${pushName}`) +
                    chalk.green(`\n📍 Lugar: ${groupName}\n`)
                )

                // ⚡ ejecutar handlers
                for (const handler of plugins) {

                    if (!handler.command) continue

                    const commands = Array.isArray(handler.command)
                        ? handler.command
                        : [handler.command]

                    if (!commands.includes(command)) continue

                    // 🚫 validaciones
                    if (handler.group && !isGroup) continue
                    if (handler.private && isGroup) continue

                    // 👑 admin
                    if (handler.admin) {
                        const isAdmin = participants.find(p => p.id === sender)?.admin
                        if (!isAdmin) continue
                    }

                    // 👑 owner
                    if (handler.owner) {
                        if (!config.owner.includes(sender)) continue
                    }

                    // 🚀 ejecutar
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

    // ♻️ reconexión total
    sock.ev.on('connection.update', ({ connection }) => {
        if (connection === 'close') {
            console.log(chalk.red('🔄 Reiniciando bot...'))
            start()
        }
    })
}

// 🚀 run
start()
