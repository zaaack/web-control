import net from 'net'
import robot from 'robotjs'
import Express from 'express'
import Enquirer from 'enquirer'
import path from 'path'
const { Select } = require('enquirer')

const app = Express()

app.use(Express.json())
app.use(
  Express.urlencoded({
    extended: true,
  }),
)
app.use(Express.raw())

app.get('/mouse/get/', (req, res) => {
  res.json(robot.getMousePos())
})
app.post('/mouse/move', (req, res) => {
  const { x, y } = req.body
  robot.moveMouse(x, y)
  res.json({
    x,
    y,
  })
})
app.post('/mouse/click', (req, res) => {
  const { button } = req.body
  robot.mouseClick(button)
  res.json({
    button,
  })
})
app.post('/mouse/scroll', (req, res) => {
  const { x, y } = req.body
  robot.scrollMouse(x, y)
  res.json(req.body)
})


app.post('/keyboard/input', (req, res) => {
  const { value } = req.body
  robot.typeString(value)
  res.json(req.body)
})

app.use(Express.static(path.join(__dirname, '../public')))

function getExternHosts() {
  const hosts = []
  const interfaces = require('os').networkInterfaces()
  for (const devName in interfaces) {
    const iface = interfaces[devName]
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i]
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        hosts.push(alias.address)
      }
    }
  }
  return hosts
}

async function start() {
  let port = await findPort()
  let server = app.listen(port, () => {
    const address = server.address()!
    if (typeof address === 'string') {
      console.log(`Listening on ${address}`)
    } else {
      const hosts = getExternHosts().map((host) => `http://${host}:${address.port}`)

      const select = (initial: number) => {
        const prompt = new Select({
          name: 'select',
          message: 'Select external url:',
          choices: hosts.slice(),
          initial,
        })

        prompt
          .run()
          .then((answer: string) => {
            select(hosts.indexOf(answer))
          })
          .catch(console.error)
        prompt.on('cancel', () => {
          process.exit()
        })
        console.log(hosts[initial])
        require('qrcode-terminal').generate(hosts[initial], {
          small: true,
        })
      }

      select(0)
    }
  })
}

async function findPort(port = 8610) {
  return new Promise((resolve, reject) => {
    net
      .createServer()
      .on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          resolve(findPort(0))
        }
      })
      .listen(port)
      .close(() => {
        resolve(port)
      })
  })
}

start().catch(console.error)
