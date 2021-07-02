const defaultSettings = {
	storageKey: 'audioPlayerSettings',
	renderTime: 2,
	bgColor: '#d50000', // цвет фона
	gradientColors: ['#152B51', '#2A58A2', '#8B0470', 'pink'],
	particle: {
		color: '#fff',
		total: 256,
		radius: 3,
		maxVelocity: 1,
		lineLength: 150,
		lineWidth: 0.3,
		collision: false, // учет столкновения частиц
		collisionType: 'flow' // тип столкновения: kick - отталкивание, flow - обтекание
	},
	mouseMoveAction: 'pull', // поведение при наведении мышки: join - соединяет, pull - отталкивает
	// mouseMoveAction: 'join', // поведение при наведении мышки: join - соединяет, pull - отталкивает
	mouseParticleRadius: 70,
	// mouseParticleColor: 'transparent'
	mouseParticleColor: 'rgba(0, 0, 0, 0)'
}

function setMouseParticleColor (mouseMoveAction) {
	return mouseMoveAction === 'join' ? 'transparent' : 'rgba(0, 0, 0, 0)'	
}

let settings
let canvas
let ctx
let particles = [] // частицы
let mouseOver = false // индикатор нахождения мышки на поле
let mouseParticle // частица для мышки
let intervalTime = defaultSettings.renderTime // обновление фона
let requestAnimationId = null
const audioElement = document.querySelector("#audio") // проигрыватель (HTMLMediaElement)
let dataArray = null // массив для звуковых частот
const container = document.querySelector('.container') // основной контейнер
const uploader = document.querySelector('#uploader') // подгрузка файла
let fileTitle = '' // название трека
let currentTime = '0:00'
const currentTimeElement = document.querySelector('#currentTime') // текущий таймер времени проигрывания
const trackSeeker = document.querySelector('#trackSeeker') // ползунок времени проигрывания
let audioPlayerFader // ползунок времени проигрывания

// Создать canvas
function createCanvas (width, height) {
	const coords = container.getBoundingClientRect()
	const canvas = document.createElement('canvas')	

	ctx = canvas.getContext('2d')
	canvas.width = width || coords.width
	canvas.height = height || coords.height
	
	container.append(canvas)
	return canvas
}

// Чистка canvas
function clearCanvas () {
	ctx.save()
	ctx.setTransform(1, 0, 0, 1, 0, 0)
	ctx.clearRect(0, 0, canvas.width, canvas.height)
	ctx.restore()
}

// градиент для фона canvas
function setGradientColor (random = false) {
	const colors = settings.gradientColors
	const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);	
	gradient.addColorStop(0.1, random ? getRandomFrom(colors) : colors[0]);
	gradient.addColorStop(0.4, random ? getRandomFrom(colors) : colors[1]);
	gradient.addColorStop(0.8, random ? getRandomFrom(colors) : colors[2]);
	gradient.addColorStop(1, random ? getRandomFrom(colors) : colors[3]);
	
	return gradient
}

// Рисуем фон
function drawBackground () {
	if (!dataArray || audioElement && audioElement.paused) {
		ctx.fillStyle = setGradientColor()
	} else {
		// ctx.fillStyle = `rgba(${getRandomFrom(dataArray)}, ${getRandomFrom(dataArray)}, ${getRandomFrom(dataArray)})`	
		const colors = settings.gradientColors.slice(0, -1)
		ctx.fillStyle = getRandomFrom(colors)	
	}
	
	ctx.fillRect(0, 0, canvas.width, canvas.height)
}

// Класс частиц с координатами и методами рисования и позиционирования
class Particle {
	constructor (x, y, radius, color) {
		this.setPosition = (x, y) => {
			this.x = x || Math.random() * canvas.width
			this.y = y || Math.random() * canvas.height
		}	
		this.setPosition(x, y)	
		this.radius = radius || settings.particle.radius
		this.color = color || settings.particle.color
		// задаем случайное ускорение для задания разной скорости у частиц
		this.maxVelocityX = Math.random() * settings.particle.maxVelocity * 2 - settings.particle.maxVelocity
		this.maxVelocityY = Math.random() * settings.particle.maxVelocity * 2 - settings.particle.maxVelocity
	}

