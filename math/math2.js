window.logic = (function() {
  
  // Apply a transformation rule given the antecedents and some values to replace the variables with
  function apply(trans, ante, vars) {
    // Check if given expressions satisfy antecedents
    var ante1 = replaceEach(trans.ante, vars);
    if (equals(ante1, ante)) {
      // Do the thing
      return replaceEach(trans.cons, vars);
    } else {
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
  
  // Deep clone an expression
  // (atom properties are NOT cloned)
  function clone(expr) {
    if (isAtomic(expr)) {
      var newObj = {};
      newObj.type = expr.type;
      newObj.val = expr.val;
      newObj.bind = expr.bind;
      newObj.bindi = expr.bindi;
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
  
  // Check if elem1 == elem2
  function equals(elem1, elem2) {
    if (elem1.length === elem2.length) {
      if (isAtomic(elem1)) {
        // Atomic equality test
        if (elem1.type != elem2.type) return false;
        if (elem1.val != elem2.val) return false;
        if (elem1.bind && elem1.bind.length != elem2.bind.length) return false;
        if (elem1.bindi && elem1.bindi.length != elem2.bindi.length) return false;
        if (elem1.bind) {
          for (var i=0; i<elem1.bind.length; i++) {
            if (elem1.bind[i] != elem2.bind[i]) {
              return false;
            }
          }
        }
        if (elem1.bindi) {
          for (var i=0; i<elem1.bindi.length; i++) {
            for (var k=0; k<elem1.bindi[i].length; k++) {
              if (elem1.bindi[i][k] != elem2.bindi[i][k]) {
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
  function replaceIndex(expr, index, val) {
    for (var i=0; i<index.length - 1; i++) {
      expr = expr[index[i]];
    }
    
    expr[index[index.length - 1]] = val;
  }
  
  // Gets external bindings of an expression (not indices)
  function getBindings(expr, depth, ans) {
    ans = ans || [];
    depth = depth || 0;
    if (isAtomic(expr)) {
      if (expr.bind) {
        for (var i=0; i<expr.bind.length; i++) {
          if (expr.bind[i] > depth) {
            var bind = expr.bind[i] - depth;
            if (ans.indexOf(bind) === -1) {
              ans.push(bind);
            }
          }
        }
      }
    } else {
      for (var i=0; i<expr.length; i++) {
        getBindings(expr[i], depth+1, ans)
      }
    }
    
    return ans;
  }
  
  // Makes a replacement variables from an expression
  function makeVariables(expr, trans, iroot, iargs) {
    var expr = clone(expr);
    var ans = [];
    // For each metafunction
    for (var i=0; i<iargs.length; i++) {
      
    }
    return ans;
  }
  
  // Makes a single metafunction, modifying expr and returning the metafunction definition
  function makeMetafunction(expr, bindHints, iroot, iargs, head) {
    // Replace incoming bindings
    // For each argument...
      // For each instance...
        // Get all bindings in range
        // For each binding...
          // Add a binding index and remap all bindings to use it
        // Add a pl with all remapped bindings
    // Get external bindings in range
      // Remap external bindings to use index from bindHints
    
    /*
    ans = clone(expr);
    // Replace the arguments with pl's
    for (var k=0; k<iargs.length; k++) {
      for (var l=0; l<iargs[k].length; l++) {
        var bind = getBindings([index(ans,iargs[k][l])])
        bind = bind.filter(e => {
          return e <= iargs[k][l].length - iroot.length
        })
        if (bind.length > 0) {
          var bindi = Array(bind.length).fill([]);
          replaceIndex(ans, iargs[k][l], [{type:"pl",val:k+1,bind,bindi}]);
          // Rebind children
        } else {
          replaceIndex(ans, iargs[k][l], [{type:"pl",val:k+1}]);
        }
      }
    }
    ans = index(ans, iroot);
    // Rebind external bindings
    if (trans.bindHints) {
      for (var k=0; k<bindHints.length; k++) {
        addbind(ans,bindHints[k],k)
      }
    }
    */
  }
  
  // Gets external bindings of an expression (not indices)
  function getBindings(expr, depth, ans) {
    ans = ans || [];
    depth = depth || 0;
    if (isAtomic(expr)) {
      if (expr.bind) {
        for (var i=0; i<expr.bind.length; i++) {
          if (expr.bind[i] > depth) {
            var bind = expr.bind[i] - depth;
            if (ans.indexOf(bind) === -1) {
              ans.push(bind);
            }
          }
        }
      }
    } else {
      for (var i=0; i<expr.length; i++) {
        getBindings(expr[i], depth+1, ans)
      }
    }
    
    return ans;
  }
  
  function toString(expr) {
    if (!expr) {
      return "???("+expr+")";
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
        if (expr.bindi) {
          ans += `<${expr.bindi}@${expr.bind}>`
        } else {
          ans += `<@${expr.bind}>`
        }
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
  
  var logic = {apply, replaceEach, replace, rebind, renumber, clone, equals, isAtomic, index, getBindings, makeVariables, toString};
  return logic;
})();

window.example = (function() {
  var example = {};
  example.lambda = {
    ante: [
      [ {type: "pl", val:0},
        [ [ {type:"lambda"},
            [ {type: "pl", val:1, bind:[4], bindi:[[]]},
              {type:"bind", bind: [2], bindi:[[]]}
            ]
          ],
          [ {type: "pl", val:2, bind:[3], bindi:[[]]} ]
        ]
      ]
    ],
    cons: [
      [ {type: "pl", val:0},
        [ {type: "pl", val:1, bind:[2], bindi:[[]]},
          [ {type: "pl", val:2, bind:[3], bindi:[[]]} ]
        ]
      ]
    ],
    bindHints: [null,[4],[3]],
    plArities: [1, 1, 0]
  }
  example.statement =
    [ [ {type:"lambda"},
        {type:"bind", bind:[1], bindi:[[]]}
      ],
      {type:"a"}
    ]

  example.vars = [
    [{type:"f"},[{type:"pl", val:1, bind:[2], bindi:[[]]}]],
    [{type:"pl", val:1}],
    {type:"a",bind:[1,1],bindi:[[0,123],[0,456]]}
  ]

  example.statement1 = 
    [ {type:"let"},
      [ [ {type:"lambda"},
          [ [ {type:"lambda"},
              [ {type:"bind",bind:[4],bindi:[[]]},
                {type:"bind",bind:[2],bindi:[[]]}
              ]
            ],
            {type:"a",bind:[4],bindi:[[0]]}
          ]
        ],
        {type:"b",bind:[2],bindi:[[1]]}
      ]
    ]
  
  example.vars1a = [
    [ {type:"let"},
      [ [ {type:"lambda"},
          [ {type:"pl",val:1,bind:[null,2,4],bindi:[[],[],[]]} ]
        ],
        {type:"b",bind:[2],bindi:[[1]]}
      ]
    ],
    [ {type:"bind",bind:[2],bindi:[[0,1]]},
      [ {type:"pl",val:1} ]
    ],
    {type:"a",bind:[1],bindi:[[0,2,0]]}
  ]

  example.vars1b = [
    [ {type:"let"},
      [ {type:"pl",val:1,bind:[2],bindi:[[]]} ]
    ],
    [ [ {type:"lambda"},
        [ [ {type:"pl",val:1} ],
          {type:"bind",bind:[2],bindi:[[]]}
        ]
      ],
      {type:"a",bind:[2],bindi:[[0,0,0]]}
    ],
    {type:"b",bind:[1],bindi:[[0,0,1]]}
  ]
  
  example.vars1ba = [
    [ {type:"let"},
      [ {type:"pl",val:1,bind:[2],bindi:[[]]} ],
    ],
    [ {type:"b",bind:[2],bindi:[[0,0,1]]},
      [ {type:"pl",val:1} ]
    ],
    {type:"a",bind:[1],bindi:[[0,0,0]]}
  ]
  
  example.vars1ab = [
    [ {type:"let"},
      [ {type:"pl",val:1,bind:[2],bindi:[[]]} ],
    ],
    [ [ {type:"pl",val:1} ],
      {type:"a",bind:[2],bindi:[[0,0,0]]}
    ],
    {type:"b",bind:[1],bindi:[[0,0,1]]}
  ]
  
  example.bindTest = 
    [ {type:"bind", bind:[1,2,3], bindi:[0,0]},
      [ {type:"bind", bind:[2,3,4], bindi:[0,0]},
        [ {type:"bind", bind:[3,4,5], bindi:[0,0]},
          [ {type:"bind", bind:[4,5,6], bindi:[0,0]} ]
        ]
      ]
    ]
  
  return example;
})();