const settings = {
	renderTime: 0,
	// bgColor: '#E65100',
	// bgColor: '#212121',
	bgColor: '#d50000',
	particle: {
		color: '#fff',
		color: 'red',
		// color: '#1E88E5',
		total: 256,
		radius: 3,
		maxVelocity: 1,
		lineLength: 150,
		lineWidth: 0.3
	},
	mouseMoveAction: 'pull', // поведение при наведении мышки: join - соединяет, pull - отталкивает
	// mouseMoveAction: 'join', // поведение при наведении мышки: join - соединяет, pull - отталкивает
	mouseParticleRadius: 100,
	mouseParticleColor: 'rgba(0,0,0,0.1)'
	// mouseParticleColor: 'transparent'
}

let canvas
let ctx
const particles = [] // частицы
let mouseOver = false // индикатор нахождения мышки на поле
let mouseParticle // частица для мышки

// Создать canvas
function createCanvas (width, height) {
	const container = document.querySelector('.container')

	const canvas = document.createElement('canvas')	
	canvas.style.display = 'block'
	ctx = canvas.getContext('2d')
	canvas.width = width || document.documentElement.clientWidth
	canvas.height = height || document.documentElement.clientHeight
	
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

// Рисуем фон
function drawBackground () {
	// ctx.fillStyle = getRandomFrom(BLOCK_COLORS)
	// ctx.fillStyle = `rgba(0, 0, ${getRandomFrom(dataArray)})`
	// ctx.fillStyle = `rgba(0, 0, 0, 0)`
	if (!dataArray || audioElement && audioElement.paused) {
		// ctx.fillStyle = settings.bgColor	
	} else {
		// ctx.fillStyle = `rgba(${getRandomFrom(dataArray)}, ${getRandomFrom(dataArray)}, ${getRandomFrom(dataArray)})`	
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

	moveToPosition (x = 0, y = 0) {
		const newX = this.x + this.maxVelocityX + x
		const newY = this.y + this.maxVelocityY + y
		
		// -- Расчет движения при столкновении (settings.mouseMoveAction = 'pull')--
		function collissionHandler (obj1, obj2) {
			const dx = obj1.x - obj2.x
			const dy = obj1.y - obj2.y

			const d = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2)) // расстояние между центрами объектов

			if (mouseOver && d <= obj1.radius + obj2.radius) {
				const nx = dx / d
				const ny = dy / d
				const s = obj1.radius + obj2.radius - d // глубина проникновения

				obj1.x += nx * s / 2
				obj1.y += ny * s / 2
				obj2.x -= nx * s / 2
				obj2.y -= ny * s / 2
			}
		}

		if (settings.mouseMoveAction === 'pull') {
			collissionHandler(this, mouseParticle)
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
		// settings.particle.lineLength = dataArray[i]
		// settings.particle.lineWidth = dataArray[i] / 50
		
		const p1 = particles[i]
		for (let j = i + 1; j < particles.length; j++) {
			const p2 = particles[j]
			const length = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
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
function render (timeStamp) {
	let intervalTime = settings.renderTime

	if (timeStamp >= intervalTime) {
		if (window.analyser) window.analyser.getByteFrequencyData(dataArray)
		clearCanvas()
		drawBackground()
		drawParticles()
		drawLines()
		if (mouseOver) {
			mouseParticle.draw()
		}
		
		intervalTime = settings.renderTime + timeStamp	
	}

	requestAnimationFrame(render)	
}


function init () {
	canvas = createCanvas()
	
	createCanvasListeners(canvas)

	// Создаем точку-частицу для мышки
	mouseParticle = new Particle(null, null, settings.mouseParticleRadius, settings.mouseParticleColor)

	createParticles()
	requestAnimationFrame(render)	
}

// eventListeners
window.addEventListener('resize', () => {
	canvas.width = document.documentElement.clientWidth
	canvas.height = document.documentElement.clientHeight
	render(Date.now())
})

function createCanvasListeners (canvas) {
	canvas.addEventListener('click', (e) => {
		for (let i = 0; i < 5; i++) {
			particles.push(new Particle(e.pageX, e.pageY))
		}
	})

	canvas.addEventListener('mouseover', (e) => {
		mouseOver = true
		// if (settings.mouseMoveAction === 'join') {
		// 	particles.push(mouseParticle)	
		// }
		// mouseParticle.setPosition(e.pageX, e.pageY)
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

// document.addEventListener('click', () => {
// 	console.log(audioContext.state)
// 	console.dir(dataArray)
// })

init ()
