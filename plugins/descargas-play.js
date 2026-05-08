import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import https from 'https'

function formatTime(seconds) {
  seconds = Number(seconds || 0)

  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return `${m}:${s.toString().padStart(2, '0')}`
}

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {

    https.get(url, (res) => {

      const stream = fs.createWriteStream(filepath)

      res.pipe(stream)

      stream.on('finish', () => {
        stream.close()
        resolve()
      })

    }).on('error', reject)
  })
}

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
`🎵 Ingresa una canción

Ejemplo:
.play emilia blackout`
    }, { quoted: m })
  }

  const query = args.join(' ')

  // ⚡ reacción
  await sock.sendMessage(from, {
    react: {
      text: '🎧',
      key: m.key
    }
  })

  // 📂 temp
  const tempDir = './tmp'

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir)
  }

  const id = crypto.randomBytes(5).toString('hex')

  const output = path.join(tempDir, `${id}.mp3`)
  const infoPath = path.join(tempDir, `${id}.info.json`)
  const thumbPath = path.join(tempDir, `${id}.jpg`)

  // 🚀 descarga rápida
  const cmd =
`yt-dlp "ytsearch1:${query}" \
--no-playlist \
--extract-audio \
--audio-format mp3 \
--audio-quality 0 \
--write-info-json \
--quiet \
--no-warnings \
-o "${output.replace('.mp3', '.%(ext)s')}"`

  exec(cmd, async (err) => {

    if (err) {

      console.log(err)

      return sock.sendMessage(from, {
        text: '❌ Error descargando canción.'
      }, { quoted: m })
    }

    try {

      if (!fs.existsSync(output)) {
        return sock.sendMessage(from, {
          text: '❌ No encontré resultados.'
        }, { quoted: m })
      }

      // 📀 defaults
      let title = 'Desconocido'
      let author = 'Desconocido'
      let duration = '00:00'
      let views = '0'
      let thumbnail = null

      // 📄 info
      if (fs.existsSync(infoPath)) {

        const data = JSON.parse(
          fs.readFileSync(infoPath)
        )

        title = data.title || title
        author = data.uploader || author
        duration = formatTime(data.duration)

        views = data.view_count
          ? Number(data.view_count).toLocaleString()
          : views

        thumbnail =
          data.thumbnail ||
          (data.thumbnails?.length
            ? data.thumbnails[data.thumbnails.length - 1].url
            : null)
      }

      // 🖼️ miniatura
      if (thumbnail) {
        try {
          await downloadImage(thumbnail, thumbPath)
        } catch {}
      }

      // 📩 info primero
      const caption =
`╭━━━〔 🎵 SPIDER PLAY 〕━━━⬣
┃
┃ 🎶 Título:
┃ ${title}
┃
┃ ⏱️ Duración:
┃ ${duration}
┃
┃ 👤 Autor:
┃ ${author}
┃
┃ 👁️ Vistas:
┃ ${views}
┃
┃ 📥 Pedido por:
┃ ${pushName}
╰━━━━━━━━━━━━━━━━⬣

> SPIDER BOT`

      // 🔥 enviar info antes
      if (fs.existsSync(thumbPath)) {

        await sock.sendMessage(from, {
          image: fs.readFileSync(thumbPath),
          caption
        }, { quoted: m })

      } else {

        await sock.sendMessage(from, {
          text: caption
        }, { quoted: m })
      }

      // 🚀 audio después
      const audioBuffer = fs.readFileSync(output)

      await sock.sendMessage(from, {
        audio: audioBuffer,
        mimetype: 'audio/mpeg',
        ptt: false
      }, { quoted: m })

      // 🗑️ limpiar
      ;[output, infoPath, thumbPath].forEach(file => {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file)
        }
      })

    } catch (e) {

      console.log(e)

      return sock.sendMessage(from, {
        text: '❌ Error enviando canción.'
      }, { quoted: m })
    }
  })
}

handler.command = ['play']
handler.tags = ['descargas']
handler.help = ['play']
handler.menu = true

export default handler
