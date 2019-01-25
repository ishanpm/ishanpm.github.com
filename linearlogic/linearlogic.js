var canvas = $("#canvas")

var ctx = canvas[0].getContext("2d")

function doResize() {
  // Save width and height to ctx for easy access in draw functions
  ctx.width =canvas[0].width=$(window).width()
  ctx.height=canvas[0].height=$(window).height()
  
  root.width = ctx.width;
  root.height = ctx.height;
}
$(window).on("resize",doResize)

ctx.circ = function circ(x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2*Math.PI);
}
ctx.strokeCirc = function strokeCirc(x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2*Math.PI);
  ctx.stroke();
}
ctx.fillCirc = function fillCirc(x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2*Math.PI);
  ctx.fill();
}

class LogicToolbar {
  constructor(root) {
    this.root = root;
    this.cursorx = 0;
    this.icons = [];
    
    // Build icons
    for (var i=0; i<8; i++) {
      this.icons[i] = new LogicOperator(this.root);
      
      if (i < 5) {
        this.icons[i].type = i;
      } else {
        this.icons[i].type = 1;
        var newOp = new LogicOrnament(this.root);
        newOp.type = i
        this.icons[i].addOrnament(newOp);
      }
      
      if (i == 0) {
        this.icons[i].label = "a";
      }
    }
  }
  
  hitTest(x,y) {
    return x < 20*22 && y < 20*2;
  }
  
  onClick(x,y,ctx) {
    x = Math.floor(x/40);
    
    if (x == 0) {
      root.mode = "action";
    } else if (x == 1) {
      root.mode = "pan"
    } else if (x == 2) {
      root.mode = "delete"
    } else if (x == 3 && root.mode == "add" && root.addType == 0) {
      var index = "abcdefghi".indexOf(root.addLabel);
      root.addLabel = "bcdefghia".charAt(index);
    } else {
      root.mode = "add"
      root.addType = x - 3;
      root.addLabel = "a";
    }
  }
  
  tick() {
    var selection = 0;
    if (root.mode == "action") {
      selection = 0;
    } else if (root.mode == "pan") {
      selection = 1;
    } else if (root.mode == "delete") {
      selection = 2;
    } else {
      selection = 3 + root.addType;
    }
    
    this.cursorx += (selection - this.cursorx)/5
    
    // Tick icon operators
    for (var i=0; i<this.icons.length; i++) {
      this.icons[i].tick();
    }
    
    // Update label icon
    if (this.icons[0].label != this.root.addLabel) {
      this.icons[0].label = this.root.addLabel;
      this.icons[0].labelWidth = null;
    }
  }
  
  draw(ctx) {
    ctx.save()
    
    ctx.scale(20,20)
    
    // Frame
    ctx.fillStyle = "white";
    ctx.strokeStyle = "#aaa";
    ctx.lineWidth = "0.1"
    ctx.beginPath();
    ctx.rect(0,0,22,2)
    ctx.fill()
    ctx.stroke()
    
    ctx.beginPath();
    ctx.moveTo(6,.2)
    ctx.lineTo(6,1.8)
    ctx.stroke()
    
    // Draw control icons
    for (var i=0; i<11; i++) {
      this.drawIcon(ctx, i*2, i)
    }
    
    // Selection cursor
    ctx.strokeStyle = "black"
    ctx.beginPath();
    ctx.rect(this.cursorx*2,0,2,2)
    ctx.stroke()
    
    ctx.restore()
  }
  
