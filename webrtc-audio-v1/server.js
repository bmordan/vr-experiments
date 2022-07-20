const express = require('express')
const app = express()
const WS = require('express-ws')(app)

const CONNECTIONS = new Map()

app.use(express.static('dist'))
app.use(express.json())

app.get('/isInitiator', (req, res) => {
    res.send(CONNECTIONS.size === 0)
})

app.get('/offers/:channelName', (req, res) => {
    const offers = []
    for (const [channelName, offer] of CONNECTIONS.entries()) {
        if (channelName !== req.params.channelName) offers.push(offer)
    }
    res.send(offers)
})



app.ws('/audio/:channelName', (ws, req) => {
    const { channelName } = req.params

    ws.on('message', _msg => {
        const msg = JSON.parse(_msg)
        
        if (msg.type === 'offer') {
            
            CONNECTIONS.set(channelName, msg)
            
            for (const socket of WS.getWss().clients) {
                for (const [_channelName, offer] of CONNECTIONS.entries()) {
                    if(_channelName !== channelName) socket.send(JSON.stringify({type: 'offer', offer}))
                }
            }
        }

        if (msg.type === 'answer') {}
    })

    ws.on('close', () => {
        CONNECTIONS.delete(channelName)
    })
})

app.listen(3000, '0.0.0.0', () => {
    console.info('VR Socket Server Running')
})