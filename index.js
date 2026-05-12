import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { connect } from './lib/connection.js'
import config from './config.js'
import { verificarMuteados } from './lib/muteWatcher.js'
import { verificarAntilink } from './lib/antilink.js'

// 📁 rutas
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const pluginsPath = path.join(__dirname, 'plugins')

// 📦 plugins
let plugins = []
let sockGlobal

// ⚡ cache plugins/comandos
const commandMap = new Map()

// ⚡ cache metadata grupos
const groupCache = new Map()

// 🔒 MODODADMIN
const modoadminPath = './data/modoadmin.json'

function getModoadmin() {

    try {

        if (!fs.existsSync(modoadminPath))
            return {}

        return JSON.parse(
            fs.readFileSync(
                modoadminPath,
                'utf-8'
            )
        )

    } catch {

        return {}
    }
}

// ⚡ metadata cache
async function getGroupMetadata(sock, jid) {

    const cache = groupCache.get(jid)

    // ⚡ 15 segundos cache
    if (
        cache &&
        Date.now() - cache.time < 15000
    ) {
        return cache.data
    }

    const metadata =
        await sock.groupMetadata(jid)

    groupCache.set(jid, {
        data: metadata,
        time: Date.now()
    })

    return metadata
}

// 🔄 cargar plugins
async function loadPlugins() {

    plugins = []
    commandMap.clear()

    const files = fs.readdirSync(pluginsPath)
        .filter(f => f.endsWith('.js'))

    for (const file of files) {

        try {

            const module = await import(
                `file://${path.join(
                    pluginsPath,
                    file
                )}?update=${Date.now()}`
            )

            const handler = module.default

            if (typeof handler === 'function') {

                if (module.before) {
                    handler.before = module.before
                }

                plugins.push(handler)

                // ⚡ guardar comandos en cache
                if (handler.command) {

                    const commands =
                        Array.isArray(
                            handler.command
                        )
                            ? handler.command
                            : [handler.command]

                    for (const cmd of commands) {
                        commandMap.set(
                            cmd,
                            handler
                        )
                    }
                }
            }

        } catch (err) {

            console.log(
                chalk.red(
                    `Error en plugin ${file}:`
                ),
                err
            )
        }
    }

    global.plugins = plugins

    console.log(
        chalk.green(
            `✅ Plugins cargados: ${plugins.length}`
        )
    )
}

// 👀 autoreload
fs.watch(pluginsPath, async (_, file) => {

    if (!file?.endsWith('.js'))
        return

    console.log(
        chalk.yellow(
            `♻️ Recargando ${file}...`
        )
    )

    await loadPlugins()
})

