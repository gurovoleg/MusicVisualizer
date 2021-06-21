const settingsPanel = (function () {
	let isCreated = false	
	
	function createControls () {
		const toggle = document.querySelector('#settingsControl')
		if (!toggle) return 
		
		// Открываем настройки
		toggle.addEventListener('click', function (e) {
			this.classList.toggle('settings-panel--active') 
			this.firstElementChild.classList.toggle('d-none')
			this.lastElementChild.classList.toggle('d-none')
		})

		if (!isCreated) {
			const faderTotal = new Fader({ id: '#particlesTotal', min: 0, max: 256, value: settings.particle.total, title: 'Частицы' })
			const faderRadius = new Fader({ id: '#particleRadius', min: 1, max: 20, value: settings.particle.radius, title: 'Радиус' })
			const faderLength = new Fader({ id: '#lineLength', min: 10, max: 250, value: settings.particle.lineLength, title: 'Длина линии' })
			const faderVelocity = new Fader({ id: '#particleVelocity', min: 1, max: 10, value: settings.particle.maxVelocity, title: 'Скорость' })	
			isCreated = true

			const update = document.querySelector('.settings-panel__button')
			update.addEventListener('click', () => {
				settings.particle.total = faderTotal.value
				settings.particle.radius = faderRadius.value
				settings.particle.lineLength = faderLength.value
				settings.particle.maxVelocity = faderVelocity.value
				destroy()
				init()
			})
		}
	}
	
	return {
		createControls
	}
})()
