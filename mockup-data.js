module.exports = function startMockupConsuming(onMessage) {
	var cursor = 0
	setInterval(() => {
		cursor += 1
		if (mockup.enter.length <= cursor) cursor = 0

		onMessage({
			current_waiting: mockup.incoming.slice(0, cursor).reduce((a, b) => a + b, 0)
				- mockup.bounce.slice(0, cursor).reduce((a, b) => a + b, 0)
				- mockup.enter.slice(0, cursor).reduce((a, b) => a + b, 0),
			incoming: mockup.incoming[cursor],
			enter: mockup.enter[cursor],
			bounce: mockup.bounce[cursor],
			tps: mockup.tps[cursor]
		})
	}, 1000)
}

var wait = [30, ...createArray(106, () => Math.random() < 0.3).map(tf => tf ? parseInt(Math.random() * 30) : 0)]
var mockup = {
	'incoming': [10000, 1300, 341, 100, 200, 32, 32, ...createArray(100, randInt(15))],
	'bounce': createArray(107, randInt(200)),
	'enter': wait,
	'tps': enter.map(ex => ex + (Math.random() < 0.3 ? parseInt(Math.random() * 30) : 0))
}

function randInt(maximum, minimum) {
	return () => {
		minimum = minimum || 0
		return parseInt(minimum + (Math.random() * maximum))
	}
}

function createArray(length, mapfn) {
	return Array.from(Array(length), mapfn)
}