// 🚀 iniciar
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

    console.log(
        chalk.greenBright(
            '\n⚡ SPIDER BOT ACTIVO\n'
        )
    )

    await loadPlugins()

    const startTime = Date.now()

    // 🕷️ welcome/bye
    sock.ev.on(
        'group-participants.update',
        async (update) => {

            try {

                for (const plugin of plugins) {

                    if (
                        typeof plugin.before === 'function'
                    ) {

                        plugin.before({
                            sock,
                            update
                        }).catch(() => {})
                    }
                }

            } catch (err) {

                console.log(
                    chalk.red(
                        'Error welcome/bye:'
                    ),
                    err
                )
            }
        }
    )

    // 🕷️ cambios grupo
    sock.ev.on(
        'groups.update',
        async (update) => {

            try {

                for (const plugin of plugins) {

                    if (
                        typeof plugin.before === 'function'
                    ) {

                        plugin.before({
                            sock,
                            groupsUpdate: update
                        }).catch(() => {})
                    }
                }

            } catch (err) {

                console.log(
                    chalk.red(
                        'Error autodetect:'
                    ),
                    err
                )
            }
        }
    )

    // 📨 mensajes
    sock.ev.on(
        'messages.upsert',
        async ({ messages, type }) => {

            if (type !== 'notify')
                return

            const m = messages[0]

            if (!m?.message)
                return

            const msgTime =
                (m.messageTimestamp || 0) * 1000

            if (msgTime < startTime)
                return

            const from =
                m.key.remoteJid

            if (!from)
                return

            const isGroup =
                from.endsWith('@g.us')

            const sender =
                m.key.participant || from

            // ⚡ NO ESPERAR visto
            sock.readMessages([m.key])
                .catch(() => {})

            // 📄 texto
            const msg =
                m.message.conversation ||
                m.message.extendedTextMessage?.text ||
                m.message.imageMessage?.caption ||
                m.message.videoMessage?.caption ||
                ''

            if (!msg)
                return

            // 🔥 primero revisar prefix
            const isCmd =
                msg.startsWith(config.prefix)

            // 🔇 mute
            const bloqueado =
                await verificarMuteados({
                    sock,
                    m,
                    from,
                    sender,
                    isGroup
                })

            if (bloqueado)
                return

            // 🔥 antilink
            const eliminado =
                await verificarAntilink({
                    sock,
                    m,
                    from,
                    sender,
                    isGroup
                })

            if (eliminado)
                return

            // ❌ ignorar normales
            if (!isCmd)
                return

            setImmediate(async () => {

                try {

                    let pushName =
                        m.pushName || 'Usuario'

                    let groupName =
                        'Privado'

                    let groupMetadata = null

                    let participants = []

                    // ⚡ args rápido
                    const body =
                        msg.slice(
                            config.prefix.length
                        ).trim()

                    const split =
                        body.split(/ +/)

                    const command =
                        split.shift()
                            ?.toLowerCase()

                    const args = split

                    // ⚡ buscar handler directo
                    const handler =
                        commandMap.get(command)

                    if (!handler)
                        return

                    // 👥 metadata SOLO si necesario
                    if (
                        isGroup &&
                        (
                            handler.admin ||
                            handler.group ||
                            handler.owner
                        )
                    ) {

                        try {

                            groupMetadata =
                                await getGroupMetadata(
                                    sock,
                                    from
                                )

                            participants =
                                groupMetadata.participants

                            groupName =
                                groupMetadata.subject

                        } catch {

                            participants = []
                        }
                    }

                    // 🔒 modoadmin
                    const modoadmin =
                        getModoadmin()

                    const isBlockedGroup =
                        isGroup &&
                        modoadmin[from]

                    console.log(
                        chalk.cyan(
                            `\n📌 Comando: ${command}`
                        ) +
                        chalk.yellow(
                            `\n👤 Usuario: ${pushName}`
                        ) +
                        chalk.green(
                            `\n📍 Lugar: ${groupName}\n`
                        )
                    )

                    if (
                        handler.group &&
                        !isGroup
                    ) return

                    if (
                        handler.private &&
                        isGroup
                    ) return

                    // 🔒 modoadmin
                    const isGroupCommand =
                        handler.group === true

                    if (
                        isBlockedGroup &&
                        !isGroupCommand
                    ) {

                        const user =
                            participants.find(
                                p =>
                                    p.id === sender
                            )

                        const isAdmin =
                            user?.admin === 'admin' ||
                            user?.admin === 'superadmin'

                        if (!isAdmin)
                            return
                    }

                    // 👑 admin
                    if (handler.admin) {

                        const user =
                            participants.find(
                                p =>
                                    p.id === sender
                            )

                        const isAdmin =
                            user?.admin === 'admin' ||
                            user?.admin === 'superadmin'

                        if (!isAdmin)
                            return
                    }

                    // 👑 owner
                    if (handler.owner) {

                        if (
                            !config.owner.includes(sender)
                        ) return
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

                } catch (err) {

                    console.log(
                        chalk.red('Error:'),
                        err
                    )
                }
            })
        }
    )

    // 🔄 reconexión
    sock.ev.on(
        'connection.update',
        ({ connection }) => {

            if (connection === 'close') {

                console.log(
                    chalk.red(
                        '🔄 Reiniciando bot...'
                    )
                )

                setTimeout(start, 2000)
            }
        }
    )
}

start()