  drawIcon(ctx, x, i) {
    // Because like who needs images anyway
    if (i == 0) {
      // Cursor
      ctx.fillStyle = "black";
      ctx.beginPath();
      ctx.moveTo(x+0.6,0.4)
      ctx.lineTo(x+0.6,1.6)
      ctx.lineTo(x+1,1.2)
      ctx.lineTo(x+1.4,1.2)
      ctx.closePath();
      ctx.fill();
      /*
      ctx.strokeStyle = "black";
      ctx.beginPath();
      ctx.moveTo(x+0.95,1.2)
      ctx.lineTo(x+1.2,1.6)
      ctx.stroke();
      */
    } else if (i == 1) {
      // Pan
      var p = 0.4; // padding
      var d = 0.2; // line distance
      ctx.strokeStyle = "black"
      ctx.beginPath
      ctx.moveTo(x+1-d,p+d)
      ctx.lineTo(x+1  ,p  )
      ctx.lineTo(x+1+d,p+d)
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x+2-p-d,1-d)
      ctx.lineTo(x+2-p  ,1  )
      ctx.lineTo(x+2-p-d,1+d)
      ctx.stroke();
      ctx.moveTo(x+1-d,2-p-d)
      ctx.lineTo(x+1  ,2-p  )
      ctx.lineTo(x+1+d,2-p-d)
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x+p+d,1-d)
      ctx.lineTo(x+p  ,1  )
      ctx.lineTo(x+p+d,1+d)
      ctx.stroke();
    } else if (i == 2) {
      // Delete
      ctx.strokeStyle = "black";
      ctx.beginPath();
      ctx.moveTo(x+0.4,0.4)
      ctx.lineTo(x+1.6,1.6)
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x+0.4,1.6)
      ctx.lineTo(x+1.6,0.4)
      ctx.stroke();
    } else {
      if (this.icons[i-3]) {
        this.icons[i-3].draw(ctx,x+1,1)
      }
    }
  }
}

// Monadic (only takes one argument) operator
// I wrote this around Christmas so it's called an ornament
class LogicOrnament {
  constructor(root) {
    this.parent = root;
    this.root = root;
    this.x = 0;
    this.y = 0;
    this.r = 0.5;
    this.isOrnament = true;
    // Distance from border of parent, for animations
    this.dist = 0;
    this.th = 0;
    this.i = 0;
    this.type = 5;
  }
  
  copy(newParent) {
    var result = new LogicOrnament(this.root)
    result.parent = newParent;
    result.x = this.x;
    result.y = this.y;
    result.r = this.r;
    result.dist = this.dist;
    result.th = this.th;
    result.i = this.i;
    result.type = this.type;
    
    return result;
  }
  
  hitTest(x, y) {
    return Math.sqrt(Math.pow(x-this.x,2)+Math.pow(y-this.y,2)) < this.r;
  }
  
  toRelativePos(x, y) {
    if (this.parent == this.root) {
      return [x-this.x, y-this.y];
    }
    var out = this.parent.toRelativePos(x, y)
    out[0] -= this.x;
    out[1] -= this.y;
    return out;
  }
  
  fromRelativePos(x, y) {
    if (this.parent == this.root) {
      return [x+this.x, y+this.y];
    }
    var out = this.parent.fromRelativePos(x, y)
    out[0] += this.x;
    out[1] += this.y;
    return out;
  }
  
  // Returns true if target can be reached by travelling up the hierarchy
  hasAncestor(target) {
    if (target === this)
      return true;
    return this.parent.hasAncestor(target);
  }
  
  // Returns true if any ancestor has a negative ornament, or if in an earlier slot than a negative ornament
  underNegative() {
    var i = this.parent.ornaments.indexOf(this) + 1;
    for (; i<this.parent.ornaments.length; i++) {
      if (this.parent.ornaments[i].type == 5) {
        return true;
      }
    }
    return this.parent.parent.underNegative();
  }
  
  tick() {
    var tth = this.i/this.parent.r + (this.r * 2)
    this.th += (tth - this.th)* 0.1
    this.th = this.th || 0;
    
    this.dist *= 0.8;
    this.x = Math.cos(this.th) * (this.parent.r + this.dist)
    this.y = -Math.sin(this.th) * (this.parent.r + this.dist)
  }
  
  draw(ctx, ox, oy) {
    ctx.fillStyle = ["black","red","blue"][this.type - 5];
    ctx.strokeStyle = ["#555","#a00","#008"][this.type - 5]
    
    ctx.fillCirc(this.x + ox, this.y + oy, this.r)
    ctx.stroke();
    
    var symbol = ["~","!","?"][this.type-5]
    if (symbol) {
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "0.8px sans-serif"
      ctx.fillText(symbol,this.x + ox,this.y + oy);
    }
  }
}

