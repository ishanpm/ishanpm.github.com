var logic = function() {
	"use strict";
	
    /**** Transformations
    
    Transformations have the following form:
    
    {
        antecedents: List of expressions (default: [])
        consequents: List of expressions (default: [])
        target: An expression (optional)
        replacement: An expression (required if target is specified)
        bidirectional: True/false (default: true)
        variables: List of variable domain specifications (required if any variables are used)
    }
    
    If all of the variables are in their specified domain, and all of the antecedents are true
    (i.e. at the top level of the proof tree), then all of the consequents are true.
    Also, if the target appears /anywhere/ on the proof (minding variable scope), then the
    replacement may replace it. If bidirectional=true, then you can do the replacement the other
    way (if the antecedents are true) as well.
    
    More consicely,
    for all variables: antecedents -> (consequents & (target = replacement))
    
    Some examples (expressions are shown in shorthand):
    
    Modus tollens {
        antecedents: [<p -> q>, <p>],
        consequents: [<q>],
        variables: [{name:"p",domain="boolean"},{name:"q",domain="boolean"}]
    }
    
    Equals {
        antecedents: <a = b>,
        target: <a>,
        replacement: <b>,
        bidirectional: true,
        variables: [{name:"a",domain="any"},{name:"b",domain="any"}]
    }
    
    The raw apply function requires that the antecedents be explicitly supplied, in order.
    For the target, one top-level expression along with a path to a subexpression is used.
    Explicit expressions for the input variables must also be given.
    If succsessful, it will return the list of consequents plus the substituted target expression.
    Otherwise it will return false.
    
    There is a more lenient version of the apply function that asks for the entire list of proven expressions
    and expressions for the input variables. It will search the tree for matching expressions.
    
    */
    
	var logic = {};
    
    /** Apply a transformation
     *  transform: Transformation to attempt
     *  variables: Expressions to use for input variables {a:{expression}, b:{expression}}
     *  antecedents: Must match the antecedents listed in the transformation
     *  targetExpr: Expression that contains substitution target
     *  iTarget: Path to target within expression
     *  reverse: Whether to apply substitution in reverse
     */
    logic.applyRaw = function(transform, variables, antecedents, targetExpr, iTarget, reverse) {
        // Check if transform.antecedents matches antecedents
        // Create output w/ substituted consequents
        if (targetExpr != null) {
            // Replace free
            // Replace targetExpr[iTarget] with transform.replacement
        }
        // return [consequents, targetExpr]
    }
    
    /** Apply a transformation safely
     *  expressions: List of available expressions
     *  transform: 
     */
    logic.apply = function(expressions, transform, variables, iTargetExpr, iTarget, reverse) {
        
    }
    
    /** Replace a subexpression
     *  expr: Expression to modify
     *  vars: Free vars in expr
     *  replacement: Replacement expression
     *  iReplace: index of expr to replace
     */
    logic.replace = function(expr, vars, replacement, iReplace) {
        // Infer free variables in replacement
        // Infer bound variables in expr[iReplace]
        // Cross the two lists; rename any conflicts
        // Note conflicts between vars and replacement (return.conflicts)
        // Perform the replacements
        // return {val: replaced expression, conflicts: [{var, new}]}
    }
    
    /** Returns list of variable replacements [{var, expr}] if expr fits form, false otherwise
     *  expr: Expression to test
     *  form: Expression to match against
     *  vars: Free variables in form
     */
    logic.fitsForm = function(expr, form, vars) {
        
    }
    
    /** Returns the index of every match, and variable replacements
     *  expr: Expression to search
     *  form: Expression to match against
     */
    logic.findAll = function(expr, form, vars) {
        
    }
	
	var testExpr = {
        antecedents: [
            {type:"equals",sub:[
                {type:"plus",sub:[
                    {type:"variable",val:"x"},
                    {type:"integer",val:4}
                ]},
                {type:"number",val:5}
            ]}
        ],
        consequents: [
            {type:"equals",sub:[
                {type:"variable",val:"x"},
                {type:"integer",val:1}
            ]}
        ],
        variables: [
            {name:"x", domain:"real"}
        ]
    };
    
    transforms.equals_l = {
        antecedents: [
            {type:"equals",sub:[
                {type:"variable",val:"a"},
                {type:"variable",val:"b"}
            ]},
        ],
        target:
            {type:"variable",val="a"},
        replacement:
            {type:"variable",val="b"},
        variables: [
            {name:"a", domain="any"},
            {name:"b", domain="any"},
        ],
        bidirectional: true
    }
    
    // Returns a replacement for a plus expression with two integers
    // [a [+] b] -> (sum of a and b)
    transforms.addition = function(expr) {
        if (expr.type != "plus") {return false;}
        if (expr.sub[0].type != "integer") {return false;}
        if (expr.sub[1].type != "integer") {return false;}
        
        a = expr.sub[0].val;
        b = expr.sub[0].val;
        
        return {
            target:
                {type:"plus",sub:[
                    {type:"integer",val:a},
                    {type:"integer",val:b}
                ]},
            replacement:
                {type:"integer",val:a+b},
            bidirectional: true
        }
    }
    
	return logic;
}