class GeneralScene extends Phaser.Scene {
	constructor(key, config) {
		super(key)
		this.config = config
		this.socket = this.config.socketManager.socket
	}

	createText({ x = this.config.center.x, y = this.config.center.y, text, origin, func }) {
		const textButton = this.add
			.text(x, y, text, {
				fontSize: '32px',
			})
			.setScrollFactor(0)

		origin ? textButton.setOrigin(origin[0], origin[1]) : textButton.setOrigin()

		if (func) {
			textButton.setInteractive()
			textButton.on('pointerover', () => {
				textButton.setStyle({ fill: 'rgba(92, 122, 210, 0.6)' })
			})
			textButton.on('pointerout', () => {
				textButton.setStyle({ fill: 'white' })
			})
			textButton.on('pointerdown', () => func())
		}
		return textButton
	}
}

export default GeneralScene
