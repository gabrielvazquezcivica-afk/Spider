import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    jidNormalizedUser
} from '@whiskeysockets/baileys'

import pino from 'pino'
import chalk from 'chalk'
import readline from 'readline'
import fs from 'fs'
import { Boom } from '@hapi/boom'
import qrcode from 'qrcode-terminal'

// 📲 Interfaz consola
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

// 🎯 Helper pregunta
const question = (text) => new Promise(resolve => rl.question(text, resolve))

export async function connect() {

    console.clear()

    // 🕷️ Pantalla inicial
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

    console.log(chalk.yellowBright('\n⚡ Conexión Spider\n'))

    const sessionExists = fs.existsSync('./session')

    const { state, saveCreds } = await useMultiFileAuthState('./session')

    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        printQRInTerminal: false
    })

    // 🔐 SI NO HAY SESIÓN → PREGUNTAR
    if (!sessionExists) {

        console.log(chalk.cyan('\n¿CÓMO QUIERES INICIAR SESIÓN?\n'))
        console.log('1. Código de vinculación')
        console.log('2. Código QR\n')

        const option = await question('Selecciona (1 o 2): ')

        if (option === '1') {
            const number = await question('\n📱 Ingresa tu número (ej: 521234567890): ')

            // 🔥 FIX REAL: esperar conexión válida
            let codeRequested = false

            sock.ev.on('connection.update', async (update) => {
                const { connection } = update

                if (connection === 'connecting' && !codeRequested) {
                    codeRequested = true

                    try {
                        const code = await sock.requestPairingCode(number)
                        console.log(chalk.green(`\n🔑 Código de vinculación: ${code}\n`))
                    } catch (err) {
                        console.log(chalk.red('❌ Error generando código'), err)
                    }
                }
            })
        }

        if (option === '2') {
            sock.ev.on('connection.update', ({ qr }) => {
                if (qr) {
                    console.log(chalk.green('\n📲 Escanea este QR:\n'))
                    qrcode.generate(qr, { small: true })
                }
            })
        }

    } else {
        console.log(chalk.green('\n🔐 Sesión detectada, conectando automáticamente...\n'))
    }

    // 📡 Eventos conexión
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update

        if (connection === 'open') {
            console.log(chalk.green('\n✅ BOT CONECTADO\n'))
            rl.close()
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode

            if (reason !== DisconnectReason.loggedOut) {
                console.log(chalk.red('❌ Reconectando...\n'))
                connect()
            } else {
                console.log(chalk.red('❌ Sesión cerrada, elimina carpeta session\n'))
            }
        }
    })

    // 💾 Guardar sesión
    sock.ev.on('creds.update', saveCreds)

    return sock
}
