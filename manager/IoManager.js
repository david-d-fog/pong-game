class IoManager {
	constructor(io) {
		this.io = io
		this.waitingSockets = []
		this.lobbies = []
		this.io.on('connection', socket => this.registerSocket(socket))
	}

	enableDebugLogs() {
		this.io.on('connection', ({ id }) => console.log(`Socket with id ${id} connected`))
	}

	registerSocket(socket) {
		const socketInfo = { socketId: socket.id, socket, ready: false }
		socket.on('opponent:get', this.joinWaitingLobby.bind(this, socketInfo))
		socket.on('game:ready', () => {
			const socketsLobbyInfo = this.lobbyInfoOf(socket)
			const readyPlayerCount = this.setPlayerReady(socket, socketsLobbyInfo)
			if (readyPlayerCount < 2) return
			this.setGameListenersForLobby(socketsLobbyInfo)
		})
		socket.on('reset', this.handleResetSocket.bind(this, socketInfo))
        socket.on('disconnect', this.handleSocketDisconnect.bind(this, socketInfo))
	}

	joinWaitingLobby(socketInfo) {
		this.waitingSockets.push(socketInfo)
		console.table(this.waitingSockets)
		if (this.waitingSockets.length < 2) return
		this.initNewLobby()
	}

	initNewLobby() {
		const playerInfo1 = this.waitingSockets.shift()
		const playerInfo2 = this.waitingSockets.shift()
		const lobbyId = `lobby-${playerInfo1.socketId}`
		const lobbyInfo = {
			lobbyId,
			player: { playerInfo1, playerInfo2 },
			leftPlayerId: playerInfo1.socketId,
		}
		this.lobbies.push(lobbyInfo)
		playerInfo1.socket.join(lobbyId)
		playerInfo2.socket.join(lobbyId)
		this.io.to(lobbyId).emit('opponent:found', { leftPlayerId: lobbyInfo.leftPlayerId })
	}

	setGameListenersForLobby(lobbyInfo) {
		this.setGameListenersFor(lobbyInfo.player.playerInfo1.socket, lobbyInfo.lobbyId)
		this.setGameListenersFor(lobbyInfo.player.playerInfo2.socket, lobbyInfo.lobbyId)

		this.io.to(lobbyInfo.lobbyId).emit('game:start')
	}

	setGameListenersFor(socket, lobbyId) {
		socket.on('playerRight:up', () => {
			this.io.to(lobbyId).emit('playerRight:up')
		})
		socket.on('playerRight:down', () => {
			this.io.to(lobbyId).emit('playerRight:down')
		})
		socket.on('playerRight:still', () => {
			this.io.to(lobbyId).emit('playerRight:still')
		})
		socket.on('playerLeft:position', position => {
			this.io.to(lobbyId).emit('playerLeft:position', position)
		})
		socket.on('playerRight:position', position => {
			this.io.to(lobbyId).emit('playerRight:position', position)
		})
		socket.on('ball:position', position => {
			this.io.to(lobbyId).emit('ball:position', position)
		})
		socket.on('score:left', scoreLeft => {
			this.io.to(lobbyId).emit('score:left', scoreLeft)
		})
		socket.on('score:right', scoreRight => {
			this.io.to(lobbyId).emit('score:right', scoreRight)
		})
		socket.on('score:victory', leftPlayerWon => {
			this.io.to(lobbyId).emit('score:victory', leftPlayerWon)
		})
	}

	lobbyInfoOf(socket) {
		let socketsLobbyInfo
		this.lobbies.forEach(lobbyInfo => {
			if (
				lobbyInfo.player?.playerInfo1?.socketId === socket.id ||
				lobbyInfo.player?.playerInfo2?.socketId === socket.id
			) {
				socketsLobbyInfo = lobbyInfo
			}
		})
		return socketsLobbyInfo
	}

	setPlayerReady(socket, lobbyInfo) {
		let readyPlayerCount = 0
		Object.values(lobbyInfo.player).forEach(socketInfo => {
			if (socketInfo.socketId === socket.id) {
				socketInfo.ready = true
			}
			socketInfo.ready && readyPlayerCount++
		})
		return readyPlayerCount
	}

	handleResetSocket(socketInfo) {
        const socketsLobby = this.lobbies.filter(
			lobbyInfo => lobbyInfo.lobbyId === this.lobbyInfoOf(socketInfo.socket).lobbyId,
		)[0]
        this.removeSocketFromLobbyInfo(socketInfo, socketsLobby)
        socketInfo.ready = false
        this.joinWaitingLobby(socketInfo)
	}

    handleSocketDisconnect(socketInfo) {
        if (this.waitingSockets.includes(socketInfo)) {
            this.waitingSockets = this.waitingSockets.filter(({ id }) => id !== socketInfo.id)
            return
        }
        const socketsLobbyInfo = this.lobbyInfoOf(socketInfo.socket)
        if (!socketsLobbyInfo) return
        socketInfo.socket.leave(socketsLobbyInfo.lobbyId)
        this.removeSocketFromLobbyInfo(socketInfo, socketsLobbyInfo)
        this.io.to(socketsLobbyInfo.lobbyId).emit('opponent:disconnect')
    }

    removeSocketFromLobbyInfo(socketInfo, socketsLobby) {
        if (socketsLobby.player?.playerInfo1?.socketId === socketInfo.socketId) {
            delete socketsLobby.player?.playerInfo1
        }
        if (socketsLobby.player?.playerInfo2?.socketId === socketInfo.socketId) {
            delete socketsLobby.player?.playerInfo2
        }
        if (Object.values(socketsLobby.player).length <= 0) {
            this.lobbies = this.lobbies.filter(
                lobbyInfo => lobbyInfo.lobbyId !== this.lobbyInfoOf(socketInfo.socket),
            )
        }
    }
}

module.exports = IoManager
