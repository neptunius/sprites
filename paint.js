const title = document.getElementById('title')
const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')
const initNumSprites = canvas.width / 20
const maxNumSprites = canvas.width / 5
const sprites = []
const sqrt2 = Math.sqrt(2)
let frameID = 0
let canvasHue = 0

function near(sprite1, sprite2) {
  // Calculate minimum distance for sprites to touch
  const horizDist = sprite1.width + sprite2.width
  const vertDist = sprite1.height + sprite2.height
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
  const hue = ((hue1 + hue2) / 2 + (hueDiff > 180 ? 180 : 0)) % 360
  // if (hueDiff <= 180)
  //   const hue = (hue1 + hue2) / 2
  // else // hueDiff > 180
  //   const hue = (hue1 + hue2 + 360) / 2
  return hue
}

function createSprite() {
  const x = randomFloat(0, canvas.width) // Math.random() * canvas.width
  const y = randomFloat(-canvas.height, 0) // Math.random() * -canvas.height
  const width = randomFloat(8, 8 + 16) // Math.random() * 16 + 8
  const height = randomFloat(5, 5 + 10) // Math.random() * 10 + 5
  const hue = randomFloat(0, 360) // Math.random() * 360
  const color = `hsla(${hue}, 100%, 50%, 0.8)`
  const sprite = Sprite(x, y, 0, width, height, color)
  // sprite.id = id
  sprite.hue = hue
  sprite.shape = 'circle'
  addSpriteMotion(sprite)
  return sprite
}

function addSpriteMotion(sprite) {
  sprite.dx = randomFloat(-1, 1)
  sprite.dy = randomFloat(3, 6) // Math.random() * 3 + 3
  sprite.dw = randomFloat(3, 6) // Math.random() * 3 + 3
}

function resetSprite(sprite) {
  sprite.x = randomFloat(0, canvas.width)
  sprite.y = randomFloat(-canvas.height, 0)
  sprite.width = randomFloat(8, 8 + 16)
  sprite.height = randomFloat(5, 5 + 10)
  addSpriteMotion(sprite)
}

function cloneSprite(s) {
  const sprite = Sprite(s.x, s.y, s.rotation, s.width, s.height, s.color)
  // sprite.id = s.id
  sprite.dx = s.dx
  sprite.dy = s.dy
  sprite.dw = s.dw
  sprite.hue = s.hue
  sprite.shape = s.shape
  return sprite
}

function mergeSprites(s1, s2) {
  // Average sprite hues to mix paint streams
  avgHue = averageHues(s1.hue, s2.hue)
  s1.color = `hsla(${avgHue}, 100%, 50%, 0.8)`
  // if (hue === Number.NaN)
  // console.log(hue)
  // Average sprite width and height
  s1.width = (s1.width + s2.width) / sqrt2
  s1.height = (s1.height + s2.height) / sqrt2
  // Average sprite velocities
  s1.dx = (s1.dx + s2.dx) / 2
  s1.dy = (s1.dy + s2.dy) / 2
  s1.dw = (s1.dw + s2.dw) / 2
  // Delete other sprite to merge streams
  sprites.splice(sprites.indexOf(s2), 1)
}

function animateSprite(sprite) {
  // Move x left or right to jiggle sprites sideways with momentum
  let ddx = randomFloat(-.5, .5)
  if (sprite.dx + ddx > 2 || sprite.dx + ddx < -2)
    ddx = -ddx // Reverse left-right jiggle
  sprite.dx += ddx
  sprite.x += sprite.dx
  // Move y down to make sprites fall with gravity minus a jiggle from friction
  let ddy = randomFloat(-.1, .2)
  if (sprite.dy + ddy > 8 || sprite.dy + ddy < 2)
    // ddy *= .5 // Reduce up-down jiggle
    ddy = 0 // Remove up-down jiggle
  sprite.dy += ddy
  sprite.y += sprite.dy
  // Jiggle width to allow sprites to grow and shrink as they fall
  sprite.dw = randomFloat(-1, 1)
  if (sprite.width + sprite.dw > 20 || sprite.width + sprite.dw < 5)
    sprite.dw = -sprite.dw
  sprite.width += sprite.dw
  // Clamp speed to half sprite width to avoid visual discontinuities
  if (sprite.dy > sprite.width / 3)
    sprite.dy = sprite.width / 3

  // Check if sprite is outside of right or left boundary
  // if (sprite.x + sprite.width/2 > canvas.width || sprite.x - sprite.width/2 < 0) {
  //   sprite.dx = -sprite.dx
  //   sprite.x += sprite.dx
  // }
  // Check if sprite is outside of bottom or top boundary
  // if (sprite.y + sprite.height/2 > canvas.height || sprite.y - sprite.height/2 < 0) {
  //   if (sprite.y <= 0)
  //     sprite.y = sprite.height/2
  //   sprite.dy = -sprite.dy
  //   sprite.y += sprite.dy
  // }
  // else
  // Check if sprite is below bottom
  if (sprite.y > canvas.height + sprite.height) {
    // Check if sprites are maxed out and roll die with 25% chance
    if (sprites.length >= maxNumSprites && Math.random() < .25) {
      // Delete sprite to allow others to clone
      sprites.splice(sprites.indexOf(sprite), 1)
      // const index = sprites.indexOf(sprite)
      // if (index >= 0)
      //   sprites.splice(index, 1)
    }
    else
      // Reset sprite to above top
      resetSprite(sprite)
  }
  // Redraw sprite
  sprite.update(ctx)
  // return // Skip splitting
  // Check if sprites are maxed out and roll die with 1% chance
  if (sprites.length < maxNumSprites && Math.random() < .01) {
    // Clone sprite to split stream in two directions
    const clone = cloneSprite(sprite)
    // console.log(clone.color)
    // Increase sprite's sideways motion, but clamped
    sprite.dx *= 2
    if (sprite.dx > 2 || sprite.dx < -2)
      sprite.dx /= sprite.dx / 2
    // Clone's sideways motion is opposite of original
    clone.dx = -sprite.dx
    // Make sprite and clone half size since stream split
    // if (sprite.width > 2) {
    //   sprite.width /= 2
    //   clone.width /= 2
    // }
    // Append clone to animate it
    sprites.push(clone)
  }
}

