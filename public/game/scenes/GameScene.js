import GeneralScene from './GeneralScene.js'

class GameScene extends GeneralScene {
    victoryText = 'Congratulations!\nYou won the game!'
    loseText = 'You lost!\nMore luck next time!'
    opponentDisconnectText = 'Your opponent left!'

	constructor(settings) {
		super('GameScene', settings)
	}

	init({ isLeftPlayer }) {
        this.setupGameScene(isLeftPlayer)
        this.events.on('wake', (system, data) => this.resetGameScene.call(this, data.isLeftPlayer))
	}

	create() {
		this.createBackground()
		this.createPlayer()
		this.createBall()
		this.createScoreboard()
		this.createInfotexts()
		this.createKeys()

		this.physics.add.overlap(this.leftPlayer, this.ball, this.playerBallCollision.bind(this))
		this.physics.add.overlap(this.rightPlayer, this.ball, this.playerBallCollision.bind(this))

		this.socket.emit('game:ready')
    }

	update() {
		if (!this.gameStarted) return
		this.handleMovement()
		if (this.isHost) {
			this.launchBall()
			this.checkScore()
			this.sync()
		}
	}

	setHostListener() {
		this.socket.on('playerRight:up', () => {
			this.rightPlayer.setVelocityY(-300)
		})
		this.socket.on('playerRight:down', () => {
			this.rightPlayer.setVelocityY(300)
		})
		this.socket.on('playerRight:still', () => {
			this.rightPlayer.setVelocityY(0)
		})
	}

	setClientListener() {
		this.socket.on('playerLeft:position', ({ xPos, yPos }) => {
			if (!this.leftPlayer) return
			this.leftPlayer.x = xPos
			this.leftPlayer.y = yPos
		})
		this.socket.on('playerRight:position', ({ xPos, yPos }) => {
			if (!this.rightPlayer) return
			this.rightPlayer.x = xPos
			this.rightPlayer.y = yPos
		})
		this.socket.on('ball:position', ({ xPos, yPos }) => {
			if (!this.ball) return
			this.ball.x = xPos
			this.ball.y = yPos
		})
		this.socket.on('score:left', scoreLeft => {
			if (typeof this.scoreLeft === 'undefined' || !this.scoreLeftText) return
			this.scoreLeft = scoreLeft
			this.scoreLeftText.setText(this.scoreLeft)
		})
		this.socket.on('score:right', scoreRight => {
			if (typeof this.scoreRight === 'undefined' || !this.scoreRightText) return
			this.scoreRight = scoreRight
			this.scoreRightText.setText(this.scoreRight)
		})
		this.socket.on('score:victory', leftPlayerWon => {
			this.handleVictory(leftPlayerWon)
		})
	}

	createBackground() {
		this.add
			.image(0, 0, 'background')
			.setOrigin(0, 0)
			.setDisplaySize(this.game.config.width, this.game.config.height)
			.setScrollFactor(0)
	}

	createPlayer() {
        this.leftPlayer = this.physics.add.sprite(50, this.config.center.y, 'playerLeft')
        this.leftPlayer.setCollideWorldBounds()
        this.rightPlayer = this.physics.add.sprite(
            this.config.width - 50,
            this.config.center.y,
            'playerRight',
        )
        this.rightPlayer.setCollideWorldBounds()
    }

	createBall() {
        this.ball = this.physics.add.sprite(this.config.center.x, this.config.center.y, 'ball')
        this.ball.setCollideWorldBounds()
        this.ball.setBounce(1, 1)
    }

	createScoreboard() {
        this.scoreLeftSprite = this.add.sprite(this.config.center.x, 0, 'scoreBarRight').setOrigin(1, 0)
        this.scoreLeftSprite.flipX = true
        this.scoreRightSprite = this.add.sprite(this.config.center.x, 0, 'scoreBarRight').setOrigin(0, 0)
		this.scoreLeft = 0
		this.scoreLeftText
			? (this.scoreLeftText.text = this.scoreLeft)
			: (this.scoreLeftText = this.createText({
					x: this.scoreLeftSprite.x - this.scoreLeftSprite.width / 2,
					y: this.scoreLeftSprite.y + this.scoreLeftSprite.height / 2,
					text: this.scoreLeft,
			  }).setDepth(10))
		this.scoreRight = 0
		this.scoreRightText
			? (this.scoreRightText.text = this.scoreRight)
			: (this.scoreRightText = this.createText({
					x: this.scoreRightSprite.x + this.scoreRightSprite.width / 2,
					y: this.scoreRightSprite.y + this.scoreRightSprite.height / 2,
					text: this.scoreRight,
			  }).setDepth(10))
	}

	createInfotexts() {
		this.leftPlayerText = this.createText({
			x: this.config.width / 4,
			y: this.config.height / 2,
			text: '',
		})
		this.leftPlayerText.visible = false
		this.leftPlayerText.style.align = 'center'

		this.leftPlayerNewOpponentButton = this.createText({
			x: this.config.width / 4,
			y: this.config.height / 2 + this.config.textSpace * 2,
			text: 'Search new opponent',
			func: this.handleSearchNewOpponent.bind(this),
		})
		this.leftPlayerNewOpponentButton.visible = false

		this.rightPlayerText = this.createText({
			x: (this.config.width / 4) * 3,
			y: this.config.height / 2,
			text: '',
		})
		this.rightPlayerText.visible = false
		this.rightPlayerText.style.align = 'center'

		this.rightPlayerNewOpponentButton = this.createText({
			x: (this.config.width / 4) * 3,
			y: this.config.height / 2 + this.config.textSpace * 2,
			text: 'Search new opponent',
			func: this.handleSearchNewOpponent.bind(this),
		})
		this.rightPlayerNewOpponentButton.visible = false
	}