// Associative and commutative operator
class LogicOperator {
  constructor(root) {
    this.parent = root;
    this.root = root;
    this.children = [];
    this.ornaments = [];
    this.x = 0;
    this.y = 0;
    this.r = 0;
    this.type = 0;
    this.label = null;
    this.isOrnament = false;
    // x and y for next tick
    this.nx = 0;
    this.ny = 0;
    // Distance from center
    this.dist = 0;
  }
  
  copy(newParent) {
    var result = new LogicOperator(this.root)
    result.parent = newParent;
    result.children = this.children.map(e => e.copy(result))
    result.ornaments = this.ornaments.map(e => e.copy(result))
    result.x = this.x;
    result.y = this.y;
    result.r = this.r;
    result.type = this.type;
    result.label = this.label;
    result.labelWidth = null;
    result.nx = this.nx;
    result.ny = this.ny;
    result.dist = this.dist;
    
    return result
  }
  
  renumberOrnaments() {
    for (var i=0; i<this.ornaments.length; i++) {
      this.ornaments[i].i = i;
    }
  }
  
  pushFrom(other) {
    var dx = this.x - other.x
    var dy = this.y - other.y
    
    var dist = Math.sqrt(Math.pow(dx,2)+Math.pow(dy,2))
    var over = this.r + other.r + 1 - dist
    if (over>0) {
      var px = dx/dist * over;
      var py = dy/dist * over;
      this.nx += px/4;
      this.ny += py/4;
    }
  }
  
  toRelativePos(x, y) {
    if (this.parent == this.root) {
      return [x-this.x, y-this.y];
    }
    var out = this.parent.toRelativePos(x, y)
    out[0] -= this.x;
    out[1] -= this.y;
    return out;
  }
  
  fromRelativePos(x, y) {
    if (this.parent == this.root) {
      return [x+this.x, y+this.y];
    }
    var out = this.parent.fromRelativePos(x, y)
    out[0] += this.x;
    out[1] += this.y;
    return out;
  }
  
  pushFromEdge(r) {
    var over = this.dist + this.r + 1.05 - r
    if (over > 0 && this.dist) {
      over = Math.log(over+1)
      //this.nx -= this.x/this.dist * over /10
      //this.ny -= this.y/this.dist * over /10
      this.nx /= (over/5 +1)
      this.ny /= (over/5 +1)
    }
  }
  
  hitTest(x, y) {
    if (this.ornaments.length > 0) {
      for (var i=0; i<this.ornaments.length; i++) {
        if (this.ornaments[i].hitTest(x - this.x, y - this.y)){
          return true;
        }
      }
    }
    return Math.sqrt(Math.pow(x-this.x,2)+Math.pow(y-this.y,2)) < this.r;
  }
  
  // Get the element pointed to by x,y
  getElementAt(x, y) {
    // Relative x and y
    var rx = x - this.x;
    var ry = y - this.y;
    
    for (var i=0; i<this.ornaments.length; i++) {
      if (this.ornaments[i].hitTest(rx,ry)) {
        return this.ornaments[i];
      }
    }
    for (var i=0; i<this.children.length; i++) {
      if (this.children[i].hitTest(rx,ry)) {
        return this.children[i].getElementAt(rx, ry);
      }
    }
    
    // No child found; return self
    return this;
  }
  
  // Returns true if target can be reached by travelling up the hierarchy
  hasAncestor(target) {
    if (target === this)
      return true;
    if (this.parent === this.root)
      return (target === this.root);
    //else
    return this.parent.hasAncestor(target);
  }
  
  // Returns true if this or any ancestor has a negative ornament
  underNegative() {
    for (var i=0; i<this.ornaments.length; i++) {
      if (this.ornaments[i].type === 5) {
        return true;
      }
    }
    
    if (this.parent === this.root)
      return false;
    //else
    return this.parent.underNegative();
  }
  
