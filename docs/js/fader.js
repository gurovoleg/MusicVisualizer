 /*

 		Пример использования с параметрами:

		new Fader({ 
			id: '#elementId', // тег-обертка, куда будет добавлен контрол
			value, // текущее значение
			min: 0, // начальное значение
			max: 100, // конечное значение
			title: 'Fader title', // заголовок (можно совсем не указывать или использовать свой вместе с оберткой)
			showValue: true, // true/false/'always' - режим отображения значения ползунка (по умолчанию только при нажатии и перемещении)
			stopWithoutFocus: false,  // прекращает передвижение при потери фокуса (по умолчанию можно уходить с элемента)
			withValues: true, // отображение значений min max
			onManualChange: undefined // callback при изменение value вручную
		})

*/


class Fader {
	constructor ({ id, min, max, value, stopWithoutFocus = false, showValue = true,  withValues = true, title, onManualChange }) {
		this.min = parseFloat(min) || 0 // min
		this.max = parseFloat(max) || 100 // max
		this.value = value || this.min // текущее значение
		this.withValues = withValues // отображать показатели min max
		this.title = title // добавить название
		this.showValue = showValue // режим отображения значения ползунка (по умолчанию при нажатии)
		this.stopWithoutFocus = stopWithoutFocus  // прекращение перемещения при потери фокуса
		this.wrapper = document.querySelector(id)
		this.onManualChange = typeof(onManualChange) === 'function' ? onManualChange : null // вызов callback при изменение value
		if (!this.wrapper) {
			console.error(`Ошибка! Не найден элемент с указанным идентификатором - ${id}`)	
			return
		}	
		this.createHTML() // разметка
		this.getCoords() // координаты
		this.move(this.value * this.indicatorCoords.width / this.max) // сдвиг
	}

  // создание разметки
	createHTML = () => {
		// основная обертка
		const fader = document.createElement('div') 
		fader.className = 'fader'

		// шкала
		const faderIndicator = document.createElement('div') 
		faderIndicator.className = 'fader-indicator'
		faderIndicator.addEventListener('click', this.indicatorClickHandler)
		
		// ползунок
		const faderControl = document.createElement('div') 
		faderControl.className = 'fader-control'
		faderControl.title = this.value
		faderControl.addEventListener('mousedown', this.mouseDownHandler)
		faderControl.addEventListener('touchstart', this.touchStartHandler)
		faderControl.ondragstart = () => false; // отключаем браузерный DnD

		// показатель ползунка (всплывающий подсказка)
		const faderControlValue = document.createElement('div') // ползунок
		faderControlValue.className = 'fader-control__value'
		if (this.showValue === 'always') faderControlValue.classList.add('d-block')
		faderControlValue.textContent = this.value 
		this.faderControlValue = faderControl.appendChild(faderControlValue)
		faderControl.title = this.value

		this.faderControl = faderIndicator.appendChild(faderControl)
		
		// индикатор прогресса
		const faderIndicatorProgress = document.createElement('div') 
		faderIndicatorProgress.className = 'fader-indicator__progress'
		this.faderIndicatorProgress = faderIndicator.appendChild(faderIndicatorProgress)

		// название (title)
		if (this.title) {
			const faderTitle = document.createElement('div') // основная обертка
			faderTitle.className = 'fader-title'
			faderTitle.textContent = this.title
			this.faderTitle = fader.appendChild(faderTitle)
		}

		// создаем разметку для полосы индикации
		this.faderIndicator = fader.appendChild(faderIndicator)
		
		// создаем разметку для показатели значений min max
		this.createValuesHTML(fader)
		
		// добавляем в обертку на страницу
		this.fader = this.wrapper.appendChild(fader)
	}

	// разметка для занчений min max
	createValuesHTML = (parent) => {
		if (this.withValues) {
			const faderValues = document.createElement('div') // основная обертка
			faderValues.className = 'fader-values unselectable'

			const faderMin = document.createElement('div') // min
			faderMin.className = 'fader-value unselectable'
			faderMin.textContent = this.min

			const faderMax = document.createElement('div') // max
			faderMax.className = 'fader-value unselectable'
			faderMax.textContent = this.max

			this.faderMin = faderValues.appendChild(faderMin)
			this.faderMax = faderValues.appendChild(faderMax)	

			this.faderValues = parent.appendChild(faderValues)
		} else {
			// если не отображаем показатели, то добавляем отступ между контролами
			parent.classList.add('fader--mb')
		}	
	}