	createKeys() {
		this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W, true, true)
		this.sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S, true, true)
	}

	playerBallCollision(player) {
        if (!this.isHost) return
		player === this.leftPlayer ? this.ball.setVelocityX(300) : this.ball.setVelocityX(-300)
	}

	handleMovement() {
		if (this.isHost) {
			if (this.wKey.isDown && !this.sKey.isDown) {
				this.leftPlayer.setVelocityY(-300)
			}
			if (this.sKey.isDown && !this.wKey.isDown) {
				this.leftPlayer.setVelocityY(300)
			}
			if (!this.wKey.isDown && !this.sKey.isDown) {
				this.leftPlayer.setVelocityY(0)
			}
		} else {
			if (this.wKey.isDown && !this.sKey.isDown) {
				this.socket.emit('playerRight:up')
			}
			if (this.sKey.isDown && !this.wKey.isDown) {
				this.socket.emit('playerRight:down')
			}
			if (!this.wKey.isDown && !this.sKey.isDown) {
				this.socket.emit('playerRight:still')
			}
		}
	}

	checkScore() {
		if (this.ball.x < this.ball.width) {
			this.handleScore(false)
			return
		}
		if (this.ball.x > this.config.width - this.ball.width) {
			this.handleScore()
			return
		}
	}

	handleScore(leftPlayer = true) {
		if (leftPlayer) {
			this.scoreLeft++
			this.scoreLeftText.setText(this.scoreLeft)
			this.socket.emit('score:left', this.scoreLeft)
			this.resetBall(false)
			if (this.scoreLeft >= 11) {
				this.handleVictory()
			}
			return
		}
		this.scoreRight++
		this.scoreRightText.setText(this.scoreRight)
		this.socket.emit('score:right', this.scoreRight)
		this.resetBall()
		if (this.scoreRight >= 11) {
			this.handleVictory(false)
		}
	}

	resetBall(moveLeft = true) {
		this.ball.x = this.config.center.x
		this.ball.y = this.config.center.y
		this.ball.setVelocity(moveLeft ? -300 : 300, Phaser.Math.Between(-300, 300))
	}

	handleVictory(leftPlayerWon = true) {
		this.gameStarted = false
		this.ball.isMoving = false
		this.isLeftPlayer
			? this.showInfo(leftPlayerWon ? this.victoryText : this.loseText)
			: this.showInfo(leftPlayerWon ? this.loseText : this.victoryText)
		if (!this.isHost) return
		this.socket.emit('score:victory', leftPlayerWon)
		this.ball.setVelocity(0)
	}

	showInfo(text) {
		if (
			!this.leftPlayerText &&
			!this.leftPlayerNewOpponentButton &&
			!this.rightPlayerText &&
			!this.rightPlayerNewOpponentButton
		) {
			this.createInfotexts()
		}
		if (this.isLeftPlayer) {
			this.leftPlayerText.visible = true
			this.leftPlayerText.setText(text)
			this.leftPlayerNewOpponentButton.visible = true
			return
		}
		this.rightPlayerText.visible = true
		this.rightPlayerText.setText(text)
		this.rightPlayerNewOpponentButton.visible = true
	}

	launchBall() {
		if (this.ball.isMoving) return
		this.ball.setVelocity(Math.random() < 0.5 ? -300 : 300, Phaser.Math.Between(-300, 300))
		this.ball.isMoving = true
	}

    handleSearchNewOpponent() {
        this.socket.emit('game:not-ready')
        this.scene.sleep(this)
        this.scene.run('LobbyScene')
    }

	sync() {
		this.socket.emit('playerLeft:position', {
			xPos: this.leftPlayer.x,
			yPos: this.leftPlayer.y,
		})
		this.socket.emit('playerRight:position', {
			xPos: this.rightPlayer.x,
			yPos: this.rightPlayer.y,
		})
		this.socket.emit('ball:position', {
			xPos: this.ball.x,
			yPos: this.ball.y,
		})
	}

    setupGameScene(isLeftPlayer) {
        this.gameStarted = false
		this.isHost = isLeftPlayer
		this.isLeftPlayer = isLeftPlayer

        if (this.isHost) {
			this.setHostListener()
		}

		if (!this.isHost) {
			this.setClientListener()
		}

        this.socket.removeAllListeners('opponent:disconnect')
        this.socket.on('opponent:disconnect', this.handleOpponentDisconnect.bind(this))
        this.socket.on('game:start', () => {
			this.gameStarted = true
		})
    }

    resetGameScene(isLeftPlayer) {
        this.setupGameScene(isLeftPlayer)

        this.scoreLeft = 0
        this.scoreLeftText.setText(this.scoreLeft)
        this.scoreRight = 0
        this.scoreRightText.setText(this.scoreRight)
        this.leftPlayerText.visible = false
        this.leftPlayerNewOpponentButton.visible = false
        this.rightPlayerText.visible = false
        this.rightPlayerNewOpponentButton.visible = false
        this.leftPlayer.y = this.config.center.y
        this.rightPlayer.y = this.config.center.y
        this.ball.x = this.config.center.x
        this.ball.y = this.config.center.y
        this.ball.isMoving = false
        this.socket.emit('game:ready')
    }

    handleOpponentDisconnect() {
        this.gameStarted = false
		this.showInfo(this.opponentDisconnectText)
		if (!this.isHost) return
		this.ball.setVelocity(0)
    }
}

export default GameScene
