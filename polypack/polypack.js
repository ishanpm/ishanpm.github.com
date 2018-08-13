// List of subshapes for animation purposes (x,y,width,height)
POLYS = [
    [[0,0,1,1],[0,0,1,1],[0,0,1,1],[0,0,1,1],[0,0,0]], // Dot
    [[0,0,1,1],[0,0,2,1],[0,0,1,1],[0,0,1,1],[0.2,0.2,0.2]], // Domino

    [[-1,0,2,1],[0,0,2,1],[0,0,1,1], [0,0,1,1],[0.4,0.4,0.4]], // Straight
    [[-1,0,2,1],[0,0,1,1],[0,-1,1,2],[0,0,1,1],[0.6,0.6,0.6]], // Bend

    [[-1,0,2,1], [0,0,3,1], [0,0,1,1],  [0,0,1,1],[0,1,1]], // I
    [[-1,0,2,1], [0,0,2,1], [0,-1,1,2], [0,0,1,1],[1,0,1]], // T
    [[-1,0,2,1], [0,-1,2,1],[0,-1,1,2], [0,0,1,1],[0,1,0]], // S
    [[-1,-1,2,1],[0,0,2,1], [0,-1,1,2], [0,0,1,1],[1,0,0]], // Z
    [[-1,0,2,1], [0,0,2,1], [1,-1,1,2], [0,0,1,1],[0,0,1]], // L
    [[-1,0,2,1], [0,0,2,1], [-1,-1,1,2],[0,0,1,1],[1,0.5,0]], // J
    [[0,0,1,1],  [0,-1,2,2],[0,0,1,1],  [0,0,1,1],[1,1,0]], // O

    [[-1,0,2,1], [0,0,2,1], [-1,-1,1,2],[0,0,1,2], [0.7,0.4,  0]], // F
    [[-1,0,2,1], [0,0,2,1], [1,-1,1,2], [0,0,1,2], [  0,  0,0.7]], // F'
    [[-2,0,3,1], [0,0,3,1], [0,0,1,1],  [0,0,1,1], [0.5,0.9,0.9]], // I
    [[-2,0,3,1], [0,0,2,1], [1,-1,1,2], [0,0,1,1], [0.4,0.4,1  ]], // L
    [[-1,0,2,1], [0,0,3,1], [-1,-1,1,2],[0,0,1,1], [1  ,0.8,0.4]], // L'
    [[-2,0,3,1], [0,1,2,1], [0,0,1,2],  [0,0,1,1], [0.8,  0,  0]], // N
    [[-1,1,2,1], [0,0,3,1], [0,0,1,2],  [0,0,1,1], [  0,0.8,  0]], // N'
    [[-1,-1,2,2],[0,0,2,1], [0,0,1,1],  [0,0,1,1], [0.7,1  ,  0]], // P
    [[-1,0,2,1], [0,-1,2,2],[0,0,1,1],  [0,0,1,1], [1  ,0.9,  0]], // P'
    [[-1,0,2,1], [0,0,2,1], [0,-2,1,3], [0,0,1,1], [1  ,0.3,1  ]], // T
    [[-1,0,2,1], [0,0,2,1], [-1,-1,1,2],[1,-1,1,2],[  0,0.5,1  ]], // U
    [[-2,0,3,1], [0,0,1,1], [0,-2,1,3], [0,0,1,1], [1  ,0.5,0.2]], // V
    [[-1,0,2,1], [0,1,2,1], [-1,-1,1,2],[0,0,1,2], [0.5,0.5,1  ]], // W
    [[-1,0,2,1], [0,0,2,1], [0,-1,1,2], [0,0,1,2], [0.5,  0,1  ]], // X
    [[-2,0,3,1], [0,0,2,1], [0,-1,1,2], [0,0,1,1], [  0,0.8,0.4]], // Y
    [[-1,0,2,1], [0,0,3,1], [0,-1,1,2], [0,0,1,1], [  0,0.4,0.8]], // Y
    [[-1,0,2,1], [0,0,2,1], [-1,0,1,2], [1,-1,1,2],[  1,0.5,0.5]], // Z
    [[-1,0,2,1], [0,0,2,1], [-1,-1,1,2],[1,0,1,2], [0.5,1  ,0.5]], // Z'
]

