window.logic = (function() {
  
  // Apply a transformation rule given the antecedents and some values to replace the variables with
  function apply(trans, ante, vars) {
    // Check if given expressions satisfy antecedents
    var ante1 = replaceEach(trans.ante, vars);
    if (equals(ante1, ante, 0, 0)) {
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
  
  // Replace "var" variables in expr with vars
  function replace(expr, vars) {
    if (isAtomic(expr)) {
      return clone(expr);
    } else {
      var ans = [];
      // Iterate over expression tree
      for (var i=0; i<expr.length; i++) {
        ans[i] = replace(expr[i], vars)
      }
      
      if (isAtomic(expr[0]) && expr[0].type == "pl") {
        if (expr.length > 1) {
          // Function replacement
          // Return function with args replaced with the expression
          ans[0] = null; // Don't use the original head in the replacement
          ans = replace([vars[expr[0].val]], ans)
        } else {
          ans = clone(vars[expr[0].val])
        }
        
        rebind(ans, expr[0].bind, expr[0].bindi);
        renumber(ans, -1, 1)
      }
      
      return ans;
    }
  }
  
  // In-place replacement of bindings in expr at depth
  function rebind(expr, bind, bindi, depth) {
    depth = depth || 0;
    if (isAtomic(expr)) {
      if (expr.bind != null) {
        var newBind = [];
        var newBindi = [];
        for (var i=0; i<expr.bind.length; i++) {
          if (expr.bind[i] == depth) {
            newBind[i] = bind[expr.bindi[i]];
            newBindi[i] = bindi[expr.bindi[i]];
          } else {
            newBind[i] = expr.bind[i];
            newBindi[i] = expr.bindi[i];
          }
        }
        expr.bind = newBind;
        expr.bindi = newBindi;
      }
    } else {
      // Iterate over expression tree
      for (var i=0; i<expr.length; i++) {
        rebind(expr[i], bind, bindi, depth+1)
      }
    }
  }
  
  // In-place adjustment of bindings in expr above depth
  function renumber(expr, amt, depth) {
    if (isAtomic(expr)) {
      if (expr.bind != null) {
        var newBind = [];
        for (var i=0; i<expr.bind.length; i++) {
          if (expr.bind[i] > depth) {
            newBind[i] = expr.bind[i] + amt;
          } else {
            newBind[i] = expr.bind[i];
          }
        }
        expr.bind = newBind;
      }
    } else {
      // Iterate over expression tree
      for (var i=0; i<expr.length; i++) {
        renumber(expr[i], amt, depth+1)
      }
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
  
  // Check if elem1[i1] == elem2[i2]  
  // d1 and d2 subtract from depth for matching binding vars
  function equals(elem1, elem2, d1, d2, depth) {
    depth = depth || 0;
    
    if (elem1.length === elem2.length) {
      if (isAtomic(elem1)) {
        // Atomic equality test
        if (elem1.type != elem2.type) return false;
        if (elem1.val != elem2.val) return false;
        if (elem1.bind && elem1.bind.length != elem2.bind.length) return false;
        if (elem1.bindi && elem1.bindi.length != elem2.bindi.length) return false;
        if (elem1.bind) {
          for (var i=0; i<elem1.bind.length; i++) {
            if (elem1.bind[i] <= depth) {
              if (elem1.bind[i] != elem2.bind[i]) {
                return false;
              }
            } else {
              if (elem1.bind[i]+d1 != elem2.bind[i]+d2) {
                return false;
              }
            }
          }
        }
        if (elem1.bindi) {
          for (var i=0; i<elem1.bindi.length; i++) {
            if (elem1.bindi[i] != elem2.bindi[i]) {
              return false;
            }
          }
        }
        
        return true;
      } else {
        // Composite equality test
        for (var i=0; i<elem1.length; i++) {
          if (! equals(elem1[i], elem2[i], d1, d2, depth+1)) {
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
    return !!expr.type;
  }
  
  // Get an element at a particular index in an expression
  function index(expr, index) {
    for (var i=0; i<index.length; i++) {
      expr = expr[index[i]];
    }
    return expr;
  }
  
  
  var logic = {apply, replaceEach, replace, rebind, clone, equals, isAtomic, index};
  return logic;
})();


   exampleTransform = {
    ante: [
      [ {type: "pl", val:0},
        [ [ {type:"lambda"},
            [ {type: "pl", val:1, bind:[4], bindi:[0]},
              {type:"bind", bind: [2], bindi:[0]}
            ]
          ],
          [ {type: "pl", val:2, bind:[2], bindi:[1]}
          ]
        ]
      ]
    ],
    cons: [
      [ {type: "pl", val:0},
        [ {type: "pl", val:1, bind:[2], bindi:[0]},
          [ {type: "pl", val:2, bind:[2], bindi:[1]}
          ]
        ]
      ]
    ]
  }
  exampleStamement =
    [ [ {type:"lambda"},
        {type:"bind", bind:[1], bindi:[0]}
      ],
      {type:"a"}
    ]

exampleVars = [
  {type:"pl", val:1},
  {type:"pl", val:1},
  {type:"a"}
]

  exampleStamement2 =
    [ [ [ {type:"lambda"},
          [ {type:"lambda"},
            [ {type:"bind", bind:[3], bindi:[0]},
              {type:"bind", bind:[2], bindi:[0]}
            ]
          ]
        ],
        {type:"a"}
      ],
      {type:"b"}
    ]