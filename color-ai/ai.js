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
    strokeCircle(color, thickness, radius, x, y) {
        this._setStroke(color);
        this.ctx.lineWidth = this.toScreenScale(thickness);
        this.ctx.beginPath();
        this.ctx.arc(this.toScreenX(x), this.toScreenY(y), this.toScreenScale(radius), 0, Math.PI*2);
        this.ctx.closePath();
        this.ctx.stroke();
    }
    strokeRect(color, thickness, x, y, w, h) {
        this._setStroke(color);
        this.ctx.lineWidth = this.toScreenScale(thickness);
        this.ctx.strokeRect(this.toScreenX(x), this.toScreenY(y+h), this.toScreenScale(w), this.toScreenScale(h));
    }
}

class Board {
    constructor(width, height) {
        this.time = 0;
        this.width = width;
        this.height = height;
        this.params = {
            creatureAwareness: 200,
            creatureSpeed: 1/50,
            maxSpeed: 300,
            movementCost: 1/10000,
            hueCost:  0,//0.001/180,
            satCost:  0.02,
            valCost:  0.05,
            existenceCost: 0.1,
            sizeCost: 0.0001,
            limitHue: 180,
            limitSat: 0,
            limitVal: 0,
            splitMin: 100,
            splitMax: 500,
            eatSpeed: 5,
            sizeAdvantage: 5/20,
            normalizedEating: true,
            drag: 15/20,
            loop: true,
            circle: false,
            RPSMode: false,
            rotatePerception: true
        }
        this.creatures = [];
    }
    
