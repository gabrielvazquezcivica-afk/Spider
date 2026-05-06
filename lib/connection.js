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

    let method = null
    let number = null
    let codeRequested = false
    let fallbackToQR = false

    // 📡 EVENTO PRINCIPAL
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update

        // 📲 QR (normal o fallback)
        if (qr && (method === '2' || fallbackToQR)) {
            console.log(chalk.green('\n📲 Escanea este QR:\n'))
            qrcode.generate(qr, { small: true })
        }

        // 🔑 Código con intento + fallback
        if (method === '1' && number && !codeRequested) {
            codeRequested = true

            setTimeout(async () => {
                try {
                    console.log(chalk.yellow('\n⏳ Generando código...\n'))

                    const cleanNumber = jidNormalizedUser(number)
                    const code = await sock.requestPairingCode(cleanNumber)

                    if (!code) throw 'No code'

                    console.log(chalk.green(`\n🔑 Código de vinculación: ${code}\n`))

                } catch (err) {
                    console.log(chalk.red('❌ Falló código, cambiando a QR...\n'))
                    fallbackToQR = true
                }
            }, 4000)
        }

        // ✅ conectado REAL
        if (connection === 'open') {
            console.log(chalk.green('\n✅ BOT CONECTADO\n'))
            rl.close()
        }

        // ❌ desconexión
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

    // 🔐 PREGUNTAS
    if (!sessionExists) {

        console.log(chalk.cyan('\n¿CÓMO QUIERES INICIAR SESIÓN?\n'))
        console.log('1. Código de vinculación')
        console.log('2. Código QR\n')

        const option = await question('Selecciona (1 o 2): ')
        method = option

        if (option === '1') {
            number = await question('\n📱 Ingresa tu número (ej: 521234567890): ')
        }

    } else {
        console.log(chalk.green('\n🔐 Sesión detectada, conectando automáticamente...\n'))
    }

    // 💾 guardar sesión
    sock.ev.on('creds.update', saveCreds)

    return sock
}
