import axios from 'axios'
import fs from 'fs'
import { exec } from 'child_process'

/* 📝 WRAP TEXTO */
function wrap(text, max = 28) {

    let words = text.split(' ')
    let lines = []
    let current = []

    for (let word of words) {

        if (
            (current.join(' ').length +
            word.length + 1) > max
        ) {

            lines.push(
                current.join(' ')
            )

            current = [word]

        } else {

            current.push(word)
        }
    }

    if (current.length)
        lines.push(
            current.join(' ')
        )

    return lines.join('\n')
}

/* 🚀 COMANDO */
const handler = async ({
    sock,
    m,
    from,
    participants,
    sender,
    args,
    command
}) => {

    // 🔒 MODODADMIN
    let isBlockedGroup = false

    try {

        const db = JSON.parse(
            fs.readFileSync('./data/modoadmin.json')
        )

        isBlockedGroup = db[from]

    } catch {}

    const user = participants?.find(
        p => p.id === sender
    )

    const isAdmin =
        user?.admin === 'admin' ||
        user?.admin === 'superadmin'

    // 🔥 silencioso
    if (isBlockedGroup && !isAdmin)
        return

    /* 📝 TEXTO */
    let text =
        args.join(' ').trim()

    if (!text) {

        text =
            m.message?.extendedTextMessage
                ?.contextInfo
                ?.quotedMessage
                ?.conversation ||

            m.message?.extendedTextMessage
                ?.contextInfo
                ?.quotedMessage
                ?.extendedTextMessage
                ?.text ||

            null
    }

    if (!text) {

        return sock.sendMessage(from,{
            text:
`⚡ Escribe un texto

Ejemplo:
.${command} Hola mundo`
        },{
            quoted:m
        })
    }

    /* ⏳ REACCIÓN */
    await sock.sendMessage(from,{
        react:{
            text:'🕒',
            key:m.key
        }
    })

    try {

        const formatted =
            wrap(text, 28)

        const key =
            Buffer
                .from(
                    'c3lscGh5LTZmMTUwZA==',
                    'base64'
                )
                .toString('utf-8')

        const url =
`https://sylphyy.xyz/tools/brat?text=${encodeURIComponent(formatted)}&color=black&fondo=white&type=Nose&api_key=${key}`

        /* 📥 DESCARGAR */
        const res =
            await axios.get(url,{
                responseType:'arraybuffer'
            })

        const img =
            `./tmp-${Date.now()}.png`

        const webp =
            `./tmp-${Date.now()}.webp`

        fs.writeFileSync(
            img,
            res.data
        )

        /* 🎨 PNG → WEBP */
        await new Promise((resolve,reject)=>{

            exec(

`ffmpeg -i ${img} -vcodec libwebp -vf "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -y ${webp}`,

                (err)=>{

                    if(err)
                        reject(err)

                    else
                        resolve()
                }
            )
        })

        /* 📤 ENVIAR */
        await sock.sendMessage(from,{
            sticker:
                fs.readFileSync(webp)
        },{
            quoted:m
        })

        /* ✅ */
        await sock.sendMessage(from,{
            react:{
                text:'✅',
                key:m.key
            }
        })

        /* 🗑️ BORRAR TMP */
        try {

            if (fs.existsSync(img))
                fs.unlinkSync(img)

            if (fs.existsSync(webp))
                fs.unlinkSync(webp)

        } catch {}

    } catch(e){

        console.log(
            'BRAT ERROR:',
            e
        )

        await sock.sendMessage(from,{
            react:{
                text:'❌',
                key:m.key
            }
        })

        await sock.sendMessage(from,{
            text:
'❌ Error al generar sticker'
        },{
            quoted:m
        })
    }
}

handler.command = ['brat']
handler.tags = ['stickers']
handler.help = ['brat <texto>']
handler.menu = true
handler.group = true

export default handler