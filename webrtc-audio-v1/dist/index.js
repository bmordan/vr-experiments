const audioHandler = async stream => {
    const isInitiator = await fetch('/isInitiator').then(res => res.json()).catch(console.error)
    console.info({isInitiator})
        
    const peer = new SimplePeer({
        initiator: isInitiator,
        trickle: false,
        stream: stream
    })

    const socket = new WebSocket(`ws://localhost:3000/audio/${peer.channelName}`)
 
    if (!isInitiator) {
        const offers = await fetch(`/offers/${peer.channelName}`).then(res => res.json()).catch(console.error)
        for (const offer of offers) {
            console.log('recieved offer')
            peer.signal(offer)
        }
    }

    peer.on('signal', offer => {
        console.log('signal', offer.type)
        offer.type === 'offer' ? socket.send(JSON.stringify(offer)) : peer.signal(offer)
    })

    peer.on('connect', info => {
        console.log('connect', info)
    })

    socket.addEventListener('message', _msg => {
        const msg = JSON.parse(_msg.data)

        if (msg.type === 'offer') {
            console.log(msg.offer) 
        }
    })
}

navigator.mediaDevices.getUserMedia({video: false, audio: true}).then(audioHandler).catch(console.error)