import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const handler = async ({
  sock,
  m,
  from,
  args,
  pushName
}) => {

  if (!args[0]) {
    return sock.sendMessage(from, {
      text:
`🎵 Ingresa el nombre de una canción

Ejemplo:
.play peso pluma`
    }, { quoted: m })
  }

  const query = args.join(' ')

  // ⚡ reacción
  await sock.sendMessage(from, {
    react: { text: '🎧', key: m.key }
  })

  // 📂 carpeta temp
  const tempDir = './tmp'

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir)
  }

  const id = crypto.randomBytes(5).toString('hex')

  const output = path.join(tempDir, `${id}.mp3`)
  const infoPath = path.join(tempDir, `${id}.json`)

  // 🔥 descarga rápida
  const cmd =
`yt-dlp "ytsearch1:${query}" \
-x \
--audio-format mp3 \
--audio-quality 0 \
--no-playlist \
--write-info-json \
--quiet \
-o "${output.replace('.mp3', '.%(ext)s')}"`

  exec(cmd, async (err) => {

    if (err) {

      console.log(err)

      return sock.sendMessage(from, {
        text: '❌ Error descargando audio.'
      }, { quoted: m })
    }

    if (!fs.existsSync(output)) {
      return sock.sendMessage(from, {
        text: '❌ No encontré resultados.'
      }, { quoted: m })
    }

    try {

      // 📀 info
      let title = 'Desconocido'
      let duration = '00:00'
      let channel = 'Desconocido'
      let views = '0'

      if (fs.existsSync(infoPath)) {

        const json = JSON.parse(
          fs.readFileSync(infoPath)
        )

        title = json.title || title
        channel = json.uploader || channel
        views = json.view_count
          ? json.view_count.toLocaleString()
          : views

        if (json.duration) {

          const min = Math.floor(json.duration / 60)
          const sec = json.duration % 60

          duration =
`${min}:${sec.toString().padStart(2, '0')}`
        }
      }

      // 📩 info mensaje
      await sock.sendMessage(from, {
        text:
`╭━━━〔 🎵 SPIDER PLAY 〕━━━⬣
┃
┃ 🎶 ${title}
┃ 👤 ${channel}
┃ ⏱️ ${duration}
┃ 👁️ ${views} vistas
┃ 📥 Solicitado por:
┃ ${pushName}
╰━━━━━━━━━━━━━━━━⬣

> SPIDER BOT`
      }, { quoted: m })

      // 🎧 audio
      const buffer = fs.readFileSync(output)

      await sock.sendMessage(from, {
        audio: buffer,
        mimetype: 'audio/mpeg',
        ptt: false
      }, { quoted: m })

      // 🗑️ limpiar
      fs.unlinkSync(output)

      if (fs.existsSync(infoPath)) {
        fs.unlinkSync(infoPath)
      }

    } catch (e) {

      console.log(e)

      return sock.sendMessage(from, {
        text: '❌ Error enviando audio.'
      }, { quoted: m })
    }
  })
}

handler.command = ['play']
handler.tags = ['descargas']
handler.help = ['play']
handler.menu = true

export default handler