    sense(creature, radius, rotate) {
        var out = [[0,0,0], [0,0,0], [0,0,0], [0,0,0], [0,0,0]];
        this.creatures.forEach(c=>{
            if (c === creature) return;
            var dx = (c.x - creature.x),
                dy = (c.y - creature.y);
            if (this.params.loop && !this.params.circle) {
                if (Math.abs(dx) > this.width /2) dx -= this.width *Math.sign(dx);
                if (Math.abs(dy) > this.height/2) dy -= this.height*Math.sign(dy);
            }
            var dist = (dx*dx + dy*dy) / (radius*radius);
            if (dist <= 1) {
                var fac = c.radius * (1-dist);
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
        
        if (this.params.rotatePerception) {
            out.forEach((e,i) => out[i]=rotate3(e, rotate));
        }
        return out;
    }
    tick() {
        this.time += 1;
        this.creatures.forEach(c=>c.think());
        this.creatures.forEach(c=>c.update());
        if (this.params.normalizedEating) {
            for (var i = 0; i < this.creatures.length; i++) {
                var c1 = this.creatures[i];
                var collisions = [];
                for (var k = 0; k < this.creatures.length; k++) {
                    var c2 = this.creatures[k];
                    var dist = Math.sqrt(Math.pow(c1.x - c2.x,2) + Math.pow(c1.y - c2.y,2));
                    var collision = (dist < c1.radius + c2.radius) && c1.type !== c2.type;

                    if (collision) {
                        collisions.push(c2);
                    }
                }
                c1.collide(collisions);
            }
        } else {
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
        }
        this.creatures = this.creatures.filter(c=>c.energy > 0);
    }
    draw(canvas) {
        canvas.fill([0.1,0.1,0.1]);
        if (!fast) {
            this.creatures.forEach(c=>{
                c.drawpre(canvas);
            })
        }
        this.creatures.forEach(c=>{
            c.draw(canvas);
        })
        if (this.params.circle) {
            canvas.strokeCircle([0.2, 0.2, 0.2], 10, this.width/2+5, 0, 0);
        } else {
            canvas.strokeRect([0.2, 0.2, 0.2], 10, -this.width/2-5, -this.height/2-5, this.width+10, this.height+10);
        }
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
    drawpre() {}
    draw() {}
}

class Creature extends Thing {
    constructor(board, x, y, mind, type, energy) {
        super(board, x, y);
        this.mind = mind;
        this.type = type;
        this.energy = energy;
        this.lifespan = 0;
    }
    think() {
        var sensors = this.board.sense(this, this.board.params.creatureAwareness, -this.type)
        this.thoughts = this.mind.think(this.energy, this.x, this.y, this.vx, this.vy, sensors, this);
        
        this.thoughts.moveX = +this.thoughts.moveX || 0;
        this.thoughts.moveY = +this.thoughts.moveY || 0;
        
        this.thoughts.hue = (this.thoughts.hue%360+360)%360 || 0;
        
        var maxspeed = this.board.params.maxSpeed;
        
        this.thoughts.moveX = Math.max(-maxspeed, Math.min(maxspeed, this.thoughts.moveX));
        this.thoughts.moveY = Math.max(-maxspeed, Math.min(maxspeed, this.thoughts.moveY));
        
        if (this.mind.net) {
            this.thoughts.hue = Math.max(0, Math.min(this.board.params.limitHue*2, this.thoughts.hue+this.board.params.limitHue)) - this.board.params.limitHue;
            this.thoughts.sat = Math.max(this.board.params.limitSat, Math.min(1, this.thoughts.sat));
            this.thoughts.val = Math.max(this.board.params.limitVal, Math.min(1, this.thoughts.val));
        }
        
    }
    update() {
        this.lifespan += 1;
        
        this.vx += +this.thoughts.moveX * this.board.params.creatureSpeed;
        this.x += this.vx;
        this.vx *= this.board.params.drag;
        
        this.vy += +this.thoughts.moveY * this.board.params.creatureSpeed;
        this.y += this.vy;
        this.vy *= this.board.params.drag;
        
        if (this.board.params.circle) {
            var rthis = Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
            var rboard = this.board.width/2 - this.radius;
            if (rthis > rboard) {
                this.x *= (rboard / rthis);
                this.y *= (rboard / rthis);
            }
        } else {
            if (this.board.params.loop) {
                if (Math.abs(this.x) > board.width/2)  this.x -= board.width  * Math.sign(this.x); 
                if (Math.abs(this.y) > board.height/2) this.y -= board.height * Math.sign(this.y); 
            } else {
                if (Math.abs(this.x) > board.width/2 - this.radius) {
                    this.x = Math.sign(this.x) * (board.width/2 - this.radius)
                    this.vx *= -1;
                };
                if (Math.abs(this.y) > board.height/2 - this.radius) {
                    this.y = Math.sign(this.y) * (board.height/2 - this.radius)
                    this.vy *= -1;
                };
            }
        }
        
        this.energy -= this.getEnergyConsumption();
        
        if ((this.thoughts.split >= 1 && this.energy > this.board.params.splitMin) || this.energy > this.board.params.splitMax) {
            var offspring = new Creature(this.board,
                                         this.x,
                                         this.y,
                                         this.mind.newMind(),
                                         this.type);
            offspring.energy = this.energy / 2;
            this.energy /= 2;
        }
      
        this.radius = Math.sqrt(this.energy);
        
        this.color = hsv2rgb(this.thoughts.hue + (this.type * 120), this.thoughts.sat, this.thoughts.val);
    }
    getEnergyConsumption() {
        if (!this.thoughts) return this.board.params.existenceCost;
        
        var out = this.board.params.existenceCost;
        out += this.board.params.sizeCost * this.energy;
        out += (Math.pow(this.thoughts.moveX, 2) + Math.pow(this.thoughts.moveY, 2)) * this.board.params.movementCost;
        out += (180-Math.abs(this.thoughts.hue - 180)) * board.params.hueCost;
        out += (1-this.thoughts.sat) * board.params.satCost;
        out += (1-this.thoughts.val) * board.params.valCost;
        
        return out;
    }
    collide(list) {
        var singleCollision = (other, speed) => {
            if (other instanceof Creature) {
                var canNom = false;
                if (this.board.params.RPSMode){
                    canNom = (((this.type - other.type + 3) % 3 == 1));
                } else {
                    canNom = (this.energy > other.energy) || this.board.params.normalizedEating;
                }
                
                canNom |= other.type == 3;
                canNom &= (this.type != 3);
                
                if (canNom) {
                    // Om nom nom
                    var amt = speed;
                    other.energy -= amt;
                    this.energy += amt;
                    return true;
                }
            }
            return false;
        }
        var s = this.board.params.eatSpeed + this.board.params.sizeAdvantage * this.radius;
        if (this.board.params.normalizedEating) {
            list.forEach(e=>singleCollision(e, s / list.length));
        } else {
            return singleCollision(list, s);
        }
    }
    drawpre(canvas) {
        canvas.strokeCircle([[1,0,0],[0,1,0],[0,0,1],[1,1,1]][this.type], 2, this.radius + 5, this.x, this.y);
        if (false){//this.mind.iterations && this.mind.iterations + 3 >= bestNN) {
            var val = (4 - (bestNN - this.mind.iterations)) / 4;
            canvas.strokeRect([val,val,0], 2, this.x - this.radius-10, this.y - this.radius-10, this.radius*2+20, this.radius*2+20)
        }
        if (this.lifespan == bestLifespan) {
            canvas.strokeRect([0,1,1], 2, this.x - this.radius-15, this.y - this.radius-15, this.radius*2+30, this.radius*2+30)
        }
    }
    draw(canvas) {
        canvas.fillCircle(this.color, this.radius, this.x, this.y);
    }
}

class DummyMind {
    constructor() {}
    think(energy, x, y, vx, vy, sensors) {
        return {
            moveX: 0,
            moveY: 0,
            hue: 0,
            sat: 1,
            val: 1,
            split: 0
        }
    }
    newMind() {
        return new DummyMind();
    }
}

class FoodMind {
    constructor() {}
    think(energy, x, y, vx, vy, sensors, creature) {
        creature.type = 3;
        return {
            moveX: 0,
            moveY: 0,
            hue: (creature.lifespan * 20)%360,
            sat: 1,
            val: 1,
            split: 0
        }
    }
    newMind() {
        return new FoodMind();
    }
}

class FollowMind {
    constructor() {}
    think(energy, x, y, vx, vy, sensors, creature) {
        var ax = 0, ay = 0;
        
        if (canvas.mouseOver) {
            ax = canvas.mousePos[0] - x;
            ay = canvas.mousePos[1] - y;
        }
        return {
            moveX: ax,
            moveY: ay,
            hue: 0, //Math.atan2(ay, ax) * 180 / Math.PI,
            sat: 1,
            val: 1,
            split: 0
        }
    }
    newMind() {
        return new DummyMind();
    }
}

class SimpleMind {
    constructor() {}
    think(energy, x, y, vx, vy, sensors, creature) {
        var ax = sensors[2][1] + sensors[0][2] - sensors[0][1] - sensors[2][2],
            ay = sensors[3][1] + sensors[1][2] - sensors[1][1] - sensors[3][2];
        return {
            moveX: ax,
            moveY: ay,
            hue: 0, //Math.atan2(ay, ax) * 180 / Math.PI,
            sat: 1,
            val: 1,
            split: window.enableSplit ? (energy > 400 ? 1 : 0) : 0
        }
    }
    newMind() {
        return new SimpleMind();
    }
}

class NeuralNetMind {
    constructor(net, iterations, creatures) {
        this.iterations = iterations || 1;
        if (!net) {
            this.net = new NeuralNet(20, 12, 6, board);
            // Reincarnation
            if (creatures && creatures.length > 0) {
                for (var i = 0; i < 10; i++) {
                    var index = Math.floor(Math.random()*creatures.length);
                    if (creatures[index].mind.net) {
                        this.net.deserialize(creatures[index].mind.net.serialize());
                        this.iterations = creatures[index].mind.iterations + 1;
                        this.net.mutate(20,0.5);
                        i = 10;
                    }
                }
            }
        } else {
            this.net = net;
        }
    }
    think(energy, x, y, vx, vy, sensors, creature) {
        var input = sensors.reduce((a,b)=>a.concat(b), []);
        input = input.concat([energy, x, y, vx, vy]);
        var out = this.net.exec(input);
        return {
            moveX: (out[0]-0.5)*creature.board.params.maxSpeed,
            moveY: (out[1]-0.5)*creature.board.params.maxSpeed,
            hue: out[2] * creature.board.params.limitHue, //Math.atan2(ay, ax) * 180 / Math.PI,
            sat: out[3],
            val: out[4],
            split: out[5] + 0.5//window.enableSplit ? (energy > 400 ? 1 : 0) : 0
        }
                                
    }
    newMind() {
        return new NeuralNetMind(this.net.clone().mutate(20, 0.5), this.iterations+1);
    }
}

class NeuralNet {
    constructor(l0, l1, l2) {
        var rand = _=>(Math.random()*2-1);
        
        this.l0length = l0;
        this.l1length = l1;
        this.l2length = l2;
        this.l1bias = new Array(l1).fill(0).map(a=>rand());
        this.l1fac = new Array(l1).fill(0).map(a=>new Array(l0).fill(0).map(b=>rand()));
        this.l2bias = new Array(l2).fill(0).map(a=>rand());
        this.l2fac = new Array(l2).fill(0).map(a=>new Array(l1).fill(0).map(b=>rand()));
    }
    sig(x) {return 1/(1+Math.pow(Math.E,-x));}
    exec(l0) {
        var l1 = this.l1fac.map((e, i_l1)=>
            this.sig(e.reduce((sum, fac, i_l0)=>
                sum + fac*l0[i_l0]
            , 0) + this.l1bias[i_l1]));
        var l2 = this.l2fac.map((e, i_l2)=>
            this.sig(e.reduce((sum, fac, i_l1)=>
                sum + fac*l1[i_l1]
            , 0) + this.l2bias[i_l2]));
        
        return l2;
    }
    clone() {
        var out = new NeuralNet(0,0,0);
        out.deserialize(this.serialize());
        return out;
    }
    mutate(count, amt) {
        var list = this.serialize();
        var indexes = new Array(count).fill(0).map(a=>Math.floor(Math.random()*list[0].length));
        indexes.forEach(i=>(list[0][i] += (Math.random()*2 - 1) * amt));
        this.deserialize(list);
    }
    serialize() {
        var out =        this.l1bias;
        out = out.concat(this.l1fac.reduce((a,b)=>a.concat(b), []));
        out = out.concat(this.l2bias);
        out = out.concat(this.l2fac.reduce((a,b)=>a.concat(b), []));
        return [out, this.l0length, this.l1length, this.l2length]
    }
    deserialize(list) {
        this.l0length = list[1];
        this.l1length = list[2];
        this.l2length = list[3];
        
        var l0 = this.l0length,
            l1 = this.l1length,
            l2 = this.l2length;
        
        var i = 0;
        for (var a=0; a<l1; a++, i++) {
            this.l1bias[a] = list[0][i];
        }
        for (var a=0; a<l1; a++) {
            this.l1fac[a] = [];
            for (var b=0; b<l0; b++, i++) {
                this.l1fac[a][b] = list[0][i];
            }
        }
        for (var a=0; a<l2; a++, i++) {
            this.l2bias[a] = list[0][i];
        }
        for (var a=0; a<l2; a++) {
            this.l2fac[a] = [];
            for (var b=0; b<l1; b++, i++) {
                this.l2fac[a][b] = list[0][i];
            }
        }
    }
}

var fast = false;
var superfast = false;

var board;
var canvas;
var repeatingTick;
var totalEnergy;
var bestNN;
var bestLifespan;
var warpspeed=1;
var minds = {dummy:_=>new DummyMind(),
             follow:_=>new FollowMind(),
             simple:_=>new SimpleMind(),
             food:_=>new FoodMind(),
             newNeural:_=>new NeuralNetMind(null, 1),
             neural:_=>new NeuralNetMind(null, 1, board.creatures)};

function init() {
    if (board) {
        board.creatures = [];
        board.time = 0;
    } else {
        board = new Board(1500,1500);
    }
    canvas = new CanvasWrapper();
    canvas.updateMetrics(board);
    
    if (repeatingTick) {
        clearInterval(repeatingTick);
    }
    repeatingTick = setInterval(function () {
        for (var i=0; i<warpspeed; i++) {
            tick();
        }
        posttick();
    }, 1);
    
    canvas.onClick = function(x,y) {
        type = +document.getElementById("type").value;
        mind =  document.getElementById("mind").value;
        new Creature(board, x, y, minds[mind](), type, 100);
    }
    
    for (var i=0; i<200; i++) {
        new Creature(board,
                     (Math.random()-0.5)*board.width,
                     (Math.random()-0.5)*board.height,
                     minds['newNeural'](),
                     Math.floor(Math.random()*3),
                     100);
    }
    
    window.enableSplit = true;
}

function tick() {
    board.tick();
    totalEnergy = board.creatures.reduce((s,c)=>s+(c.mind?c.energy:0), 0);
    while (totalEnergy < 20000) {
        new Creature(board,
                     (Math.random()-0.5)*board.width*0.7,
                     (Math.random()-0.5)*board.height*0.7,
                     minds[(Math.random()<0.05)?'food':'neural'](),
                     Math.floor(Math.random()*3),
                     100);
        totalEnergy += 100;
    }
}
    
function posttick() {
    var averageConsumption = board.creatures.reduce((s,c)=>s+(c.mind?c.getEnergyConsumption():0), 0) / board.creatures.length;
    bestNN = 0;
    bestLifespan = 0;
    board.creatures.forEach(c=>{
        if (c.mind && c.mind.iterations > bestNN) {
            bestNN = c.mind.iterations;
        }
        if (c.lifespan > bestLifespan) {
            bestLifespan = c.lifespan;
        }
    })
    
    if (!superfast) board.draw(canvas);
    
    document.getElementById("time-display").innerText = (board.time);
    document.getElementById("energy-display").innerText = (totalEnergy);
    document.getElementById("consumption-display").innerText = (averageConsumption);
    document.getElementById("count-display").innerText = (board.creatures.length)
    document.getElementById("bestnn-display").innerText = (bestNN);
    document.getElementById("bestlife-display").innerText = (bestLifespan);
}