// List of [x,y] pairs of tiles covered by polyominoes
POLYCOVER = (function() {
    var polycover = [];
    // For each polyomino
    for (var i=0; i<POLYS.length; i++) {
        polycover[i] = [];
        // Add the spaces covered by its subshapes
        for (var p=0; p<4; p++) {
            for (var x=0; x<POLYS[i][p][2]; x++) {
                for (var y=0; y<POLYS[i][p][3]; y++) {
                    // Don't add duplicates
                    var dup = false;
                    for (var k=0; k<polycover[i].length; k++) {
                        if (x+POLYS[i][p][0] == polycover[i][k][0] && y+POLYS[i][p][1] == polycover[i][k][1]) {
                            dup = true;
                            break;
                        }
                    }
                    if (!dup) {
                        polycover[i].push([x+POLYS[i][p][0], y+POLYS[i][p][1]]);
                    }
                }
            }
        }
    }
    return polycover;
})()

// List of vertices for animation purposes ([[x1a,y1a]...], [[x1b,y1b]...])
NUMBERS = [
    [[[0,0],[1,0],[1,2],[0,2],[0,0]],[[1,0],[1,0],[1,2],[1,2],[1,0]]], // 0..1
    [[[1,0],[1,0],[1,1],[1,1],[1,2],[1,2]],[[0,0],[1,0],[1,1],[0,1],[0,2],[1,2]]], // 1..2
    [[[0,0],[1,0],[1,1],[0,1],[0,1],[0,2],[0,2],[1,2]],[[0,0],[1,0],[1,1],[0,1],[1,1],[1,2],[0,2],[1,2]]], // 2..3
    [[[0,0],[1,0],[1,1],[0,1],[0,1],[0,1],[1,1],[1,2],[0,2]],[[1,0],[1,0],[1,1],[0,1],[0,0],[0,1],[1,1],[1,2],[1,2]]], // 3..4
    [[[0,0],[0,0],[0,1],[1,1],[1,0],[1,2],[1,2]],[[1,0],[0,0],[0,1],[1,1],[1,1],[1,2],[0,2]]], // 4..5
    [[[1,0],[0,0],[0,1],[1,1],[1,2],[0,2],[0,2]],[[1,0],[0,0],[0,1],[1,1],[1,2],[0,2],[0,1]]], // 5..6
    [[[1,0],[0,0],[0,0],[0,1],[1,1],[1,2],[0,2],[0,1]],[[1,0],[0,0],[1,0],[1,1],[1,1],[1,2],[1,2],[1,1]]], // 6..7
    [[[0,0],[1,0],[1,2],[1,2],[1,0],[1,1],[1,1]],[[0,0],[1,0],[1,2],[0,2],[0,0],[0,1],[1,1]]], // 7..8
    [[[1,1],[0,1],[0,0],[1,0],[1,2],[0,2],[0,1]],[[1,1],[0,1],[0,0],[1,0],[1,2],[0,2],[0,2]]], // 8..9
    [[[1,1],[0,1],[0,0],[1,0],[1,2],[0,2],[0,2]],[[0,1],[0,1],[0,0],[1,0],[1,2],[0,2],[0,1]]] // 9..0
]

framerate = 1000/60;

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
    
    updateMetrics(width, height, offx, offy) {
        this.width = this.canvas.offsetWidth;
        this.height = this.canvas.offsetHeight;
        this.offsetx = offx || 0;
        this.offsety = offy || 0;
        if (width !== null) {
            this.offsets = Math.min(this.width / width, this.height / height);
        }
        
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(this.offsets, this.offsets);
        this.translate(offx, offy);
    }
    // Coordinate transformations
    toScreenX(val) {return (this.offsetx + val) * this.offsets}
    toScreenY(val) {return (this.offsety + val) * this.offsets}
    toScreenScale(val) {return val * this.offsets}
    fromScreenX(val) {return val / this.offsets - this.offsetx}
    fromScreenY(val) {return val / this.offsets - this.offsety}
    fromScreenScale(val) {return val / this.offsets}
    
    // Graphics
    setFill(color) {
        this.ctx.fillStyle = `rgb(${Math.round(color[0]*255)},${Math.round(color[1]*255)},${Math.round(color[2]*255)})`;
    }
    setStroke(color) {
        this.ctx.strokeStyle = `rgb(${Math.round(color[0]*255)},${Math.round(color[1]*255)},${Math.round(color[2]*255)})`;
    }
    fill(color) {
        this.setFill(color);
        this.saveTransform();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.fillRect(0,0,this.width,this.height);
        this.restoreTransform();
    }
    fillCircle(radius, x, y) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI*2);
        this.ctx.closePath();
        this.ctx.fill();
    }
    strokeCircle(thickness, radius, x, y) {
        this.ctx.lineWidth = thickness;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, 2*Math.PI);
        this.ctx.closePath();
        this.ctx.stroke();
    }
    strokeArc(thickness, radius, x, y, start, end) {
        this.ctx.lineWidth = thickness;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, start, end);
        this.ctx.stroke();
    }
    fillRect(x, y, w, h) {
        this.ctx.fillRect(x, y, w, h);
    }
    strokeRect(thickness, x, y, w, h) {
        this.ctx.lineWidth = thickness;
        this.ctx.strokeRect(x, y, w, h);
    }
    strokeLine(thickness, x1, y1, x2, y2) {
        this.ctx.lineWidth = thickness;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }
    
    strokePolyLine(thickness, line) {
        this.ctx.lineWidth = thickness;
        this.ctx.beginPath();
        this.ctx.moveTo(line[0][0], line[0][1]);
        for (var i=1; i<line.length; i++) {
            this.ctx.lineTo(line[i][0], line[i][1]);
        }
        this.ctx.stroke();
    }
    
    saveTransform() {
        this.ctx.save();
    }
    restoreTransform() {
        this.ctx.restore();
    }
    translate(x, y) {
        this.ctx.translate(x, y);
    }
    rotate(r) {
        this.ctx.rotate(r*2*Math.PI);
    }
    scale(s) {
        this.ctx.scale(s,s);
    }
}

