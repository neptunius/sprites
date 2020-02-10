const title = document.getElementById('title')
const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')

let frameID = 0 // ID of last requested animation frame
let frameTime = 0 // Time of last completed animation frame
let canvasHue = 210 // Start canvas hue cycle at light blue
const canvasOpacity = 0.006 // >= 0.006 to avoid grey since 1/180 deg = 0.00555
const canvasHueCycleRate = 0.5 // Degrees of hue around color wheel per update
const spriteHueCycleRate = 2.5 // Degrees of hue around color wheel per update
const chanceOfHueCycle = 0.2 // Chance that sprite hue will rainbow cycle
const chanceOfClear = 0.3 // Chance that sprite color will be translucent
const chanceOfEyes = 0.00 // Chance that rainbow cycle sprite will have eyes
const chanceOfRandomSplit = 0.002 // Chance that sprite randomly splits per update
const chanceOfRandomDeath = 0.005 // Chance that sprite randomly dies per update

const sprites = []
const initNumSprites = canvas.width / 100
const maxNumSprites = 4 * initNumSprites
const minSize = 10
const maxSize = 40
const minSpeedY = 2
const maxSpeedY = 6
const maxSpeedX = 3
const speedFactor = 1
const distFactor = 2

const splitStreams = true
const mixStreams = false
const mergeStreams = false
const stopLeftRight = true
const stopTopBottom = false
const bounceLeftRight = false
const bounceTopBottom = false

function hslaColor(hue, opacity, saturation, lightness) {
  if (opacity === undefined)
    opacity = 1.0
  if (saturation === undefined)
    saturation = 80
  if (lightness == undefined)
    lightness = 50 // randomInt(30, 70)
  return `hsla(${hue}, ${saturation}%, ${lightness}%, ${opacity})`
}

function createInitialSprites() {
  for (let i = 0; i < initNumSprites; i++) {
    const sprite = createSprite()
    sprites.push(sprite)
  }
}

function createSprite() {
  const diameter = randomFloat(minSize, maxSize)
  const width = diameter // randomFloat(minSize, maxSize)
  const height = diameter // randomFloat(minSize, maxSize)
  const x = randomFloat(0, canvas.width) // Random location within sides
  // const y = randomFloat(0, canvas.height) // Random location within canvas
  const y = randomFloat(-height, -canvas.height) // Random location above canvas
  const opacity = rollDie(chanceOfClear) ? 0.5 : 1.0
  const hue = randomFloat(0, 360)
  const color = hslaColor(hue, opacity)
  const sprite = Sprite(x, y, 0, width, height, color)
  addSpriteMotion(sprite)
  sprite.opacity = opacity
  sprite.hue = hue
  sprite.hueCycle = randomFloat(0.1, spriteHueCycleRate) // rollDie(chanceOfHueCycle)
  sprite.eyes = sprite.hueCycle ? rollDie(chanceOfEyes) : false
  sprite.shape = 'circle'
  return sprite
}

function addSpriteMotion(sprite) {
  sprite.dx = randomFloat(-maxSpeedX, maxSpeedX) * speedFactor
  sprite.dy = randomFloat(minSpeedY, maxSpeedY) * speedFactor
  sprite.dw = randomFloat(-1, 1) // * speedFactor
}

function resetSprite(sprite) {
  const diameter = randomFloat(minSize, maxSize)
  sprite.width = diameter // randomFloat(minSize, maxSize)
  sprite.height = diameter // randomFloat(minSize, maxSize)
  sprite.x = randomFloat(0, canvas.width) // Random location within sides
  // sprite.y = randomFloat(0, -canvas.height) // Random location above canvas
  sprite.y = -sprite.height // Reset location just above canvas
  sprite.hue = randomFloat(0, 360)
  sprite.hueCycle = randomFloat(0.1, spriteHueCycleRate) // rollDie(chanceOfHueCycle)
  sprite.eyes = sprite.hueCycle ? rollDie(chanceOfEyes) : false
  sprite.color = hslaColor(sprite.hue, sprite.opacity)
  addSpriteMotion(sprite)
}

function deleteSprite(sprite) {
  sprites.splice(sprites.indexOf(sprite), 1)
  // const index = sprites.indexOf(sprite)
  // if (index >= 0)
  //   sprites.splice(index, 1)
}

