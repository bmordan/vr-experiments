let context
let volume = 1
AudioContext = AudioContext || webkitAudioContext

function setContext () {
    if (!context) {
        context = new AudioContext()
        document.getElementById('start').remove()
    } else {
        document.removeEventListener('mousemove', setContext)
    }
}

function setVolume (event) {
    volume = event.target.value
    console.info(`volume: ${volume}`)
}

document.addEventListener('mousemove', setContext)
document.getElementById('volume').addEventListener('input', setVolume)

const audioHandler = async stream => {
    const isInitiator = await fetch('/isInitiator')
        .then(res => res.json())
        .catch(console.error)
        
    const peer = new SimplePeer({
        initiator: isInitiator,
        trickle: false,
        stream: stream
    })

    const socket = new WebSocket(`ws://192.168.0.12:3000/socket/${peer._id}`)

    peer.on('signal', msg => {
        if (msg.type === 'offer') {
            socket.send(JSON.stringify({
                type: 'lodge_offer',
                offer: msg
            }))
        }

        if (msg.type === 'answer') {
            socket.send(JSON.stringify({
                type: 'lodge_answer',
                answer: msg
            }))
        }

    })

    peer.on('stream', mediaStream => {
        setContext()
        const source = context.createMediaStreamSource(stream)
        const gainNode = context.createGain()
        console.log(mediaStream.getAudioTracks())
        gainNode.gain.value = Math.fround(volume/10)
        source.connect(gainNode)
        gainNode.connect(context.destination)
    })

    if (!isInitiator) {
        fetch('/offers')
            .then(res => res.json())
            .then(offers => {
                delete offers[peer._id]
                for (const peerId of Object.keys(offers)) {
                    console.log('answering: ', peerId)
                    peer.signal(offers[peerId].offer)
                }
            })
            .catch(console.error)
    }

    socket.addEventListener('message', msg => {
        let data
        
        try {
            data = JSON.parse(msg.data)
        } catch(err) {
            console.error(err)
        }

        switch(data.type) {
            case 'connected':
                console.log(peer._id, 'connected')
                break;
            default:
                console.log('message type not known')
        }
    })
}

navigator.mediaDevices.getUserMedia({video: false, audio: true}).then(audioHandler).catch(console.error)