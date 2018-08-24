var setExpr;

angular.module("AppNameHere", [])
.controller("MainController", ["$scope", function($scope) {
  $scope.x = "two plus two equals four ({\u03bb {\u03bb @<2>}} means true)";
  
  $scope.exprControl = null;
  
  window.mainScope = $scope;
  
  $scope.expr1 = [example.parseLambda(example.twotwofour)];
  $scope.input = example.twotwofour;
  $scope.showGoButton = false;
  $scope.showClearButton = false;
  $scope.keepExprs = false;
  $scope.rules = Object.keys(example.rules);
  $scope.selectedRule = $scope.rules[0];
  $scope.selection = [];
  
  $scope.rules.unshift("delete", "clone");
  
  $scope.$watch("selectedRule", function() {
    if ($scope.selectedRule == "delete") {
      $scope.showClearButton = false;
      $scope.showGoButton = false;
      $scope.clearSelection();
      return;
    }
    var rule = example.rules[$scope.selectedRule];
    $scope.showClearButton = (rule.inputsNeeded != 1);
    $scope.showGoButton = (rule.inputsNeeded == "many");
    $scope.clearSelection();
  });
  
  $scope.clearSelection = function() {
    $scope.selection = [];
    $scope.exprControl.setAllSelected(false);
  }
  
  $scope.setExprLambda = function setExprLambda(val) {
    $scope.expr1 = example.parseMultiLambda(val);
  }
  $scope.appendExprLambda = function setExprLambda(val) {
    $scope.expr1 = $scope.expr1.concat(example.parseMultiLambda(val));
  }
  
  $scope.onExprClick = function onExprClick(val) {
    if ($scope.selectedRule == "delete") {
      if (val.length > 0) {
        $scope.expr1.splice(val[0], 1);
      }
      $scope.clearSelection()
      return;
    } else if ($scope.selectedRule == "clone") {
      if (val.length> 0) {
        $scope.expr1.push($scope.expr1[val[0]]);
      }
      $scope.clearSelection();
      return;
    }
    
    var rule = example.rules[$scope.selectedRule];
    
    $scope.selection.push(val);
    
    if ($scope.selection.length == rule.inputsNeeded) {
      $scope.doTransform();
    }
  }
  
  $scope.doTransform = function doTransform() {
    var rule = example.rules[$scope.selectedRule];
    
    var expr = $scope.selection.map(e => logic.index($scope.expr1, e));
    
    var input = rule.getVars($scope.expr1, $scope.selection, expr);
    
    if (input) {
      var exprs = $scope.selection.slice(0,rule.ante.length).map(e => $scope.expr1[e[0]]);
      var result = logic.apply(exprs, rule, input);

      if (result.length > 0) {
        //$scope.expr1 = result;
        $scope.expr1 = $scope.expr1.concat(result);
        
        if (!$scope.keepExprs) {
          var remove = $scope.selection.map(e=>e[0]);
          $scope.expr1 = $scope.expr1.filter((e,i)=>remove.indexOf(i) == -1);
        }
      }
    }
    
    $scope.clearSelection();
  }
  
  setExpr = function(val) {
    $scope.expr1 = val;
    $scope.$apply();
    return val;
  }
  /*
  $scope.inSelection(val) {
    return $scope.selection.findIndex(e => {
      
    })
  }
  
  $scope.toggleSelected(val) {
    var index = $scope.inSelection(val);
    if (index == -1) {
      $scope.selection.push(val);
    } else {
      $scope.selection.splice(index, 1);
    }
  }
  */
}])

.component("expression", {
  bindings: {
    expression: '=',
    exprControl: '&',
    exprClick: '&',
  },
  template: `
    <div ng-if="!logic.isAtomic($ctrl.expression)" ng-click="onclick($event)" ng-class="{selected:selected, expr:true, hover:hover && !childHover}">
      <expression
        ng-repeat="e in $ctrl.expression track by $index"
        expression="e"
        expr-click="subclick($index, expr)"
        expr-control="setChildControl(ctrl, $index)"
        ng-mouseenter="setChildHover(true)"
        ng-mouseleave="setChildHover(false)"></expression>
    </div>
    <span ng-if="logic.isAtomic($ctrl.expression)" ng-click="onclick($event)" ng-class="{selected:selected, hover:hover}">{{$ctrl.expression|exprToString}}</span>
  `,
  controller: function($scope, $element) {
    var ctrl = this;
    
    $scope.children = [];
    $scope.logic = logic;
    $scope.selected = false;
    $scope.childClickListener = [];
    $scope.hover = false;
    $scope.childHover = false;
    
    $scope.setChildControl = function(childController, index) {
      $scope.children[index] = childController;
    }
    
    $scope.setChildHover = function(val) {
      $scope.childHover = val;
    };
    
    $scope.onclick = function(event) {
      $scope.selected = true;
      event.stopPropagation();
      ctrl.exprClick({expr:[]});
    }
    
    $scope.subclick = function(id, expr) {
      expr.unshift(id);
      ctrl.exprClick({expr: expr});
    }
    
    ctrl.setSelected = function(val) {
      $scope.selected = val;
    }
    
    ctrl.setAllSelected = function(val) {
      $scope.selected = val;
      for (var i=0; i<$scope.children.length; i++) {
        $scope.children[i].setAllSelected(val);
      }
    }
    
    $element.on("mouseenter", function(e) {
      $scope.hover = true;
      $scope.$apply();
    })
    
    $element.on("mouseleave", function(e) {
      $scope.hover = false;
      $scope.$apply();
    })
    
    ctrl.exprControl({ctrl});
  }
})

.filter("exprToString", function() {return function(val) {
  return logic.toString(val);
}})