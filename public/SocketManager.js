export default class SocketManager {
    constructor() {
        this.socket = io()
        this.setupListeners()
    }

    enableDebugLogs() {
	    this.socket.on('connect_error', err => {
	    console.error(`connect_error due to ${err.message}`)
        })
    }

    setupListeners() {
        this.socket.on('opponent:found', ({leftPlayerId}) => this.handleOpponentFound.call(this, leftPlayerId))
    }


	handleOpponentFound(leftPlayerId) {
		this.isLeftPlayer = leftPlayerId === this.socket.id
	}

    reset() {
		this.isLeftPlayer = undefined
        this.socket.removeAllListeners()
        this.setupListeners()
        this.socket.emit('reset')
	}
}
