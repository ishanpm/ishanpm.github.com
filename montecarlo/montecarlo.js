var canvas=$("#canvas")
var cwidth,cheight
function doResize() {
  cwidth=canvas[0].width=$(window).width()
  cheight=canvas[0].height=$(window).height()-4
}
//document.onresize=doResize
//doResize()

var ctx=canvas[0].getContext("2d")

class GoGameState {
  constructor() {
    this.width = 9;
    this.height = 9;
    this.cells = Array(this.height).fill().map(e=>Array(this.width).fill(0));
    this.turn = 1;
    this.winner = null;
    this.count = 0;
    this.passCount = 0;
    //this.hashes = new Set();
    this.captureColor = 0;
    this.isSpeculative = false;
    this.isSpeedy = false;
    this.hash = 0;
    this.score = 0;
    this.parent = null;
  }
  
  clone(fast) {
    var result = new GoGameState()
    result.width = this.width;
    result.height = this.height;
    result.cells = this.cells.map(e=>e.map(e=>e))
    result.turn = this.turn
    result.winner = this.winner
    result.count = this.count
    result.passCount = this.passCount;
    result.isSpeedy = this.isSpeedy;
    result.parent = this;
    if (!fast) {
      result.update()
    }
    return result;
  }
  
  update() {
    if (!this.isSpeculative) {
      this.findLegalMoves()
      this.checkVictory()
    }
    this.hash = this.getHash();
  }
  
  checkVictory() {
    if (this.passCount >= 2 || (this.isSpeedy && this.count > 50)) {
      this.countScore();
      
      if (this.score > 0) {
        this.winner = 1;
      } else if (this.score < 0) {
        this.winner = 2;
      } else {
        this.winner = -1;
      }
    }
  }
  
  countScore() {
    let territory = {1:0, 2:0}
    
    let child = this.clone(true);
    child.isSpeculative = true;
    
    for (var y=0; y<child.height; y++) {
      for (var x=0; x<child.width; x++) {
        if (child.cells[y][x] === 0) {
          if (child.isSurrounded(x, y, 1)) {
            child.fill(x, y, 1);
          } else if (child.isSurrounded(x, y, 2)) {
            child.fill(x, y, 2);
          } else {
            child.fill(x, y, -1);
          }
        }
          
        if (child.cells[y][x] > 0) {
          territory[child.cells[y][x]]++;
        }
      }
    }
    
    this.score = territory[1] - territory[2];
  }
  
  getEvaluation() {
    this.countScore();
    
    let ev = Math.atan(this.score/5) / (Math.PI);
    
    // Flip evaluation for second player
    //if (this.turn === 2) ev = -ev;
    
    return [ev + 0.5, 1-(ev + 0.5)];
  }
  
  findLegalMoves() {
    this.legalMoves = [-1];
    
    if (this.isSpeedy) {
      // Allow any move onto open spaces
      for (var x=0; x<this.width; x++) {
        for (var y=0; y<this.height; y++) {
          if (this.cells[y][x] !== 0) {
            this.legalMoves.push(x + y*this.width)
          }
        }
      }
    } else {
      // Forbid repitition and suicide
      for (var x=0; x<this.width; x++) {
        for (var y=0; y<this.height; y++) {
          if (this.tryMove(x, y)) {
            this.legalMoves.push(x + y*this.width)
          }
        }
      }
    }
  }
  
  // Helper function: Determine if a move is legal
  // (played on an empty space, no suicide, no repeats)
  tryMove(x, y) {
    // Played on an empty space?
    if (this.cells[y][x] !== 0) return false;
    
    // Shortcut for no suicide & no repeats
    if (
      this.getColor(x+1,y) === 0 ||
      this.getColor(x-1,y) === 0 ||
      this.getColor(x,y+1) === 0 ||
      this.getColor(x,y-1) === 0) {
        return true
    };
    
    // Check suicide and repeats
    let child = this.clone(true);
    child.isSpeculative = true;
    child.move(x + y*this.width);
    return (child.captureColor !== this.turn) && (!child.isRepeatedPosition());
  }
  
  isSurrounded(x,y,color) {
    let width = this.width;
    let height = this.height;
    
    var checked = new Set();
    var cells = this.cells;
    var base = this.cells[y][x];
    
    
    function surr2(x,y) {
      if (x < 0 || y < 0 || x >= width || y >= width) return true;
      if (checked.has(x + y*width)) return true;
      
      checked.add(x + y*width);
      
      if (cells[y][x] != base) {
        if (color) {
          return cells[y][x] == color
        } else {
          return cells[y][x] !== 0
        }
      }
      
      var result = (
        surr2(x-1,y) &&
        surr2(x+1,y) &&
        surr2(x,y-1) &&
        surr2(x,y+1));
      return result;
    }
    
    return surr2(x,y)
  }
  
  fill(x,y,color) {
    if (this.cells[y][x] == color) {return false}
    var cells = this.cells
    var base = this.cells[y][x]
    var width = this.width;
    var height = this.height;
    
    function fill2(x,y) {
      if (x < 0 || y < 0 || x >= width || y >= height) return;
      if (cells[y][x] !== base) return;
      
      cells[y][x] = color;
      
      fill2(x-1,y)
      fill2(x+1,y)
      fill2(x,y-1)
      fill2(x,y+1)
    }
    
    return fill2(x,y)
  }
  
  fillIfColorAndSurrounded(x,y,color) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    if (color === null) {
      if (this.cells[y][x] === 0) return;
    } else {
      if (this.cells[y][x] !== color) return;
    }
    if (!this.isSurrounded(x,y)) return;
    
