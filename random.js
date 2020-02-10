function randomFloat(min, max) {
  return Math.random() * (max - min) + min
}

function randomInt(min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function rollDie(chanceOfSuccess) {
  return Math.random() < chanceOfSuccess
}

function randomValue(array) {
  return array[randomInt(0, array.length - 1)]
}

function countRandoms(min, max, count) {
  hist = []
  for (let n = min; n <= max; n++) {
    hist[n] = 0
  }
  for (let i = 0; i < count; i++) {
    num = randomInt(min, max)
    hist[num] += 1
  }
  console.log(hist)
  return hist
}