	// расчет движения при столкновении 2-х объектов (settings.mouseMoveAction = 'pull')
	static collissionHandler (obj1, obj2, type = 'flow' ) {
		const dx = obj1.x - obj2.x
		const dy = obj1.y - obj2.y

		const d = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2)) // расстояние между центрами объектов

		if (d <= obj1.radius + obj2.radius) {
			// вариант с отскоком друг от друга	
			if (type === 'kick') {
				obj1.maxVelocityX *= -1
				obj1.maxVelocityY *= -1
				obj2.maxVelocityX *= -1
				obj2.maxVelocityY *= -1	
			} else {
				// вариант с обтеканием друг друга
				const nx = dx / d
				const ny = dy / d
				const s = obj1.radius + obj2.radius - d // глубина проникновения

				obj1.x += nx * s / 2
				obj1.y += ny * s / 2
				obj2.x -= nx * s / 2
				obj2.y -= ny * s / 2	
			}
		}
	}

	moveToPosition (x = 0, y = 0) {
		const newX = this.x + this.maxVelocityX + x
		const newY = this.y + this.maxVelocityY + y
		
		if (mouseOver && settings.mouseMoveAction === 'pull') {
			Particle.collissionHandler(this, mouseParticle)
		}
		
		if (newX >= canvas.width || newX <= 0) {
			this.maxVelocityX *= -1
		}
		if (newY >= canvas.height || newY <= 0) {
			this.maxVelocityY	*= -1
		} 
		this.x += this.maxVelocityX + x
		this.y += this.maxVelocityY	+ y
	}

	draw (radius, color) {
		ctx.beginPath()
		ctx.fillStyle = color || this.color
		ctx.arc(this.x, this.y, radius || this.radius, 0, Math.PI * 2)
		ctx.fill()
	}
}

// Задаем массив с координатами частиц
function createParticles (quantity = settings.particle.total) {
	for (let i = 0; i < quantity; i++) {
		particles.push(new Particle)
		// const radius =  Math.floor(Math.random() * (12 - 3 + 1)) + 3
		// const radius = Math.random() > 0.1 ? 3 : 13
		// color = Math.random() > 0.5 ? 'rgba(255,255,255,0.2)' : '#fff'
		// color = radius === 13 ? 'rgba(255,255,255,0.2)' : '#fff'
		// particles.push(new Particle(null, null, radius, color))
	}
}

// Рисуем частицы
function drawParticles () {
	particles.forEach((particle, idx) => {
		if (!(mouseOver && settings.mouseMoveAction === 'join' && (idx === particles.length - 1))) {
			particle.moveToPosition()
		}
		// mouseOver && settings.mouseMoveAction === 'join' && (idx === particles.length - 1) ? null : particle.moveToPosition()
		particle.draw()
	})
}

// Рисуем линии между частицами
function drawLines () {
	for (let i = 0; i < particles.length; i++) {
	
		const p1 = particles[i]
		for (let j = i + 1; j < particles.length; j++) {
			const p2 = particles[j]
			const length = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))

			// учет столкновения частиц друг с другом
			if (settings.particle.collision) {
				Particle.collissionHandler(p1, p2, settings.particle.collisionType)	
			}
			
			if (length < settings.particle.lineLength) {
				const opacity = 1 - length / settings.particle.lineLength
				ctx.beginPath()
				ctx.moveTo(p1.x, p1.y)

				// Если нет аудио даннных или зауза
				if (!dataArray || audioElement && audioElement.paused) {
					ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`	
				} else {
					ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`	
					// ctx.strokeStyle = `rgba(${dataArray[i]}, ${dataArray[i]}, 255, ${opacity})`	
				}
				// ctx.strokeStyle = `rgba(30, 136, 229, ${opacity})`
				
				ctx.lineWidth = settings.particle.lineWidth
				ctx.lineTo(p2.x, p2.y)
				ctx.closePath()
				ctx.stroke()
			}
		}		
	}
}

// Обновляем экран
function render (timeStamp = 0) {
	if (timeStamp >= intervalTime) {
		if (window.analyser) window.analyser.getByteFrequencyData(dataArray)
		clearCanvas()
		drawBackground()
		drawParticles()
		drawLines()
		if (mouseOver) {
			mouseParticle.draw()
		}

		// обновялем текущее время трека и полосу прогресса
		if (audioElement && !audioElement.paused) {
			updatePlayerView()
		}
			
		intervalTime = settings.renderTime + timeStamp	
	}

	requestAnimationId = requestAnimationFrame(render)	
}

// Обновление элементов плеера
function updatePlayerView (reset = false) {
	if (reset) {
  	pause.classList.add('d-none')		
		play.classList.remove('d-none')	 	
  }

	currentTimeElement.textContent = formatTrackTime(audioElement.currentTime)	 
	if (audioPlayerFader) {
		const offset = Math.abs(Math.floor(audioPlayerFader.indicatorCoords.width * audioElement.currentTime / audioPlayerFader.max))
		audioPlayerFader.move(offset, false)
	}
}


