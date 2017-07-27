function rotate3(list, amt) {
    switch (amt%3) {
        case 0: return list;
        case 1: return [list[2], list[0], list[1]];
        case 2: return [list[1], list[2], list[0]];
    }
}

function hsv2rgb(h, s, v) {
    var fac = (h%120) / 60;
    var out = (fac < 1) ? [v, (1-(1-fac)*s)*v, (1-s)*v] : [(1-(fac-1)*s), v, (1-s)*v];
    out = rotate3(out, Math.floor(h%360 / 120));
    
    return out;
}

class CanvasWrapper {
    constructor() {
        this.canvas = document.getElementById('world');
        this.ctx = this.canvas.getContext('2d');
        this.width = 300;
        this.height = 150;
        this.offsetx = this.width/2;
        this.offsety = this.height/2;
        this.scale = 1;
        this.onClick = null;
        this.mouseOver = false;
        this.mousePos = [0,0];
        
        var that = this;
        
        this.canvas.addEventListener("click", function(e) {
            var x = e.pageX - e.target.offsetLeft;
            var y = e.pageY - e.target.offsetTop;
            
            if (that.onClick) {
                that.onClick(that.fromScreenX(x), that.fromScreenY(y));
            }
        })
        
        this.canvas.addEventListener("mousemove", function(e) {
            var x = e.pageX - e.target.offsetLeft;
            var y = e.pageY - e.target.offsetTop;
            
            that.mousePos = [that.fromScreenX(x), that.fromScreenY(y)];
        })
        
        this.canvas.addEventListener("mouseenter", function(e) {
            that.mouseOver = true;
        })
        
        this.canvas.addEventListener("mouseleave", function(e) {
            that.mouseOver = false;
        })
    }
    // Coordinate transformations
    toScreenX(val) {return (this.offsetx + val) * this.scale}
    toScreenY(val) {return (this.offsety - val) * this.scale}
    toScreenScale(val) {return val * this.scale}
    fromScreenX(val) {return val / this.scale - this.offsetx}
    fromScreenY(val) {return this.offsety - val / this.scale}
    fromScreenScale(val) {return val / this.scale}
                          
    // Graphics
    fill(color) {
        this.ctx.fillStyle = `rgb(${Math.round(color[0]*255)},${Math.round(color[1]*255)},${Math.round(color[2]*255)})`;
        this.ctx.fillRect(0,0,this.width,this.height);
    }
    fillCircle(color, radius, x, y) {
        this.ctx.beginPath();
        this.ctx.fillStyle = `rgb(${Math.round(color[0]*255)},${Math.round(color[1]*255)},${Math.round(color[2]*255)})`;
        this.ctx.arc(this.toScreenX(x), this.toScreenY(y), this.toScreenScale(radius), 0, Math.PI*2);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
}

class Board {
    constructor() {
        this.params = {
            creatureAwareness: 10,
            creatureSpeed: 1/20,
            movementCost: 1/10000,
            eatSpeed: 5,
            drag: 15/20
        }
        this.creatures = [];
    }
    
    sense(creature, radius, rotate) {
        var c = {r:0, g:0, b:0};
        return {up:c, left:c, down:c, right:c, center:c};
    }
    tick() {
        this.creatures.forEach(c=>c.think());
        this.creatures.forEach(c=>c.update());
        for (var i = 0; i < this.creatures.length - 1; i++) {
            var c1 = this.creatures[i];
            for (var k = i+1; k < this.creatures.length; k++) {
                var c2 = this.creatures[k];
                var dist = Math.sqrt(Math.pow(c1.x - c2.x,2) + Math.pow(c1.y - c2.y,2));
                var collision = (dist < c1.radius + c2.radius);
                
                if (collision) {
                    c1.collide(c2) || c2.collide(c1)
                }
            }
        }
        this.creatures = this.creatures.filter(c=>c.energy > 0);
    }
    draw(canvas) {
        canvas.fill([0.1,0.1,0.1]);
        this.creatures.forEach(c=>{
            c.draw(canvas);
        })
    }
}

class Thing {
    constructor(board, x, y) {
        this.radius = 1;
        this.energy = 1;
        this.color = [1,1,1];
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.board = board;
        
        board.creatures.push(this);
    }
    collide(other) {
        return false;
    }
    draw() {}
}

class Creature extends Thing {
    constructor(board, x, y, mind, type, energy) {
        super(board, x, y);
        this.mind = mind;
        this.type = type;
        this.energy = energy;
    }
    think() {
        var sensors = this.board.sense(this, this.board.params.creatureAwareness, this.type)
        this.thoughts = this.mind.think(this.energy, this.vx, this.vy, sensors, this);
        
        this.thoughts.moveX = +this.thoughts.moveX || 0;
        this.thoughts.moveY = +this.thoughts.moveY || 0;
    }
    update() {
        this.vx += +this.thoughts.moveX * this.board.params.creatureSpeed;
        this.x += this.vx;
        this.vx *= this.board.params.drag;
        
        this.vy += +this.thoughts.moveY * this.board.params.creatureSpeed;
        this.y += this.vy;
        this.vy *= this.board.params.drag;
      
        this.radius = Math.sqrt(this.energy);
        
        this.color = hsv2rgb(this.thoughts.hue + this.type * 120, this.thoughts.sat, this.thoughts.val);
        
        this.energy -= (Math.pow(this.thoughts.moveX, 2) + Math.pow(this.thoughts.moveY, 2)) * this.board.params.movementCost
    }
    collide(other) {
        if (other instanceof Creature) {
            if ((this.type - other.type + 3) % 3 == 2) {
                // Om nom nom
                var amt = Math.min(other.energy, board.params.eatSpeed);
                other.energy -= amt;
                this.energy += amt;
                return true;
            }
        }
    }
    draw(canvas) {
        canvas.fillCircle(this.color, this.radius, this.x, this.y);
    }
}

class DummyMind {
    constructor() {}
    think(energy, vx, vy, sensors) {
        return {
            moveX: 0,
            moveY: 0,
            hue: 0,
            sat: 1,
            val: 1,
            respawn: 0
        }
    }
}

class FollowMind {
    constructor() {}
    think(energy, vx, vy, sensors, creature) {
        return {
            moveX: canvas.mousePos[0] - creature.x,
            moveY: canvas.mousePos[1] - creature.y,
            hue: 0,
            sat: 1,
            val: 1,
            respawn: 0
        }
    }
}

var board;
var canvas;
var repeatingTick;
var minds = {dummy:_=>new DummyMind(), follow:_=>new FollowMind()}

function init() {
    board = new Board();
    board.canvas = new CanvasWrapper();
    canvas = new CanvasWrapper();
    repeatingTick = setInterval(tick, 50);
    
    canvas.onClick = function(x,y) {
        type = +document.getElementById("type").value;
        mind =  document.getElementById("mind").value;
        new Creature(board, x, y, minds[mind](), type, 100);
    }
}

function tick() {
    board.tick();
    board.draw(canvas);
}