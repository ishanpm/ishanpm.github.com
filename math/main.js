var setExpr;

angular.module("AppNameHere", [])
.controller("MainController", ["$scope", function($scope) {
  $scope.x = "two plus two equals four ({\u03bb {\u03bb @<2>}} means true)";
  
  $scope.expr1 = [example.parseLambda(example.twotwofour)];
  $scope.selection = [];
  
  console.log($scope.expr1);
  
  $scope.onExprClick = function(val) {
    var expr = logic.index($scope.expr1, val)
    if (expr.type == "lambda") {
      val = val.slice(0,-1);
    } else if (expr[0] && expr[0].type == "lambda") {
      // No change
    } else if (expr[0] && expr[0][0] && expr[0][0].type == "lambda") {
      val = val.concat([0]);
    } else {
      return;
    }
    
    var a = [[val.slice(1).slice(0,-1)]];
    var b = [logic.getAllFree(logic.index($scope.expr1, val)[1])];
    var newExpr = logic.apply($scope.expr1, example.lambda, [a, b, []]);
    if (newExpr.length > 0) {
      $scope.expr1 = newExpr;
    }
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
    exprClick: '&',
    doClick: '&',
  },
  template: `
    <div ng-if="!logic.isAtomic($ctrl.expression)" ng-click="onclick($event)" ng-class="{selected:selected, expr:true, hover:hover && !childHover}">
      <expression
        ng-init="doChildClick[$index]=1"
        ng-repeat="e in $ctrl.expression"
        expression="e" expr-click="subclick($index, expr)"
        do-click="doChildClick($index,doClick)"
        ng-mouseenter="setChildHover(true)"
        ng-mouseleave="setChildHover(false)"></expression>
    </div>
    <span ng-if="logic.isAtomic($ctrl.expression)" ng-click="onclick($event)" ng-class="{selected:selected, hover:hover}">{{$ctrl.expression|exprToString}}</span>
  `,
  controller: function($scope, $element) {
    var ctrl = this;
    
    function doClick() {
      //$scope.selected = !$scope.selected;
      
      for (var i=0; i<$scope.childClickListener.length; i++) {
        $scope.childClickListener[i]();
      }
    }
    
    $scope.logic = logic;
    $scope.selected = false;
    $scope.childClickListener = [];
    $scope.hover = false;
    $scope.childHover = false;
    
    $scope.setChildHover = function(val) {
      $scope.childHover = val;
    };
    
    $scope.onclick = function(event) {
      //$scope.selected = !$scope.selected;
      doClick();
      event.stopPropagation();
      ctrl.exprClick({expr:[]});
    }
    
    $scope.subclick = function(id, expr) {
      expr.unshift(id);
      ctrl.exprClick({expr: expr});
    }
    
    $scope.doChildClick = function(index, doClick) {
      $scope.childClickListener[index] = doClick;
    }
    
    $element.on("mouseenter", function(e) {
      $scope.hover = true;
      $scope.$apply();
    })
    
    $element.on("mouseleave", function(e) {
      $scope.hover = false;
      $scope.$apply();
    })
    
    ctrl.doClick({doClick})
  }
})

.filter("exprToString", function() {return function(val) {
  return logic.toString(val);
}})