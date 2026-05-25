import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { connect } from './lib/connection.js'
import config from './config.js'
import { verificarMuteados } from './lib/muteWatcher.js'
import { verificarAntilink } from './lib/antilink.js'

/* 📁 rutas */
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const pluginsPath = path.join(__dirname, 'plugins')

/* 📦 plugins */
let plugins = []
let sockGlobal

/* ⚡ CACHE GLOBAL */
global.groupCache = {}

/* 🔒 MODODADMIN */
const modoadminPath = './data/modoadmin.json'

/* 🚫 BANNED */
const bannedPath = './data/banned.json'

/* ⚡ CACHE MEMORIA */
let modoadminCache = {}
let bannedCache = {}

/* 📥 cargar db UNA sola vez */
function loadDB() {

    try {

        if (fs.existsSync(modoadminPath)) {

            modoadminCache = JSON.parse(
                fs.readFileSync(
                    modoadminPath,
                    'utf-8'
                )
            )
        }

    } catch {

        modoadminCache = {}
    }

    try {

        if (fs.existsSync(bannedPath)) {

            bannedCache = JSON.parse(
                fs.readFileSync(
                    bannedPath,
                    'utf-8'
                )
            )
        }

    } catch {

        bannedCache = {}
    }
}

/* ⚡ autoreload db */
fs.watchFile(modoadminPath, loadDB)
fs.watchFile(bannedPath, loadDB)

loadDB()

/* 🔄 cargar plugins */
async function loadPlugins() {

    plugins = []

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

/* 👀 autoreload */
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

/* 🚀 iniciar */
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

    /* 🧹 limpiar cache */
    setInterval(() => {

        global.groupCache = {}

        if (global.gc) {

            try {
                global.gc()
            } catch {}
        }

    }, 1000 * 60 * 5)

    /* 🕷️ welcome/bye */
    sock.ev.on(
        'group-participants.update',
        async (update) => {

            try {

                if (update?.id) {
                    delete global.groupCache[update.id]
                }

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

            } catch {}
        }
    )

    /* 🕷️ cambios grupo */
    sock.ev.on(
        'groups.update',
        async (update) => {

            try {

                for (const group of update) {

                    if (group?.id) {
                        delete global.groupCache[group.id]
                    }
                }

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

            } catch {}
        }
    )

    /* 📨 mensajes */
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

            /* 🚫 banned cache */
            if (bannedCache[sender])
                return

            /* 📄 texto */
            const msg =
                m.message.conversation ||
                m.message.extendedTextMessage?.text ||
                m.message.imageMessage?.caption ||
                m.message.videoMessage?.caption ||
                ''

            if (!msg)
                return

            /* ⚡ SOLO comandos */
            if (
                !msg.startsWith(config.prefix)
            ) return

            /* 👁️ visto SIN await */
            sock.readMessages([m.key])
                .catch(() => {})

            setImmediate(async () => {

                try {

                    let pushName =
                        m.pushName || 'Usuario'

                    let groupName =
                        'Privado'

                    let groupMetadata = null

                    let participants = []

                    /* 👥 metadata cache */
                    if (isGroup) {

                        try {

                            if (!global.groupCache[from]) {

                                global.groupCache[from] =
                                    await sock.groupMetadata(from)
                            }

                            groupMetadata =
                                global.groupCache[from]

                            participants =
                                groupMetadata.participants

                            groupName =
                                groupMetadata.subject

                        } catch {

                            participants = []
                        }
                    }

                    /* 🔇 mute */
                    verificarMuteados({
                        sock,
                        m,
                        from,
                        sender,
                        isGroup
                    }).catch(() => {})

                    /* 🔥 antilink */
                    verificarAntilink({
                        sock,
                        m,
                        from,
                        sender,
                        isGroup
                    }).catch(() => {})

                    /* ⚡ args */
                    const args =
                        msg
                            .slice(config.prefix.length)
                            .trim()
                            .split(/ +/)

                    const command =
                        args.shift()
                            .toLowerCase()

                    /* 🔒 modoadmin cache */
                    const isBlockedGroup =
                        isGroup &&
                        modoadminCache[from]?.enabled

                    /* 👑 admin */
                    let isAdmin = false

                    if (isGroup) {

                        isAdmin =
                            participants.some(
                                p =>
                                    p.id === sender &&
                                    (
                                        p.admin === 'admin' ||
                                        p.admin === 'superadmin'
                                    )
                            )
                    }

                    console.log(
                        chalk.cyan(
                            `\n📌 ${command}`
                        ) +
                        chalk.yellow(
                            ` | 👤 ${pushName}`
                        ) +
                        chalk.green(
                            ` | 📍 ${groupName}`
                        )
                    )

                    for (const handler of plugins) {

                        if (!handler.command)
                            continue

                        const commands =
                            Array.isArray(
                                handler.command
                            )
                                ? handler.command
                                : [handler.command]

                        if (
                            !commands.includes(command)
                        ) continue

                        if (
                            handler.group &&
                            !isGroup
                        ) continue

                        if (
                            handler.private &&
                            isGroup
                        ) continue

                        /* 🔒 modoadmin */
                        if (
                            isBlockedGroup &&
                            !isAdmin
                        ) return

                        /* 👑 admin */
                        if (
                            handler.admin &&
                            !isAdmin
                        ) continue

                        /* 👑 owner */
                        if (handler.owner) {

                            if (
                                !config.owner.includes(sender)
                            ) continue
                        }

                        handler({
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
                        }).catch(err => {

                            console.log(
                                chalk.red(
                                    `Error plugin ${command}:`
                                ),
                                err
                            )
                        })
                    }

                } catch (err) {

                    console.log(
                        chalk.red('Error:'),
                        err
                    )
                }
            })
        }
    )

    /* 🔄 reconexión */
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