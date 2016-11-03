# Note of internal representation

## Module

### declaration

```
eval(module('moduleName [params]|moduleName/arity'
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

There will be another function `module_` to be the version that will return the module object.

examples:

`module('Functor a', function(a){ ... })`
==
`module('Functor/1', function(a){ ... })`
==
`'var Functor = .../*internal representation of the module*/;'`


`module('dummy', function(){ ... })`
==
`module('dummy/0, function(){ ... })`


`module('Monad (a : Applicative b)', function(a){ ... })`
==
`module('Monad/1', function(a){ ... })`


### exporting

`exporting(x,y)({ z : z1 })`
==
`{x : x, y : y, z : z1}`

### open

eval(open(/*module*/, [/*options*/]))

`options` informs whether some items in the module will be renamed or hidden, 
or opening some items specifically. If it's not declared, 
then all the elements inside will be opened; if this part contains
only renaming information, then it does the same. 
When there are conflicting options, the later one will be taken as the case.

The `open` function return a string like `var k = m.k;` to expose the symbols 
in the module to the current scope.


example:

`eval(open(ListUtils, 'fold, map, Cons as c, Nil as n, -reverse'))`
==
`eval(open(ListUtils, ['fold', 'map', ['Cons','c'], ['Nil','c']]))`
==
`eval('var fold = ListUtils.fold; ...; var c = ListUtils.Cons;')`



## Record

### Declaration

`record()`

## Data, Codata

## Function, pattern matching

- no currying



* declaration string -> process of turning declaration to the context of module declaration

```
example decl intermediate data
var declList = { decltype : "data"
  , typename : "List"
  , constructors : [["nil",0], ["cons",2]]
}
var declM = { decltype : "open"
, quantifier : "M" //"" for no quantifier
, contents : {f1:5, f2:10, f3:15}
, use : ["f2","f3"]
, hides : ["f1"]
, renaming : [['f3','g3']]
}
var declR = { decltype : "record"
, recordname : "R"
, fields : ["f1","f2"]
}
```


* context representation of declarations

  + data
    - typename(e.g., `List`): `List` support the `exporting` function to work. (`List = {intermediateDatatype:"data", constructors:[["Cons",Cons], ["Nil",Nil]]}`).

    - constructor(e.g., `Cons`,`Nil`): constructors are functions, making objects:`{fromConstructor:Cons, args:[x,xs]}`, constructors have a field `constructorName` record the constructor's name in string.

    - constructor with arity=0, itself is {fromConstructor:null, args:..., constructorName:...}

  + open
    - just open things in the module. btw, a module is like `{_exported:['f1','f2'], f1:..., f2:... }`
  + record
    - a record is a constructor constains fields: `{intermediateDatatype:"record", getters:["f1","f2"]}`, this is also for the `exporting` function.



* function body(with altered context)

  + add `eval(_ctx)` at the begining of the function body
  + use `module('mod/0',fb('exp1;exp2;exp3;'))`, `lam('pattern', fb('...'))`, case(x,y)('pattern', fb('...'))or `lam('pattern -> exp1;exp2')`









