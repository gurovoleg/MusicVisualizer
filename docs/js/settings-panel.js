const settingsPanel = (function () {
	const wrapper = document.querySelector('#settingsFaders')
	const toggle = document.querySelector('#settingsControl')
	const updateButton = document.querySelector('.settings-panel__button')
	const resetButton = document.querySelector('.settings-panel__reset')
	let faderTotal
	let faderRadius
	let faderLength
	let faderVelocity

	function createControls () {
		if (!toggle || !wrapper) return 
		
		// создать ползунки
		faderTotal = new Fader({ id: '#settingsFaders', min: 0, max: 256, value: settings.particle.total, title: 'Частицы' })
		faderRadius = new Fader({ id: '#settingsFaders', min: 1, max: 20, value: settings.particle.radius, title: 'Радиус' })
		faderLength = new Fader({ id: '#settingsFaders', min: 10, max: 250, value: settings.particle.lineLength, title: 'Длина линии' })
		faderWidth = new Fader({ id: '#settingsFaders', min: 0.3, max: 30, value: settings.particle.lineWidth, title: 'Ширина линии' })
		faderVelocity = new Fader({ id: '#settingsFaders', min: 1, max: 10, value: settings.particle.maxVelocity, title: 'Скорость' })	
		
		toggle.addEventListener('click', togglePanel)
		updateButton.addEventListener('click', update)
		resetButton.addEventListener('click', reset)
	}

	function update () {
		settings.particle.total = faderTotal.value
		settings.particle.radius = faderRadius.value
		settings.particle.lineLength = faderLength.value
		settings.particle.lineWidth = faderWidth.value
		settings.particle.maxVelocity = faderVelocity.value
		localStorage.setItem(settings.storageKey, JSON.stringify(settings))
		destroy()
		init()
	}

	function reset () {
		settings = JSON.parse(JSON.stringify(defaultSettings))
		localStorage.setItem(settings.storageKey, JSON.stringify(settings))
		destroy()
		init()
	}

	function togglePanel () {
		this.classList.toggle('settings-panel--active') 
		this.firstElementChild.classList.toggle('d-none')
		this.lastElementChild.classList.toggle('d-none')
	}

	function destroyControls () {
		toggle.removeEventListener('click', togglePanel)
		updateButton.removeEventListener('click', update)
		resetButton.removeEventListener('click', reset)
		wrapper.innerHTML = ''
	}
	
	return {
		createControls,
		destroyControls
	}
})()