  // Returns true if this has exactly the same contents as other
  // If neg is true, also requires a difference of exactly one negative
  // ornament in the last slot
  equals(other, neg) {
    // Can't match the base
    if (other === this.root) return false;
    // Can't match ornaments
    if (other.isOrnament) return false;
    if (neg) {
      if (Math.abs(this.ornaments.length-other.ornaments.length)!==1) return false;
    } else {
      if (this.ornaments.length !== other.ornaments.length) return false;
    }
    if (this.children.length !== other.children.length) return false;
    if (this.label != other.label) return false;
    
    // Ornaments must match exactly
    var len = Math.min(this.ornaments.length, other.ornaments.length);
    for (var i=0; i<len; i++) {
      if (this.ornaments[i].type !== other.ornaments[i].type) return false;
    }
    
    if (neg) {
      // Check is last ornament is negative (type=5)
      if (this.ornaments[len+1] && this.ornaments[len+1].type !== 5) return false;
      if (other.ornaments[len+1] && other.ornaments[len+1].type !== 5) return false;
    }
    
    // Children must match in any order
    var unmatched = other.children.map(e=>e);
    
    for (var i=0; i<this.children.length; i++) {
      var matchFound = false;
      
      for (var k=0; k<unmatched.length; k++) {
        if (this.children[i].equals(unmatched[k])) {
          unmatched.splice(k,1);
          matchFound = true;
          break;
        }
      }
      
      if (!matchFound) return false;
    }
    
    return true;
  }
  
  addChild(ch) {
    var pos = ch.fromRelativePos(0,0)
    pos = this.toRelativePos(pos[0], pos[1]);
    ch.x = pos[0];
    ch.y = pos[1];
    ch.nx = ch.x;
    ch.ny = ch.y;
    ch.parent.removeChild(ch)
    ch.parent = this;
    this.children.push(ch);
  }
  
  addOrnament(or,index) {
    var pos = or.fromRelativePos(0,0);
    pos = this.toRelativePos(pos[0], pos[1]);
    or.th = Math.atan2(-pos[1],pos[0])
    
    or.dist = Math.sqrt(pos[0]*pos[0] + pos[1]*pos[1]) - this.r;
    
    if (or.parent !== this.root) or.parent.removeOrnament(or);
    or.parent = this;
    if (index !== undefined) {
      this.ornaments.splice(index,0,or);
    } else {
      this.ornaments.push(or);
    }
    this.renumberOrnaments();
  }
  
  // Removes specified child, if present
  removeChild(ch) {
    var i = this.children.indexOf(ch);
    if (i>-1)
      this.children.splice(i,1);
  }
  
  removeOrnament(or) {
    var i = this.ornaments.indexOf(or);
    if (i>-1) {
      this.ornaments.splice(i,1);
      this.renumberOrnaments();
    }
  }
  
  // Delete this and move all children to the parent
  popOperator() {
    while (this.children.length > 0) {
      this.parent.addChild(this.children[0]);
    }
    this.parent.removeChild(this);
  }
  
  tick() {
    // Calculate pushback for children
    for (var i=0; i<this.children.length; i++) {
      for (var j=0; j<this.children.length; j++) {
        if (i !== j) {
          this.children[i].pushFrom(this.children[j])
        }
      }
    }
    // Tick children
    for (var i=0; i<this.children.length; i++) {
      this.children[i].pushFromEdge(this.r);
      this.children[i].tick();
    }
    // Tick ornaments
    for (var i=0; i<this.ornaments.length; i++) {
      this.ornaments[i].tick();
    }
    
    // Calculate radius
    var newRad = -0.25;
    for (var i=0; i<this.children.length; i++) {
      var candidate = this.children[i].dist + this.children[i].r
      if ( candidate > newRad ) {
        newRad = candidate;
      }
    }
    
    newRad = Math.max(newRad, this.ornaments.length/2 - 1)
    if (this.labelWidth) {
      if (this.ornaments.length > 0) {
        newRad = Math.max(newRad, this.labelWidth/2)
      } else {
        newRad = Math.max(newRad, this.labelWidth/2 - 0.5)
      }
    }
    
    this.r = this.r || 0
    this.r += (newRad + 0.95 - this.r) / 5
    this.x = this.nx;
    this.y = this.ny;
    
    // Update distance
    this.dist = Math.sqrt(Math.pow(this.x,2)+Math.pow(this.y,2))
    
    this.nx = this.x;
    this.ny = this.y;
  }
  
