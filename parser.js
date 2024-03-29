allparser = /*
 * Generated by PEG.js 0.10.0.
 *
 * http://pegjs.org/
 */
(function() {
  "use strict";

  function peg$subclass(child, parent) {
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
  }

  function peg$SyntaxError(message, expected, found, location) {
    this.message  = message;
    this.expected = expected;
    this.found    = found;
    this.location = location;
    this.name     = "SyntaxError";

    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, peg$SyntaxError);
    }
  }

  peg$subclass(peg$SyntaxError, Error);

  peg$SyntaxError.buildMessage = function(expected, found) {
    var DESCRIBE_EXPECTATION_FNS = {
          literal: function(expectation) {
            return "\"" + literalEscape(expectation.text) + "\"";
          },

          "class": function(expectation) {
            var escapedParts = "",
                i;

            for (i = 0; i < expectation.parts.length; i++) {
              escapedParts += expectation.parts[i] instanceof Array
                ? classEscape(expectation.parts[i][0]) + "-" + classEscape(expectation.parts[i][1])
                : classEscape(expectation.parts[i]);
            }

            return "[" + (expectation.inverted ? "^" : "") + escapedParts + "]";
          },

          any: function(expectation) {
            return "any character";
          },

          end: function(expectation) {
            return "end of input";
          },

          other: function(expectation) {
            return expectation.description;
          }
        };

    function hex(ch) {
      return ch.charCodeAt(0).toString(16).toUpperCase();
    }

    function literalEscape(s) {
      return s
        .replace(/\\/g, '\\\\')
        .replace(/"/g,  '\\"')
        .replace(/\0/g, '\\0')
        .replace(/\t/g, '\\t')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/[\x00-\x0F]/g,          function(ch) { return '\\x0' + hex(ch); })
        .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return '\\x'  + hex(ch); });
    }

    function classEscape(s) {
      return s
        .replace(/\\/g, '\\\\')
        .replace(/\]/g, '\\]')
        .replace(/\^/g, '\\^')
        .replace(/-/g,  '\\-')
        .replace(/\0/g, '\\0')
        .replace(/\t/g, '\\t')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/[\x00-\x0F]/g,          function(ch) { return '\\x0' + hex(ch); })
        .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return '\\x'  + hex(ch); });
    }

    function describeExpectation(expectation) {
      return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
    }

    function describeExpected(expected) {
      var descriptions = new Array(expected.length),
          i, j;

      for (i = 0; i < expected.length; i++) {
        descriptions[i] = describeExpectation(expected[i]);
      }

      descriptions.sort();

      if (descriptions.length > 0) {
        for (i = 1, j = 1; i < descriptions.length; i++) {
          if (descriptions[i - 1] !== descriptions[i]) {
            descriptions[j] = descriptions[i];
            j++;
          }
        }
        descriptions.length = j;
      }

      switch (descriptions.length) {
        case 1:
          return descriptions[0];

        case 2:
          return descriptions[0] + " or " + descriptions[1];

        default:
          return descriptions.slice(0, -1).join(", ")
            + ", or "
            + descriptions[descriptions.length - 1];
      }
    }

    function describeFound(found) {
      return found ? "\"" + literalEscape(found) + "\"" : "end of input";
    }

    return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
  };

  function peg$parse(input, options) {
    options = options !== void 0 ? options : {};

    var peg$FAILED = {},

        peg$startRuleIndices = 
          { WholePattern: 0
          , CodataDecl: 12
          , RecordDecl: 13
          , DataDecl: 15
          , ModuleDecl: 20
          , Type: 22
          },
        peg$startRuleIndex   = 0,

        peg$consts = [
          function(ps) {return new WholePattern(ps)},
          function(cp) {return new WholePattern(cp)},
          function(p, ps) {ps.unshift(p); return ps},
          peg$anyExpectation(),
          function() {return []},
          function(n) {return new IPattern(n)},
          function(s) {return new IPattern(s)},
          "(",
          peg$literalExpectation("(", false),
          "@",
          peg$literalExpectation("@", false),
          "*",
          peg$literalExpectation("*", false),
          ")",
          peg$literalExpectation(")", false),
          function(c, ps) {
          			  if(ps.length == 0){
                          return c.text=='_' ? new IPattern(insDontCare) : new IPattern(c);
                        }else{
                          return new IPattern(new IntroFormPattern(c, ps));
                        }
          			},
          ",",
          peg$literalExpectation(",", false),
          function(p, ps) {
                   	  ps.unshift(p);
                   	  return new IPattern(new Tuple(ps.length,ps))
                      },
          ":",
          peg$literalExpectation(":", false),
          function(ph, ps) {
                   	    var pt = ps[ps.length-1];
                          for(var i=ps.length-2; i>=0; i--){
                            pt = new IPattern(new ConsPattern(ps[i], pt));
                          }
                        return new IPattern(new ConsPattern(ph,pt))
                      },
          function(p) {return p},
          "[]",
          peg$literalExpectation("[]", false),
          function() {return new IPattern(insNilPattern)},
          "[",
          peg$literalExpectation("[", false),
          "]",
          peg$literalExpectation("]", false),
          function(ps) {return new IPattern(ps)},
          "{",
          peg$literalExpectation("{", false),
          "|",
          peg$literalExpectation("|", false),
          "}",
          peg$literalExpectation("}", false),
          function(ln, rn, r) {
                       return new IPattern(
                         new RecordPattern( ln==null? [] : [ln[0]]
          								, rn==null? [] : [rn[0].text=='_'?insDontCare:rn[0]]
          								, r));
                     },
          function(v) {return new IPattern(v); },
          /^[ \t\n\r]/,
          peg$classExpectation([" ", "\t", "\n", "\r"], false, false),
          function(ps) {return ps},
          function(p, ps) {ps.unshift(p);return ps},
          /^[)\]]/,
          peg$classExpectation([")", "]"], false, false),
          "=",
          peg$literalExpectation("=", false),
          function(k, p, rps) {
          			  rps.unshift([k,p]);
                        return rps;
                      },
          function(rps) {return rps},
          function(o) {
          			return new CPattern(o.text=='_'? insDontCare : o ,[])},
          function(o, ps) {
                       return new CPattern(o.text=='_'? insDontCare : o , ps)
                     },
          function(n, ps, t, r) {
          			var obsvs = [];
                      for(var i=0;i<r.type.keytypes.length;i++){
                        obsvs.push(new Observer(r.type.keytypes[i][0], r.type.keytypes[i][1]));
                      }
          			return new Codata(n,ps,t,obsvs);
          			},
          function(n, ps, t, cnstr, r) {
                   if(cnstr===null){
                           return new Record(n,ps,t,r.type.keytypes,false);
                         }else{
                           return new Record(n,ps,t,r.type.keytypes,true,cnstr)
                         }      
                       },
          function(n, ps) {
                    	  var x = new ParamType(false,n,new Type(insDontCare));
                        ps.unshift(x);
                        return ps;
                      },
          function(p, ps) {
                       ps.unshift(p.type)
                       return ps;
                      },
          function(l, r) {return new Data(l[0],l[1],l[2],r);},
          function(n, ps, t) {return [n,ps,t];},
          function(p, ps) {
                          ps.unshift(p);
                          return ps;
                        },
          function(cs) {return cs},
          function(c, ct) {return [new Constructor(c,ct)];},
          function(c, ct, cs) {
                           cs.unshift(new Constructor(c,ct))
                           return cs;
                         },
          function(n, ts) {return {name : n, params:ts}},
          function() {return [];},
          function(n, ts) {
                    	  var x = new Type(new ParamType(false,n,new Type(insDontCare)));
                        ts.unshift(x);
                        return ts;
                      },
          function(t, ts) {
                       ts.unshift(t)
                       return ts;
                      },
          "->",
          peg$literalExpectation("->", false),
          function(st) {return st;},
          function(st, t) {return new Type(new ArrowType(st,t))},
          function(ps, t) {
          		if(ps.type.constructor === ArrowType){
          		  var last = lastArrowOfChain(ps.type);
          		  last.righttype = new Type(new ArrowType(last.righttype, t));
                    return ps;
                  }else{
                    return new Type(new ArrowType(ps,t));
                  }},
          function(st, t) {return new Type(new ArrowType(st,t));},
          function(p) { return p },
          function(p, ps) { return new Type(new ArrowType(p,ps)) },
          function(n, t) { 
          		   return new Type(new ParamType(false,n,t))
                  },
          function(n, t) { 
              	  return new Type(new ParamType(true,n,t))
                  },
          function(p) { return p; },
          "-",
          peg$literalExpectation("-", false),
          function(t) { return new Type(new SubType(t)); },
          "+",
          peg$literalExpectation("+", false),
          function(t) { return new Type(new SupType(t)); },
          function(t, ts) {
                       ts.unshift(t);
                       return new Type(new Tuple(ts.length,ts));
                     },
          function(t) {return t;},
          function(r) {return r;},
          function(t) {return new Type(new ListType(t));},
          function(c, args) {
                       return new Type(new ComposeType(c,args));
                     },
          function(n) { 
                   	if(n.text == '_'){
                        return new Type(insDontCare);
                      }else{
                   	  return new Type(n); 
                      }},
          function(s) {return [s]},
          function(s, ss) {
                        ss.unshift(s);
                        return ss;
                      },
          /^[^=([{ \t\n\r)\]}\-:,]/,
          peg$classExpectation(["=", "(", "[", "{", " ", "\t", "\n", "\r", ")", "]", "}", "-", ":", ","], true, false),
          function(s, ls) {
          				var res = s.join('')+ls;
          				return res;},
          /^[= \t\n\r)\]}\-:,]/,
          peg$classExpectation(["=", " ", "\t", "\n", "\r", ")", "]", "}", "-", ":", ","], false, false),
          function() {return ""},
          /^[([{]/,
          peg$classExpectation(["(", "[", "{"], false, false),
          /^[)\]}]/,
          peg$classExpectation([")", "]", "}"], false, false),
          function(ls) {return m+rp+ls},
          function(r) {return '('+r;},
          function(r) {return '['+r;},
          function(cb, r) {return cb+r;},
          /^[^)(]/,
          peg$classExpectation([")", "("], true, false),
          function(any, i, b) {return any.join('')+i+')'+b},
          function(any) {return any.join('')},
          /^[^\][]/,
          peg$classExpectation(["]", "["], true, false),
          function(any, i, b) {return any.join('')+i+']'+b},
          /^[^}{]/,
          peg$classExpectation(["}", "{"], true, false),
          function(any, i, rcb, b) {return any.join('')+i+rcb+b},
          function(t) { return [t]; },
          function(t, ts) {
                        ts.unshift(t);
                        return ts;
                      },
          function(lf) { return new Type(new RecordType(lf))},
          function(n, t) { return [[n,t]];},
          function(n, t, lf) {
                     		lf.unshift([n,t]);
                          return lf;
                       },
          peg$otherExpectation("whitespace"),
          /^[a-zA-Z_$]/,
          peg$classExpectation([["a", "z"], ["A", "Z"], "_", "$"], false, false),
          /^[a-zA-Z0-9_$]/,
          peg$classExpectation([["a", "z"], ["A", "Z"], ["0", "9"], "_", "$"], false, false),
          function(n) { return new Name(n[0]+n[1].join('')) },
          /^[0-9]/,
          peg$classExpectation([["0", "9"]], false, false),
          function(n) { return Number(n.join('')); },
          /^[^=`~!@#%\^&*\-+,.<>\/?|\\)}\]:;]/,
          peg$classExpectation(["=", "`", "~", "!", "@", "#", "%", "^", "&", "*", "-", "+", ",", ".", "<", ">", "/", "?", "|", "\\", ")", "}", "]", ":", ";"], true, false),
          /^[=`~!@#%\^&*\-+,.<>\/?|\\)}\]:;]/,
          peg$classExpectation(["=", "`", "~", "!", "@", "#", "%", "^", "&", "*", "-", "+", ",", ".", "<", ">", "/", "?", "|", "\\", ")", "}", "]", ":", ";"], false, false),
          "\"",
          peg$literalExpectation("\"", false),
          /^[^"]/,
          peg$classExpectation(["\""], true, false),
          function(s) {return s.join('')},
          "'",
          peg$literalExpectation("'", false),
          /^[^']/,
          peg$classExpectation(["'"], true, false)
        ],

        peg$bytecode = [
          peg$decode("%;!/' 8!: !! )./ &%;+/' 8!:!!! )"),
          peg$decode("%;#/;#;E/2$;\"/)$8#:\"#\"\" )(#'#(\"'#&'#"),
          peg$decode("%%<1\"\"5!7#=.##&&!&'#./ &%<;I=/##&'!&&#/& 8!:$! ).E &%;#/;#;E/2$;\"/)$8#:\"#\"\" )(#'#(\"'#&'#"),
          peg$decode("%;G/' 8!:%!! ).\u0307 &%;J/' 8!:&!! ).\u02F5 &%2'\"\"6'7(/\xA2#;E/\x99$;F/\x90$%<%;E/J#%<2)\"\"6)7*.) &2+\"\"6+7,=.##&&!&'#/#$+\")(\"'#&'#=/##&'!&&#/J$;$/A$;E/8$2-\"\"6-7./)$8':/'\"$\")(''#(&'#(%'#($'#(#'#(\"'#&'#.\u0260 &%2'\"\"6'7(/t#;E/k$;#/b$;E/Y$20\"\"6071/J$;E/A$;'/8$2-\"\"6-7./)$8(:2(\"%!)(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.\u01F9 &%2'\"\"6'7(/}#;E/t$;#/k$;E/b$23\"\"6374/S$;E/J$;%/A$;E/8$2-\"\"6-7./)$8):5)\"&\")()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.\u0189 &%2'\"\"6'7(/R#;E/I$;#/@$;E/7$2-\"\"6-7./($8%:6%!\")(%'#($'#(#'#(\"'#&'#.\u0144 &%27\"\"6778/& 8!:9! ).\u012D &%2:\"\"6:7;/R#;E/I$;'/@$;E/7$2<\"\"6<7=/($8%:>%!\")(%'#($'#(#'#(\"'#&'#.\xE8 &%%;F/D#;E/;$2)\"\"6)7*/,$;E/#$+$)($'#(#'#(\"'#&'#.\" &\"/\x9C#2?\"\"6?7@/\x8D$;E/\x84$%;F/;#;E/2$2A\"\"6A7B/#$+#)(#'#(\"'#&'#.\" &\"/T$;E/K$;)/B$;E/9$2C\"\"6C7D/*$8(:E(#'$\")(('#(''#(&'#(%'#($'#(#'#(\"'#&'#./ &%;F/' 8!:F!! )"),
          peg$decode("%%<%;E/O#%<1\"\"5!7#=.##&&!&'#./ &%<;I=/##&'!&&#/#$+\")(\"'#&'#=/##&'!&&#/& 8!:$! ).T &%$4G\"\"5!7H/,#0)*4G\"\"5!7H&&&#/1#;!/($8\":I\"! )(\"'#&'#"),
          peg$decode("%;#/;#;E/2$;&/)$8#:J#\"\" )(#'#(\"'#&'#"),
          peg$decode("%23\"\"6374/1#;%/($8\":I\"! )(\"'#&'#.@ &%%<2-\"\"6-7.=/##&'!&&#/& 8!:$! )"),
          peg$decode("%;#/;#;E/2$;(/)$8#:\"#\"\" )(#'#(\"'#&'#"),
          peg$decode("%20\"\"6071/:#;E/1$;'/($8#:I#! )(#'#(\"'#&'#.@ &%%<4K\"\"5!7L=/##&'!&&#/& 8!:$! )"),
          peg$decode("%;F/f#;E/]$2M\"\"6M7N/N$;E/E$;#/<$;E/3$;*/*$8':O'#&\" )(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%%<2C\"\"6C7D=/##&'!&&#/& 8!:$! ).J &%20\"\"6071/:#;E/1$;)/($8#:P#! )(#'#(\"'#&'#"),
          peg$decode("%;F/@#;E/7$2+\"\"6+7,/($8#:Q#!\")(#'#(\"'#&'#.\x8D &%;F/\x83#;E/z$2'\"\"6'7(/k$;E/b$2+\"\"6+7,/S$;E/J$;!/A$;E/8$2-\"\"6-7./)$8):R)\"(\")()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;F/\x91#;E/\x88$;./\x7F$;E/v$23\"\"6374/g$;E/^$;6/U$;E/L$2M\"\"6M7N/=$;E/4$;C/+$8+:S+$*($ )(+'#(*'#()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;F/\xA9#;E/\xA0$;./\x97$;E/\x8E$23\"\"6374/\x7F$;E/v$;6/m$;E/d$2M\"\"6M7N/U$;E/L$;F.\" &\"/>$;E/5$;C/,$8-:T-%,*&\" )(-'#(,'#(+'#(*'#()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%%<23\"\"6374=/##&'!&&#/& 8!:$! ).m &%;F/;#;E/2$;./)$8#:U#\"\" )(#'#(\"'#&'#.E &%;9/;#;E/2$;./)$8#:V#\"\" )(#'#(\"'#&'#"),
          peg$decode("%;0/S#;E/J$2M\"\"6M7N/;$;E/2$;2/)$8%:W%\"$ )(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;F/o#;E/f$;./]$;E/T$23\"\"6374/E$;E/<$;6/3$;E/*$8(:X(#'%!)(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%%<%;E/2#23\"\"6374/#$+\")(\"'#&'#=/##&'!&&#/& 8!:$! ).E &%;9/;#;E/2$;1/)$8#:Y#\"\" )(#'#(\"'#&'#"),
          peg$decode("%%<1\"\"5!7#=.##&&!&'#/& 8!:$! )./ &%;3/' 8!:Z!! )"),
          peg$decode("%;F/v#;E/m$23\"\"6374/^$;E/U$;6/L$;E/C$%<1\"\"5!7#=.##&&!&'#/)$8':['\"&\")(''#(&'#(%'#($'#(#'#(\"'#&'#.\x88 &%;F/~#;E/u$23\"\"6374/f$;E/]$;6/T$;E/K$2A\"\"6A7B/<$;E/3$;3/*$8):\\)#($ )()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;F/;#;E/2$;5/)$8#:]#\"\" )(#'#(\"'#&'#"),
          peg$decode("%%<1\"\"5!7#=.##&&!&'#/& 8!:^! ).m &%;F/;#;E/2$;5/)$8#:_#\"\" )(#'#(\"'#&'#.E &%;9/;#;E/2$;5/)$8#:`#\"\" )(#'#(\"'#&'#"),
          peg$decode("%;:/L#;E/C$%<2a\"\"6a7b=.##&&!&'#/($8#:c#!\")(#'#(\"'#&'#.\x9D &%;:/S#;E/J$2a\"\"6a7b/;$;E/2$;7/)$8%:d%\"$ )(%'#($'#(#'#(\"'#&'#.] &%;8/S#;E/J$2a\"\"6a7b/;$;E/2$;7/)$8%:e%\"$ )(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;:/L#;E/C$%<2a\"\"6a7b=.##&&!&'#/($8#:c#!\")(#'#(\"'#&'#.] &%;:/S#;E/J$2a\"\"6a7b/;$;E/2$;7/)$8%:f%\"$ )(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;9/V#%<%;E/2#2a\"\"6a7b/#$+\")(\"'#&'#=/##&'!&&#/($8\":g\"!!)(\"'#&'#.E &%;9/;#;E/2$;8/)$8#:h#\"\" )(#'#(\"'#&'#"),
          peg$decode("%2'\"\"6'7(/t#;E/k$;F/b$;E/Y$23\"\"6374/J$;E/A$;6/8$2-\"\"6-7./)$8(:i(\"%!)(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.\x84 &%2?\"\"6?7@/t#;E/k$;F/b$;E/Y$23\"\"6374/J$;E/A$;6/8$2C\"\"6C7D/)$8(:j(\"%!)(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;9/' 8!:k!! ).\u01D6 &%2l\"\"6l7m/:#;E/1$;7/($8#:n#! )(#'#(\"'#&'#.\u01A9 &%2o\"\"6o7p/:#;E/1$;7/($8#:q#! )(#'#(\"'#&'#.\u017C &%2'\"\"6'7(/}#;E/t$;6/k$;E/b$20\"\"6071/S$;E/J$;B/A$;E/8$2-\"\"6-7./)$8):r)\"&\")()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.\u010C &%2'\"\"6'7(/R#;E/I$;6/@$;E/7$2-\"\"6-7./($8%:s%!\")(%'#($'#(#'#(\"'#&'#.\xC7 &%;C/' 8!:t!! ).\xB5 &%2:\"\"6:7;/R#;E/I$;6/@$;E/7$2<\"\"6<7=/($8%:u%!\")(%'#($'#(#'#(\"'#&'#.p &%;F/T#$4G\"\"5!7H/,#0)*4G\"\"5!7H&&&#/2$;;/)$8#:v#\"\" )(#'#(\"'#&'#./ &%;F/' 8!:w!! )"),
          peg$decode("%;</g#%<%;E/C#%<1\"\"5!7#=.##&&!&'#.# &;I/#$+\")(\"'#&'#=/##&'!&&#/($8\":x\"!!)(\"'#&'#.^ &%;</T#$4G\"\"5!7H/,#0)*4G\"\"5!7H&&&#/2$;;/)$8#:y#\"\" )(#'#(\"'#&'#"),
          peg$decode("%%<;H=/##&'!&&#/T#$4z\"\"5!7{/,#0)*4z\"\"5!7{&&&#/2$;=/)$8#:|#\"! )(#'#(\"'#&'#"),
          peg$decode("%%<1\"\"5!7#=.##&&!&'#.5 &%<4}\"\"5!7~=/##&'!&&#/& 8!:\x7F! ).o &%%%<4\x80\"\"5!7\x81=/##&'!&&#/;#;>/2$4\x82\"\"5!7\x83/#$+#)(#'#(\"'#&'#/1#;</($8\":\x84\"! )(\"'#&'#"),
          peg$decode("%2'\"\"6'7(/1#;?/($8\":\x85\"! )(\"'#&'#.f &%2:\"\"6:7;/1#;@/($8\":\x86\"! )(\"'#&'#.B &%2?\"\"6?7@/2#;A/)$8\":\x87\"\"! )(\"'#&'#"),
          peg$decode("%$4\x88\"\"5!7\x890)*4\x88\"\"5!7\x89&/f#%<4\x80\"\"5!7\x81=/##&'!&&#/K$;>/B$2-\"\"6-7./3$;?/*$8%:\x8A%#$\" )(%'#($'#(#'#(\"'#&'#.` &%$4\x88\"\"5!7\x890)*4\x88\"\"5!7\x89&/C#%<2-\"\"6-7.=/##&'!&&#/($8\":\x8B\"!!)(\"'#&'#"),
          peg$decode("%$4\x8C\"\"5!7\x8D0)*4\x8C\"\"5!7\x8D&/f#%<4\x80\"\"5!7\x81=/##&'!&&#/K$;>/B$2<\"\"6<7=/3$;@/*$8%:\x8E%#$\" )(%'#($'#(#'#(\"'#&'#.` &%$4\x8C\"\"5!7\x8D0)*4\x8C\"\"5!7\x8D&/C#%<2-\"\"6-7.=/##&'!&&#/($8\":\x8B\"!!)(\"'#&'#"),
          peg$decode("%$4\x8F\"\"5!7\x900)*4\x8F\"\"5!7\x90&/g#%<4\x80\"\"5!7\x81=/##&'!&&#/L$;>/C$2C\"\"6C7D/4$;A/+$8%:\x91%$$\"! )(%'#($'#(#'#(\"'#&'#.` &%$4\x8F\"\"5!7\x900)*4\x8F\"\"5!7\x90&/C#%<2-\"\"6-7.=/##&'!&&#/($8\":\x8B\"!!)(\"'#&'#"),
          peg$decode("%;6/V#%<%;E/2#2-\"\"6-7./#$+\")(\"'#&'#=/##&'!&&#/($8\":\x92\"!!)(\"'#&'#.] &%;6/S#;E/J$20\"\"6071/;$;E/2$;B/)$8%:\x93%\"$ )(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%2?\"\"6?7@/R#;E/I$;D/@$;E/7$2C\"\"6C7D/($8%:\x94%!\")(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;F/\x81#;E/x$23\"\"6374/i$;E/`$;6/W$%<%;E/2#2C\"\"6C7D/#$+\")(\"'#&'#=/##&'!&&#/)$8&:\x95&\"%!)(&'#(%'#($'#(#'#(\"'#&'#.\x91 &%;E/\x87#;F/~$;E/u$23\"\"6374/f$;E/]$;6/T$;E/K$20\"\"6071/<$;E/3$;D/*$8*:\x96*#($ )(*'#()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("<$4G\"\"5!7H0)*4G\"\"5!7H&=.\" 7\x97"),
          peg$decode("%%4\x98\"\"5!7\x99/?#$4\x9A\"\"5!7\x9B0)*4\x9A\"\"5!7\x9B&/#$+\")(\"'#&'#/' 8!:\x9C!! )"),
          peg$decode("%$4\x9D\"\"5!7\x9E/,#0)*4\x9D\"\"5!7\x9E&&&#/' 8!:\x9F!! )"),
          peg$decode("4\xA0\"\"5!7\xA1"),
          peg$decode("4\xA2\"\"5!7\xA3"),
          peg$decode("%2\xA4\"\"6\xA47\xA5/S#$4\xA6\"\"5!7\xA70)*4\xA6\"\"5!7\xA7&/7$2\xA4\"\"6\xA47\xA5/($8#:\xA8#!!)(#'#(\"'#&'#.c &%2\xA9\"\"6\xA97\xAA/S#$4\xAB\"\"5!7\xAC0)*4\xAB\"\"5!7\xAC&/7$2\xA9\"\"6\xA97\xAA/($8#:\xA8#!!)(#'#(\"'#&'#")
        ],

        peg$currPos          = 0,
        peg$savedPos         = 0,
        peg$posDetailsCache  = [{ line: 1, column: 1 }],
        peg$maxFailPos       = 0,
        peg$maxFailExpected  = [],
        peg$silentFails      = 0,

        peg$resultsCache = {},

        peg$result;

    if ("startRule" in options) {
      if (!(options.startRule in peg$startRuleIndices)) {
        throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
      }

      peg$startRuleIndex = peg$startRuleIndices[options.startRule];
    }

    function text() {
      return input.substring(peg$savedPos, peg$currPos);
    }

    function location() {
      return peg$computeLocation(peg$savedPos, peg$currPos);
    }

    function expected(description, location) {
      location = location !== void 0 ? location : peg$computeLocation(peg$savedPos, peg$currPos)

      throw peg$buildStructuredError(
        [peg$otherExpectation(description)],
        input.substring(peg$savedPos, peg$currPos),
        location
      );
    }

    function error(message, location) {
      location = location !== void 0 ? location : peg$computeLocation(peg$savedPos, peg$currPos)

      throw peg$buildSimpleError(message, location);
    }

    function peg$literalExpectation(text, ignoreCase) {
      return { type: "literal", text: text, ignoreCase: ignoreCase };
    }

    function peg$classExpectation(parts, inverted, ignoreCase) {
      return { type: "class", parts: parts, inverted: inverted, ignoreCase: ignoreCase };
    }

    function peg$anyExpectation() {
      return { type: "any" };
    }

    function peg$endExpectation() {
      return { type: "end" };
    }

    function peg$otherExpectation(description) {
      return { type: "other", description: description };
    }

    function peg$computePosDetails(pos) {
      var details = peg$posDetailsCache[pos], p;

      if (details) {
        return details;
      } else {
        p = pos - 1;
        while (!peg$posDetailsCache[p]) {
          p--;
        }

        details = peg$posDetailsCache[p];
        details = {
          line:   details.line,
          column: details.column
        };

        while (p < pos) {
          if (input.charCodeAt(p) === 10) {
            details.line++;
            details.column = 1;
          } else {
            details.column++;
          }

          p++;
        }

        peg$posDetailsCache[pos] = details;
        return details;
      }
    }

    function peg$computeLocation(startPos, endPos) {
      var startPosDetails = peg$computePosDetails(startPos),
          endPosDetails   = peg$computePosDetails(endPos);

      return {
        start: {
          offset: startPos,
          line:   startPosDetails.line,
          column: startPosDetails.column
        },
        end: {
          offset: endPos,
          line:   endPosDetails.line,
          column: endPosDetails.column
        }
      };
    }

    function peg$fail(expected) {
      if (peg$currPos < peg$maxFailPos) { return; }

      if (peg$currPos > peg$maxFailPos) {
        peg$maxFailPos = peg$currPos;
        peg$maxFailExpected = [];
      }

      peg$maxFailExpected.push(expected);
    }

    function peg$buildSimpleError(message, location) {
      return new peg$SyntaxError(message, null, null, location);
    }

    function peg$buildStructuredError(expected, found, location) {
      return new peg$SyntaxError(
        peg$SyntaxError.buildMessage(expected, found),
        expected,
        found,
        location
      );
    }

    function peg$decode(s) {
      var bc = new Array(s.length), i;

      for (i = 0; i < s.length; i++) {
        bc[i] = s.charCodeAt(i) - 32;
      }

      return bc;
    }

    function peg$parseRule(index) {
      var bc    = peg$bytecode[index],
          ip    = 0,
          ips   = [],
          end   = bc.length,
          ends  = [],
          stack = [],
          params, i;

      var key    = peg$currPos * 43 + index,
          cached = peg$resultsCache[key];

      if (cached) {
        peg$currPos = cached.nextPos;

        return cached.result;
      }

      while (true) {
        while (ip < end) {
          switch (bc[ip]) {
            case 0:
              stack.push(peg$consts[bc[ip + 1]]);
              ip += 2;
              break;

            case 1:
              stack.push(void 0);
              ip++;
              break;

            case 2:
              stack.push(null);
              ip++;
              break;

            case 3:
              stack.push(peg$FAILED);
              ip++;
              break;

            case 4:
              stack.push([]);
              ip++;
              break;

            case 5:
              stack.push(peg$currPos);
              ip++;
              break;

            case 6:
              stack.pop();
              ip++;
              break;

            case 7:
              peg$currPos = stack.pop();
              ip++;
              break;

            case 8:
              stack.length -= bc[ip + 1];
              ip += 2;
              break;

            case 9:
              stack.splice(-2, 1);
              ip++;
              break;

            case 10:
              stack[stack.length - 2].push(stack.pop());
              ip++;
              break;

            case 11:
              stack.push(stack.splice(stack.length - bc[ip + 1], bc[ip + 1]));
              ip += 2;
              break;

            case 12:
              stack.push(input.substring(stack.pop(), peg$currPos));
              ip++;
              break;

            case 13:
              ends.push(end);
              ips.push(ip + 3 + bc[ip + 1] + bc[ip + 2]);

              if (stack[stack.length - 1]) {
                end = ip + 3 + bc[ip + 1];
                ip += 3;
              } else {
                end = ip + 3 + bc[ip + 1] + bc[ip + 2];
                ip += 3 + bc[ip + 1];
              }

              break;

            case 14:
              ends.push(end);
              ips.push(ip + 3 + bc[ip + 1] + bc[ip + 2]);

              if (stack[stack.length - 1] === peg$FAILED) {
                end = ip + 3 + bc[ip + 1];
                ip += 3;
              } else {
                end = ip + 3 + bc[ip + 1] + bc[ip + 2];
                ip += 3 + bc[ip + 1];
              }

              break;

            case 15:
              ends.push(end);
              ips.push(ip + 3 + bc[ip + 1] + bc[ip + 2]);

              if (stack[stack.length - 1] !== peg$FAILED) {
                end = ip + 3 + bc[ip + 1];
                ip += 3;
              } else {
                end = ip + 3 + bc[ip + 1] + bc[ip + 2];
                ip += 3 + bc[ip + 1];
              }

              break;

            case 16:
              if (stack[stack.length - 1] !== peg$FAILED) {
                ends.push(end);
                ips.push(ip);

                end = ip + 2 + bc[ip + 1];
                ip += 2;
              } else {
                ip += 2 + bc[ip + 1];
              }

              break;

            case 17:
              ends.push(end);
              ips.push(ip + 3 + bc[ip + 1] + bc[ip + 2]);

              if (input.length > peg$currPos) {
                end = ip + 3 + bc[ip + 1];
                ip += 3;
              } else {
                end = ip + 3 + bc[ip + 1] + bc[ip + 2];
                ip += 3 + bc[ip + 1];
              }

              break;

            case 18:
              ends.push(end);
              ips.push(ip + 4 + bc[ip + 2] + bc[ip + 3]);

              if (input.substr(peg$currPos, peg$consts[bc[ip + 1]].length) === peg$consts[bc[ip + 1]]) {
                end = ip + 4 + bc[ip + 2];
                ip += 4;
              } else {
                end = ip + 4 + bc[ip + 2] + bc[ip + 3];
                ip += 4 + bc[ip + 2];
              }

              break;

            case 19:
              ends.push(end);
              ips.push(ip + 4 + bc[ip + 2] + bc[ip + 3]);

              if (input.substr(peg$currPos, peg$consts[bc[ip + 1]].length).toLowerCase() === peg$consts[bc[ip + 1]]) {
                end = ip + 4 + bc[ip + 2];
                ip += 4;
              } else {
                end = ip + 4 + bc[ip + 2] + bc[ip + 3];
                ip += 4 + bc[ip + 2];
              }

              break;

            case 20:
              ends.push(end);
              ips.push(ip + 4 + bc[ip + 2] + bc[ip + 3]);

              if (peg$consts[bc[ip + 1]].test(input.charAt(peg$currPos))) {
                end = ip + 4 + bc[ip + 2];
                ip += 4;
              } else {
                end = ip + 4 + bc[ip + 2] + bc[ip + 3];
                ip += 4 + bc[ip + 2];
              }

              break;

            case 21:
              stack.push(input.substr(peg$currPos, bc[ip + 1]));
              peg$currPos += bc[ip + 1];
              ip += 2;
              break;

            case 22:
              stack.push(peg$consts[bc[ip + 1]]);
              peg$currPos += peg$consts[bc[ip + 1]].length;
              ip += 2;
              break;

            case 23:
              stack.push(peg$FAILED);
              if (peg$silentFails === 0) {
                peg$fail(peg$consts[bc[ip + 1]]);
              }
              ip += 2;
              break;

            case 24:
              peg$savedPos = stack[stack.length - 1 - bc[ip + 1]];
              ip += 2;
              break;

            case 25:
              peg$savedPos = peg$currPos;
              ip++;
              break;

            case 26:
              params = bc.slice(ip + 4, ip + 4 + bc[ip + 3]);
              for (i = 0; i < bc[ip + 3]; i++) {
                params[i] = stack[stack.length - 1 - params[i]];
              }

              stack.splice(
                stack.length - bc[ip + 2],
                bc[ip + 2],
                peg$consts[bc[ip + 1]].apply(null, params)
              );

              ip += 4 + bc[ip + 3];
              break;

            case 27:
              stack.push(peg$parseRule(bc[ip + 1]));
              ip += 2;
              break;

            case 28:
              peg$silentFails++;
              ip++;
              break;

            case 29:
              peg$silentFails--;
              ip++;
              break;

            default:
              throw new Error("Invalid opcode: " + bc[ip] + ".");
          }
        }

        if (ends.length > 0) {
          end = ends.pop();
          ip = ips.pop();
        } else {
          break;
        }
      }

      peg$resultsCache[key] = { nextPos: peg$currPos, result: stack[0] };

      return stack[0];
    }

    peg$result = peg$parseRule(peg$startRuleIndex);

    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
      return peg$result;
    } else {
      if (peg$result !== peg$FAILED && peg$currPos < input.length) {
        peg$fail(peg$endExpectation());
      }

      throw peg$buildStructuredError(
        peg$maxFailExpected,
        peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
        peg$maxFailPos < input.length
          ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
          : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
      );
    }
  }

  return {
    SyntaxError: peg$SyntaxError,
    parse:       peg$parse
  };
})();