	mouseDownHandler = (e) => {
		e.preventDefault()
		// отображение значения ползунка только для режима true и 'always'
		if (this.showValue) {
			this.faderControlValue.classList.add('d-block')	
		}
		this.getCoords(e.clientX)		
		// именно здесь добавляем обработчики для отслеживания событий уже на документе, так как указатель не всегда может находиться над элементом
		document.addEventListener('mousemove', this.mouseMoveHandler)
		document.addEventListener('mouseup', this.stopHandler)
		if (this.stopWithoutFocus) {
			this.fader.addEventListener('mouseleave', this.stopHandler)	
		}
	}

	touchStartHandler = (e) => {
		e.preventDefault()
		e.stopPropagation()
		// отображение значения ползунка только для режима true и 'always'
		if (this.showValue) {
			this.faderControlValue.classList.add('d-block')	
		}
		this.getCoords(e.changedTouches[0].clientX)		
		document.addEventListener('touchmove', this.touchMoveHandler)
		document.addEventListener('touchend', this.stopHandler)
	}

	// получить координаты ползунка, шкалы и смещение
	getCoords = (clientX) => {
		this.indicatorCoords = this.faderIndicator.getBoundingClientRect() // координаты шкалы
		this.controlCoords = this.faderControl.getBoundingClientRect() // координаты ползунка
		this.shiftX = clientX ? clientX - this.controlCoords.left : 0; // смещение по Х при захвате
		// шкала
		this.leftEdge = 0 // левый край шкалы
		this.rightEdge = this.indicatorCoords.width // правый край шкалы
		// ползунок
		this.minPosition = this.leftEdge - this.controlCoords.width / 2 // левое положение
		this.maxPosition = this.rightEdge - this.controlCoords.width / 2 // правое положение
	}

	// обработчик движения мыши
	mouseMoveHandler = (e) => this.move(e.clientX - this.indicatorCoords.left - this.shiftX)
	// обработчик движения для мобильных экранов
	touchMoveHandler = (e) => this.move(e.changedTouches[0].clientX - this.indicatorCoords.left - this.shiftX)

	// функция расчет положения (перемещения) ползунка 
	// рассчет задается от началы шкалы, offset - смещение от начала шкалы, userInput - смещение задается пользователем
	move = (offset, userInput = true) => {
		if (offset >= this.rightEdge) {
			// this.value = userInput ? this.max : this.value
			this.value = this.max
			this.render(this.rightEdge, this.maxPosition, userInput)
		} else if (offset <= this.leftEdge) {
			// this.value = userInput ? this.min : this.value
			this.value = this.min
			this.render(this.leftEdge, this.minPosition, userInput)
		} else {
			this.value = userInput ? Math.floor(offset * this.max / this.indicatorCoords.width) : this.value
			this.render(offset, offset - this.controlCoords.width / 2, userInput)
		}
	}

	// обработчик клика по шкале и перемещение ползунка
	indicatorClickHandler = (e) => {
		if (e.target !== this.faderControl) {
			this.getCoords(e.clientX)
			const newScaleOffset = parseInt(e.clientX - this.indicatorCoords.left)
			this.move(newScaleOffset, true)
		}
	}

	// обновлеям отображение элементов (scaleOffset - смещение по шкале, controlOffest - смещение ползунка, userInput - изменение от пользователя)
	render = (scaleOffset, controlOffest, userInput) => {
		this.faderControl.style.left = controlOffest + 'px' // смещение ползунка
		this.faderIndicatorProgress.style.width = scaleOffset + 'px' // заливка прогресса
		
		this.faderControl.title = this.value
		this.faderControlValue.textContent = this.value

		// запуск callback при изменение значения пользователем вручную для обновления данных снаружи
		if (this.onManualChange && userInput) this.onManualChange(this.value)
	}

	// остановка процесса перемещения (удаление обработчиков)
	stopHandler = (e) => {
		e.preventDefault()
		e.stopPropagation()
		document.removeEventListener('mousemove', this.mouseMoveHandler)
		document.removeEventListener('touchmove', this.touchMoveHandler)
		document.removeEventListener('mouseup', this.stopHandler)
		document.removeEventListener('touchend', this.stopHandler)
		this.fader.removeEventListener('mouseleave', this.stopHandler)

		// убираем всплывающий блок с текущим значением, если в настройках не задано постоянное отображение
		if (this.showValue !== 'always') {
			this.faderControlValue.classList.remove('d-block')	
		}

	}
}