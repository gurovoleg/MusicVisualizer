// Получаем случайный элемент массива
function getRandomFrom (array) {
	const random = Math.floor(Math.random() * array.length)
	return array[random]
}

function formatTrackTime (seconds) {
	const ss = Math.floor(seconds % 60)
	const mm = Math.floor(seconds / 60)
	return mm + ':' + (ss > 9 ? ss : '0' + ss)
}