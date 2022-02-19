# Note of internal representation







## Module

### declaration

```
eval(evModule('moduleName [params]'
, function(args){
  ...
  return exporting(...)({...})
}))
```

In the first argument, `params` is a list of items seperated by spaces;
Regardless of the contents, Q.J.F. only counts the arity of the module.

`module` returns a string of declaration, by which creates a symbol points to 
an object with accessible items of the declared module, after evaluated by `eval`.
See more in section *exporting*.

There will be another function `module` to be the version that will return the module object.

examples:

1.
    evModule('Functor a', function(a){ ... })
    ≡
    evModule('Functor (a : A)', function(a){ ... })
    ≡
    'var Functor = .../*internal representation of the module*/;'


2.

    evModule('Monad (a : Applicative b)', function(a){ ... })
    ≡
    evModule('Monad a', function(a){ ... })


### exporting

    exporting('x, y')({ z : z1 })
    ≡
    {x : x, y : y, z : z1}

### open

`eval(evOpen(/*module*/, [/*options*/]))`

`options` informs whether some items in the module will be renamed or hidden, 
or opening some items specifically. If it's not declared, 
then all the elements inside will be opened; if this part contains
only renaming information, then it does the same. 
When there are conflicting options, the later one will be taken as the case.

The `evOpen` function return a string like `var k = m.k;` to expose the symbols 
in the module to the current scope.


example:

    eval(evOpen('ListUtils', 'fold, map, Cons as c, Nil as n, -reverse'))
    ≡
    eval(evOpen('ListUtils', ['fold', 'map', ['Cons','c'], ['Nil','c']]))
    ≡
    eval('var fold = ListUtils.fold; ...; var c = ListUtils.Cons;')


















## Record

### Declaration

`eval(evRecord('RecordName [params] = (?Name) {f1 : Type1, f2 : Type2 ...} '))`

There's also a version `record`.

### Construction

The delcaration defines a function `RecordName : Type1 -> Type2 ... -> RecordName`.
Or use javascript object instead: `{f1 : ..., f2 : ...} : RecordName`


ways of making a record instance:

  1. using the constructor
  2. using js object

examples:

1.
    evRecord('R1 : Set = {f1 : T1, f2 : T2}')
    ≡
    evRecord('R1 : Set = {f1, f2 : T2}')
    ≡
    evRecord('R1 = {f1, f2}')

2.
    evRecord('R2 (a : Set) (b : Nat) : Set 1 = {f3}')
    ≡
    evRecord('R2 a b : c = {f3}')


### Covariance & contravariance (Dynamic record)


    ABC < AB < A
    123 < 12 < 1

    ABC < AB, 123 < 12
    ------------------
    AB -> 123 < ABC -> 12












## Data, Codata

### Declaration

`eval(evData('DataName [params] = Cnstrs')` (see example)

`eval(evCodata( [same as record declaration] ))`

Same as module and record, there are `data` and `codata`.


examples:

    evData('List : Set -> Set = \
            Cons : {a : Set} -> a -> List a -> List a \
          | Nil : {a : Set} -> List a')
    ≡
    evData('List : _ -> _ = Cons : _ -> _ -> _ | Nil : _')



literal expressions:

    a,b xs=...
    eval(evle('(a,b) : xs'))
    =
    eval('Cons(Pair(a,b),xs)')

    le('(a,b) : xs')
    =
    Cons(Pair('a','b'), 'xs')


pattern matching assigning (unification):

    assign(le('[a,b,c]') , efg)
    =
    'var a = ...; var b = ...; var c = ...;'









## Function, pattern matching

- no currying
- 3 functions: func, case, REC

Where
`func([Arity, Type], patterns1, callback1, patterns2, callback2 ...)`
returns a function,
And
`case( Object, pattern1, callback1, pattern2, callback2 ...)`
returns the result.

`REC` is used in callbacks declared in `func` for recursive call.

examples:

1.
    var f1 = 
      func( "Int -> [Int] -> Int"
      , 'n []'     , function(n){
                      return n;}
      , 'n (x:xs)' , function(n,x,xs){
                      return REC(n+x,xs)}
      )
    ≡
    var f1 = 
      func( 2
      , 'n []'     , function(n){
                      return n;}
      , 'n (x:xs)' , function(n,x,xs){
                      return REC(n+x,xs)}
      )

2.
    function fromStream(s){
      return case( head(s)
      , '(Just a)' , function(a){return Cons(a, fromStream(tail(s)));}
      , 'Nothing'  , Nil
      )
    }

3. copattern
    var toStream = 
      func( "[a] -> Stream (Maybe a)"
      , '_ (* [])'        , Nothing
      , 'head (* (x:xs))' , function(x){return Just(x);}
      , 'tail (* (x:xs))' , _.compose(REC,id)
      )

4. record

    eval(record('R2/0 = {f1, f2}'))
    eval(record('R3/0 = {f1, f2, f3}'))
    var f1 = 
      func( "R -> A"
      , 'r@{f1 = x, f2 = y}', function(r,x,y){...}
      )

    var f2 =
      func( "-R2 -> A"
      , 'rec@{rest|f1 = x, f2 = y}' , function(r,rest,x,y){...}
      )
    //suppose instance of R3 is given, then rest = {f3 : ...}

    var splitting = function(x){
      return case(x
             , '{r | b = b, c = c1}' , function(r,b,c1){ return [r,{b:b,c:c1}]}
             )
      }














## Parsing

* No constraint on names.

`list(',','pat')` means accepting things like `'pat , pat , pat'`.


ModuleDecl := Name list(' ', Param)
DataDecl   := Name ':' Type '=' list('|', Name : Type )
CodataDecl := RecordDecl
RecordDecl := NameType '=' RecordTypeDecl

RecordTypeDecl := '{' list(',', Name ':' Type) '}'


Param  :=  '{' Name ':' Type '}'
        |  '(' Name ':' Type ')'


WholePattern := Patterns | CPattern

Patterns := list(' ', IPattern)

IPattern := '_'
         | Name                           (including variables and constructors)
         | Constructor Patterns           (introduction form)
         | '(' List(',', IPattern) ')'
         | '[' List(',', IPattern) ']'
         | '(' IPattern ')'
         | ?(Name '@') RecordPattern
         | IPattern ':' IPattern
         | []

RecordPattern := '{' ?((Name | '_') '|') list(',', Name '=' IPattern) '}'


CPattern :=
          | Observer '*'
          | Observer '(' '*' Patterns ')'
Observer := '_'
          | Name


Type := list(' ', Param) '->' Type_  
      | Param
      | '-' Type_
      | '+' Type_
      | '(' List(',', Type) ')'  
      | '(' Type ')'             
      | RecordTypeDecl           
      | '[' Type ']'             
      | Name
      | '_'              


Type_ := Param
      | Type_ '->' Type_
      | '-' Type_
      | '+' Type_
      | '(' List(',', Type) ')'  
      | '(' Type ')'             
      | RecordTypeDecl           
      | '[' Type ']'             
      | Name
      | '_'