function cloneSprite(sprite) {
  const clone = Sprite(sprite.x, sprite.y, sprite.rotation, sprite.width, sprite.height, sprite.color)
  clone.dx = sprite.dx
  clone.dy = sprite.dy
  clone.dw = sprite.dw
  clone.opacity = sprite.opacity
  clone.hue = sprite.hue
  clone.hueCycle = sprite.hueCycle
  clone.eyes = sprite.hueCycle ? rollDie(chanceOfEyes) : false
  clone.shape = sprite.shape
  return clone
}

function splitStream(sprite) {
  // Clone sprite to split stream in two directions
  const clone = cloneSprite(sprite)
  clone.hueCycle = randomFloat(0.1, spriteHueCycleRate)

  // Increase original sprite's horizontal velocity, but clamped (not too fast)
  sprite.dx *= 1.4
  if (Math.abs(sprite.dx) > maxSpeedX * speedFactor)
    sprite.dx = Math.sign(sprite.dx) * maxSpeedX * speedFactor
  // Clone's horizontal velocity is slower and opposite of original sprite
  clone.dx = sprite.dx * -0.5

  // Increase sprite's vertical velocity, but clamped (not too fast)
  if (Math.abs(sprite.dy) * 1.5 < maxSpeedY * speedFactor)
    sprite.dy *= 1.5
  // Decrease clone's vertical velocity, but clamped (not too slow)
  if (Math.abs(clone.dy) * 0.75 > minSpeedY * speedFactor)
    clone.dy *= 0.75

  // Make sprites smaller since stream split, but clamped (not too small)
  const scale1 = randomFloat(0.6, 0.8)
  const scale2 = 1.2 - scale1
  if (sprite.width * scale1 > minSize
    && clone.width * scale2 > minSize) {
    sprite.width *= scale1
    sprite.height *= scale1
    clone.width *= scale2
    clone.height *= scale2
  }
  else {
    sprite.width = minSize * scale1 / scale2
    sprite.height = minSize * scale1 / scale2
    clone.width = minSize
    clone.height = minSize
  }

  // Append clone to animate it
  sprites.push(clone)
  // console.log('Split stream')
  // console.log('Split stream into sprite:', sprite, 'and clone:', clone)
}

function near(sprite1, sprite2) {
  // Calculate minimum distance for sprites to touch
  const horizDist = (sprite1.width + sprite2.width) / 2.
  const vertDist = (sprite1.height + sprite2.height) / 2.
  // Check if sprites almost touch
  return (Math.abs(sprite1.x - sprite2.x) < horizDist &&
          Math.abs(sprite1.y - sprite2.y) < vertDist)
}

function distance(sprite1, sprite2) {
  // Euclidean distance formula using Pythagorean formula a^2 + b^2 = c^2
  const dx = sprite1.x - sprite2.x
  const dy = sprite1.y - sprite2.y
  return Math.sqrt(dx * dx + dy * dy)
}

function averageHues(hue1, hue2) {
  const hueDiff = Math.abs(hue1 - hue2)
  const hue = ((hue1 + hue2) / 2. + (hueDiff > 180 ? 180 : 0)) % 360
  // if (hueDiff <= 180)
  //   const hue = (hue1 + hue2) / 2.
  // else // hueDiff > 180
  //   const hue = (hue1 + hue2 + 360) / 2.
  return hue
}

function mergeSprites(sprite1, sprite2) {
  // Average sprite hues to mix paint streams
  const avgHue = averageHues(sprite1.hue, sprite2.hue)
  // Update color of first sprite
  sprite1.hue = avgHue
  sprite1.color = hslaColor(avgHue, sprite1.opacity) // , saturation, lightness)
  // Average width and height and update first sprite
  sprite1.width = (sprite1.width + sprite2.width) // / 2.
  sprite1.height = (sprite1.height + sprite2.height) // / 2.
  // Average velocities and update first sprite
  sprite1.dx = (sprite1.dx + sprite2.dx) / 2.
  sprite1.dy = (sprite1.dy + sprite2.dy) / 2.
  sprite1.dw = (sprite1.dw + sprite2.dw) / 2.
  // Delete second sprite to merge streams
  deleteSprite(sprite2)
}

