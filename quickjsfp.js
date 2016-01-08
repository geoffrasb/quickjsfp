// to implement: module,exporting, lam, cases, lamcases
// function constructed by lam can either be curried or noncurried

function alterCtx(ctxs,f){
  //!ctxs is a list of objects

  var fstr = "(function(){\n";
  for(var i=0;i<ctxs.length;i++){
    for(var k in ctxs[i]){
      fstr += "var "+k+"=ctxs[\'"+i+"\'][\'"+k+"\'];\n";
    }
  }
  fstr += "return ("+f.toString()+");})()"
  return eval(fstr);
}


function curryfree(f){
  if(f._length == null){
    f['_length'] = f.length; }

  var F = function(){
    var thisF = arguments.callee;
    var restArity = thisF._length - arguments.length;
    if(restArity <=0){
      return f.apply(this,arguments);
    }else{
      var curArgs = [];
      for(var i in arguments){ curArgs.push(arguments[i]); }

      var nextF = function(){
        for(var i in arguments){ curArgs.push(arguments[i]); }
        return f.apply(this, curArgs);
      }
      nextF['_length'] = restArity;
      return curryFree(nextF);
    }
  }
  F['_length'] = f._length;
  return F;
}


function module(modname){
  //length of arguments should be at least one(modname),
  // then followed by numbers of data,module declaration,
  // then last the module body

  //!arguments checking

  var decls = arguments.slice(1,arguments.length);
  var modulebody = arguments[arguments.length-1];

  var contexts = decls.map(parseDecl); 
  //a context :: a table of symbol to be used in the module body

 return alterCtx(contexts, modulebody)


}

//record/module system
/*

mod1 = module( 'mod1/2'
,' data T1 = C1/0 | C2/0'
,' open modx (as M) using () | hiding () | renaming ()'
,' data T2 = C3/1 | C4/2'
, function (arg1,opr1){

  privateFunc = ...

  return 
    exporting(T1,T2)({
    t1 : term1
    t2 : term2
  })
})


*/


//core types: data(constructed by),function(arity)
//simple check: function arity check
// pattern matching handling
// introducing types
/*
function def
in string:
lam(`\\ x y . t `) , can do single case pattern matching
same as
function(x,y){return t;}
note that
`\\ x y . t` =! `\\ x . \\ y . t`

lamCases([ 'Case1 . t1'
       , 'Case2 . t2'
       ])
cases( x , y,
   ['(Pr a b) (Cns h t) . t1'
   ,'(Pr a b) _ . t2'
   ])

*/



// composition
/* f : a -> b
   g : b -> c
   h : a -> b -> c
   x : a

   f(x)
   h(f(x))
   g(f(x))
*/


/* example
D('List = Cons 2 | Nil 0')
length = lamInd( 'Cons x xs . 1 + length(xs)'
               , 'Nil . 0'
               )
*/
