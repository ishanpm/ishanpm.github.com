var setExpr;

angular.module("AppNameHere", [])
.controller("MainController", ["$scope", function($scope) {
  $scope.x = "what could it mean";
  
  $scope.expr1 = [example.lambda.ante[0],example.lambda.cons[0]];
  $scope.selection = [];
  
  console.log($scope.expr1);
  
  $scope.onExprClick = function(val) {
    console.log(logic.index($scope.expr1, val));
  }
  
  setExpr = function(val) {
    $scope.expr1 = val;
    $scope.$apply();
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
    <div ng-if="!logic.isAtomic($ctrl.expression)" ng-click="onclick($event)" ng-class="{selected:selected, expr:true}">
      <expression ng-init="doChildClick[$index]=1" ng-repeat="e in $ctrl.expression" expression="e" expr-click="subclick($index, expr)" do-click="doChildClick($index,doClick)"></expression>
    </div>
    <span ng-if="logic.isAtomic($ctrl.expression)" ng-click="onclick($event)" ng-class="{selected:selected}">{{$ctrl.expression|exprToString}}</span>
  `,
  controller: function($scope) {
    var ctrl = this;
    
    function doClick() {
      $scope.selected = !$scope.selected;
      
      for (var i=0; i<$scope.childClickListener.length; i++) {
        $scope.childClickListener[i]();
      }
    }
    
    $scope.logic = logic;
    $scope.selected = false;
    $scope.childClickListener = [];
    
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
    
    ctrl.doClick({doClick})
  }
})

.filter("exprToString", function() {return function(val) {
  return logic.toString(val);
}})