function mixOrMergeSprites(sprite1, sprite2) {
  // Calculate minimum distance for sprites to touch
  const horizDist = (sprite1.width + sprite2.width) / 2.
  const vertDist = (sprite1.height + sprite2.height) / 2.
  // Check if sprites almost touch
  if (Math.abs(sprite1.x - sprite2.x) < horizDist * distFactor &&
      Math.abs(sprite1.y - sprite2.y) < vertDist * distFactor) {
    const dist = distance(sprite1, sprite2)
    const distLimit = (horizDist + vertDist) / 2. * distFactor
    // Average sprite hues to mix paint streams
    const avgHue = averageHues(sprite1.hue, sprite2.hue)
    // Check if streams should merge and sprites overlap
    if (mergeStreams && dist < distLimit * 0.2) {
      console.log('Merge streams')
      // console.log('Merge streams - sprite1:', sprite1, 'sprite2:', sprite2)
      mergeSprites(sprite1, sprite2)
    }
    // Check if streams should mix hues and sprites are near
    else if (mixStreams && dist < distLimit) { // 20 < 50
      // console.log('Mixing streams')
      // console.log('Mixing streams - sprite1:', sprite1, 'sprite2:', sprite2)
      // Average each sprite's hue with average hue of both sprites
      let hue1 = averageHues(sprite1.hue, avgHue)
      let hue2 = averageHues(sprite2.hue, avgHue)
      // Distance/pure ratio - how much to keep hues pure
      const pureRatio = dist / distLimit // 20 / 50 = 0.4
      // Nearness/mix ratio - how much to mix hues together
      const mixRatio = (distLimit - dist) / distLimit // 30 / 50 = 0.6
      const stepsBack = pureRatio * 3
      for (let step = 0; step < stepsBack; step++) {
        hue1 = averageHues(hue1, sprite1.hue)
        hue2 = averageHues(hue2, sprite2.hue)
      }
      // // Check if both mix and pure ratios in range [0.4, 0.6]
      // if (Math.abs(mixRatio - pureRatio) <= 0.2) {
      //   // Do nothing, keep hues as halfway to average
      // }
      // // Check if mix ratio in [0.6, 0.8] and pure ratio in [0.2, 0.4]
      // else if (mixRatio <= 0.8) { // pureRatio >= 0.2
      //   // Mix hues by pushing toward average hue of both sprites
      //   // hue1 = averageHues(hue1, avgHue)
      //   // hue2 = averageHues(hue2, avgHue)
      // }
      // else if (mixRatio >= 0.6) { // pureRatio <= 0.4
      //   hue1 = averageHues(hue1, sprite1.hue)
      //   hue2 = averageHues(hue2, sprite2.hue)
      // }
      // // Check if mix ratio in [0.2, 0.4] and pure ratio in [0.6, 0.8]
      // else if (mixRatio >= 0.2) { // pureRatio <= 0.8
      //   // Purify hues by pulling back toward sprites' original hues
      //   hue1 = averageHues(hue1, sprite1.hue)
      //   hue2 = averageHues(hue2, sprite2.hue)
      //   hue1 = averageHues(hue1, sprite1.hue)
      //   hue2 = averageHues(hue2, sprite2.hue)
      // }
      // Set sprite hues and colors to newly mixed hues
      sprite1.hue = hue1
      sprite2.hue = hue2
      sprite1.color = hslaColor(hue1, sprite1.opacity)
      sprite2.color = hslaColor(hue2, sprite2.opacity)
    }
  }
}

