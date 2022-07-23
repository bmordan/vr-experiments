const express = require('express')
const app = express()
require('express-ws')(app)

const network = new Map()

app.use(express.json())
app.use(express.static('public'))

app.get('/isInitiator', (req, res) => {
    res.send(network.size === 0)
})

app.get('/offers', (req, res) => {
    const entries = {}
    for(const [peerId, offer] of network.entries()) {
        entries[peerId] = offer
    }
    res.send(entries)
})

app.ws('/socket/:peerId', (ws, req) => {
    const { peerId } = req.params

    network.set(peerId, {
        offer: null,
        answer: null
    })
    console.info('connecting:', peerId)
    
    ws.send(JSON.stringify({type: `connected`}))
    
    ws.on('message', msg => {
        let data

        try {
            data = JSON.parse(msg)
        } catch (err) {
            return console.error(err)
        }

        switch(data.type) {
            case 'lodge_offer':
                if (network.has(peerId)) {
                    const entry = network.get(peerId)
                    network.set(peerId, {answer: entry.answer, offer: data.offer})
                    console.log(`${peerId} lodged offer`)
                }
                break;
            case 'lodge_answer':
                if (network.has(peerId)) {
                    const entry = network.get(peerId)
                    network.set(peerId, {answer: data.answer, offer: entry.offer})
                    console.log(`${peerId} lodged answer`)
                }
                break;
            default:
                console.info(`message type ${data.type} not registered`)
        }
    })

    ws.on('close', _ => {
        console.info('disconnecting:',req.params.peerId)
        network.delete(req.params.peerId)
    })
})

app.listen(process.env.PORT || 3000, () => {
    console.log('Your socket server is running on port 3000')
})