function collideSprites() {
  for (let i = 0; i < sprites.length; i++) {
    const sprite = sprites[i]
    // sprites.forEach(function (other) {
    for (let j = i + 1; j < sprites.length; j++) {
      const other = sprites[j]
      if (sprite !== other && sprite.hue !== other.hue) {
        // console.log(sprite.hue)
        // console.log(other.hue)
        // Calculate minimum distance for sprites to touch
        const horizDist = sprite.width + other.width
        const vertDist = sprite.height + other.height
        // Check if sprites almost touch
        if (Math.abs(sprite.x - other.x) < horizDist &&
            Math.abs(sprite.y - other.y) < vertDist) {
          const dist = distance(sprite, other)
          const distLimit = (horizDist + vertDist) / 2
          // Average sprite hues to mix paint streams
          const avgHue = averageHues(sprite.hue, other.hue)
          // Check if sprites overlap
          if (dist < distLimit * 0.2) {
            mergeSprites(sprite, other)
          }
          // Check if sprites touch are should mix hues
          else if (dist < distLimit) { // 20 < 50
            // Average each sprite's hue with average hue of both sprites
            let hue1 = averageHues(sprite.hue, avgHue)
            let hue2 = averageHues(other.hue, avgHue)
            // Distance/pure ratio - how much to keep hues pure
            const pureRatio = dist / distLimit // 20 / 50 = 0.4
            // Nearness/mix ratio - how much to mix hues together
            const mixRatio = (distLimit - dist) / distLimit // 30 / 50 = 0.6
            // Check if both mix and pure ratios in range [0.4, 0.6]
            if (Math.abs(mixRatio - pureRatio) <= 0.2) {
              // Do nothing, keep hues as halfway to average
            }
            // Check if mix ratio in [0.6, 0.8] and pure ratio in [0.2, 0.4]
            else if (mixRatio <= 0.8) { // pureRatio >= 0.2
              // Mix hues by pushing toward average hue of both sprites
              hue1 = averageHues(hue1, avgHue)
              hue2 = averageHues(hue2, avgHue)
            }
            // Check if mix ratio in [0.2, 0.4] and pure ratio in [0.6, 0.8]
            else if (mixRatio >= 0.2) { // pureRatio <= 0.8
              // Purify hues by pulling back toward sprites' original hues
              hue1 = averageHues(hue1, sprite.hue)
              hue2 = averageHues(hue2, other.hue)
            }
            // Set sprite colors bases on new mixed hues
            sprite.color = `hsla(${hue1}, 100%, 50%, 0.8)`
            other.color = `hsla(${hue2}, 100%, 50%, 0.8)`
          }
        }
      }
    }
    // })
  }
}

for (let i = 0; i < initNumSprites; i++) {
  const sprite = createSprite()
  sprites.push(sprite)
}

function drawBackground() {
  canvasHue += 1
  ctx.fillStyle = `hsla(${canvasHue}, 100%, 50%, 0.005)`
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  title.style.color = `hsla(${canvasHue}, 100%, 50%, 0.8)`
}

drawBackground()
let lastTime
function onFrame(timestamp) {
  drawBackground()

  sprites.forEach(animateSprite)
  collideSprites()

  // if (!lastTime)
  //   lastTime = timestamp
  // else if (timestamp - lastTime > 200) {
  //   lastTime = timestamp
    frameID = requestAnimationFrame(onFrame)
  }
}

// HANDLE MOUSE CLICK
window.addEventListener('click', function () {
  if (frameID) {
    // Stop animation
    cancelAnimationFrame(frameID)
    frameID = 0
  } else {
    // Start animation
    frameID = requestAnimationFrame(onFrame)
  }
}, false)
