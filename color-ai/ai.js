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

class Board {
    constructor() {
        this.params = {
            creatureAwareness: 10,
            creatureSpeed: 1/20,
            eatSpeed: 2,
            drag: 19/20
        }
        this.creatures = [];
    }
    
    sense() {
        return {r:0, g:0, b:0};
    }
    
    tick() {
        this.creatures.forEach(c=>c.think());
        this.creatures.forEach(c=>c.update());
        for (var i = 0; i < this.creatures.length - 1; i++) {
            var c1 = this.creatures[i];
            for (var k = i+1; k < this.creatures.length; k++) {
                var c2 = this.creatures[k];
                var dist = Math.sqrt(Math.pow(c1.x - c2.x,2) + Math.pow(c1.x - c2.x,2));
                var collision = (dist < c1.radius + c2.radius);
                
                if (collision) {
                    c1.collide(c2) || c2.collide(c1)
                }
            }
        }
        this.creatures = this.creatures.filter(c=>c.energy > 0);
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
        this.thoughts = this.mind.think(this.energy, this.vx, this.vy, sensors);
    }
    update() {
        this.vx += this.thoughts.moveX * this.board.params.creatureSpeed;
        this.x += this.vx;
        this.vx *= this.board.params.drag;
        
        this.vy += this.thoughts.moveY * this.board.params.creatureSpeed;
        this.y += this.vy;
        this.vy *= this.board.params.drag;
      
        this.radius = Math.sqrt(this.energy);
        
        this.color = hsv2rgb(this.thoughts.hue, this.thoughts.sat, this.thoughts.val);
    }
    collide(other) {
        if (other instanceof Creature) {
            if ((this.type - other.type) % 3 == 2) {
                // Om nom nom
                var amt = Math.min(other.energy, board.params.eatSpeed);
                other.energy -= amt;
                this.energy += amt;
                return true;
            }
        }
    }
}

class DummyMind {
    constructor() {}
    think(energy, vx, vy) {
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

var board;
var creature;

function init() {
    board = new Board();
    creature = newCreature(0, 0, 0);
}

function newCreature(x, y, type) {
    return new Creature(board, x, y, new DummyMind(), type, 100);
}
    