class KeyManager {
    constructor(canvas) {
        this.mouse = new VirtualButton();
        this.cw = new VirtualButton();
        this.ccw = new VirtualButton();
        this.hold = new VirtualButton();
        this.ffwd = new VirtualButton();
        this.debug = new VirtualButton();
        this.debug1 = new VirtualButton();
        this.debug2 = new VirtualButton();
        
        var that = this;
        
        document.addEventListener("keydown", function handleKeyDown(e) {
            if (that._handleKey(e.which || e.keyCode, true)) {
                //e.preventDefault();
                //e.stopPropagation();
            }
        });
        
        document.addEventListener("keyup", function handleKeyDown(e) {
            if (that._handleKey(e.which || e.keyCode, false)) {
                //e.preventDefault();
                //e.stopPropagation();
            }
        });
        
        canvas.canvas.addEventListener("mousedown", function handleMouseDown(e) {
            that._handleMouse(e.button, true);
            e.preventDefault();
            e.stopPropagation();
        });
        
        canvas.canvas.addEventListener("mouseup", function handleMouseUp(e) {
            that._handleMouse(e.button, false);
            e.preventDefault();
            e.stopPropagation();
        });
        canvas.canvas.addEventListener("contextmenu", function (e) {
            e.preventDefault();
        })
    }
    
    _handleMouse(mouse, down) {
        switch (mouse) {
            case 0:
                this.mouse.set(down);
                break;
            case 2:
                this.cw.set(down);
                break;
            case 1:
                this.hold.set(down);
        }
    }
    
    _handleKey(key, down) {
        switch (key) {
            case 81:
            case 'q':
                this.ccw.set(down);
                break;
            case 69:
            case 'e':
                this.cw.set(down);
                break;
            case 87:
            case 'w':
                this.hold.set(down);
                break;
            case 83:
            case 's':
                this.ffwd.set(down);
                break;
            case 192:
            case '`':
                this.debug.set(down);
                break;
            case 49:
            case '1':
                this.debug1.set(down);
                break;
            case 50:
            case '2':
                this.debug2.set(down);
                break;
            default:
                return false;
        }
        return true;
    }
    
    tick() {
        this.mouse.tick();
        this.cw.tick();
        this.ccw.tick();
        this.hold.tick();
        this.ffwd.tick();
        this.debug.tick();
        this.debug1.tick();
        this.debug2.tick();
    }
}

class VirtualButton {
    constructor() {
        this.hold = false;
        this.queueDown = false;
        this.queueUp = false;
        this.downListeners = [];
        this.upListeners = [];
    }
    
    tick() {
        if (!this.hold && this.queueDown) {
            this.hold = true;
            for (var i=0; i<this.downListeners.length; i++) {
                this.downListeners[i](true);
            }
        }
        if (this.hold && this.queueUp) {
            this.hold = false;
            for (var i=0; i<this.upListeners.length; i++) {
                this.upListeners[i](false);
            }
        }
        this.queueDown = false;
        this.queueUp = false;
    }
    
    set(v) {
        if (v) {
            this.queueDown = true;
        } else {
            this.queueUp = true;
        }
    }
    
