import GeneralScene from "./GeneralScene.js";

class LobbyScene extends GeneralScene {
    constructor(settings) {
        super('LobbyScene', settings);
    }

    init() {
        this.events.on('wake', this.resetLobbyScene.bind(this))
        this.socket.on('opponent:disconnect', this.resetLobbyScene.bind(this))
        this.requestOpponent()
    }

    create() {
        this.createSearchOpponentText()
    }

    update() {
        if (typeof this.config.socketManager.isLeftPlayer !== 'undefined' && !this.playButton?.visible) {
			this.searchOpponentText.visible = false
			this.createPlayButton()
		}
    }

	createSearchOpponentText() {
		this.searchOpponentText
			? (this.searchOpponentText.visible = true)
			: (this.searchOpponentText = this.createText({
					text: 'Searching an opponent...',
			  }))
	}

	createPlayButton() {
		this.playButton
			? (this.playButton.visible = true)
			: (this.playButton = this.createText({
					text: 'PLAY',
					func: () => {
						this.test = true
						this.scene.sleep(this)
                        this.scene.run('GameScene', {
							isLeftPlayer: this.config.socketManager.isLeftPlayer,
						})
					},
			  }))
	}

    resetLobbyScene() {
        this.config.socketManager.reset()
        this.socket.on('opponent:disconnect', this.resetLobbyScene.bind(this))
        this.playButton && (this.playButton.visible = false)
        this.createSearchOpponentText()
    }

    requestOpponent() {
        this.socket.emit('opponent:get')
    }
}

export default LobbyScene
