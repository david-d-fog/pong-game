import GeneralScene from './GeneralScene.js'

class PreloadScene extends GeneralScene {
	constructor(settings) {
		super('PreloadScene', settings)
	}

	init() {
		this.cameras.main.setBackgroundColor('rgba(1, 3, 10, 0.6)')
		this.progressBar = this.add.graphics()
		this.loadingAssetsText = this.createText({
			y: this.config.center.y + this.config.textSpace,
			text: 'Loading assets...',
		})

		this.load.on('progress', value => {
			this.progressBar.clear()
			this.progressBar.fillStyle(0xffffff)
			this.progressBar.fillRect(this.config.center.x - 150, this.config.center.y, 300 * value, 30)
		})

		this.load.on('complete', () => {
			this.progressBar.visible = false
			this.loadingAssetsText.visible = false
            this.createText({
                text: 'Search opponent!',
                func: () => this.scene.start('LobbyScene')
          })
		})
	}

	preload() {
		this.load.image('background', 'game/assets/Board.png')
		this.load.image('scoreBarRight', 'game/assets/ScoreBarRight.png')
		this.load.image('playerLeft', 'game/assets/PlayerLeft.png')
		this.load.image('playerRight', 'game/assets/PlayerRight.png')
		this.load.image('ball', 'game/assets/Ball.png')
	}
}

export default PreloadScene