  draw(ctx, ox, oy) {
    ctx.fillStyle = ["white","white","black","red","blue",null,null,null,"#cfc","transparent"][this.type]
    ctx.fillCirc(this.x + ox, this.y + oy, this.r);
    
    if (this.type === this. parent.type || this.type === 0 || this.type == 8 || this.type == 9 || (this.type === 1 && this.parent.type === 8)) {
      ctx.strokeStyle = ["black","#aaa","#555","#800","#008",null,null,null,"black","white","black"][this.type]
      if (this.type === 8 || this.type === 9) {
        ctx.setLineDash([0.5,0.2]);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        ctx.stroke();
      }
    }
    
    if (this.label && this.children.length === 0) {
      ctx.fillStyle = "black";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "1px sans-serif"
      ctx.fillText(this.label,this.x + ox,this.y + oy);
      
      if (this.labelWidth == null) {
        this.labelWidth = ctx.measureText(this.label).width
      }
    }
    
    // Draw children
    for (var i=0; i<this.children.length; i++) {
      this.children[i].draw(ctx, this.x + ox, this.y + oy);
    }
    // Draw ornaments
    for (var i=0; i<this.ornaments.length; i++) {
      this.ornaments[i].draw(ctx, this.x + ox, this.y + oy);
    }
  }
}

class LogicBoard {
  constructor() {
    this.children = []
    this.mouseX = 0;
    this.mouseY = 0;
    this.mode = "action";
    this.addType = 1;
    this.addLabel = "a";
    
    this.width = 0;
    this.height = 0;
    
    this.mouseX = 0;
    this.mouseY = 0;
    this.panX = 0;
    this.panY = 0;
    this.scale = 20;
    // freeAdd circle allows free construction inside it
    this.freeAdd = null;
    // freeAdd circle copies to this circle when finished
    this.mirrorAdd = null;
    // Drag info
    this.inDrag = false;
    this.dragTarget = null;
    this.dragStartX = 0;
    this.dragStartY = 0;
    // The board acts as a type 1 operator for most purposes
    this.type = 1;
    
    this.toolbar = new LogicToolbar(this);
    
    this.addChild(new LogicOperator(this));
    this.children[0].type = 4;
  }
  
  toScreenPos(x,y) {
    return [(x-this.panX)*this.scale+this.width/2, (y-this.panY)*this.scale+this.height/2]
  }
  
  fromScreenPos(x,y) {
    return [(x-this.width/2)/this.scale+this.panX, (y-this.height/2)/this.scale+this.panY]
  }
  
  addChild(ch) {
    var pos = ch.fromRelativePos(0,0)
    ch.x = pos[0];
    ch.y = pos[1];
    ch.nx = ch.x;
    ch.ny = ch.y;
    ch.parent.removeChild(ch);
    ch.parent = this;
    this.children.push(ch);
  }
  
  removeChild(ch) {
    var i = this.children.indexOf(ch);
    if (i>-1)
      this.children.splice(i,1);
  }
  
  // Dummy method; ornaments can't be put on the root
  underNegative() {
    return false;
  }
  
  tick() {
    // Pan screen
    if (this.mode == "pan" && this.inDrag) {
      var pos = this.fromScreenPos(this.mouseX, this.mouseY)
      this.panX -= pos[0] - this.dragStartX;
      this.panY -= pos[1] - this.dragStartY;
    }
    
    // Calculate pushback
    for (var i=0; i<this.children.length; i++) {
      for (var j=0; j<this.children.length; j++) {
        if (i !== j) {
          this.children[i].pushFrom(this.children[j])
        }
      }
    }
    // Tick
    for (var i=0; i<this.children.length; i++) {
      this.children[i].tick()
    }
    
    // Tick toolbar
    this.toolbar.tick();
  }
  
  draw(ctx) {
    ctx.save()
    
    ctx.fillStyle = "white"
    ctx.strokeStyle = "black"
    ctx.lineWidth = 0.1;
    ctx.fillRect(0,0,this.width,this.height)
    
    ctx.translate(this.width/2, this.height/2)
    ctx.scale(this.scale,this.scale)
    ctx.translate(-this.panX, -this.panY)
    
    for (var i=0; i<this.children.length; i++) {
      this.children[i].draw(ctx,0,0)
    }
    
    ctx.restore()
    
    this.toolbar.draw(ctx);
  }
  