    this.fill(x,y,0)
    this.captureColor = color;
  }
  
  draw() {
    ctx.lineWidth=0.05
    ctx.strokeStyle="black"
    for (var x=0;x<this.cells[0].length;x++) {
      line(x+0.5,0,x+0.5,this.height)
    }
    for (var y=0;y<this.height;y++) {
      line(0,y+0.5,this.width,y+0.5)
      for (var x=0;x<this.width;x++) {
        if (this.cells[y][x] > 0) {
          ctx.fillStyle = this.cells[y][x]==1 ? "black" : "white"
          ctx.fillcirc(x+0.5,y+0.5,0.4)
          ctx.stroke()
        } 
      }
    }
    
    
    if (this.passCount > 0) {
      ctx.fillStyle = "black";
      ctx.beginPath();
      ctx.moveTo(this.width + 0.5, 0.5);
      ctx.lineTo(this.width + 1  , 1  );
      ctx.lineTo(this.width + 0.5, 1.5);
      ctx.closePath();
      ctx.fill();
    }
    
    if (this.winner !== null) {
      ctx.save();
      ctx.translate(this.width + 0.25, 2.5);
      ctx.scale(.3, .3);
      ctx.fillStyle = "black";
      ctx.font = '1px sans-serif';
      ctx.fillText(`Difference:`, 0, 0)
      ctx.fillText(`${this.score}`, 0, 1.5)
      ctx.restore();
    }
  }
  
  move(move) {
    if ((!this.isSpeculative) && this.legalMoves.indexOf(move) === -1) return false;
    
    if (move == -1) {
      this.passCount ++;
      this.turn = this.turn%2 + 1;
      if (this.isSpeedy) this.count++;
      
      this.update();
      
      return;
    }
    
    this.passCount = 0;
    
    var x = move%this.cells[0].length
    var y = Math.floor(move/this.cells[0].length)
    
    this.captureColor = 0;
    this.cells[y][x] = this.turn
    
    this.turn = this.turn%2 + 1
    
    if (this.isSpeedy) this.count++
    
    this.fillIfColorAndSurrounded(x-1,y,this.turn)
    this.fillIfColorAndSurrounded(x+1,y,this.turn)
    this.fillIfColorAndSurrounded(x,y-1,this.turn)
    this.fillIfColorAndSurrounded(x,y+1,this.turn)
    //this.fillIfColorAndSurrounded(x-1,y)
    //this.fillIfColorAndSurrounded(x+1,y)
    //this.fillIfColorAndSurrounded(x,y-1)
    //this.fillIfColorAndSurrounded(x,y+1)
    this.fillIfColorAndSurrounded(x,y, this.turn%2+1);
    
    this.update();
  }

  playerInput(x,y) {
    x = Math.floor(x);
    y = Math.floor(y);
    
    // Pass
    if (x >= this.width) return -1;
    
    if (x < 0 || y < 0 || x >= this.width || y >= this.height)
      return null;
    return x + this.width*y;
  }
  
  getColor(x,y) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return -1;
    
    return this.cells[y][x];
  }
  
  getHash() {
    let val = this.turn;
    
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        val = (val*3 + this.cells[y][x]) % 1e15;
      }
    }
    
    return val;
  }
  
  isRepeatedPosition() {
    let p = this.parent;
    while (p) {
      if (this.hash === p.hash && this.boardEquals(p)) {
        return true;
      }
      p = p.parent;
    }
    
    return false;
  }
  
  // Helper function
  boardEquals(other) {
    if (this.turn !== other.turn) return false;
    
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        if (this.cells[y][x] !== other.cells[y][x]) return false;
      }
    }
    
    return true;
  }
}

class PentagoGameState {
  constructor() {
    this.cells=Array(6).fill().map(_=>Array(6).fill(0))
    this.turn=1;
    this.winner=null;
    this.humanMoveTmp=null;
  }
  
  clone() {
    var result = new PentagoGameState()
    result.cells = this.cells.map(e=>e.map(e=>e))
    result.turn = this.turn;
    result.checkVictory();
    result.findLegalMoves();
    return result;
  }
  
  // update list of legal moves
  findLegalMoves() {
    // constructing large arrays using push() is inefficient
    
    var width=this.cells[0].length;
    var height=this.cells.length;
    
    var count = 0
  
    for (var y=0; y<height; y++) {
      for (var x=0; x<width; x++) {
        if (this.cells[y][x]===0) {
          count++
        }
      }
    }
    
    this.legalMoves = new Array(count*8);
    
    var i = 0;
    for (var y=0; y<height; y++) {
      for (var x=0; x<width; x++) {
        if (this.cells[y][x]===0) {
          this.legalMoves[i*8  ] = x + width*y
          this.legalMoves[i*8+1] = x + width*y + width*height
          this.legalMoves[i*8+2] = x + width*y + width*height*2
          this.legalMoves[i*8+3] = x + width*y + width*height*3
          this.legalMoves[i*8+4] = x + width*y + width*height*4
          this.legalMoves[i*8+5] = x + width*y + width*height*5
          this.legalMoves[i*8+6] = x + width*y + width*height*6
          this.legalMoves[i*8+7] = x + width*y + width*height*7
          i++
        }
      }
    }
  }
  
  // update victory state
  checkVictory() {
    var that=this
    var cells=this.cells
    
    var filled = true
  
    for (var y=0; y<this.cells.length && filled; y++) {
      for (var x=0; x<this.cells[0].length && filled; x++) {
        if (this.cells[y][x]===0) {
          filled = false
        }
      }
    }
    
    if (filled) {
      this.winner = -1;
    }
    
    function checkMatch(x,y,dx,dy) {
      var c = cells[y][x]
      
      if (c===0) {
        return;
      }

      if (c===cells[y+  dy][x+  dx] &&
          c===cells[y+2*dy][x+2*dx] &&
          c===cells[y+3*dy][x+3*dx] &&
          c===cells[y+4*dy][x+4*dx]) {
      
        // match was found - set winner
        if (that.winner===null) {
          that.winner = c
        } else if (that.winner!==c) {
          that.winner = -1
        }
      }
    }
    // check matches
    for (var i=0; i<cells.length; i++) {
      for (var k=0; k<2; k++) {
        checkMatch(i,k,0,1)
        checkMatch(k,i,1,0)
        if (i<2) {
          checkMatch(i,k,1,1)
          checkMatch(cells.length-i-1,k,-1,1)
        }
      }
    }
    //check diags
    for (var i=0; i<2; i++) {
      for (var k=0; k<2; k++) {
      }
    }
  }
  
