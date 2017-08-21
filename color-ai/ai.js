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
    constructor(id) {
        this.canvas = document.getElementById(id);
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
    // "board" should have a width and height property
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
        this.ctx.arc(this.toScreenX(x), this.toScreenY(y), this.toScreenScale(radius), 0, 2*Math.PI);
        this.ctx.closePath();
        this.ctx.stroke();
    }
    strokeArc(color, thickness, radius, x, y, start, end) {
        this._setStroke(color);
        this.ctx.lineWidth = this.toScreenScale(thickness);
        this.ctx.beginPath();
        this.ctx.arc(this.toScreenX(x), this.toScreenY(y), this.toScreenScale(radius), start, end);
        this.ctx.stroke();
    }
    fillRect(color, x, y, w, h) {
        this._setFill(color);
        this.ctx.fillRect(this.toScreenX(x), this.toScreenY(y+h), this.toScreenScale(w), this.toScreenScale(h));
    }
    strokeRect(color, thickness, x, y, w, h) {
        this._setStroke(color);
        this.ctx.lineWidth = this.toScreenScale(thickness);
        this.ctx.strokeRect(this.toScreenX(x), this.toScreenY(y+h), this.toScreenScale(w), this.toScreenScale(h));
    }
    strokeLine(color, thickness, x1, y1, x2, y2) {
        this._setStroke(color);
        this.ctx.lineWidth = this.toScreenScale(thickness);
        this.ctx.beginPath();
        this.ctx.moveTo(this.toScreenX(x1), this.toScreenY(y1));
        this.ctx.lineTo(this.toScreenX(x2), this.toScreenY(y2));
        this.ctx.stroke();
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
            movementCost: 1/100000,
            hueCost:  0.02/180,
            satCost:  0.02,
            valCost:  0.05,
            existenceCost: 0.1,
            sizeCost: 0.0001,
            wallCost: 2,
            limitHue: 180,
            limitSat: 0.2,
            limitVal: 0.2,
            splitMin: 100,
            splitMax: 500,
            eatSpeed: 2,
            sizeAdvantage: 0,//5/20,
            normalizedEating: true,
            drag: 15/20,
            loop: false,
            circle: false,
            //foodChain: [[0,0,1,1],[1,0,0,1],[0,1,0,1]],
            foodChain: [[0,1,1,1],[1,0,1,1],[1,1,0,1]],
            //foodChain: [[0,0,0,1],[1,0,0,0],[0,1,0,0]],
            rotatePerception: true,
            positionSense: true,
            memoryNodes: 2,
            separateGenomes: true
        };
        this.view = {
            showOverlay: true,
            showType: true,
            showHash: false,
            showMemory: true,
            showOldest: false,
            showLongestLineage: false
        }
        this.creatures = [];
    }
    
    sense(creature, radius, rotate) {
        var out = [[0,0,0], [0,0,0], [0,0,0], [0,0,0], [0,0,0]];
        var rsquared = radius*radius;
        
        for (var i=this.creatures.length-1; i>=0; i--) {
            var c = this.creatures[i];
            if (c === creature) continue;
            var dx = (c.x - creature.x),
                dy = (c.y - creature.y);
            if (this.params.loop && !this.params.circle) {
                if (Math.abs(dx) > this.width /2) dx -= this.width *Math.sign(dx);
                if (Math.abs(dy) > this.height/2) dy -= this.height*Math.sign(dy);
            }
            if (dx>radius || dy>radius || dx<-radius || dy<-radius) continue;
            var dist = (dx*dx+dy*dy) / (rsquared);
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
        }
        
        out[4] = creature.color.map(x=>x*creature.radius);
        
        if (this.params.rotatePerception) {
            out.forEach((e,i) => out[i]=rotate3(e, rotate));
        }
        return out;
    }
    moveCreatureNextTo(dest, creature) {
        var index = this.creatures.indexOf(dest);
        if (index > -1) {
            this.creatures.pop();
            this.creatures.splice(index+1, 0, creature);
        }
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
        if (this.view.showOverlay) {
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
        this.type = 3;
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
    think() {}
    update() {}
    drawpre(canvas) {}
    draw(canvas) {
        canvas.fillCircle(this.color, this.radius, this.x, this.y);
    }
}

class FoodPellet extends Thing {
    constructor(board, x, y, energy) {
        super(board, x, y)
        this.energy = energy;
        this.lifespan = 0;
    }
    
    update() {
        this.lifespan += 1;
        this.color = hsv2rgb(this.lifespan*10, 1, 1);
        this.radius= Math.sqrt(this.energy);
    }
    
    drawpre(canvas) {
        if (this.board.view.showType)
            canvas.strokeCircle([1,1,1], 2, this.radius + 5, this.x, this.y);
    }
}

class Creature extends Thing {
    constructor(board, x, y, mind, type, energy) {
        super(board, x, y);
        this.mind = mind;
        this.type = type;
        this.energy = energy;
        this.lifespan = 0;
        this.touchingWall = false;
        
        this.hashColor = colorFromNet(this);
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
        
        if (!this.thoughts) return;
        
        this.vx += +this.thoughts.moveX * this.board.params.creatureSpeed;
        this.x += this.vx;
        this.vx *= this.board.params.drag;
        
        this.vy += +this.thoughts.moveY * this.board.params.creatureSpeed;
        this.y += this.vy;
        this.vy *= this.board.params.drag;
        
        this.touchingWall = false;
        if (this.board.params.circle) {
            var rthis = Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
            var rboard = this.board.width/2 - this.radius;
            if (rthis > rboard) {
                this.x *= (rboard / rthis);
                this.y *= (rboard / rthis);
                this.touchingWall = true;
            }
        } else {
            if (this.board.params.loop) {
                if (Math.abs(this.x) > board.width/2)  this.x -= board.width  * Math.sign(this.x); 
                if (Math.abs(this.y) > board.height/2) this.y -= board.height * Math.sign(this.y); 
            } else {
                if (Math.abs(this.x) > board.width/2 - this.radius) {
                    this.x = Math.sign(this.x) * (board.width/2 - this.radius)
                    this.vx *= -1;
                    this.touchingWall = true;
                };
                if (Math.abs(this.y) > board.height/2 - this.radius) {
                    this.y = Math.sign(this.y) * (board.height/2 - this.radius)
                    this.vy *= -1;
                    this.touchingWall = true;
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
            this.board.moveCreatureNextTo(this, offspring);
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
        out += this.touchingWall ? this.board.params.wallCost : 0;
        
        return out;
    }
    collide(list) {
        var singleCollision = (other, speed) => {
            var eatSpeeds = this.board.params.foodChain[this.type]
            if (other instanceof Creature || other instanceof FoodPellet) {
                var amt = speed * eatSpeeds[other.type];
                other.energy -= amt;
                this.energy += amt;
                return true;
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
        if (this.board.view.showType) {
            var typeColor = [[1,0,0],[0,1,0],[0,0,1]][this.type];
            canvas.strokeCircle(typeColor, 2, this.radius + 5, this.x, this.y);
        }
        if (this.board.view.showHash)
            canvas.strokeCircle(this.hashColor, 2, this.radius + 7, this.x, this.y);
        
        
        if (this.board.view.showLongestLineage && this.mind.iterations && this.mind.iterations + 3 >= bestNN) {
            var val = (4 - (bestNN - this.mind.iterations)) / 4;
            canvas.strokeRect([val,val,0], 2, this.x - this.radius-10, this.y - this.radius-10, this.radius*2+20, this.radius*2+20)
        }
        
        if (this.board.view.showOldest && this.lifespan == bestLifespan) 
            canvas.strokeRect([0,1,1], 2, this.x - this.radius-15, this.y - this.radius-15, this.radius*2+30, this.radius*2+30)
        
        if (this.board.view.showMemory && this.thoughts && this.thoughts.memory) {
            var segmentSize = 2*Math.PI / this.thoughts.memory.length;
            for (var i = 0; i < this.thoughts.memory.length; i++) {
                canvas.strokeArc([1,1,1], 2, this.radius + 1, this.x, this.y, segmentSize*i, segmentSize*(i+this.thoughts.memory[i]));
            }
        }
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
        ax *= board.params.maxSpeed / 100;
        ay *= board.params.maxSpeed / 100;
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
    constructor(net, iterations, board, template) {
        this.board = board;
        this.iterations = iterations || 1;
        if (!net) {
            this.net = new NeuralNet(20 + board.params.memoryNodes,
                                     15 + board.params.memoryNodes,
                                     6  + board.params.memoryNodes);
            if (template) {
                this.net.deserialize(template.mind.net.serialize());
                this.iterations = template.mind.iterations + 1;
                this.net.mutate(0.2,0.5);
            }
        } else {
            this.net = net;
        }
    }
    think(energy, x, y, vx, vy, sensors, creature) {
        if (!creature.board.params.positionSense) {
            x=0; y=0;
        }
        if (!creature.thoughts) {
            creature.thoughts = {memory: Array(creature.board.params.memoryNodes).fill(0)}
        }
        var input = sensors.reduce((a,b)=>a.concat(b), []);
        input = input.concat([energy/100, 2*x/creature.board.width, 2*y/creature.board.height/*/x, y/**/, vx, vy]);
        input = input.concat(creature.thoughts.memory);
        var out = this.net.exec(input);
        return {
            moveX: (out[0]-0.5)*creature.board.params.maxSpeed*2,
            moveY: (out[1]-0.5)*creature.board.params.maxSpeed*2,
            hue: out[2] * creature.board.params.limitHue, //Math.atan2(ay, ax) * 180 / Math.PI,
            sat: 1 - (1-out[3]) * creature.board.params.limitSat,
            val: 1 - (1-out[4]) * creature.board.params.limitVal,
            split: out[5] + 0.5,//window.enableSplit ? (energy > 400 ? 1 : 0) : 0
            memory: out.filter((e,i)=>i>5)
        }
    
    }
    newMind() {
        return new NeuralNetMind(this.net.clone().mutate(0.2, 0.5), this.iterations+1, this.board);
    }
}

class NeuralNet {
    constructor(l0, l1, l2) {
        var rand = _=>(Math.random()*2-1);
        
        this.l0length = l0;
        this.l1length = l1;
        this.l2length = l2;
        this.l1bias = new Array(l1).fill(0).map(a=>rand());
        this.l1fac  = new Array(l1).fill(0).map(a=>new Array(l0).fill(0).map(b=>rand()));
        this.l2bias = new Array(l2).fill(0).map(a=>rand());
        this.l2fac  = new Array(l2).fill(0).map(a=>new Array(l1).fill(0).map(b=>rand()));
    }
    sig(x) {return 1/(1+Math.pow(Math.E,-x));}
    exec(l0) {
        var l1 = [];
        for (var i_l1=0; i_l1<this.l1length; i_l1++) {
            l1[i_l1] = this.l1bias[i_l1];
            for (var i_l0=0; i_l0<this.l0length; i_l0++) {
                l1[i_l1] += l0[i_l0] * this.l1fac[i_l1][i_l0];
            }
            l1[i_l1] = this.sig(l1[i_l1]);
        }
        var l2 = [];
        for (var i_l2=0; i_l2<this.l2length; i_l2++) {
            l2[i_l2] = this.l2bias[i_l2];
            for (var i_l1=0; i_l1<this.l1length; i_l1++) {
                l2[i_l2] += l1[i_l1] * this.l2fac[i_l2][i_l1];
            }
            l2[i_l2] = this.sig(l2[i_l2]);
        }
        return l2;
    }
    clone() {
        var out = new NeuralNet(0,0,0);
        out.deserialize(this.serialize());
        return out;
    }
    mutate(count, amt) {
        var list = this.serialize();
        var indexes = new Array(Math.round(count*list[0].length)).fill(0).map(a=>Math.floor(Math.random()*list[0].length));
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

// Here be global variables

function stableSort (array, cmp) {
  cmp = !!cmp ? cmp : (a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  };
  let stabilizedThis = array.map((el, index) => [el, index]);
  let stableCmp = (a, b) => {
    let order = cmp(a[0], b[0]);
    if (order != 0) return order;
    return a[1] - b[1];
  }
  stabilizedThis.sort(stableCmp);
  for (let i=0; i<array.length; i++) {
    array[i] = stabilizedThis[i][0];
  }
  return array;
}

var superfast = false;

var board;
var canvas;
var repeatingTick;
var totalEnergy;
var bestNN;
var bestLifespan;
var warpspeed=1;

var c2;
var tickerX;
var tickerSpeed = 1/100;

var netColors=[];
function creatureColorFilter(creatures) {
    creatures = creatures.sort((a,b)=>{
        if (a[1].type != b[1].type) {
            return a[1].type-b[1].type;
        } else {
            return a[0]-b[0];
        }
    });
    
    return creatures;
}

function gatherPopulationColors(count) {
    // Collect `count` random samples from the population
    // Pick random indices
    /*
    var indices = Array(count).fill().map(_=>(
        Math.floor(Math.random()*board.creatures.length)
    ))
    indices.sort();
    */
    indices = Array(board.creatures.length).fill().map((e,i)=>i);
    
    // Map to creatures
    var creatures = indices.map(e=>[e,(board.creatures[e])]);
    creatures = creatureColorFilter(creatures);
    
    // Map to color
    return creatures.map(c=>{
        if (c[1].type == 3) {
            return [1,1,1];
        } else {
            return c[1].hashColor;
        }
    })
    
        
}
function drawPopulationColors(canvas, colors, x) {
    var width = 3, height = 50, y = 25, dy = height / colors.length;
    for (var i = 0; i < colors.length; i++) {
        canvas.fillRect(colors[i], x, y-dy-1, width, dy+1);
        y -= dy;
    }
}

var minds = {dummy:_=>new DummyMind(),
             follow:_=>new FollowMind(),
             simple:_=>new SimpleMind(),
             food:_=>new FoodMind(),
             newNeural:_=>new NeuralNetMind(null, 1, board),
             neural:template=>new NeuralNetMind(null, 1, board, template)};

function newObject(objType, board, x, y, type, energy) {
    if (objType == 'food') {
        return new FoodPellet(board, x, y, energy)
    } else {
        var template = null;
        if (objType == 'neural') {
            // Reincarnation
            // Check 50 random creatures for these requirements:
            // - Is a NN creature
            // - Is specified type
            for (var i = 0; i < 50; i++) {
                var index = Math.floor(Math.random()*board.creatures.length);
                var c = board.creatures[index];
                if (c.mind && c.mind.net && (!board.params.separateGenomes || c.type == type)) {
                    template = c;
                    break;
                }
            }
            if (i == 50) console.log("Failed to clone NN, random one created")
        }
        var newCreature = new Creature(board, x, y, minds[objType](template), type, energy);
        if (template) {
            board.moveCreatureNextTo(template, newCreature);
        }
        return newCreature;
    }  
}


function init() {
    if (board) {
        board.creatures = [];
        board.time = 0;
    } else {
        board = new Board(1500,1500);
    }
    canvas = new CanvasWrapper("world");
    canvas.updateMetrics(board);
    
    c2 = new CanvasWrapper("extra");
    c2.updateMetrics({width:200, height:50});
    c2.fill([0,0,0])
    tickerX = -100;
    
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
        var type = Math.floor(Math.random()*3)
        newObject('newNeural',
                  board,
                  (Math.random()-0.5)*board.width,
                  (Math.random()-0.5)*board.height,
                  type,
                  100);
    }
    
    window.enableSplit = true;
}


function tick() {
    board.tick();
    totalEnergy = board.creatures.reduce((s,c)=>s+(c.energy), 0) || 0;
    while (totalEnergy < 20000) {
        var type = Math.floor(Math.random()*3)
        newObject((Math.random()<0.00)?'food':'neural',
                  board,
                  (Math.random()-0.5)*board.width*0.7,
                  (Math.random()-0.5)*board.height*0.7,
                  type,
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
    
    if (warpspeed > 0) {
        drawPopulationColors(c2, gatherPopulationColors(100), Math.floor(tickerX*4)/4);
        tickerX += warpspeed * tickerSpeed;
        if (tickerX > 100) tickerX = -100;
    }
    
    document.getElementById("time-display").innerText = (board.time);
    document.getElementById("energy-display").innerText = (totalEnergy);
    document.getElementById("consumption-display").innerText = (averageConsumption);
    document.getElementById("count-display").innerText = (board.creatures.length)
    document.getElementById("bestnn-display").innerText = (bestNN);
    document.getElementById("bestlife-display").innerText = (bestLifespan);
}


// Draws a neural network... Kinda looks like a buncha lines
function drawNN(net, inputs, canvas, alignment, offsetX, offsetY) {
    var spacingX = 100, spacingY = -20, radius = 5, thickness = 1;
    offsetX -= alignment * spacingX*2;
    offsetY -= alignment * spacingY*(net.l0length-1);
    
    if (!inputs) {inputs = Array(net.l0length).fill(100000)}
    
    function gray(x) {
        var v = 1/(1+Math.pow(Math.E,-x));
        return [v,v,v];
    }
    
    // Draw fac lines
    for (var i = 1; i < 3; i++) {
        facs = [net.l1fac, net.l2fac][i-1];
        
        var x1 = offsetX + spacingX * i,
            x2 = x1 - spacingX;
        
        for (var k = 0; k < facs.length; k++) {
            var y1 = offsetY + spacingY * k;
            for (var l = 0; l < facs[0].length; l++) {
                var y2 = offsetY + spacingY * l;
                canvas.strokeLine(gray(facs[k][l]), thickness, x1, y1, x2, y2);
            }
        }
    }
    
    // Draw bias circles
    for (var i = 0; i < 3; i++) {
        biases = [inputs, net.l1bias, net.l2bias][i];
        
        var x1 = offsetX + spacingX * i;
        
        for (var k = 0; k < biases.length; k++) {
            var y1 = offsetY + spacingY * k;
            canvas.fillCircle(gray(biases[k]), radius, x1, y1);
        }
    }
}


var netColorFactors = Array(3).fill().map(_=>(
    Array(600).fill().map(_=>(
        Math.random()-0.5
    ))
))
// Returns a color based on a hash of the creature
function colorFromNet(creature) {
    if (creature.mind && creature.mind.net) {
        var net = creature.mind.net;
        var netVals = net.serialize()[0];
        var hashVals = netColorFactors.map(e=>(
            netVals.reduce((a,b,i)=>a+(b*e[i]), 0) / 10
        ));
        
        if (creature.board.params.separateGenomes) {
            hashvals[0] = Math.sin(hashVals[0])*40+(creature.type*120)
        } else {
            hashVals[0] *= 40;
        }

        return hsv2rgb(hashvals[0],
                       Math.sin(hashVals[1])*0.25+0.75,
                       Math.sin(hashVals[2])*0.25+0.75);
    } else {
        return [[1,0,0],[0,1,0],[0,0,1],[1,1,1]][creature.type];
    }
}

/*
c2 = new CanvasWrapper("extra");
net = board.creatures[200].mind.net;
c2.updateMetrics({width:60, height:190});
*/