function init () {
	settings = JSON.parse(localStorage.getItem(defaultSettings.storageKey)) || JSON.parse(JSON.stringify(defaultSettings))
	// Задаем количество частиц для мобильных экранов
	const screenWidth = document.documentElement.clientWidth
	if (screenWidth < 576) {
		settings.particle.total = 128
	}

	settingsPanel.createControls()
	
	canvas = createCanvas()

	createCanvasListeners(canvas)
	
	// создаем ползунок для проигрывателя
	audioPlayerFader = new Fader({ 
		id: '#audioPlayerProgress', 
		withValues: false, 
		showValue: false,
		onManualChange: function (value) {
			audioElement.currentTime = value 
		}
	})
	
	// Создаем точку-частицу для мышки
	mouseParticle = new Particle(null, null, settings.mouseParticleRadius, setMouseParticleColor(settings.mouseMoveAction))

	createParticles()
	render()	
	// перезагружаем аудио элемент (требуется в некоторых браузерах (Firefox!), не подхватывает 
  // событие подгрузки  по умолчанию loadeddata)
	audioElement.load() 
}

function destroy () {
	cancelAnimationFrame(requestAnimationId)
	canvas.remove()
	particles = []
	const playerProgressWrapper = document.querySelector('#audioPlayerProgress')
	playerProgressWrapper.innerHTML = ''
	settingsPanel.destroyControls()
}

// eventListeners
window.addEventListener('resize', () => {
	destroy()
	init()
})

function createCanvasListeners (canvas) {
	canvas.addEventListener('click', (e) => {
		for (let i = 0; i < 5; i++) {
			particles.push(new Particle(e.pageX, e.pageY))
		}
	})

	canvas.addEventListener('dblclick', (e) => {
		if (audioElement.paused) {
			audioElement.play()		
		} else {
			audioElement.pause()		
		}
	})

	canvas.addEventListener('mouseover', (e) => {
		mouseOver = true
		if (settings.mouseMoveAction === 'join') {
			particles.push(mouseParticle)	
		}
		mouseParticle.setPosition(e.pageX, e.pageY)
	})

	canvas.addEventListener('mouseout', (e) => {
		mouseOver = false
		if (settings.mouseMoveAction === 'join') {
			particles.pop()
		}
	})

	canvas.addEventListener('mousemove', (e) => {
		mouseParticle.setPosition(e.pageX, e.pageY)
	})
}

uploader.addEventListener('change', (e) => {
	const file = e.target.files[0]
	fileTitle = file.name || '' // задаем название трека
	const reader = new FileReader()
	reader.readAsDataURL(file) // конвертирует Blob в base64 и вызывает onload
	reader.addEventListener('loadend', () => {
		audioElement.src = reader.result
		pause.classList.add('d-none')		
		play.classList.remove('d-none')
	})
})

// получаем данные по длине трека после загрузки, задаем общее время и название трека
audioElement.addEventListener('loadeddata', function () {
	const durationTime = document.querySelector('#durationTime')
	if (durationTime) durationTime.textContent = formatTrackTime(audioElement.duration)
	if (audioPlayerFader) {
		audioPlayerFader.max = audioElement.duration
		audioPlayerFader.move(audioElement.currentTime, false)
		updatePlayerView(true)
	}

	const title = document.querySelector('.audio-player__title')
	if (title && !fileTitle) {
		const start = this.src.lastIndexOf('/') === -1 ? 0 : this.src.lastIndexOf('/')
		title.textContent = this.src.substring(start + 1)
	} else {
		title.textContent = fileTitle
	}
})

// player controls eventListeners
const pause = document.querySelector('#pauseControl')
const play = document.querySelector('#playControl')
const stop = document.querySelector('#stopControl')
const volumeOn = document.querySelector('#volumeOn')
const volumeOff = document.querySelector('#volumeOff')

function createPlayerListeners () {
	
	// отображение значков звука при загрузке
	if (audioElement && audioElement.muted) {
		volumeOn.classList.add('d-none')		
		volumeOff.classList.remove('d-none')	
	}

	play.addEventListener('click', () => {
		audioElement.play()
		pause.classList.remove('d-none')		
		play.classList.add('d-none')		
	})

	pause.addEventListener('click', () => {
		audioElement.pause()
		pause.classList.add('d-none')		
		play.classList.remove('d-none')		
	})

	stop.addEventListener('click', () => {
		audioElement.pause()
		audioElement.currentTime = 0
		pause.classList.add('d-none')		
		play.classList.remove('d-none')		
		updatePlayerView()
	})

	volumeOn.addEventListener('click', () => {
		audioElement.muted = true
		volumeOn.classList.add('d-none')		
		volumeOff.classList.remove('d-none')		
	})

	volumeOff.addEventListener('click', () => {
		audioElement.muted = false
		volumeOn.classList.remove('d-none')		
		volumeOff.classList.add('d-none')		
	})	
}

// запуск приложения
document.addEventListener('DOMContentLoaded', () => {
	createPlayerListeners()
	init()
})