  draw() {
    ctx.lineWidth=0.05
    ctx.strokeStyle="black"
    ctx.strokeRect(0,0,3,3)
    ctx.strokeRect(0,3,3,3)
    ctx.strokeRect(3,0,3,3)
    ctx.strokeRect(3,3,3,3)
    for (var y=0;y<this.cells.length;y++) {
      for (var x=0;x<this.cells[0].length;x++) {
        if (this.cells[y][x] > 0) {
          ctx.fillStyle = this.cells[y][x]==1 ? "black" : "white"
          ctx.fillcirc(x+0.5,y+0.5,0.4)
          ctx.stroke()
        } 
      }
    }
    
    if (this.humanMoveTmp !== null) {
      var x=this.humanMoveTmp%this.cells[0].length;
      var y=Math.floor(this.humanMoveTmp/this.cells[0].length);
      ctx.strokeStyle = "red";
      ctx.strokecirc(x+0.5,y+0.5,0.4)
    }
  }
  
  rotateQuadrant(q,a) {
    var x = [0,3,0,3][q]
    var y = [0,0,3,3][q]
    var cells = this.cells
    
    for (var i=0; i<a; i++) {
      var tmp = cells[y][x]
      cells[y][x]=cells[y+2][x]
      cells[y+2][x]=cells[y+2][x+2]
      cells[y+2][x+2]=cells[y][x+2]
      cells[y][x+2]=tmp
      
      tmp = cells[y][x+1]
      cells[y][x+1]=cells[y+1][x]
      cells[y+1][x]=cells[y+2][x+1]
      cells[y+2][x+1]=cells[y+1][x+2]
      cells[y+1][x+2]=tmp
    }
  }
  
  // make a move
  // side effect: winner and legalMoves are updated
  move(move, fast) {
    var x = move%this.cells[0].length
    move = Math.floor(move/this.cells[0].length)
    var y = move%this.cells.length
    move = Math.floor(move/this.cells.length)
    var quad = move%4
    var rot = [1,3][Math.floor(move/4)]
    
    this.cells[y][x] = this.turn
    
    // Game ends instantly (no need to rotate) if placing the piece wins
    this.checkVictory()
    if (this.winner === null) {
      this.rotateQuadrant(quad,rot)
    }
    this.turn = this.turn%2+1
    
    this.checkVictory()
    if (!fast)
      this.findLegalMoves()
  }
  
  randomMove(fast) {
    var selection = null;
    var count = 0;
    var width = this.cells[0].length;
    var height = this.cells.length;
  
    for (var y=0; y<height; y++) {
      for (var x=0; x<width; x++) {
        if (this.cells[y][x]===0) {
          count++;
          if (Math.random() < 1/count)
            selection = x + y*width;
        }
      }
    }
    
    if (selection !== null) {
      var p = Math.floor(Math.random()*8)
      this.move(selection + width*height*p, fast)
    }
  }

  playerInput(x,y) {
    if (this.humanMoveTmp === null) {
      this.humanMoveTmp = Math.floor(x) + 6*Math.floor(y)
    } else {
      var quad = Math.floor(x/3) + 2*Math.floor(y/3)
      var rot = Math.floor(x/1.5 + 1) % 2
      var move = this.humanMoveTmp + 36*(quad + 4*rot);
      this.humanMoveTmp = null

      return move;
    }
  }
}

class OtrioGameState {
  constructor() {
    this.cells=Array(3).fill().map(_=>Array(3).fill().map(_=>Array(3).fill(0)))
    this.pieces=Array(4).fill().map(_=>Array(3).fill(3))
    this.turn=1;
    this.state=1;
    this.winner=null;
    this.fourPlayers=false;
  }
  
  clone() {
    var result = new OtrioGameState()
    result.cells = this.cells.map(e=>e.map(e=>e.map(e=>e)))
    result.pieces = this.pieces.map(e=>e.map(e=>e))
    result.turn = this.turn;
    result.state = this.state;
    result.fourPlayers = this.fourPlayers;
    result.checkVictory();
    result.findLegalMoves();
    return result;
  }
  
  // update list of legal moves
  findLegalMoves() {
    this.legalMoves = [];
    
    var width=this.cells[0].length;
    var height=this.cells.length;
    var depth=this.cells[0][0].length;
  
    for (var y=0; y<height; y++) {
      for (var x=0; x<width; x++) {
        for (var z=0; z<depth; z++) {
          if (this.cells[y][x][z]==0 && this.pieces[this.state-1][z]>0) {
            this.legalMoves.push(x + width*(y + height*z))
          }
        }
      }
    }
  }
  
  // update victory state
  // side effect: legalMoves is updated
  checkVictory() {
    this.winner = null;
    
    var that=this
    var cells=this.cells
    
    this.findLegalMoves()
    
    if (this.legalMoves.length==0) {
      this.winner = -1
    }
    
    function checkMatch(x,y,z,dx,dy,dz) {
      var c = cells[y][x][z]
      
      if (c==0 || x+dx*2<0 || x+dx*2>2 || y+dy*2>2 || z+dz*2>2) {
        return;
      }
      // check other 2 cells
      for (var i=1; i<3; i++) {
        x+=dx
        y+=dy
        z+=dz
        if (c!=cells[y][x][z]) {
          return;
        }
      }
      
      // match was found - set winner
      if (that.winner===null) {
        if (that.fourPlayers) {
          that.winner = c
        } else {
          that.winner = (c-1)%2 + 1
        }
      }
    }
    // check cols and diags
    for (var x=0; x<cells[0].length; x++) {
      for (var y=0; y<cells.length; y++) {
        for (var z=0; z<cells[0][0].length; z++) {
          checkMatch(x,y,z,  1,0,0)
          checkMatch(x,y,z,  1,1,0)
          checkMatch(x,y,z,  0,1,0)
          checkMatch(x,y,z, -1,1,0)
          if (z==0) {
            checkMatch(x,y,z,  1,0,1)
            checkMatch(x,y,z,  1,1,1)
            checkMatch(x,y,z,  0,1,1)
            checkMatch(x,y,z, -1,1,1)
            checkMatch(x,y,z, 0,0,1)
          } else if (z==2) {
            checkMatch(x,y,z,  1,0,-1)
            checkMatch(x,y,z,  1,1,-1)
            checkMatch(x,y,z,  0,1,-1)
            checkMatch(x,y,z, -1,1,-1)
          }
        }
      }
    }
  }
  
