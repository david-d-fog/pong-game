import GameScene from './scenes/GameScene.js'
import LobbyScene from './scenes/LobbyScene.js'
import PreloadScene from './scenes/PreloadScene.js'

const WIDTH = 1280
const HEIGHT = 720

const settings = {
	width: WIDTH,
	height: HEIGHT,
	center: {
		x: WIDTH / 2,
		y: HEIGHT / 2,
	},
	textSpace: 50,
	socketManager: null,
}

function createConfig(socketManager) {
	settings.socketManager = socketManager

	return {
		type: Phaser.AUTO,
		scale: {
			parent: 'game',
			mode: Phaser.Scale.FIT,
			autoCenter: Phaser.Scale.CENTER_BOTH,
			width: settings.width,
			height: settings.height,
		},
		physics: {
			default: 'arcade',
			arcade: {
				debug: true,
			},
		},
		scene: [new PreloadScene(settings), new LobbyScene(settings), new GameScene(settings)],
	}
}

export default createConfig
