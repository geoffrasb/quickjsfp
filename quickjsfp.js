//record/module system
/*
record R
  constructor C/n

mod1 = module( where
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

// eliminating types
/*
x : T1
t : T1 -> TX
t = ind( x
     , 'C1 x y . t1'
     , 'C2 . t2'
     )
functional reduction:
  f(x)
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