  draw() {
    ctx.lineWidth=0.1
    ctx.strokeStyle="black"
    var colors=["#ddd","red","green","yellow","blue"]
    for (var y=0;y<this.cells.length;y++) {
      for (var x=0;x<this.cells[0].length;x++) {
        for (var z=0;z<this.cells[0][0].length;z++) {
          ctx.strokeStyle = colors[this.cells[y][x][z]]
          ctx.strokecirc(x*2+1,y*2+1,(z+1)/4)
        }
      }
    }

    // draw player's pieces
    
    ctx.lineWidth=0.05

    for (var p=0; p<4; p++) {
      ctx.strokeStyle = colors[p+1]
      for (var z=0; z<this.pieces[0].length; z++) {
        for (var i=0; i<this.pieces[p][z]; i++) {
          ctx.strokecirc(6.5+p,5-i,(z+1)/8)
        }
      }
    }

    ctx.strokeStyle = colors[this.state]
    line(5+this.state,5.5,6+this.state,5.5)
  }
  
  // make a move
  // side effect: winner and legalMoves are updated
  move(move) {
    var x = move%this.cells[0].length
    move = Math.floor(move/this.cells[0].length)
    var y = move%this.cells.length
    var z = Math.floor(move/this.cells.length)
    
    this.cells[y][x][z] = this.state
    this.pieces[this.state-1][z] --;
    
    this.state = this.state%4+1

    this.turn = this.fourPlayers ? this.state : (this.state-1)%2+1
    
    this.checkVictory()
    //this.findLegalMoves()

    // skip turn if player can't move
    var i=0;
    while (this.legalMoves.length === 0 && i<4) {
      this.state = this.state%4+1
      this.turn = this.fourPlayers ? this.state : (this.state-1)%2+1
      this.checkVictory()

      i++
    }
  }

  // interpret player input as a move
  // may return an invalid or illegal move
  playerInput(x,y) {
    var x1 = Math.floor(x/2)
    var y1 = Math.floor(y/2)
    var r = Math.sqrt(Math.pow(1-x%2,2) + Math.pow(1-y%2,2))
    var z = Math.round(r*4)-1
    if (z>=0 && z<3) {
      return x1 + this.cells[0].length*(y1 + this.cells.length*z)
    } else {
      return null;
    }
  }
}

class OthelloGameState {
  constructor() {
    this.cells=Array(8).fill().map(_=>Array(8).fill(0))
    this.cells[3][3] = this.cells[4][4] = 1;
    this.cells[4][3] = this.cells[3][4] = 2;
    this.turn=1;
    this.winner=null;
  }
  
  clone() {
    var result = new OthelloGameState()
    result.cells = this.cells.map(e=>e.map(e=>e))
    result.turn = this.turn;
    result.checkVictory();
    result.findLegalMoves();
    return result;
  }
  
  // update list of legal moves
  findLegalMoves() {
    this.legalMoves = [];
    
    var width=this.cells[0].length;
    var height=this.cells.length;
  
    for (var y=0; y<this.cells.length; y++) {
      for (var x=0; x<this.cells[0].length; x++) {
        if (this.cells[y][x]==0 && this.findMatches(x,y)) {
          this.legalMoves.push(x + y*width)
        }
      }
    }
  }
  
  // update victory state
  // side effect: legalMoves is updated
  checkVictory() {
    this.findLegalMoves()

    if (this.legalMoves.length !== 0) {
      this.winner = null;
      return;
    }
    
    var count = 0;
    for (var y=0; y<this.cells.length; y++) {
      for (var x=0; x<this.cells[0].length; x++) {
        if (this.cells[y][x] == 1) {
          count++;
        } else if (this.cells[y][x] == 2) {
          count--;
        }
      }
    }

    if (count > 0) {
      this.winner = 1;
    } else if (count < 0) {
      this.winner = 2;
    } else {
      this.winner = -1;
    }
  }

  findMatches(x,y,mode) {
    var turn = this.turn;
    var opponent = turn%2+1;
    var cells = this.cells;

    function findLine(dx, dy) {
      var x1=x+dx, y1=y+dy
      var run=0
      while (cells[y1] && cells[y1][x1] === opponent) {
        x1+=dx;
        y1+=dy;
        run++;
      }
      if (cells[y1] && cells[y1][x1] === turn) {
        if (mode) {
          var x1=x+dx, y1=y+dy
          x1=x+dx; y1=y+dy;
          while (cells[y1] && cells[y1][x1] === opponent) {
            cells[y1][x1] = turn;
            x1+=dx;
            y1+=dy;
          }

          return false;
        } else {
          return run > 0;
        }
      }

      return false;
    }
    
    return findLine(1,0)
        || findLine(1,1)
        || findLine(0,1)
        || findLine(-1,1)
        || findLine(-1,0)
        || findLine(-1,-1)
        || findLine(0,-1)
        || findLine(1,-1)

    return count;
  }
  
  draw() {
    ctx.strokeStyle = "black"
    ctx.lineWidth = 0.05
    
    ctx.fillStyle = "black";
    ctx.fillcirc(2,2,0.1)
    ctx.fillcirc(2,6,0.1)
    ctx.fillcirc(6,2,0.1)
    ctx.fillcirc(6,6,0.1)

    for (var y=0;y<this.cells.length;y++) {
      for (var x=0;x<this.cells[0].length;x++) {
        ctx.strokeRect(x,y,1,1)

        if (this.cells[y][x] > 0) {
          ctx.fillStyle = this.cells[y][x]==1 ? "black" : "white"
          ctx.fillcirc(x+0.5,y+0.5,0.4)
          ctx.stroke()
        } 
      }
    }

    this.checkVictory();
    ctx.strokeStyle = "red"

    if (this.winner === null) {
      for (var i=0; i<this.legalMoves.length; i++) {
        var x = this.legalMoves[i]%this.cells.length;
        var y = Math.floor(this.legalMoves[i]/this.cells.length);
        if (this.turn==1) {
          line(x+0.4,y+0.5,x+0.6,y+0.5)
        } else {
          line(x+0.5,y+0.4,x+0.5,y+0.6)
        }
      }
    }
  }
  