function animateSprite(sprite) {
  // Chance of death based on size (small sprite are more likely to die)
  const chanceOfDeath = chanceOfRandomDeath * (maxSize - sprite.width) / maxSize
  if (!sprite.dead && rollDie(chanceOfDeath)) {
    // Redraw sprite with dead eyes
    sprite.dead = true
    sprite.lifeLeft = 1.0
  }

  // Accelerate horizontally to jiggle sprite sideways
  let ddx = randomFloat(-0.3, 0.3) * speedFactor
  // Clamp horizontal velocity based on max speed limit
  if (Math.abs(sprite.dx + ddx) > maxSpeedX * speedFactor)
    ddx *= -1 // Reverse horizontal jiggle
    // ddx *= 0.5 // Reduce horizontal jiggle
    // ddx = 0 // Remove horizontal jiggle
  sprite.dx += ddx
  // Clamp horizontal velocity based on vertical velocity
  if (Math.abs(sprite.dx) > Math.abs(sprite.dy) * 0.6)
    sprite.dx = Math.sign(sprite.dx) * Math.abs(sprite.dy) * 0.6
  // Clamp horizontal velocity based on size to avoid visual discontinuities
  if (sprite.dx > sprite.width * 0.2)
    sprite.dx = sprite.width * 0.2
  if (sprite.dead)
    sprite.dx *= (sprite.lifeLeft + 1) / 2
  // Move sideways with horizontal velocity
  sprite.x += sprite.dx

  // Accelerate down with gravity minus friction from wall adhesion
  let directionY = Math.sign(sprite.dy)
  let ddy = randomFloat(-0.1, 0.3) * directionY * speedFactor
  if ((sprite.dy + ddy) * directionY > maxSpeedY * speedFactor ||
      (sprite.dy + ddy) * directionY < minSpeedY * speedFactor)
    // ddy *= -1 // Reverse vertical jiggle
    ddy *= 0.5 // Reduce vertical jiggle
    // ddy = 0 // Remove vertical jiggle
  sprite.dy += ddy
  // Clamp vertical velocity based on min and max speed limits
  if (sprite.dy * directionY > maxSpeedY * speedFactor)
    sprite.dy = maxSpeedY * directionY * speedFactor
  else if (sprite.dy * directionY < minSpeedY * speedFactor)
    sprite.dy = minSpeedY * directionY * speedFactor
  // Clamp vertical velocity based on size to avoid visual discontinuities
  if (sprite.dy * directionY > sprite.height * 0.3 * speedFactor)
    sprite.dy = sprite.height * 0.3 * directionY * speedFactor
  if (sprite.dead)
    sprite.dy *= sprite.lifeLeft
  // Move down with vertical velocity
  sprite.y += sprite.dy

  if (sprite.dead) {
    // sprite.update(ctx)
    if (sprite.lifeLeft > 0) {
      const stepsToDeath = 200.0
      sprite.lifeLeft -= 1.0 / stepsToDeath
      sprite.width -= minSize / stepsToDeath
      if (sprite.width < 1)
        sprite.width = 1
    }
    else
      // Kill sprite to allow others to be born when a stream splits
      deleteSprite(sprite)
  }
  else {
    // // Jiggle width to allow sprites to grow and shrink with momentum
    // let ddw = randomFloat(-0.01, 0.01) // * speedFactor
    // if (sprite.dw + ddw > 1 || sprite.dw + ddw < -1)
    //   ddx = -ddx // Reverse grow-shrink jiggle
    // sprite.dw += ddw
    // Random grow-shrink velocity without momentum
    sprite.dw = randomFloat(-1, 1) // * speedFactor
    // Check if new width would be too large or small
    if (sprite.width + sprite.dw > maxSize ||
        sprite.width + sprite.dw < minSize)
      sprite.dw *= -0.5 // Reverse grow-shrink velocity
      // sprite.dw = 0 // Remove grow-shrink velocity
    sprite.width += sprite.dw
    if (sprite.width < minSize)
      sprite.width = minSize
  }

  // Check whether to stop or bounce when sprite passes left or right boundary
  if (stopLeftRight || bounceLeftRight) {
    // Check if sprite has passed left boundary
    if (sprite.x < sprite.width/2.) {
      sprite.x = sprite.width/2.
      sprite.dx = bounceLeftRight ? Math.abs(sprite.dx) : 0
    }
    // Check if sprite has passed right boundary
    else if (sprite.x > canvas.width - sprite.width/2.) {
      sprite.x = canvas.width - sprite.width/2.
      sprite.dx = bounceLeftRight ? -Math.abs(sprite.dx) : 0
    }
  }

  // Check whether to stop or bounce when sprite passes top or bottom boundary
  if (stopTopBottom || bounceTopBottom) {
    // Check if sprite has passed top boundary
    if (sprite.y < sprite.height/2.) {
      sprite.y = sprite.height/2.
      sprite.dy = bounceTopBottom ? Math.abs(sprite.dy) : 0
    }
    // Check if sprite has passed bottom boundary
    else if (sprite.y > canvas.height - sprite.height/2.) {
      sprite.y = canvas.height - sprite.height/2.
      sprite.dy = bounceTopBottom ? -Math.abs(sprite.dy) : 0
    }
  }
  // Check if sprite is below bottom
  else if (sprite.y > canvas.height + sprite.height) {
    // Chance of death based on population and cull when overpopulated
    const chanceOfDeathOrReset = 1.0 * sprites.length / maxNumSprites
    // Roll die with chance of death or reset
    if (rollDie(chanceOfDeathOrReset))
      // Kill sprite to allow others to be born when a stream splits
      deleteSprite(sprite)
    else if (!sprite.dead)
      // Reset sprite to start a new stream
      resetSprite(sprite)
  }

  // Check if sprite hue should cycle
  if (sprite.hueCycle || sprite.dead) {
    const saturation = 80
    const lightness = 50 * (sprite.dead ? sprite.lifeLeft : 1)
    const opacity = sprite.dead ? sprite.lifeLeft : 1.0 // 0.8 // sprite.opacity
    if (sprite.hueCycle)
      // sprite.hue = (sprite.hue + spriteHueCycleRate * randomFloat(1, 3)) % 360
      sprite.hue = (sprite.hue + sprite.hueCycle) % 360
    sprite.color = hslaColor(sprite.hue, opacity, saturation, lightness)
  }

  // Redraw sprite
  sprite.update(ctx)

  // Check whether to split streams and if sprites are overpopulated
  if (splitStreams && sprites.length < maxNumSprites && !sprite.dead) {
    // Larger and faster streams have higher chance of splitting
    let chanceOfSplit = chanceOfRandomSplit * sprite.width / maxSize
    chanceOfSplit *= Math.abs(sprite.dy) / maxSpeedY
    // Small population increases chance of splitting stream
    chanceOfSplit *= maxNumSprites - sprites.length
    // Roll die to determine whether to split stream
    if (rollDie(chanceOfSplit)) {
      splitStream(sprite)
    }
  }
}

