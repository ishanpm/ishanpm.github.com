window.logic = (function() {
  
  // Apply a transformation rule given the antecedents and the ending paths for all the variables
  function apply(ante, trans, vars) {
    try {
      vars = makeVariables(ante, trans, vars);

      // Check if given expressions satisfy antecedents
      var ante1 = replaceEach(trans.ante, vars);
      if (equals(ante1, ante)) {
        // Do the thing
        return replaceEach(trans.cons, vars);
      } else {
        return [];
      }
    } catch (e) {
      console.error(e);
      return [];
    }
  }
  
  // Convenience function to map replace(expr, vars) over an array
  function replaceEach(expr, vars) {
    var ans = [];
    for (var i=0; i<expr.length; i++) {
      ans[i] = replace(expr[i], vars);
    }
    return ans;
  }
  
  // Replace all instances of [pl] with vars[pl.val]
  // Bindings are remapped according to pl.bind
  function replace(expr, vars) {
    if (isAtomic(expr)) {
      // Leaf node, do nothing
      return expr;
    } else {
      var out = [];
      // Iterate over expression tree
      for (var i=0; i<expr.length; i++) {
        out[i] = replace(expr[i], vars)
      }
      
      if (expr[0].type == "pl") {
        // Replace pl
        
        return _replace2(vars[expr[0].val], out, expr[0].bind, 1, 0, 2)
      }
      
      return out;
    }
  }
  
  // Replace all instances of pl with vars[pl.val]
  // Free vars are remapped according to bind and offset
  // Bindings above depth are renumbered according to delta
  function _replace2(expr, vars, bind, depth, delta, offset) {
    if (isAtomic(expr)) {
      if (expr.type == "pl" && vars !== null) {
        // Replace atomic pl
        return  _replace2(vars[expr.val+1], null, expr.bind, 1, depth - 2, 1)
      } else if (expr.bind) {
        // Rebind variables
        var out = clone(expr)
        out.bind = []
        for (var i=0; i<expr.bind.length; i++) {
          if (expr.bind[i][0] == depth) {
            // Remap free vars
            out.bind[i] = []
            for (var k=0; k<bind[expr.bind[i][1]].length; k++){
              out.bind[i][k] = bind[expr.bind[i][1]][k];
            }
            out.bind[i][0] += expr.bind[i][0] - offset;
            for (var k=2; k<expr.bind[i].length; k++){
              out.bind[i].push(expr.bind[i][k])
            }
          } else if (expr.bind[i][0] > depth) {
            // Renumber external vars
            out.bind[i] = shallowClone(expr.bind[i]);
            out.bind[i][0] += delta;
            
            if (vars !== null) console.warn("External bindings in replacement variables are illegal")
          } else {
            // Keep internal bindings
            out.bind[i] = expr.bind[i];
          }
        }
        return out;
      } else {
        return expr;
      }
    } else {
      out = [];
      // Iterate over expression tree
      for (var i=0; i<expr.length; i++) {
        out[i] = _replace2(expr[i], vars, bind, depth+1, delta, offset);
      }
      
      return out;
    }
  }
  
  // Deep clone an expression
  // (atom properties are NOT cloned)
  function clone(expr) {
    if (isAtomic(expr)) {
      var newObj = {};
      newObj.type = expr.type;
      newObj.val = expr.val;
      newObj.bind = expr.bind;
      newObj.disp = expr.disp;
      return newObj;
    } else {
      var ans = [];
      // Iterate over expression tree
      for (var i=0; i<expr.length; i++) {
        ans[i] = clone(expr[i])
      }
      
      return ans;
    }
  }
  
  // Shallow clone a list
  function shallowClone(val) {
    ans = [];
    for (var i=0; i<val.length; i++) {
      ans[i] = val[i];
    }
    return ans;
  }
  
  // Check if elem1 == elem2
  function equals(elem1, elem2) {
    if (elem1.length === elem2.length) {
      if (isAtomic(elem1)) {
        // Atomic equality test
        if (elem1.type != elem2.type) return false;
        if (elem1.val != elem2.val) return false;
        if (elem1.bind && elem1.bind.length != elem2.bind.length) return false;
        if (elem1.bind) {
          for (var i=0; i<elem1.bind.length; i++) {
            if (elem1.bind[i].length != elem2.bind[i].length) {
              return false;
            }
            for (var k=0; k<elem1.bind[i].length; k++) {
              if (elem1.bind[i][k] != elem2.bind[i][k]) {
                return false;
              }
            }
          }
        }
        
        return true;
      } else {
        // Composite equality test
        for (var i=0; i<elem1.length; i++) {
          if (! equals(elem1[i], elem2[i])) {
            return false;
          }
        }
        
        return true;
      }
    } else {
      // Atomic != Composite
      return false;
    }
  }
  
  // Returns true for atomic and false for non-atomic exprs
  function isAtomic(expr) {
    if (!expr) {
      console.log("Expression "+expr+" encountered")
      return true;
    }
    return !!expr.type;
  }
  
  // Get an element at a particular index in an expression
  function index(expr, index) {
    for (var i=0; i<index.length; i++) {
      expr = expr[index[i]];
    }
    return expr;
  }
  
  // Replaces a single expression at a particular index
  // WARNING: Does not properly replace zero-length paths
  function replaceIndex(expr, index, val) {
    var oldexpr = expr;
    if (index.length > 0) {
      for (var i=0; i<index.length - 1; i++) {
        expr = expr[index[i]];
      }

      expr[index[index.length - 1]] = val;

      return oldexpr;
    } else {
      return val;
    }
  }

  // Generates metafunction variables from an expression
  // exprs: expressions to correspond to consequents in transformation
  // trans: transformation rule to base replacements off of
  // arge: variable instance end indices (relative to the beginning of the instance)
  function makeVariables(exprs, trans, arge) {
    // Gather a list of all instances of every metafunction using arge
    var inst = []; // [[{parents:[{epath, start, tdepth}], bind, path, tdepth}, instances...], vars...]
    _findInstances(exprs, trans.ante, arge, inst);
    
    // Create the unbound version of every metafunction from inst[0] and arge
    var ans = [];
    for (var v=0; v<arge.length; v++) {
      ans[v] = clone(index(exprs, inst[v][0].path));
      for (var e=0; e<arge[v].length; e++) {
        for (var i=0; i<arge[v][e].length; i++) {
          ans[v] = replaceIndex(ans[v], arge[v][e][i], {type:"pl", val:e, bind:[]});
        }
      }
    }
    // Search for bindings in that version
    for (var i=0; i<ans.length; i++) {
      _connectVariableBindings(ans[i], inst, i, ans, exprs);
    }
    
    return ans;
  }
  
  
  function _findInstances(expr, template, arge, inst, path, tdepth, parents) {
    inst = inst || [];
    path = path || [];
    tdepth = tdepth || 0;
    parents = parents || [];
    
    if (isAtomic(template)) {
      // Do nothing
    } else if (template[0].type == "pl") {
      var v = template[0].val;
      
      // Add an instance
      inst[v] = inst[v] || [];
      inst[v].push({parents:shallowClone(parents), bind:template[0].bind, path:shallowClone(path), tdepth:tdepth});
      
      // Split up based on arge[placeholder val]
      for (var e=0; e<arge[v].length; e++) {
        for (var i=0; i<arge[v][e].length; i++) {
          // Mark in parent list, push path
          parents.push({v:v, epath:arge[v][e][i], start:path.length, tdepth:tdepth});
          path = path.concat(arge[v][e][i]);
          // Iterate over expression tree
          var nextExpr = index(expr, arge[v][e][i]);
          _findInstances(nextExpr, template[e+1], arge, inst, path, tdepth+1, parents)
          // Unmark parent list, pop path
          parents.pop();
          path.splice(- arge[v][e][i].length);
        }
      }
      
    } else {
      // Iterate over expression tree
      path.push(0);
      for (var i=0; i<expr.length; i++) {
        parents.push({start:path.length - 1, tdepth:tdepth})
        path[path.length - 1] = i;
        _findInstances(expr[i], template[i], arge, inst, path, tdepth+1, parents)
        parents.pop();
      }
      path.splice(path.length - 1, 1);
    }
    
    return inst;
  }
  
  function _connectVariableBindings(expr, inst, varnum, vars, fullexpr, path) {
    path = path || [];
    
    if (isAtomic(expr)) {
      if (expr.bind) {
        
        for (var b=0; b<expr.bind.length; b++) {
          if (expr.bind[b][0] > path.length) {
            var instparents = [];
            var bindTarget = 0;
            var tIndex = 0;

            // Get instance parents and pick bind target
            for (var i=0; i<inst[varnum].length; i++) {
              // Find target of binding
              instparents[i] = null;
              var bind = index(index(fullexpr, inst[varnum][i].path), path).bind[b][0];
              var target = inst[varnum][i].path.length + path.length - bind;

              for (var p=0; p<inst[varnum][i].parents.length; p++) {
                var candidate = inst[varnum][i].parents[p]

                if ((!candidate.epath && candidate.start == target)
                    || (candidate.epath
                        && candidate.start <= target
                        && candidate.start + candidate.epath.length > target)) {
                  instparents[i] = candidate;
                  break;
                }
              }

              if (instparents[i].v !== undefined) {
                bindTarget = Math.max(bindTarget, index(vars[instparents[i].v], instparents[i].epath).bind.length);
              }
            }

            // Determine template index
            var tdepth = inst[varnum][0].tdepth - instparents[0].tdepth;
            var tIndex;
            for (var t=0; t<inst[varnum][0].bind.length; t++) {
              if (inst[varnum][0].bind[t][0] == tdepth) {
                tIndex = t;
                break;
              }
            }

            expr.bind = shallowClone(expr.bind);
            expr.bind[b] = shallowClone(expr.bind[b]);
            expr.bind[b].splice(0, 1, path.length + 1, tIndex, bindTarget);

            // Update bind targets
            for (var i=0; i<inst[varnum].length; i++) {
              if (instparents[i].v !== undefined) {
                var bindDepth = index(index(fullexpr, inst[varnum][i].path), path).bind[b][0];

                var ending = index(vars[instparents[i].v], instparents[i].epath);
                ending.bind[bindTarget] = [(instparents[i].start + instparents[i].epath.length) - inst[varnum][i].path.length - path.length + bindDepth];
              }
            }
          }
        }
      }
    } else {
      // Iterate over expression tree
      path.push(0);
      for (var i=0; i<expr.length; i++) {
        path[path.length - 1] = i;
        _connectVariableBindings(expr[i], inst, varnum, vars, fullexpr, path)
      }
      path.splice(path.length - 1, 1);
    }
  }
  
  // Gets paths to all free (bound to node above root) leaf nodes
  function getAllFree(expr, path, depth) {
    path = path || [];
    depth = depth || 1;
    if (isAtomic(expr)) {
      if (expr && expr.bind) {
        for (var i=0; i<expr.bind.length; i++) {
          if (expr.bind[i][0] == depth) {
            return [shallowClone(path)];
          }
        }
      }
      
      return [];
    } else {
      var out = [];
      
      for (var i=0; i<expr.length; i++) {
        path.push(i);
        out = out.concat(getAllFree(expr[i], path, depth+1));
        path.pop();
      }
      
      return out;
    }
  }

  function toString(expr) {
    if (typeof(expr) == "number" || !expr) {
      return "("+expr+")";
    } else if (isAtomic(expr)) {
      var ans="";
      if (expr.type == "lambda") {
        ans = "\u03bb"
      } else if (expr.type == "var") {
        ans = `"${expr.val}"`
      } else if (expr.type == "pl") {
        ans = `#${expr.val}`
      } else if (expr.type == "bind") {
        ans = "@"
      } else {
        ans = expr.type;
      }
      if (expr.bind) {
        ans += `<${expr.bind}>`
      }
      return ans;
    } else if (expr.ante || expr.cons) {
      return `${toString(expr.ante)} ==> ${toString(expr.cons)}`
    } else {
      str = "{"
      // Iterate over expression tree
      for (var i=0; i<expr.length; i++) {
        str += " " + toString(expr[i]);
      }
      return str+" }";
    }
  }
  
  var logic = {apply, replaceEach, replace, _replace2, clone, equals, isAtomic, index, replaceIndex, getAllFree, makeVariables, _findInstances, toString};
  return logic;
})();