  // make a move
  // side effect: winner and legalMoves are updated
  move(move) {
    if (this.legalMoves.indexOf(move) == -1) {
      alert("ILLEGAL MOVEEEEE!!!! "+move)
    }

    var x = move%this.cells[0].length
    var y = Math.floor(move/this.cells[0].length)
    
    this.cells[y][x] = this.turn
    this.findMatches(x,y,true)

    this.turn = this.turn%2+1
    
    this.checkVictory()
    //this.findLegalMoves()

    if (this.legalMoves.length == 0) {
      this.turn = this.turn%2+1
      this.checkVictory()
    }
  }

  playerInput(x,y) {
    var x1 = Math.floor(x)
    var y1 = Math.floor(y)
    return x1 + this.cells[0].length*y1
  }
}

class QuartoGameState {
  constructor() {
    this.cells=Array(4).fill().map(_=>Array(4).fill(-1))
    this.pieces=Array(16).fill().map((e,i)=>i)
    this.turn=1;
    this.chosenPiece=null;
    this.winner=null;
    this.matchSquares = false;
  }
  
  clone() {
    var result = new QuartoGameState()
    result.cells = this.cells.map(e=>e.map(e=>e))
    result.pieces = this.pieces.map(e=>e)
    result.turn = this.turn;
    result.chosenPiece = this.chosenPiece;
    result.matchSquares = this.matchSquares;
    result.checkVictory();
    result.findLegalMoves();
    return result;
  }
  
  // update list of legal moves
  findLegalMoves() {
    this.legalMoves = [];
    
    var width=this.cells[0].length;
    var height=this.cells.length;
    
    if (this.chosenPiece === null) {
      this.legalMoves = this.pieces.map(e=>e)
    } else {
      for (var y=0; y<this.cells.length; y++) {
        for (var x=0; x<this.cells[0].length; x++) {
          if (this.cells[y][x]==-1) {
            this.legalMoves.push(x + width*y)
          }
        }
      }
    }
  }
  
  // update victory state
  // side effect: legalMoves is updated
  checkVictory() {
    var cells = this.cells;

    this.findLegalMoves()

    function isMatch(a,b,c,d) {
      return (a|b|c|d) !== -1 && (((a&b&c&d) !== 0) || ((a|b|c|d) !==15))
    }

    function checkLine(x,y,dx,dy) {
      return isMatch(
        cells[x     ][y     ],
        cells[x+  dx][y+  dy],
        cells[x+2*dx][y+2*dy],
        cells[x+3*dx][y+3*dy])
    }

    function checkSquare(x,y) {
      return isMatch(
        cells[x  ][y  ],
        cells[x  ][y+1],
        cells[x+1][y  ],
        cells[x+1][y+1])
    }

    //check rows and cols
    for (var i=0; i<4; i++) {
      if (checkLine(i,0,0,1)) {this.winner=this.turn; return;}
      if (checkLine(0,i,1,0)) {this.winner=this.turn; return;}
    }

    //check diags
    if (checkLine(0,0,1,1))  {this.winner=this.turn; return;}
    if (checkLine(3,0,-1,1)) {this.winner=this.turn; return;}

    //check squares
    if (this.matchSquares) {
      for (var x=0; x<3; x++) {
        for (var y=0; y<3; y++) {
          if (checkSquare(x,y))  {this.winner=this.turn; return;}
        }
      }
    }

    if (this.legalMoves.length === 0) {
      this.winner = -1;
      return;
    }
  }

  drawPiece(x,y,p) {
    if (p & 0b0001)
      ctx.strokeStyle = "red";
    else
      ctx.strokeStyle = "blue";

    ctx.beginPath()

    if (p & 0b0100)
      ctx.rect(x+0.05,y+0.05,0.9,0.9);
    else
      ctx.circ(x+0.5,y+0.5,0.45);


    if (p & 0b0010) {
      ctx.fillStyle="black";
      ctx.fill();
    }

    ctx.stroke();

    if (p & 0b1000) {
      ctx.fillStyle="gray";
      ctx.fillcirc(x+0.5,y+0.5,0.2);
    }
  }
  
  draw() {
    ctx.lineWidth = 0.05

    if (this.matchSquares) {
      ctx.strokeStyle = "gray"
      for (var x=0; x<3; x++) {
        for (var y=0; y<3; y++) {
          ctx.strokeRect(x+0.9,y+0.9,0.2,0.2)
        }
      }
    }

    for (var y=0;y<this.cells.length;y++) {
      for (var x=0;x<this.cells[0].length;x++) {
        ctx.strokeStyle = "black"
        ctx.strokeRect(x,y,1,1)
        if (this.cells[y][x] > -1) {
          this.drawPiece(x,y,this.cells[y][x])
        }
      }
    }

    for (var i=0;i<this.pieces.length;i++) {
      var p = this.pieces[i];
      this.drawPiece(p%4 + 4, Math.floor(p/4), p)
    }

    if (this.chosenPiece !== null)
      this.drawPiece(0,5,this.chosenPiece)
  }
  
  // make a move
  // side effect: winner and legalMoves are updated
  move(move) {
    if (this.legalMoves.indexOf(move) == -1) {
      debugger;
      console.error("ILLEGAL MOVEEEEE!!!! "+move)
    }
    
    if (this.chosenPiece === null) {
      this.chosenPiece = move;
      var i = this.pieces.indexOf(move);
      this.pieces.splice(i,1)
      this.turn = this.turn%2+1;
      this.findLegalMoves();
    } else {
      var x = move%this.cells[0].length
      var y = Math.floor(move/this.cells[0].length)
      
      this.cells[y][x] = this.chosenPiece;
      this.chosenPiece = null;
      
      this.checkVictory()
      //this.findLegalMoves()
    }
  }

  playerInput(x,y) {
    if ((x>=4) ^ (this.chosenPiece === null)) return null;
    var x1 = Math.floor(x)%4
    var y1 = Math.floor(y)
    return x1 + this.cells[0].length*y1
  }
}

class ConnectFourGameState {
  constructor() {
    this.cells=Array(6).fill().map(_=>Array(7).fill(0))
    this.turn=1;
    this.winner=null;
  }
  
  clone() {
    var result = new ConnectFourGameState()
    result.cells = this.cells.map(e=>e.map(e=>e))
    result.turn = this.turn;
    result.checkVictory();
    result.findLegalMoves();
    return result;
  }
  
  // update list of legal moves
  findLegalMoves() {
    this.legalMoves = [];
    
    var width=this.cells[0].length;
    var height=this.cells.length;
  
    for (var x=0; x<this.cells[0].length; x++) {
      if (this.cells[0][x]==0) {
        this.legalMoves.push(x)
      }
    }
  }
  