function interactSpritePairs() {
  // Check whether to mix or mrege streams
  if (!mixStreams && !mergeStreams)
    return
  // Loop over all sprites except last
  for (let i = 0; i < sprites.length - 1; i++) {
    const sprite1 = sprites[i]
    if (sprite1.dead)
      continue // Skip
    // Loop over all sprites after first
    for (let j = i + 1; j < sprites.length; j++) {
      const sprite2 = sprites[j]
      if (sprite2.dead)
        continue // Skip
      // Only mix or merge sprites if hues are different
      if (sprite1.hue !== sprite2.hue) {
        // console.log(sprite1.hue)
        // console.log(sprite2.hue)
        mixOrMergeSprites(sprite1, sprite2)
      }
    }
  }
}

function drawBackground() {
  canvasHue = (canvasHue + canvasHueCycleRate) % 360
  ctx.fillStyle = `hsla(${canvasHue}, 70%, 45%, ${canvasOpacity})`
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  // // Fill canvas with a veritical gradient
  // const numPanels = 36
  // for (let i = 0; i < numPanels; i++) {
  //   const panelHue = (canvasHue + i * 360 / numPanels) % 360
  //   ctx.fillStyle = `hsla(${panelHue}, 80%, 50%, ${canvasOpacity})`
  //   const panelHeight = canvas.height / numPanels
  //   ctx.fillRect(0, i * panelHeight, canvas.width, panelHeight)
  // }
}

function updateTitle() {
  const titleHue = (canvasHue + 135) % 360
  const shadowHue = (canvasHue - 45) % 360
  const shadowColor = `hsla(${shadowHue}, 100%, 50%, 1.0)`
  title.style.color = `hsla(${titleHue}, 100%, 50%, 1.0)`
  title.style.textShadow = `0 0 8px ${shadowColor}, 0 0 16px ${shadowColor}`
}

function onFrame(timestamp) {
  drawBackground()
  updateTitle()
  // Animate each sprite to flow and split streams
  sprites.forEach(animateSprite)
  // Interact all sprite pairs to mix and merge streams
  interactSpritePairs()

  // if (!lastTimestamp)
  //   lastTimestamp = timestamp
  // else if (timestamp - lastTimestamp > 200) {
  //   lastTimestamp = timestamp
    frameID = requestAnimationFrame(onFrame)
  // }
}

resizeCanvas()
createInitialSprites()
// Start animation on first page load
frameID = requestAnimationFrame(onFrame)

// Handle mouse click
window.addEventListener('click', function () {
  if (frameID) {
    // Stop animation and reset frame ID
    cancelAnimationFrame(frameID)
    frameID = 0
  } else {
    // Start animation and save frame ID
    frameID = requestAnimationFrame(onFrame)
  }
}, false)

function resizeCanvas() {
  console.log('canvas width:', canvas.width, 'height:', canvas.height)
  console.log('window width:', window.innerWidth, 'height:', window.innerHeight)
  // console.dir(window)
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

// Handle window resize
window.addEventListener('resize', function () {
  resizeCanvas()
  drawBackground()
  updateTitle()
}, false)