window.example = (function() {
  var example = {};
  example.lambda = {
    ante: [
      [ {type: "pl", val:0},
        [ [ {type:"lambda"},
            [ {type: "pl", val:1, bind:[[4]]},
              {type:"bind", bind: [[2]]}
            ]
          ],
          [ {type: "pl", val:2, bind:[[3]]} ]
        ]
      ]
    ],
    cons: [
      [ {type: "pl", val:0},
        [ {type: "pl", val:1, bind:[[2]]},
          [ {type: "pl", val:2, bind:[[3]]} ]
        ]
      ]
    ],
    plArities: [1, 1, 0]
  }
  example.lambdainv = {
    ante: [
      [ {type: "pl", val:0},
        [ {type: "pl", val:1, bind:[[2]]},
          [ {type: "pl", val:2, bind:[[3]]} ]
        ]
      ]
    ],
    cons: [
      [ {type: "pl", val:0},
        [ [ {type:"lambda"},
            [ {type: "pl", val:1, bind:[[4]]},
              {type:"bind", bind: [[2]]}
            ]
          ],
          [ {type: "pl", val:2, bind:[[3]]} ]
        ]
      ]
    ],
    plArities: [1, 1, 0]
  }
  example.statement =
    [ [ {type:"lambda"},
        {type:"bind", bind:[[0]]}
      ],
      {type:"a"}
    ]

  example.statement1 = 
    [ {type:"let"},
      [ [ {type:"lambda"},
          [ [ {type:"lambda"},
              [ {type:"bind",bind:[[4]]},
                {type:"bind",bind:[[2]]}
              ]
            ],
            {type:"a",bind:[[4,9]]}
          ]
        ],
        {type:"b",bind:[[2,10]]}
      ]
    ]
  
  example.omega = 
    [ [ {type:"lambda"},
        [ {type:"bind", bind:[[2]]},
          {type:"bind", bind:[[2]]}
        ]
      ],
      [ {type:"lambda"},
        [ {type:"bind", bind:[[2]]},
          {type:"bind", bind:[[2]]}
        ]
      ]
    ]
  example.parseLambda = function parseLambda(str) {
    i = 0;
    scope = {};
    
    function consumeIdentifier() {
      while (str[i] == " " || str[i] == "\n") {
        i++
      }
      var out = "";
      while (str[i] && !("'\\/ \n".includes(str[i]))) {
        out += str[i];
        i++;
      }
      return out;
    }
    
    function consume(depth) {
      switch (str[i]) {
        case '/': case '\\':
          i++;
          var name = consumeIdentifier()
          scope[name] = depth;
          var sub = consume(depth+1);
          delete scope[name];
          return [{type:"lambda"},sub];
          break;
        case "'":
          i++;
          return [consume(depth+1),consume(depth+1)];
          break;
        case " ": case "\n":
          i++;
          return consume(depth);
        default:
          var id = consumeIdentifier();
          if (scope[id] !== undefined) {
            return {type:"bind", bind:[[depth - scope[id]]]};
          } else {
            return {type:id};
          }
          break;
      }
    }
    
    return consume(0);
  }
  example.twotwofour =
`'/4
  '/2
    '/pred
      '/minus
        '/iszero
          '/leq
            '/plus
              '/and
                '/eq
                  ''eq''plus 2 2 4
                /a/b''and''leq a b ''leq b a
              /a/b ''a b /x/y y
            /a/b/f/x''a f''b f x  
          /a/b 'iszero''minus a b
        /n''n /w/x/y y /x/y x
      /a/b ''a pred b
    /n/f/x'''n /g/h'h'g f /u x /u u
  /f/x'f'f x
/f/x'f'f'f'f x`
  return example;
})();