import createConfig from './game/config.js'
import SocketManager from './SocketManager.js'

function init() {
    const socketManager = new SocketManager()
    socketManager.enableDebugLogs()
    new Phaser.Game(createConfig(socketManager))
}

init()