  onMousedown(x, y, ctx) {
    if (this.toolbar.hitTest(x,y)) {
      this.toolbar.onClick(x,y,ctx)
      return;
    }
    
    var pos = this.fromScreenPos(x,y);
    x = pos[0]
    y = pos[1]
    
    this.dragStartX = x;
    this.dragStartY = y;
    
    if (this.mode == "pan") {
      // Start pan
      this.inDrag = true;
      return;
    }
    
    this.dragTarget = null;
    var target = this;
    
    for (var i=0; i<this.children.length; i++) {
      if (this.children[i].hitTest(x,y)) {
        target = this.children[i].getElementAt(x,y);
        break;
      }
    }
    
    var inFreeAdd = (target !== this && target.hasAncestor(this.freeAdd))
    var inNegative = (target !== this && target.underNegative(this))
    
    if (this.freeAdd === null) {
      if (this.mode == "delete") {
        // Delete
        if (target == this) {
          // Can't delete the base
        } else if (!target.isOrnament && target.children.length == 1 && !inNegative) {
          // Flatten circles with one child
          // Move ornaments to child, if present
          while (target.ornaments.length > 0) {
            target.children[0].addOrnament(target.ornaments[0])
          }
          target.popOperator();
        } else if (!target.isOrnament && target.type === target.parent.type && target.ornaments.length == 0&& !inNegative) {
          // Pop circles that match their parents
          target.popOperator();
        } else if (!target.isOrnament && target.parent.type == 3 && !target.parent.underNegative()) {
          // Additive conjunction delete
          target.parent.removeChild(target);
        }
      } else if (this.mode == "add") {
        if (this.addType == 5) {
          // Double negative
          var index = 0;
          if (target.isOrnament) {
            // You can negate ornaments too
            index = target.parent.ornaments.indexOf(target)+1;
            target = target.parent;
          }
          for (var i=0; i<2; i++) {
            var newOp = new LogicOrnament(this);
            newOp.x = x;
            newOp.y = y;
            newOp.type = 5;
            target.addOrnament(newOp,index);
          }
        } else if (inNegative) {
          // Can't add anything else under a negative
          return;
        } else if (this.addType == 0) {
          if (!target.isOrnament && target.type > 0 && target.type <=4) {
            // Create a "hollow" operator
            var newOp = new LogicOperator(this);
            newOp.x = x;
            newOp.y = y;
            newOp.type = target.type;
            target.addChild(newOp);
          }
        } else if (this.addType < 5) {
          // Wrap the target with addType
          if (target !== this) {
            var index = 0;
            if (target.isOrnament) {
              index = target.parent.ornaments.indexOf(target) + 1;
              target = target.parent;
            }
            
            var newOp = new LogicOperator(this);
            var pos = target.fromRelativePos(0,0)
            newOp.x = pos[0];
            newOp.y = pos[1];
            newOp.type = this.addType;
            newOp.r = target.r;
            target.parent.addChild(newOp);
            newOp.addChild(target);
            
            // Move ornaments to parent
            while (target.ornaments.length > index) {
              newOp.addOrnament(target.ornaments[index]);
            }
          }
        }
      } else {
        // Drag begin
        this.inDrag = true;
        this.dragTarget = target;
      }
    } else if (!inFreeAdd) {
      var copy;
      if (this.mirrorAdd) {
        copy = this.freeAdd.copy(this);
        var pos = this.mirrorAdd.fromRelativePos(0,0);
        copy.x = pos[0];
        copy.y = pos[1];
        this.mirrorAdd.addChild(copy);
        copy.popOperator();
        if (this.freeAdd.children.length == 0) {
          this.mirrorAdd.type = this.mirrorAdd.parent.type;
        } else {
          this.mirrorAdd.type = 1;
        }
      }
      
      if (this.freeAdd.parent.type == 1 || this.freeAdd.children.length < 2) {
        this.freeAdd.popOperator();
      } else {
        this.freeAdd.type = 1;
      }
      
      this.freeAdd = null;
      this.mirrorAdd = null;
    } else {
      if (this.mode == "delete") {
        if (target !== this && target !== this.freeAdd) {
          // Delete
          if (target.isOrnament) {
            target.parent.removeOrnament(target)
          } else {
            target.popOperator();
          }
        }
      } else if (this.mode == "add") {
        if (this.addType >= 5 && this.addType <= 7) {
          if (target !== this && target !== this.freeAdd) {
            // Create an ornament
            var index = 0;
            if (target.isOrnament) {
              index = target.parent.ornaments.indexOf(target) + 1;
              target = target.parent;
            }
            
            var newOp = new LogicOrnament(this);
            newOp.x = x;
            newOp.y = y;
            newOp.type = this.addType
            target.addOrnament(newOp,index);
          }
        } else if (this.addType >= 0 && this.addType <= 4 && !target.isOrnament && target.type !== 0) {
          // Create an operator
          var newOp = new LogicOperator(this);
          newOp.x = x;
          newOp.y = y;
          newOp.type = this.addType;
          if (this.addType == 0) {
            newOp.label = this.addLabel;
          }
          target.addChild(newOp);
        }
      }
    }
  }
  
