// создаем аудио контекст
const audioContext = new AudioContext()

if (audioElement) {
	// audioElement.autoplay = false

	 // подключаем источник звука (HTML-элемент audio)
	const source = audioContext.createMediaElementSource(audioElement)

	 // регулятор громкости звука
	const gainNode = audioContext.createGain()
	gainNode.gain.value = 0.5
	// подключаем узел контроля громкости
	source.connect(gainNode) 

	// анализатор звука
	const analyser = audioContext.createAnalyser()
	// подключаем анализатор после узла громкости
	gainNode.connect(analyser)
	// подключаем узел вывода звука (получатель)
	analyser.connect(audioContext.destination) 

	// создаем массив для частотных параметров сигнала
	analyser.fftSize = 8192
	const bufferLength = analyser.frequencyBinCount // frequencyBinCount = analyser.fftSize / 2
	dataArray = new Uint8Array(bufferLength)
	// наполняем массив частотными параметрами сигнала
	analyser.getByteFrequencyData(dataArray)

	let durationTime = 1000 

	function draw(timeStamp) {
	  
	  const WIDTH = canvasMusic.width
	  const HEIGHT = canvasMusic.height

	  requestAnimationFrame(draw);

	  if (timeStamp >= durationTime) {
		  analyser.getByteFrequencyData(dataArray)
			canvasCtx.clearRect(0, 0, WIDTH, HEIGHT)
		  // canvasCtx.fillStyle = getRandomFrom(settings.gradientColors)
		  // canvasCtx.fillStyle = 'white';
		  // canvasCtx.fillRect(0, 0, WIDTH, HEIGHT)

		  const barWidth = (WIDTH / bufferLength) * 2
		  let barHeight
		  let x = 0

		  let color = getRandomFrom(settings.gradientColors)
		  // let color = `rgb( ${(Math.floor(Math.random() * (256))).toString()}, ${(Math.floor(Math.random() * (256))).toString()}, ${(Math.floor(Math.random() * (256))).toString()} )`
		  
		  for(let i = 0; i < bufferLength; i++) {
		    barHeight = dataArray[i] / 2;
		    // canvasCtx.fillStyle = `rgb(${barHeight + 100}, ${barHeight + 100}, ${barHeight + 100})`
		    canvasCtx.fillStyle = color
		    canvasCtx.fillRect(x, HEIGHT - barHeight, barWidth, HEIGHT);
		    
		    x += barWidth
		  }

		  durationTime = timeStamp
		}
	}


	// Создать canvas
	function createCanvas (width, height) {
		const visualizer = document.querySelector('.visualizer')
		const canvas = document.createElement('canvas')	
		canvas.width = width || visualizer.clientWidth
		canvas.height = height || visualizer.clientHeight 
		visualizer.append(canvas)
		return canvas
	}

	canvasMusic = createCanvas()
	canvasCtx = canvasMusic.getContext('2d')

	draw()
}