  // update victory state
  // side effect: legalMoves is updated
  checkVictory() {
    var that=this
    var cells=this.cells
    
    this.findLegalMoves()
    
    if (this.legalMoves.length==0) {
      this.winner = -1
    }
    
    function checkMatch(x,y,dx,dy) {
      var c = cells[y][x]
      
      if (c==0) {
        return;
      }
      // check other 3 cells
      for (var i=1; i<4; i++) {
        x+=dx
        y+=dy
        if (c!=cells[y][x]) {
          return;
        }
      }
      
      // match was found - set winner
      if (that.winner===null) {
        that.winner = c
      } else if (that.winner!==c) {
        that.winner = -1
      }
    }
    // check cols and diags
    for (var x=0; x<cells[0].length; x++) {
      for (var y=0; y<cells.length-3; y++) {
        checkMatch(x,y,0,1)
        if (x<cells[0].length-3) {
          checkMatch(x,y,1,1)
        }
        if (x>2) {
          checkMatch(x,y,-1,1)
        }
      }
    }
    // check rows
    for (var x=0; x<cells[0].length-3; x++) {
      for (var y=0; y<cells.length; y++) {
        checkMatch(x,y,1,0)
      }
    }
  }
  
  draw() {
    ctx.lineWidth=0.05
    ctx.strokeStyle="black"

    line(x,0,x,this.cells.length+1)
    line(0,this.cells.length,this.cells[0].length,this.cells.length)
    for (var x=0;x<this.cells[0].length;x++) {
      line(x+1,0,x+1,this.cells.length)
      for (var y=0;y<this.cells.length;y++) {
        if (this.cells[y][x] > 0) {
          ctx.fillStyle = this.cells[y][x]==1 ? "red" : "black"
          ctx.fillcirc(x+0.5,y+0.5,0.4)
          ctx.stroke()
        } 
      }
    }
  }
  
  // make a move
  // side effect: winner and legalMoves are updated
  move(move) {
    var x = move%this.cells[0].length
    var y = 0
    
    while (this.cells[y+1] && this.cells[y+1][x] == 0) {
      y++;
    }
    
    this.cells[y][x] = this.turn

    this.turn = this.turn%2+1
    
    this.checkVictory()
    //this.findLegalMoves()
  }

  playerInput(x,y) {
    return Math.floor(x);
  }
}

class CheckersGameState {
  constructor() {
    // Board is staggered - Row 0 is top, shifted right
    this.cells=Array(8).fill().map((e,i)=>Array(4).fill(e=i<3 ? 2 : i>=5 ? 1 : 0))
    this.turn=1;
    this.winner=null;
  }
  
  clone() {
    var result = new CheckersGameState()
    result.cells = this.cells.map(e=>e.map(e=>e))
    result.turn = this.turn;
    result.checkVictory();
    result.findLegalMoves();
    return result;
  }
  
  // update list of legal moves
  findLegalMoves() {
    this.legalMoves = [];
    
    var width=this.cells[0].length;
    var height=this.cells.length;
    
    // Find captures
    
    for (var y=0; y<this.cells.length; y++) {
      for (var x=0; x<this.cells[0].length; x++) {
        if (this.cells[y][x]==0 && this.findMatches(x,y)) {
          var move = [];
        }
      }
    }
  }
  
  // update victory state
  // side effect: legalMoves is updated
  checkVictory() {
    this.findLegalMoves()

    if (this.legalMoves.length !== 0) {
      this.winner = null;
      return;
    }
    
    var count = 0;
    for (var y=0; y<this.cells.length; y++) {
      for (var x=0; x<this.cells[0].length; x++) {
        if (this.cells[y][x] == 1) {
          count++;
        } else if (this.cells[y][x] == 2) {
          count--;
        }
      }
    }

    if (count > 0) {
      this.winner = 1;
    } else if (count < 0) {
      this.winner = 2;
    } else {
      this.winner = -1;
    }
  }

  findMatches(x,y,mode) {
    var turn = this.turn;
    var opponent = turn%2+1;
    var cells = this.cells;

    function findLine(dx, dy) {
      var x1=x+dx, y1=y+dy
      var run=0
      while (cells[y1] && cells[y1][x1] === opponent) {
        x1+=dx;
        y1+=dy;
        run++;
      }
      if (cells[y1] && cells[y1][x1] === turn) {
        if (mode) {
          var x1=x+dx, y1=y+dy
          x1=x+dx; y1=y+dy;
          while (cells[y1] && cells[y1][x1] === opponent) {
            cells[y1][x1] = turn;
            x1+=dx;
            y1+=dy;
          }

          return false;
        } else {
          return run > 0;
        }
      }

      return false;
    }
    
    return findLine(1,0)
        || findLine(1,1)
        || findLine(0,1)
        || findLine(-1,1)
        || findLine(-1,0)
        || findLine(-1,-1)
        || findLine(0,-1)
        || findLine(1,-1)

    return count;
  }
  
  draw() {
    ctx.strokeStyle = "black"
    ctx.lineWidth = 0.05
    
    ctx.fillStyle = "black";

    for (var y=0;y<this.cells.length;y++) {
      for (var x0=0;x0<this.cells[0].length;x0++) {
        // Stagger board
        var x = x0*2;
        if (y%2 == 0) x += 1;
        
        ctx.strokeRect(x,y,1,1)

        if (this.cells[y][x0] > 0) {
          ctx.fillStyle = this.cells[y][x0]==1 ? "black" : "white"
          ctx.fillcirc(x+0.5,y+0.5,0.4)
          ctx.stroke()
        } 
      }
    }

    this.checkVictory();
    ctx.strokeStyle = "red"

    if (this.winner === null) {
      for (var i=0; i<this.legalMoves.length; i++) {
        var x = this.legalMoves[i]%this.cells.length;
        var y = Math.floor(this.legalMoves[i]/this.cells.length);
        if (this.turn==1) {
          line(x+0.4,y+0.5,x+0.6,y+0.5)
        } else {
          line(x+0.5,y+0.4,x+0.5,y+0.6)
        }
      }
    }
  }
  