  onMouseup(x, y, ctx) {
    this.inDrag = false;
    
    // mouseup actions only apply with a dragTarget
    if (this.dragTarget === null) return;
    
    var pos = this.fromScreenPos(x,y);
    x = pos[0];
    y = pos[1];
    
    var dragTarget = this.dragTarget;
    this.dragTarget = null;
    
    var target = this;
    
    for (var i=0; i<this.children.length; i++) {
      if (this.children[i].hitTest(x,y)) {
        target = this.children[i].getElementAt(x,y);
        break;
      }
    }
    
    if (dragTarget === target && dragTarget.type === 5) {
      // Negation ornament click
      // Works under negatives
      if (target.i == 0) {
        // First slot: dualize operator
        // Can't dualize atom
        if (target.parent.type == 0) return;
        
        target.parent.type = [2,1,4,3][target.parent.type - 1];
        for (var k=0; k<target.parent.children.length; k++) {
          var newOp = new LogicOrnament(this);
          newOp.parent = target.parent;
          newOp.x = target.x;
          newOp.y = target.y;
          target.parent.children[k].addOrnament(newOp);
        }
        target.parent.removeOrnament(target);
      } else if (target.parent.ornaments[target.i-1].type == 5) {
        // Dualize negative (delete double negative)
        target.parent.removeOrnament(target);
        target.parent.removeOrnament(target.parent.ornaments[target.i-1]);
      } else {
        // Dualize ornament
        var other = target.parent.ornaments[target.i-1];
        other.type = [7,6][other.type - 6]
        target.parent.addOrnament(target,target.i-1)
      }
    }
    
    if (dragTarget === target) {
      // Click actions
      // None of these work under negatives
      if (target.underNegative()) return;
      
      if (target.type === 1 && this.mode == "action" && target.children.length == 0) {
        // Init rule
        // Add a freeAdd zone
        target.type = 2;
        var newOp = new LogicOperator(this);
        newOp.x = x;
        newOp.y = y;
        newOp.type = 8;
        target.addChild(newOp);
        this.freeAdd = newOp;
        
        // Will copy to mirrorAdd zone when finished
        newOp = new LogicOperator(this);
        newOp.x = x+0.1;
        newOp.y = y+0.1;
        newOp.type = 9;
        var newOp2 = new LogicOrnament(this);
        newOp2.x = x+0.1;
        newOp2.y = y+0.1;
        newOp2.type = 5;
        target.addChild(newOp);
        newOp.addOrnament(newOp2);
        this.mirrorAdd = newOp;
      }
      if (target.type === 4 && this.mode == "action") {
        // Additive disjunction click
        var newOp = new LogicOperator(this);
        newOp.x = x;
        newOp.y = y;
        newOp.type = 8;
        target.addChild(newOp);
        this.freeAdd = newOp;
      }
    } else if (!dragTarget.isOrnament && !target.isOrnament) {
      // Drag actions
      if (target.parent == dragTarget.parent && target.type == dragTarget.parent.type && target.ornaments.length == 0 && !target.underNegative()) {
        // Associate
        // Doesn't work under negatives
        target.addChild(dragTarget);
        var pos = target.toRelativePos(x,y)
        dragTarget.nx = pos[0];
        dragTarget.ny = pos[1];
      } else if (dragTarget.parent.type == 2 && dragTarget.parent.ornaments.length === 0 && target.parent.type == 2 && target.parent.ornaments.length === 0 && dragTarget.parent !== target.parent && dragTarget.parent.parent === target.parent.parent && dragTarget.parent.parent.type == 1 && !target.parent.underNegative()) {
        // Join rule (alternative to cut)
        target.parent.addChild(dragTarget.parent)
        dragTarget.parent.popOperator();
        var newOp = new LogicOperator(this);
        var pos = target.fromRelativePos(0,0);
        newOp.x = pos[0];
        newOp.y = pos[1];
        newOp.type = 1;
        target.parent.addChild(newOp);
        newOp.addChild(dragTarget);
        newOp.addChild(target);
      } else if (dragTarget.parent == target && !dragTarget.isOrnament && target.type == 3 && !target.underNegative()) {
        // Additive conjunction duplicate
        var copy = dragTarget.copy(target);
        var pos = target.toRelativePos(x,y);
        copy.x = pos[0];
        copy.y = pos[1];
        target.addChild(copy);
      } else if (dragTarget.parent == target.parent && !dragTarget.isOrnament && target.parent.type == 4 && !target.parent.underNegative() && dragTarget.equals(target)) {
        // Additive disjunction unduplicate
        target.parent.removeChild(dragTarget);
      } else if (dragTarget.equals(target, true)) {
        // Cut rules
        /*
        if (dragTarget.parent.type == 2 && dragTarget.parent.ornaments.length === 0 && target.parent.type == 2 && target.parent.ornaments.length === 0 && dragTarget.parent !== target.parent && dragTarget.parent.parent === target.parent.parent && dragTarget.parent.parent.type == 1 && !target.parent.underNegative()) {
          target.parent.addChild(dragTarget.parent)
          dragTarget.parent.popOperator();
          target.parent.removeChild(dragTarget);
          target.parent.removeChild(target);
        } else if (dragTarget.parent.type == 1 && target.parent.type == 2 && target.parent.ornaments.length === 0 && dragTarget.parent === target.parent.parent && !dragTarget.parent.underNegative()) {
          dragTarget.parent.removeChild(dragTarget)
          target.parent.removeChild(target);
        } else */if (dragTarget.parent.type == 1 && dragTarget.parent === target.parent && !dragTarget.parent.underNegative()) {
          var newOp = new LogicOperator(this);
          var pos = target.fromRelativePos(0,0);
          newOp.x = pos[0];
          newOp.y = pos[1];
          newOp.type = 2;
          newOp.r = target.r;
          target.parent.addChild(newOp);
          dragTarget.parent.removeChild(dragTarget)
          target.parent.removeChild(target);
        }
        
      }
    }
  }
}

