function rotate3(list, amt) {
    switch ((amt+3)%3) {
        case 0: return list;
        case 1: return [list[2], list[0], list[1]];
        case 2: return [list[1], list[2], list[0]];
    }
}

function hsv2rgb(h, s, v) {
    if (h < 0) {
        h = (h%360)+360
    }
    
    var fac = (h%120) / 60;
    var out = (fac < 1) ? [v, (1-(1-fac)*s)*v, (1-s)*v] : [(1-(fac-1)*s), v, (1-s)*v];
    out = rotate3(out, Math.floor(h%360 / 120));
    
    return out;
}

class CanvasWrapper {
    constructor() {
        this.canvas = document.getElementById('world');
        this.ctx = this.canvas.getContext('2d');
        this.onClick = null;
        this.mouseOver = false;
        this.mousePos = [0,0];
        
        this.updateMetrics();
        
        // Event listeners
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
    updateMetrics(board) {
        this.width = this.canvas.offsetWidth;
        this.height = this.canvas.offsetHeight;
        this.offsetx = this.width/2;
        this.offsety = this.height/2;
        if (board) {
            this.scale = Math.min(this.width / board.width, this.height / board.height);
        }
    }
    // Coordinate transformations
    toScreenX(val) {return this.offsetx + val * this.scale}
    toScreenY(val) {return this.offsety - val * this.scale}
    toScreenScale(val) {return val * this.scale}
    fromScreenX(val) {return (val - this.offsetx) / this.scale}
    fromScreenY(val) {return -(val - this.offsety) / this.scale}
    fromScreenScale(val) {return val / this.scale}
                          
    // Graphics
    _setFill(color) {
        this.ctx.fillStyle = `rgb(${Math.round(color[0]*255)},${Math.round(color[1]*255)},${Math.round(color[2]*255)})`;
    }
    _setStroke(color) {
        this.ctx.strokeStyle = `rgb(${Math.round(color[0]*255)},${Math.round(color[1]*255)},${Math.round(color[2]*255)})`;
    }
    fill(color) {
        this._setFill(color);
        this.ctx.fillRect(0,0,this.width,this.height);
    }
    fillCircle(color, radius, x, y) {
        this._setFill(color);
        this.ctx.beginPath();
        this.ctx.arc(this.toScreenX(x), this.toScreenY(y), this.toScreenScale(radius), 0, Math.PI*2);
        this.ctx.closePath();
        this.ctx.fill();
    }
    strokeRect(color, thickness, x, y, w, h) {
        this._setStroke(color);
        this.ctx.lineWidth = this.toScreenScale(thickness);
        this.ctx.strokeRect(this.toScreenX(x), this.toScreenY(y+h), this.toScreenScale(w), this.toScreenScale(h));
    }
}

class Board {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.params = {
            creatureAwareness: 100,
            creatureSpeed: 1/20,
            movementCost: 1/10000,
            eatSpeed: 5,
            drag: 15/20
        }
        this.creatures = [];
    }
    
    sense(creature, radius, rotate) {
        var out = [[0,0,0], [0,0,0], [0,0,0], [0,0,0], [0,0,0]];
        this.creatures.forEach(c=>{
            if (c === creature) return;
            var dx = (c.x - creature.x),
                dy = (c.y - creature.y),
                dist = (dx*dx + dy*dy) / (radius*radius);
            if (dist <= 1) {
                var fac = c.energy * (1-dist);
                // Angle, in quarters
                var angle = Math.atan2(dy, dx) / (Math.PI/2);
                if (angle < 0) angle += 4;
                var first = Math.floor(angle);
                var second = (first + 1) % 4;
                var f2 = (angle % 1) * fac;
                var f1 = fac - f2;
                out[first][0] += c.color[0] * f1;
                out[first][1] += c.color[1] * f1;
                out[first][2] += c.color[2] * f1;
                out[second][0] += c.color[0] * f2;
                out[second][1] += c.color[1] * f2;
                out[second][2] += c.color[2] * f2;
            }
        })
        
        out[4] = creature.color.map(x=>x*creature.radius);
        
        out.forEach((e,i) => out[i]=rotate3(e, rotate));
        return out;
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
        canvas.strokeRect([0.2, 0.2, 0.2], 10, -this.width/2, -this.height/2, this.width, this.height);
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
        var sensors = this.board.sense(this, this.board.params.creatureAwareness, -this.type)
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
        
        if (Math.abs(this.x) > board.width/2 - this.radius) {
            this.x = Math.sign(this.x) * (board.width/2 - this.radius)
            this.vx *= -1;
        };
        if (Math.abs(this.y) > board.height/2 - this.radius) {
            this.y = Math.sign(this.y) * (board.height/2 - this.radius)
            this.vy *= -1;
        };
        
        this.energy -= (Math.pow(this.thoughts.moveX, 2) + Math.pow(this.thoughts.moveY, 2)) * this.board.params.movementCost
        
        if (this.thoughts.split >= 1) {
            var offspring = new Creature(this.board, this.x, this.y, this.mind.newMind(), Math.floor(Math.random()*3));
            offspring.energy = this.energy / 2;
            this.energy /= 2;
        }
      
        this.radius = Math.sqrt(this.energy);
        
        this.color = hsv2rgb(this.thoughts.hue + this.type * 120, this.thoughts.sat, this.thoughts.val);
    }
    collide(other) {
        if (other instanceof Creature) {
            if ((this.type - other.type + 3) % 3 == 1) {
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
            split: 0
        }
    }
}

class FollowMind {
    constructor() {}
    think(energy, vx, vy, sensors, creature) {
        var ax = 0, ay = 0;
        
        if (canvas.mouseOver) {
            ax = canvas.mousePos[0] - creature.x;
            ay = canvas.mousePos[1] - creature.y;
        }
        return {
            moveX: ax,
            moveY: ay,
            hue: 0, //Math.atan2(ay, ax) * 180 / Math.PI,
            sat: 1,
            val: 1,
            split: (energy > 400 ? 1 : 0)
        }
    }
    newMind() {
        return new DummyMind();
    }
}

class SimpleMind {
    constructor() {}
    think(energy, vx, vy, sensors, creature) {
        var ax = sensors[2][1] + sensors[0][2] - sensors[0][1] - sensors[2][2],
            ay = sensors[3][1] + sensors[1][2] - sensors[1][1] - sensors[3][2];
        console.log(sensors[0][1], sensors[1][1], sensors[2][1], sensors[3][1])
        return {
            moveX: ax,
            moveY: ay,
            hue: 0,//Math.atan2(ay, ax) * 180 / Math.PI,
            sat: 1,
            val: 1,
            split: 0//(energy > 400 ? 1 : 0)
        }
    }
    newMind() {
        return new SimpleMind();
    }
}

var board;
var canvas;
var repeatingTick;
var minds = {dummy:_=>new DummyMind(), follow:_=>new FollowMind(), simple:_=>new SimpleMind()};

function init() {
    board = new Board(800,800);
    board.params.creatureAwareness = 200;
    board.params.movementCost = 0;
    canvas = new CanvasWrapper();
    canvas.updateMetrics(board);
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
    document.getElementById("energy-display").innerText = (board.creatures.reduce((s,c)=>s+c.energy, 0));
    document.getElementById("count-display").innerText = (board.creatures.length)
}