/* 

The code below creates a factory function on 
the window object that generates "Sprite".

A Sprite is an Object that positions a a DOM
element at an x, y, and y coordinate. 

The code below is organized in a portable 
block that is easily incorporated into other 
projects. 

*/

// Define an anonymouse self executing function. 
// This encapsulates all of the code here. 

(function(global) {
  // Define a class/function
  var Sprite = function(x, y, r, w, h, c) {
    return new Sprite.init(x, y, r, w, h, c)
  }
  
  // Define methods on prototype obj
  Sprite.prototype = {
    // Color
    color: function(c) {
      this.color = c
      return this
    },
    // Size
    size: function(w, h) {
      this.width = w
      this.height = h
      return this
    }, 
    // Move
    move: function(x, y) {
      this.x = x
      this.y = y
      
      return this // *** If the methods return 'this' they can be chained!
    },
    // Rotate
    rotate: function(r) {
      this.rotation = r
      return this
    },
    // Update
    update: function(ctx) {
      
      // Save the current state of the context
      ctx.save();
      
      // ctx.globalCompositeOperation = 'destination-over';
      
      // Move the origin of the context to the location of rectangle
      ctx.translate(this.x, this.y);
      
      // Rotate the context
      ctx.rotate(this.rotation * Math.PI / 180);
      
      // Set the fill style
      ctx.fillStyle = this.color;
      
      
      if (this.shape === 'circle') {
        // Draw a circle (arc of 360 degrees) with radius half its width
        ctx.beginPath();
        let radius = this.width / 2. + (this.eyes ? 10 : 0) // Bigger with eyes
        if (radius <= 0) {
          console.log('radius:', radius)
          console.dir(this)
          radius = 1.0
        }
        ctx.arc(0, 0, radius, 0, 2 * Math.PI);
        ctx.fill();
        if (this.eyes) { // || this.dead) {
          // Set the fill style to black
          const eyeHue = (this.hue + 150) % 360
          const eyeLightness = this.dead ? (1 - this.lifeLeft) * 100 : 60
          ctx.fillStyle = `hsla(${eyeHue}, 100%, ${eyeLightness}%, 1.0)`
          const eyeRadius = radius / 6. //(2 * 6) 12.
          const pupilDist = radius / 3. // Pupillary distance from center
          const xOffset = radius / 12. * this.dx // Shift eyes left or right
          const yOffset = radius / 2. * this.dy / maxSpeedY // Top or bottom
          for (let eye = -1; eye <= 1; eye += 2) {
            // Draw a circle (arc of 360 degrees) with radius half its width
            ctx.beginPath();
            ctx.arc(eye * pupilDist + xOffset, yOffset, eyeRadius, 0, 2 * Math.PI);
            ctx.fill();
          }
        }
      }
      else {
        // Draw a rectangle with a location offset at half its width and height
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
      }
      // Restore the context to it's original state
      ctx.restore();
      
      return this // *** If the methods return 'this' they can be chained!
    }
  }
  
  // Define an initializer function
  Sprite.init = function(x, y, r, w, h, c) {
    this.x        = x || 0
    this.y        = y || 0
    this.rotation = r || 0
    this.width    = w || 40
    this.height   = h || 40
    this.color    = c || 'red'
  }
  
  // Sprite()
  
  // Set the prototype of init
  Sprite.init.prototype = Sprite.prototype
  
  // Attach factory method to global object 
  global.Sprite = global.$prite = Sprite
  
}(window)); // Pass in window as the global object


// Challenge Make a 

(function(global) {
  
  var TextSprite = function(t, x, y, r, w, h, c) {
    return new Sprite.init(t, x, y, r, w, h, c)
  }
  
  TextSprite.prototype = Sprite.prototype
  
  // Define an initializer function
  TextSprite.init = function(t, x, y, r, w, h, c) {
    this.str      = t || "Hello World"
    this.x        = x || 0
    this.y        = y || 0
    this.rotation = r || 0
    this.width    = w || 40
    this.height   = h || 40
    this.color    = c || 'red'
  }
  
  
  // Set the prototype of init
  TextSprite.init.prototype = TextSprite.prototype
  
  // Attach factory method to global object 
  global.TextSprite = Sprite
  
}(window));