    addDownListener(l) {
        this.downListeners.push(l);
    }
    
    addUpListener(l) {
        this.upListeners.push(l);
    }
}

class Board {
    constructor(game, width, height) {
        this.width = width;
        this.height = height;
        this.pieces = [];
        this.oldpieces = [];
        this.blocks = [];
        this.cells = new Array(height).fill(0).map(_=>new Array(width).fill(0));
    }
    
    clear() {
        this.cells.map(e=>e.fill(0));
        for (var i=0; i<this.blocks.length; i++) {
            this.blocks[i].shrink = true;
        }
        this.oldpieces = this.oldpieces.concat(this.pieces);
        this.pieces = [];
        for (var i=0; i<this.oldpieces.length; i++) {
            this.oldpieces[i].thickness = -0.2;
            this.oldpieces[i].fade = 1;
        }
    }
    
    addBlocker(x,y) {
        this.cells[y][x] = 2;
        this.blocks.push(new Block(x,y));
    }
    
    removeBlocker(x,y) {
        if (this.cells[y][x] == 2) {
            this.cells[y][x] = 0;
            for (var i=0; i<this.blocks.length; i++) {
                if (this.blocks[i].x == x && this.blocks[i].y == y) {
                    this.blocks[i].shrink = true;
                    return;
                }
            }
        }
    }
    
    canPlace(type, x, y, r) {
        var rotx = [(x,y)=>x,(x,y)=>-y,(x,y)=>-x,(x,y)=>y][(r%4 +4)%4];
        var roty = [(x,y)=>y,(x,y)=>x,(x,y)=>-y,(x,y)=>-x][(r%4 +4)%4];
        var cover = POLYCOVER[type];
        
        for (var i=0; i<cover.length; i++) {
            var x1 = rotx(cover[i][0], cover[i][1]) + x;
            var y1 = roty(cover[i][0], cover[i][1]) + y;
            
            if (!this.cells[y1] || this.cells[y1][x1] !== 0) {
                return false;
            }
        }
        return true;
    }
    