  // make a move
  // side effect: winner and legalMoves are updated
  move(move) {
    if (this.legalMoves.indexOf(move) == -1) {
      alert("ILLEGAL MOVEEEEE!!!! "+move)
    }

    var x = move%this.cells[0].length
    var y = Math.floor(move/this.cells[0].length)
    
    this.cells[y][x] = this.turn
    this.findMatches(x,y,true)

    this.turn = this.turn%2+1
    
    this.checkVictory()
    //this.findLegalMoves()

    if (this.legalMoves.length == 0) {
      this.turn = this.turn%2+1
      this.checkVictory()
    }
  }

  playerInput(x,y) {
    var x1 = Math.floor(x)
    var y1 = Math.floor(y)
    return x1 + this.cells[0].length*y1
  }
}

class MCNode {
  // expects state to be fully initialized
  // i.e. legalMoves and winner set
  constructor(state, parent) {
    this.state = state;
    this.children = [];
    this.parent = parent || null;
    this.untriedMoves = state.winner===null ? state.legalMoves.map((e,i)=>i) : [];
    
    this.turn = state.turn;
    this.ties = 0;
    this.wins = 0;
    this.prevwins = 0;
    this.tries = 0;
    this.interest = 10;
    if (parent) {
      this.invertWin = parent.invertWin;
    } else {
      this.invertWin = $("#invert-win")[0].checked;
    }
  }
  
  /* old version of update()
  update(winner) {
    this.tries++
    if (winner === -1 || winner === null) {
      this.ties++;
    }

    if (this.invertWin) {
      if (winner !== this.turn && winner !== -1) {
        this.wins++
      }
    } else {
      if (winner === this.turn) {
        this.wins++
      }
    }
    
    if (this.parent !== null) {
      //this.interest = this.wins/this.tries + 0.5*Math.sqrt(Math.log(this.parent.tries)/this.tries)
      var prevturn = this.parent.turn
      if (this.invertWin) {
        if (winner !== prevturn && winner !== -1) {
          this.prevwins++
        }
      } else {
        if (winner === prevturn) {
          this.prevwins++
        }
      }
    }
  }
  */
  
  // new version of update() uses evaluation rather than winner/loser
  // evaluation is scaled according to the player whose turn it is
  update(winner, evaluation) {
    let scaledEval = evaluation[this.turn];
    
    this.tries++
    if (winner === -1 || winner === null) {
      this.ties++;
    }
    
    if (this.invertWin) {
      scaledEval = 1-scaledEval;
    }
    
    this.wins += scaledEval;
    
    if (this.parent !== null) {
      //this.interest = this.wins/this.tries + 0.5*Math.sqrt(Math.log(this.parent.tries)/this.tries)
      var prevturn = this.parent.turn
      
      scaledEval = evaluation[this.parent.turn];
      
      if (this.invertWin) {
        scaledEval = 1-scaledEval;
      }
      
      this.prevwins += scaledEval;
    }
  }
  
  // select a child node ripe for the searchin'
  selectInteresting() {
    // why doesn't JS have a builtin for this
    
    var explore = 1.0
    var res = this.children[0];
    var candidate = this.children[0]
    var logTries = Math.log(this.tries)
    var bestScore = candidate.prevwins/candidate.tries + explore*Math.sqrt(logTries/candidate.tries);
    
    for (var i=1; i<this.children.length; i++) {
      candidate = this.children[i]
      var interest = candidate.prevwins/candidate.tries + explore*Math.sqrt(logTries/candidate.tries);
      if (interest > bestScore) {
        res = candidate;
        bestScore = interest;
      }
    }
    
    return res;
  }
  
  // select the best move
  getBest() {
    var res = this.children[0];
    var bestScore = this.children[0].tries;
    
    for (var i=1; i<this.children.length; i++) {
      if (this.children[i].tries > bestScore) {
        res = this.children[i];
        bestScore = this.children[i].tries;
      }
    }
    
    return res;
  }
  
  // try to find the node that made a certain move
  findMove(move) {
    for (var i=0; i<this.children.length; i++) {
      if (this.children[i].move == move) {
        return this.children[i];
      }
    }
    
    // return a blank MCNode if none found
    // this doesn't remove from untriedMoves
    var newState = this.state.clone()
    newState.findLegalMoves()
    newState.move(newState.legalMoves[move])
    var newNode = new MCNode(newState, this)
    this.children.push(newNode)
    newNode.move = move
    
    return newNode;
  }
  
  // perform one MCT search step
  simulate() {
    var node = this
    var state;// = this.state.clone()
    
    // search for a node with untried moves or a leaf node
    while (node.untriedMoves.length===0 && node.children.length!==0) {
      node = node.selectInteresting()
      //state.move(state.legalMoves[node.move])
    }
    
    // expand with a child node if possible
    if (node.untriedMoves.length != 0) {
      state = node.state.clone();
      var i = Math.floor(Math.random()*node.untriedMoves.length)
      var move = node.untriedMoves.splice(i,1)[0]

      state.move(state.legalMoves[move])
      var newNode = new MCNode(state, node)
      //newNode.state = null;
      node.children.push(newNode)
      newNode.move = move;
      
      if ((!this.invertWin && state.winner === node.turn) || 
           (this.invertWin && state.winner !== node.turn && state.winner !== -1)) {
        // if a move leads to guranteed victory, always choose it
        node.children = [newNode]
        node.untriedMoves = []
      }
      
      node = newNode;
    }

    // play to completion
    state = node.state.clone();
    
    state.isSpeedy = true;
    var limit = 0;
    if (state.randomMove) {
      while (state.winner === null && limit < 1000) {
        state.randomMove(true)
        limit++;
      }
    } else {
      while (state.winner === null && limit < 1000) {
        var i = Math.floor(Math.random()*state.legalMoves.length)
        var move = state.legalMoves[i]
        state.move(move, true)
        limit++;
      }
    }
    
    var winner = state.winner;

    if (winner === null) {
      //console.log("No winner")
      winner = -1;
    }

    // backpropogate winner info
    // ties (-1) aren't awarded to either player
    
    var node2 = node
    while (node2) {
      let ev;
      
      if (state.getEvaluation) {
        ev = state.getEvaluation();
      } else {
        if (winner === -1) {
          ev = [0.1, 0.1];
        } else if (winner === 1) {
          ev = [1, 0];
        } else {
          ev = [0, 1];
        }
      }
      
      node2.update(winner, ev);
      node2 = node2.parent
    }
    
    return node;
  }
}

