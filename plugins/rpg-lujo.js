import fs from 'fs'

const regDB = './data/registros.json'
const lujoDB = './data/lujos.json'

const items = [
    { name:'🏠 Casa', price:500000 },
    { name:'🚗 Auto', price:2000000 },
    { name:'🏛️ Mansión', price:20000000 },
    { name:'🛥️ Yate', price:100000000 }
]

function readJSON(path){
    try{
        if(!fs.existsSync(path)){
            fs.writeFileSync(path, JSON.stringify({}))
            return {}
        }
        return JSON.parse(fs.readFileSync(path,'utf8'))
    }catch{
        return {}
    }
}

function saveJSON(path,data){
    fs.writeFileSync(path, JSON.stringify(data,null,2))
}

const handler = async ({ sock,m,from,sender,args,participants }) => {

    let isBlockedGroup = false
    try {
        const db = JSON.parse(fs.readFileSync('./data/modoadmin.json'))
        isBlockedGroup = db[from]
    } catch {}

    const adminUser = participants?.find(p => p.id === sender)
    const isAdmin = adminUser?.admin === 'admin' || adminUser?.admin === 'superadmin'
    if (isBlockedGroup && !isAdmin) return

    const regs = readJSON(regDB)
    const lujos = readJSON(lujoDB)
    const id = sender.split('@')[0]

    if (!regs[id]) {
        return sock.sendMessage(from,{ text:'⚠️ Debes registrarte.' },{ quoted:m })
    }

    if (!args.length) {
        let txt = '╭━━━〔 💎 LUJOS 〕━━━⬣\n┃\n'
        items.forEach((x,i)=>{
            txt += `┃ ${i+1}. ${x.name}\n┃ 💰 ${x.price}\n┃\n`
        })
        txt += '┃ Comprar:\n┃ .lujo comprar <número>\n╰━━━━━━━━━━━━━━━━⬣'
        return sock.sendMessage(from,{ text:txt },{ quoted:m })
    }

    if (args[0].toLowerCase() !== 'comprar') return

    const n = parseInt(args[1])
    if (!n || n < 1 || n > items.length) {
        return sock.sendMessage(from,{ text:'⚠️ Número inválido.' },{ quoted:m })
    }

    const item = items[n-1]

    if (regs[id].dinero < item.price) {
        return sock.sendMessage(from,{ text:'⚠️ No tienes suficiente dinero.' },{ quoted:m })
    }

    regs[id].dinero -= item.price

    if (!lujos[id]) lujos[id] = []
    lujos[id].push(item.name)

    saveJSON(regDB, regs)
    saveJSON(lujoDB, lujos)

    await sock.sendMessage(from,{
        text:
`╭━━━〔 💎 COMPRA 〕━━━⬣
┃
┃ Compraste:
┃ ${item.name}
┃
┃ 💰 -${item.price}
┃
╰━━━━━━━━━━━━━━━━⬣`
    },{ quoted:m })
}

handler.command = ['lujo']
handler.group = true
handler.menu = true
export default handler