    canPlaceAny(type) {
        for (var x=0; x<this.width; x++){
            for (var y=0; y<this.height; y++){
                for (var r=0; r<4; r++){
                    if (this.canPlace(type, x, y, r)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    addPoly(poly) {
        if (!this.canPlace(poly.type, poly.x, poly.y, poly.r)) return false;
        
        var rotx = [(x,y)=>x,(x,y)=>-y,(x,y)=>-x,(x,y)=>y][(poly.r%4 +4)%4];
        var roty = [(x,y)=>y,(x,y)=>x,(x,y)=>-y,(x,y)=>-x][(poly.r%4 +4)%4];
        var cover = POLYCOVER[poly.type];
        
        this.pieces.push(poly);
        
        for (var i=0; i<cover.length; i++) {
            var x = rotx(cover[i][0], cover[i][1]) + poly.x;
            var y = roty(cover[i][0], cover[i][1]) + poly.y;
            this.cells[y][x] = 1;
        }
        
        return true;
    }
    
    nextBoard() {
        for (var y=0; y<this.height; y++) {
            for (var x=0; x<this.width; x++) {
                if (this.cells[y][x] == 0) {
                    this.addBlocker(x,y);
                }
                if (this.cells[y][x] == 1) {
                    this.cells[y][x] = 0;
                }
            }
        }
        for (var i=0; i<this.pieces.length; i++) {
            this.pieces[i].fade = 0.8;
            this.pieces[i].thickness = 0.2;
        }
        this.oldpieces = this.pieces;
        this.pieces = [];
    }
    
    emptyCount() {
        var c = 0;
        for (var y=0; y<this.height; y++) {
            for (var x=0; x<this.width; x++) {
                if (this.cells[y][x] == 0) {
                    c++;
                }
            }
        }
        
        return c;
    }
    
    tick() {
        for (var i=0; i<this.oldpieces.length; i++) {
            this.oldpieces[i].tick();
        }
        
        for (var i=0; i<this.pieces.length; i++) {
            this.pieces[i].tick();
        }
        
        for (var i=0; i<this.blocks.length; i++) {
            var destroy = !this.blocks[i].tick();
            if (destroy) {
                this.blocks.splice(i,1);
                i--;
            }
        }
    }
    
    draw(canvas) {
        canvas.setFill([0.8,0.8,0.8]);
        for (var x=0; x<this.width; x++) {
            for (var y=0; y<this.height; y++) {
                canvas.fillRect(x+0.4, y+0.4, 0.2, 0.2);
            }
        }
        
        canvas.setFill([0.5,0.5,0.5]);
        canvas.setStroke([1,1,1]);
        
        for (var i=0; i<this.blocks.length; i++) {
            // fill: gray 0.8, stroke: white
            this.blocks[i].draw(canvas);
        }
        
        for (var i=0; i<this.oldpieces.length; i++) {
            this.oldpieces[i].draw(canvas);
        }
        
        for (var i=0; i<this.pieces.length; i++) {
            this.pieces[i].draw(canvas);
        }
    }
}

class Polyomino {
    constructor(game, type, x, y, r, scale) {
        x = x || 0;
        y = y || 0;
        r = r || 0;
        scale = scale || 1;
        this.x = x;
        this.y = y;
        this.r = r;
        this.dx = x;
        this.dy = y;
        this.dr = r;
        
        this.type = type || 0;
        this.dcolor = [0,0,0];
        this.fade = 0;
        this.thickness = 0.45;
        this.dthickness = this.thickness;
        this.scale = scale;
        this.dscale = scale;
        
        this.subshapes = [[0,0,1,1],[0,0,1,1],[0,0,1,1],[0,0,1,1]];
    }
    tick() {
        this.dx += (this.x - this.dx) / 5;
        this.dy += (this.y - this.dy) / 5;
        this.dr += (this.r - this.dr) / 3;
        this.dthickness += (this.thickness - this.dthickness) / 5;
        this.dscale += (this.scale - this.dscale) / 5;
        
        for (var i=0; i<this.subshapes.length; i++) {
            for (var p=0; p<4; p++) {
                this.subshapes[i][p] += (POLYS[this.type][i][p] - this.subshapes[i][p]) / 5;
            }
        }
        
        this.dcolor[0] += ((1-(1-this.fade)*(1-POLYS[this.type][4][0])) - this.dcolor[0]) / 5;
        this.dcolor[1] += ((1-(1-this.fade)*(1-POLYS[this.type][4][1])) - this.dcolor[1]) / 5;
        this.dcolor[2] += ((1-(1-this.fade)*(1-POLYS[this.type][4][2])) - this.dcolor[2]) / 5;
    }
    draw(canvas) {
        canvas.setFill(this.dcolor);
        canvas.saveTransform();
        canvas.translate(this.dx+0.5,this.dy+0.5);
        canvas.rotate(this.dr/4);
        canvas.scale(this.dscale);
        
        for (var i=0; i<this.subshapes.length; i++) {
            var shape = this.subshapes[i];
            if (Math.min(shape[2], shape[3]) + 2*this.dthickness > 1) {
                canvas.fillRect(shape[0] - this.dthickness, shape[1] - this.dthickness, shape[2] + 2*this.dthickness - 1, shape[3] + 2*this.dthickness - 1);
            }
        }
        
        canvas.restoreTransform();
    }
}

class Block {
    constructor(x,y) {
        this.x = x;
        this.y = y;
        this.size = 0
        this.shrink = false;
    }
    
    tick() {
        if (this.shrink) {
            this.size += (-0.1 - this.size) / 5;
        } else {
            this.size += (0.45 - this.size) / 5;
        }
        
        return (this.size >= 0);
    }
    
    // For draw optimization, expects fill and stroke to be set beforehand
    draw(canvas) {
        canvas.saveTransform();
        canvas.translate(this.x + 0.5, this.y + 0.5);
        canvas.fillRect(-this.size, -this.size, this.size*2, this.size*2);
        if (this.size > 0.1) {
            canvas.strokeLine(0.05,0.1-this.size,0.1-this.size,this.size-0.1,this.size-0.1);
            canvas.strokeLine(0.05,0.1-this.size,this.size-0.1,this.size-0.1,0.1-this.size);
        }
        canvas.restoreTransform();
    }
}

class Timer {
    constructor(game) {
        this.fspeed = framerate / 1000 * 20;
        
        this.game = game;
        
        this.maxTime = 85;
        this.ffwd = false;
        this.pause = false;
        this.currentTime = this.maxTime;
    }
    
    tick() {
        if (!this.pause) {
            if (this.ffwd) {
                this.currentTime -= this.fspeed;
            } else {
                this.currentTime -= framerate / 1000;
            }
        }
    }
    
    draw(canvas) {
        var bh = this.game.board.height;
        var t = this.currentTime/this.maxTime;
        
        if (this.ffwd) {
            canvas.setFill([0,0.5,1]);
        } else if (this.pause) {
            canvas.setFill([0.8,0.8,0.8]);
        } else {
            if (this.currentTime > 5) {
                canvas.setFill([1-t,0,0]);
            } else {
                var flash = (this.currentTime%0.333) / 0.333;
                canvas.setFill([1,flash, flash]);
            }
        }
        canvas.fillRect(-0.2,bh * (1-t), 0.2,bh * t);
    }
}

class NumberDisplay {
    constructor() {
        this.num = 0;
        this.disp = 0;
        this.x = -2;
        this.y = 0;
        this.r = 3;
        this.minDigits = 3;
    }
    
    tick() {
        this.disp += (Math.floor(this.num) - this.disp) / 10;
    }
    
    draw(canvas) {
        canvas.saveTransform();
        
        if (this.disp < 0) {
            var tmp = this.disp;
            this.disp *= -1;
            this.draw(canvas);
            this.disp = tmp;
            return;
        }
        
        canvas.translate(this.x + 0.5, this.y + 0.5);
        canvas.rotate(this.r/4);
        canvas.translate(0,0.5)
        canvas.scale(1/1.3);
        canvas.translate(-0.5, -1);
        
        canvas.setStroke([0,0,0]);
        
        var frac = this.disp % 1;
        var int = Math.floor(this.disp);
        var count = Math.max(this.minDigits, Math.floor(Math.log10(Math.ceil(this.disp))) + 1);
        
        for (var i=0; i<count; i++) {
            if (int == 0) {
                var gray = 1-frac;
                if (i < this.minDigits) {
                    gray *= 0.8;
                }
                canvas.setStroke([gray,gray,gray]);
            }
            
            this._drawDigit(canvas, int + frac);
            canvas.translate(-1.3,0);
            
            if (int % 10 != 9) {
                frac = 0;
            }
            
            int = Math.floor(int/10);
        }
        
        canvas.restoreTransform();
    }
    
    _drawDigit(canvas, digit) {
        var data = NUMBERS[Math.floor(digit) % 10];
        var frac = digit % 1;
        
        var line = data[0].map((e1,i1)=>e1.map((e2,i2)=>e2*(1-frac) + data[1][i1][i2]*(frac)));
        
        canvas.strokePolyLine(0.1, line)
    }
}

class RandomBag {
    constructor(count) {
        this.count = count;
        this.pieces = Array(count).fill(0).map((e,i)=>i);
    }
    
    get() {
        var i = Math.floor(Math.random() * this.pieces.length);
        var out = this.pieces[i];
        this.pieces.splice(i,1);
        
        if (this.pieces.length == 0) {
            this.pieces = Array(this.count).fill(0).map((e,i)=>i);
        }
        
        return out;
    }
}

class TitleScreen {
    constructor(game) {
        this.game = game;
        this.time1 = 0;
        
        this.polyList = [
            {t:27, x:1, y:3, r:0}, //P
            {t:8 , x:1, y:1, r:2},
            {t:21, x:4, y:4, r:0}, //o
            {t:21, x:4, y:1, r:2},
            {t:4 , x:6, y:2, r:1}, //l
            {t:17, x:8, y:2, r:1}, //y
            {t:1 , x:9, y:1, r:1},
            {t:20, x:0, y:7, r:1}, //P
            {t:9 , x:1, y:5, r:2},
            {t:25, x:3, y:7, r:1}, //a
            {t:14, x:5, y:6, r:3},
            {t:3 , x:6, y:5, r:2}, //c
            {t:3 , x:6, y:8, r:1},
            {t:25, x:8, y:7, r:1}, //k
            {t:0 , x:9, y:8, r:0},
            {t:1 , x:9, y:5, r:1}
        ];
        this.pieceList = [];
    }
    
    init() {
        for (var i=0; i<this.polyList.length; i++) {
            //this.game.board.addPoly(new Polyomino(this.game, this.polyList[i].t, this.polyList[i].x, this.polyList[i].y, this.polyList[i].r));
        }
        for (var i=0; i<10; i++) {
            this.game.board.addBlocker(i,0);
            this.game.board.addBlocker(i,9);
        }
    }
    
    tick() {
        if (this.time1 % 10 == 0) {
            var i = this.time1 / 10;
            if (i >= 0 && i < this.polyList.length) {
                this.pieceList[i] = new Polyomino(this.game, 0, this.polyList[i].x, this.polyList[i].y, this.polyList[i].r);
                this.game.board.addPoly(this.pieceList[i]);
            }
        }
        /*if ((this.time1 - 45) % 10 == 0) {
            var i = (this.time1 - 45) / 10;
            if (i >= 0 && i < this.polyList.length) {
                this.pieceList[i].r = this.polyList[i].r;
            }
        }*/
        if ((this.time1 - 45) % 10 == 0) {
            var i = (this.time1 - 45) / 10;
            if (i >= 0 && i < this.polyList.length) {
                this.pieceList[i].type = this.polyList[i].t;
            }
        }
        this.time1++;
    }
}

class GameOverScreen {
    constructor(game) {
        this.game = game;
        this.time = 0;
        this.finalScore = game.score.num;
        this.finalScoreDisp = null;
        game.score.num = 0;
    }
    
    tick() {
        if (this.time%5 == 0) {
            var i = this.time/5 + 1;
            if (i < 9) {
                this.game.board.removeBlocker(9-i,4);
                this.game.board.removeBlocker(i,5);
            }
            if (i == 10) {
                this.finalScoreDisp = new NumberDisplay();
                this.finalScoreDisp.minDigits = 8;
                this.finalScoreDisp.x = 8;
                this.finalScoreDisp.y = 4;
                this.finalScoreDisp.r = 0;
                this.finalScoreDisp.num = this.finalScore;
            }
        }
        
        this.time++;
        
        if (this.finalScoreDisp) this.finalScoreDisp.tick();
    }
    
    draw(canvas) {
        if (this.finalScoreDisp) this.finalScoreDisp.draw(canvas);
    }
}

class Game {
    constructor() {
        this.canvas = new CanvasWrapper("game");
        this.canvas.updateMetrics(14,10, 2,0);
        this.input = new KeyManager(this.canvas);
        
        this.title = null;
        
        this.timer = new Timer(this);
        this.score = new NumberDisplay();
        this.rand = new RandomBag(POLYS.length);
        
        this.inGame = false;
        
        this.holdQueue = [];
        this.nextQueue = [];
        
        this.board = new Board(this,10,10);
        this.mousePiece = null;
        this.fillHoldQueue();
        this.fillNextQueue();
        this.popNextQueue();
        
        
        // Event listeners
        var that = this;
      
        this.input.ccw.addDownListener(function() {
            if (that.mousePiece) that.mousePiece.r -= 1;
        })
        this.input.cw.addDownListener(function() {
            if (that.mousePiece) that.mousePiece.r += 1;
        })
        this.input.hold.addDownListener(function() {
            that.doHold();
        })
        this.input.ffwd.addDownListener(function() {
            that.timer.ffwd = true;
        })
        this.input.ffwd.addUpListener(function() {
            that.checkFfwd();
        })
        this.input.debug1.addDownListener(function() {
            that.mousePiece.type = (that.mousePiece.type + 1) % POLYS.length;
        })
        this.input.debug.addDownListener(function() {
            that.mousePiece.type = (that.mousePiece.type - 1 + POLYS.length) % POLYS.length;
        })
        this.input.debug2.addDownListener(function() {
            that.timer.pause = true;
        })
        this.input.mouse.addDownListener(function() {
            if (that.title) {
                that.title = null;
                that.inGame = true;
                that.board.clear();
            } else if (that.gameOver) {
                that.reset();
            } else {
                that.placePiece();
            }
        })
        
        this.reset();
    }
    
    placePiece() {
        if (this.board.addPoly(this.mousePiece)) {
            console.log(this.mousePiece.type, this.mousePiece.x, this.mousePiece.y, this.mousePiece.r % 4);
            this.score.num += POLYCOVER[this.mousePiece.type].length;
                
            this.mousePiece.thickness = 0.45;
            this.popNextQueue();
            
            
            this.checkFfwd();
        }
    }
    
    doHold() {
        var tmp = this.mousePiece.type;
        this.mousePiece.type = this.holdQueue[0].type;
        this.mousePiece.dr = (this.mousePiece.dr%4 +4) % 4;
        this.mousePiece.r = 0;
        this.holdQueue.splice(0,1);
        
        var newPiece = new Polyomino(
                this, tmp, this.board.width + 0.5, -0.5, 0, 0.2);
        newPiece.thickness = 0.5;
        this.holdQueue.push(newPiece);
        this.fillHoldQueue();
    }
    
    fillHoldQueue() {
        while (this.holdQueue.length < 2) {
            var newPiece = new Polyomino(
                    this, this.rand.get(), this.board.width + 0.5, -0.5, 0, 0.2);
            newPiece.thickness = 0.5;
            this.holdQueue.push(newPiece);
        }
        for (var i=0; i<this.holdQueue.length; i++) {
            this.holdQueue[i].y = 2.5 - 2*i
        }
    }
    
    fillNextQueue() {
        while (this.nextQueue.length < 3) {
            var newPiece = new Polyomino(
                    this, this.rand.get(), this.board.width + 0.5, this.board.height + 1.5, 0, 0.2);
            newPiece.thickness = 0.5;
            this.nextQueue.push(newPiece);
        }
        
        for (var i=0; i<this.nextQueue.length; i++) {
            this.nextQueue[i].y = this.board.height - 5.5 + 2*i
        }
    }
    
    popNextQueue() {
        this.mousePiece = this.nextQueue[0];
        this.mousePiece.scale = 1;
        this.mousePiece.thickness = 0.3;
        this.mousePiece.x = Math.floor(this.canvas.mousePos[0]);
        this.mousePiece.y = Math.floor(this.canvas.mousePos[1]);
        this.nextQueue.splice(0,1);

        this.fillNextQueue();
    }
    
    nextBoard() {
        this.board.nextBoard();
        
        if (this.board.emptyCount() == 0) {
            this.endGame();
        } else {
            this.timer.currentTime = (10 + this.board.emptyCount()*0.75);
            this.checkFfwd();
        }
    }
    
    checkFfwd() {
        this.timer.ffwd = false;
        
        if (!this.board.canPlaceAny(this.mousePiece.type)) {
            var ffwd = true;
            for (var i=0; i<this.holdQueue.length; i++) {
                if (this.board.canPlaceAny(this.holdQueue[i].type)) {
                    ffwd = false;
                    break;
                }
            }
            if (ffwd) {
                this.timer.ffwd = true;
            }
        }
    }
    
    endGame() {
        this.inGame = false;
        this.gameOver = new GameOverScreen(this);
    }
    
    reset() {
        this.gameOver = null;
        this.board.clear();
        this.score.num = 0;
        this.inGame = false;
        this.timer = new Timer(this);
        this.title = new TitleScreen(this);
        this.title.init();
    }
    
    tick() {
        if (this.inGame) {
            if (this.timer.ffwd && !this.timer.pause) {
                this.score.num += this.timer.fspeed;
            }
            if (this.timer.currentTime < 0 || (this.timer.ffwd && this.timer.pause)) {
                this.nextBoard();
            }
            if (this.mousePiece) {
                this.mousePiece.x = Math.floor(this.canvas.mousePos[0]);
                this.mousePiece.y = Math.floor(this.canvas.mousePos[1]);
            }
        
            this.timer.tick();
        }
        if (this.title) this.title.tick();
        if (this.gameOver) this.gameOver.tick();
        this.score.tick();
        this.input.tick();
        this.board.tick();
        this.mousePiece.tick();
        for (var i=0; i<this.holdQueue.length; i++) {
            this.holdQueue[i].tick();
        }
        for (var i=0; i<this.nextQueue.length; i++) {
            this.nextQueue[i].tick();
        }
    }

    draw() {
        this.canvas.fill([1,1,1]);
        
        this.board.draw(this.canvas);
        for (var i=0; i<this.holdQueue.length; i++) {
            this.holdQueue[i].draw(this.canvas);
        }
        for (var i=0; i<this.nextQueue.length; i++) {
            this.nextQueue[i].draw(this.canvas);
        }
        
        if (this.inGame) {
            this.timer.draw(this.canvas);
            this.mousePiece.draw(this.canvas);
        }
        
        if (this.gameOver) this.gameOver.draw(this.canvas);
        
        this.score.draw(this.canvas);
        
        this.canvas.setStroke([0.4,0.4,0.4]);
        this.canvas.strokeLine(0.1, this.board.width, 4, this.board.width+2, 4);
    }
}

window.game = null;
window.deltaTime = 0;
window.lastFrame = 0;

function init() {
    window.game = new Game();
    requestAnimationFrame(loop);
}

function loop(timestamp) {
    try {
        deltaTime += timestamp - lastFrame;
        lastFrame = timestamp;
        if (deltaTime > framerate) {
            if (deltaTime > 1000) {
                console.warn("Dropped frames");
                deltaTime = 1000;
            }

            while(deltaTime > framerate) {
                deltaTime -= framerate;
                window.game.tick();
            }
            window.game.draw();
        }
        requestAnimationFrame(loop);
    } catch (e) {
        requestAnimationFrame(loop);
        throw e;
    }
}