var root = new LogicBoard();

function loop() {
  try {
    root.tick();
    root.draw(ctx);
    requestAnimationFrame(loop)
  } catch (e) {
    requestAnimationFrame(loop)
    throw e;
  }
}

canvas.on("mousemove", function(e) {
  root.mouseX = e.clientX;
  root.mouseY = e.clientY;
})

canvas.on("mousedown", function(e) {
  root.mouseX = e.clientX;
  root.mouseY = e.clientY;
  if (e.shiftKey) {
    var tmpMode = root.mode
    root.mode = "delete"
    root.onMousedown(e.clientX, e.clientY, ctx)
    root.mode = tmpMode;
  } else {
    root.onMousedown(e.clientX, e.clientY, ctx)
  }
})

canvas.on("mouseup", function(e) {
  root.mouseX = e.clientX;
  root.mouseY = e.clientY;
  root.onMouseup(e.clientX, e.clientY, ctx)
})

$(document).on("keydown", function(e) {
  if (e.key == "1") {
    if (root.mode != "add" || root.addType != 0) {
      root.mode = "add";
      root.addType = 0;
      root.addLabel = "a";
    } else {
      var index = "abcdefghi".indexOf(root.addLabel);
      root.addLabel = "bcdefghia".charAt(index);
    }
  } else if (+e.key && +e.key < 9) {
    root.mode = "add"
    root.addType = +e.key - 1
    root.addLabel = "a"
  } else if (e.key == "q") {
    root.mode = "action"
  } else if (e.key == "w" || e.key == " ") {
    root.mode = "pan"
  } else if (e.key == "e") {
    root.mode = "delete"
  }
})

doResize()

loop();