function line(x1,y1,x2,y2) {
  ctx.beginPath()
  ctx.moveTo(x1,y1)
  ctx.lineTo(x2,y2)
  ctx.stroke()
}

ctx.circ = function(x,y,r) {
  ctx.beginPath()
  ctx.arc(x,y,r,0,Math.PI*2)
}

ctx.fillcirc = function(x,y,r) {
  ctx.beginPath()
  ctx.arc(x,y,r,0,Math.PI*2)
  ctx.fill()
}

ctx.strokecirc = function(x,y,r) {
  ctx.beginPath()
  ctx.arc(x,y,r,0,Math.PI*2)
  ctx.stroke()
}

function drawBoard(board) {
  ctx.save()
  //ctx.translate(0.5,0.5)
  ctx.fillStyle="white"
  ctx.fillRect(0,0,1000,1000)
  ctx.scale(50,50)
  
  board.draw();
  
  ctx.restore()
  
  var text=`turn: ${game.turn}`
  if (root) {
    text +=` (${root.state.legalMoves.length} options) ${root.wins.toFixed(1)}/${root.tries}`
    if (root.children.length > 0) {
      var best = root.getBest()
      text += ` (${best.prevwins.toFixed(1)}/${best.tries})`
    }
  }
  if (game.winner !== null)
    text += ` winner: ${game.winner}`

  $("#text").text(text)
}

window.thing1 = function step() {
  if (game.winner === null) {
    var move = null;
    var startTime = new Date().getTime();
    var endTime = startTime + 100;
    var playerType = $(`#mode-${game.turn}`)[0].value
    var drawThoughts = (playerType == "CPU" && $("#show-thoughts")[0].checked)
    var allowPrecomputation = $("#allow-precomputation")[0].checked;
    
    awaitHumanMove = false;
    if (playerType == "CPU" || allowPrecomputation) {
      do {
        root.simulate()
      } while (new Date().getTime() < endTime)
      root.elapsedTime += new Date().getTime() - startTime;
    }

    if (playerType == "CPU") {
      if (drawThoughts) {
        var bestMove = root.getBest().move
        var tmpBoard = game.clone()
        tmpBoard.move(tmpBoard.legalMoves[bestMove])
        drawBoard(tmpBoard)
      }
      if (root.elapsedTime > 1000*$(`#limit-time-${game.turn}`)[0].value
          || root.tries > $(`#limit-nodes-${game.turn}`)[0].value) {
         move = root.getBest().move
      }
    } else if (playerType == "player") {
      //wait for human
      window.awaitHumanMove = true
    } else if (playerType == "random") {
      move = Math.floor(Math.random()*game.legalMoves.length)
    }
    
    if (move !== null) {
      makeMove(move)
      if ($("#pause-after-move")[0].checked)
        paused=true
    }
  }
  if (!(playerType == "CPU" && drawThoughts))
    drawBoard(game)
}
window.thing2 = function pause() {
  paused=true
}
window.thing3 = function start() {
  if (paused) {
    paused=false
    loop()
  }
}

window.undoGame = function undo() {
  if (gameHistory.length>0) {
    gameUndoHistory.push(game.clone())
    game = gameHistory.pop();
    root = new MCNode(game.clone())
    root.parent = null;
    root.elapsedTime = 0;
    drawBoard(game);
  }
}

window.redoGame = function redo() {
  if (gameUndoHistory.length>0) {
    gameHistory.push(game.clone())
    game = gameUndoHistory.pop();
    root = new MCNode(game.clone())
    root.parent = null;
    root.elapsedTime = 0;
    drawBoard(game);
  }
}

window.resetGame = function reset() {
  var gameName = $("#game-select")[0].value

  $(".desc").hide()
  $(`.desc-${gameName}`).show()
  
  switch (gameName) {
    case "Pentago": game = new PentagoGameState(); break;
    case "Otrio": game = new OtrioGameState(); break;
    case "Othello": game = new OthelloGameState(); break;
    case "Quarto": game = new QuartoGameState(); break;
    case "QuartoSquare":
      game = new QuartoGameState()
      game.matchSquares=true;
      break;
    case "ConnectFour": game = new ConnectFourGameState(); break;
    case "Checkers": game = new CheckersGameState(); break;
    case "Go": game = new GoGameState(); break;
  }
  //game.matchSquares = true;
  game.findLegalMoves()
  game.checkVictory()
  rootState = game.clone();
  rootState.findLegalMoves()
  rootState.checkVictory()
  root = new MCNode(rootState);
  root.elapsedTime = 0;
  gameHistory = [];
  gameUndoHistory = [];
  
  drawBoard(game)
}

window.humanMove = function humanMove(x,y) {
  if ((awaitHumanMove || paused) && game.winner === null) {
    var move = game.playerInput(x,y)
    
    if (move !== null && game.legalMoves.indexOf(move) > -1) {
      makeMove(game.legalMoves.indexOf(move))
    }
  }
  drawBoard(game)
}

function makeMove(move) {
  game.findLegalMoves()
  game.checkVictory()
  if (game.winner === null && move !== null && move >= 0 && move < game.legalMoves.length) {
    gameHistory.push(game);
    gameUndoHistory = [];
    awaitHumanMove = false;
    game = game.clone();
    game.move(game.legalMoves[move])
    if ($("#allow-precomputation")[0].checked) {
      root = root.findMove(move)
    } else {
      root = new MCNode(game.clone())
    }
    root.parent = null;
    root.elapsedTime = 0;
    drawBoard(game)
  }
}

function loop() {
  thing1()
  if (!paused)
    requestAnimationFrame(loop)
  else
    drawBoard(game)
}

window.awaitHumanMove = false;
gameHistory = [];
gameUndoHistory = [];

/// TEST CODE ///

$("#game-select")[0].value = "Go";
$("#mode-1")[0].value = "player";
$("#mode-2")[0].value = "CPU";
$("#limit-time-1")[0].value = "10";
$("#limit-time-2")[0].value = "10";


/// END TEST CODE ///

paused = false;
resetGame()
loop()