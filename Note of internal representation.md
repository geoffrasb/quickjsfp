# Note of internal representation

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





