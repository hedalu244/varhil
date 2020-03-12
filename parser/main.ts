type Token = {
  literal: string,
  tokenType: "create_definite" | "inherit_definite" | "terminate_definite",
  character: string
} | {
  literal: string,
  tokenType: "predicate",
  name: string
} | {
  literal: string,
  tokenType: "relative" | "preposition",
  casus: string
} | {
  literal: string,
  tokenType: "indefinite" | "single_negation" | "open_negation" | "close_negation" | "open_sentence" | "close_sentence"
};

//字句解析
let separatorPattern: RegExp;

let isIndefinite: (literal :string)=>boolean;

let isCreateDefinite: (literal :string)=>boolean;
let createDefiniteToCharacter: (literal :string)=>string;

let isInheritDefinite: (literal :string)=>boolean;
let inheritDefiniteToCharacter: (literal :string)=>string;

let isTerminateDefinite: (literal :string)=>boolean;
let terminateDefiniteToCharacter: (literal :string)=>string;

let isPredicate: (literal :string)=>boolean;
let predicateToName: (literal :string)=>string;

let isRelative: (literal :string)=>boolean;
let relativeToCasus: (literal :string)=>string;

let isPreposition: (literal :string)=>boolean;
let prepositionToCasus: (literal :string)=>string;

let isSingleNegation: (literal :string)=>boolean;
let isOpenNegation: (literal :string)=>boolean;
let isCloseNegation: (literal :string)=>boolean;

//トークン単位に分割し、必要な情報を付加する
function tokenize(input: string): Token[] {
  const literals = input.split(separatorPattern).filter(x=>x!=="");

  const tokens: Token[] = literals.map(literal => {
    if (isIndefinite(literal))
      return { literal, tokenType: "indefinite"};
    if (isCreateDefinite(literal))
      return { literal, tokenType: "create_definite", character: createDefiniteToCharacter(literal)};
    if (isInheritDefinite(literal))
      return { literal, tokenType: "inherit_definite",  character: inheritDefiniteToCharacter(literal) };
    if (isTerminateDefinite(literal))
      return { literal, tokenType: "terminate_definite", character: terminateDefiniteToCharacter(literal) };
    if (isPredicate(literal))
      return { literal, tokenType: "predicate", name: predicateToName(literal) };
    if (isRelative(literal))
      return { literal, tokenType: "relative", casus: relativeToCasus(literal) };
    if (isPreposition(literal))
      return { literal, tokenType: "preposition", casus: prepositionToCasus(literal) };
    if (isSingleNegation(literal))
      return { literal, tokenType: "single_negation" };
    if (isOpenNegation(literal))
      return { literal, tokenType: "open_negation" };
    if (isCloseNegation(literal))
      return { literal, tokenType: "close_negation" };
    throw new Error("TokenizeError: word " + literal + " can't be classificated");
  });

  tokens.unshift({
    tokenType:"open_sentence",
    literal: "_SoI_",
  });

  tokens.push({
    tokenType: "close_sentence",
    literal: "_EoI_"
  });
  return tokens;
}

//構文解析
interface Tree {
  token: Token,
  children: Tree[]
}
type Arity = number | "(" | ")";
// ポーランド記法を解く
function parse(tokens: Token[]): Tree {
  const token = tokens.shift();
  if (token === undefined) throw new Error("ParseError: Unxpected End of Tokens");

  const arity = getArity(token);
  if (arity === ")") throw new Error("ParseError: Unxpected Token " + token.literal);

  const children: Tree[] = [];
  if (arity === "(") {
    while (true) {
      const next: Token = tokens[0];
      if (next === undefined) throw new Error("ParseError: Unxpected End of Tokens");
      if (getArity(next) === ")") {
        if(token.tokenType === "open_negation" && next.tokenType === "close_negation"
        || token.tokenType === "open_sentence" && next.tokenType === "close_sentence") {
          tokens.shift();
          break;
        }
        throw new Error("ParseError: Unxpected Token " + next.literal);
      }
      children.push(parse(tokens));
    }
  }
  else {
    for(let i = 0; i < arity; i++)
      children.push(parse(tokens));
  }
  return {token: token, children: children};

  function getArity(token: Token): Arity {
    switch(token.tokenType) {
      case "create_definite": return 0;
      case "inherit_definite": return 0;
      case "terminate_definite": return 0;
      case "indefinite": return 0;
      case "predicate": return 0;
      case "relative": return 2;
      case "preposition": return 2;
      case "single_negation": return 1;
      case "open_negation": return "(";
      case "close_negation": return ")";
      case "open_sentence": return "(";
      case "close_sentence": return ")";
    }
  }
}

//意味解析
interface Variable {
  name: string;
}
interface Predicate {
  formulaType: "predicate";
  subgraphType: "predicate";
  name: string;
  args: {casus:string, variable:Variable}[];
}
interface Cut {
  subgraphType: "cut";
  content: Graph;
}
type SubGraph = Predicate | Cut;
interface Graph {
  children: SubGraph[];
  usings: Variable[];
}

interface Value {
  graph: Graph,
  mainVariable: Variable | undefined,
  mainPredicate: Predicate | undefined
};
interface NounValue extends Value {
  mainVariable: Variable
}
interface PredicateValue extends Value {
  mainPredicate: Predicate
}

function calculate(tree: Tree): Graph {
  const variableTable: { [key: string]: Variable } = {};
  let variableCount: number = 0;

  function issueVariable(): Variable { return {name: "" + variableCount++ }; }

  function Predicate(name: string, args: {casus:string, variable:Variable}[]): Predicate {
    return {
      formulaType: "predicate",
      subgraphType: "predicate",
      name,
      args
    };
  }
  function cut(graph: Graph): Graph{
    return {
      children: [{
        subgraphType: "cut",
        content: graph
      }],
      usings: graph.usings
    };
  }
  function merge(a:Graph, b:Graph): Graph {
    return {
      children: [...a.children, ...b.children],
      usings: [...a.usings, ...b.usings]
    }
  }

  function isNounValue(value : Value): value is NounValue { return value.mainVariable !== undefined; }
  function isPredicateValue(value : Value): value is PredicateValue {return value.mainPredicate !== undefined; }

  function convertToNoun(a: Value): NounValue {
    if (isNounValue(a)) return a;
    if (!isPredicateValue(a)) throw new Error("CalcError: Unexpected Value");

    return calcRelative("", a, calcIndefinite());
  }

  function calcCreateDefinite(character: string): NounValue {
    const variable = issueVariable();
    variableTable[character] = variable;
    return {
      graph: {
        children: [],
        usings: [variable]
      },
      mainPredicate: undefined,
      mainVariable: variable
    };
  }
  function calcInheritDefinite(character: string): NounValue {
    const variable = variableTable[character];
    if (variable === undefined) {
      console.warn();
      return calcCreateDefinite(character);
    }
    return {
      graph: {
        children: [],
        usings: [variable]
      },
      mainPredicate: undefined,
      mainVariable: variable
    };
  }
  function calcTerminateDefinite(character: string): NounValue {
    const variable = variableTable[character];
    if (variable === undefined) {
      console.warn();
      return calcIndefinite();
    }
    else delete variableTable[character];
    return {
      graph: {
        children: [],
        usings: [variable]
      },
      mainPredicate: undefined,
      mainVariable: variable
    };
  }
  function calcIndefinite(): NounValue {
    const variable = issueVariable();
    return {
      graph: {
        children: [],
        usings: [variable]
      },
      mainPredicate: undefined,
      mainVariable: variable
    };
  }
  function calcPredicate(name: string): PredicateValue {
    const predicate = Predicate(name, []);
    return {
      graph: {
        children: [predicate],
        usings: []
      },
      mainPredicate: predicate,
      mainVariable: undefined
    };
  }
  function calcRelative(casus: string, a: Value, b: Value): NounValue {
    if (!isPredicateValue(a)) throw new Error("CalcError: Unexpected Value");
    const bb: NounValue = convertToNoun(b);
    a.mainPredicate.args.unshift({casus: casus, variable: bb.mainVariable});

    return {
      graph: merge(a.graph, bb.graph),
      mainPredicate: undefined,
      mainVariable: bb.mainVariable
    };
  }
  function calcPreposition(casus: string, a: Value, b: Value): PredicateValue {
    const aa: NounValue = convertToNoun(a);
    if (!isPredicateValue(b)) throw new Error("CalcError: Unexpected Value");
    b.mainPredicate.args.unshift({casus: casus, variable: aa.mainVariable});

    return {
      graph: merge(aa.graph, b.graph),
      mainPredicate: b.mainPredicate,
      mainVariable: undefined
    };
  }
  function calcSingleNegation(value: Value): Value {
    return {
      graph: cut(value.graph),
      mainPredicate: value.mainPredicate,
      mainVariable: value.mainVariable
    };
  }
  function calcNegation (values: Value[]): Value {
    return {
      graph: cut(calcSentence(values).graph),
      mainPredicate: undefined,
      mainVariable: undefined
    };
  }
  function calcSentence(values: Value[]): Value {
    return {
      graph: values.map(x=>x.graph).reduce(merge, {children:[], usings:[]}),
      mainPredicate: undefined,
      mainVariable: undefined
    };
  }

  function recursion(tree: Tree): Value {
    const values: Value[] = tree.children.map(x => recursion(x));
    switch(tree.token.tokenType){
      case "create_definite": return calcCreateDefinite(tree.token.character);
      case "inherit_definite": return calcInheritDefinite(tree.token.character);
      case "terminate_definite": return calcTerminateDefinite(tree.token.character);
      case "indefinite": return calcIndefinite();
      case "predicate": return calcPredicate(tree.token.name);
      case "relative": return calcRelative(tree.token.casus, values[0], values[1]);
      case "preposition": return calcPreposition(tree.token.casus, values[0], values[1]);
      case "single_negation": return calcSingleNegation(values[0]);
      case "open_negation": return calcNegation(values);
      case "open_sentence": return calcSentence(values);
      // parseでふくめてないので来ないはず
      case "close_negation":
      case "close_sentence": throw 0;
    }
  }
  const result = recursion(tree);
  return result.graph;
}

//述語論理式
interface TrueFormula {
  formulaType: "true";
}
interface FalseFormula {
  formulaType: "false";
}
interface NegationFormula {
  formulaType: "negation",
  formula: Formula
}
interface ExistFormula {
  formulaType: "exist",
  variable: Variable,
  formula: Formula
}
interface AllFormula {
  formulaType: "all",
  variable: Variable,
  formula: Formula
}
interface ConjunctionFormula {
  formulaType: "conjunction",
  formulas: Formula[]
}
interface DisjunctionFormula {
  formulaType: "disjunction",
  formulas: Formula[]
}

type Formula = TrueFormula | FalseFormula | Predicate | NegationFormula | ExistFormula | AllFormula | ConjunctionFormula | DisjunctionFormula ;

function T(): TrueFormula {
  return { formulaType: "true" };
}
function F(): FalseFormula {
  return { formulaType: "false" };
}
function negation(formula:Formula): NegationFormula {
  return { formulaType: "negation", formula };
}
function exist(variable: Variable, formula: Formula): ExistFormula{
  return { formulaType: "exist", variable, formula };
}
function all(variable: Variable, formula: Formula): AllFormula {
  return { formulaType: "all", variable, formula };
}
function conjunction(formulas: Formula[]): ConjunctionFormula | Formula {
  formulas = formulas.reduce((acc: Formula[], cur: Formula) => {
    if (cur.formulaType === "true") return acc;
    if (cur.formulaType === "conjunction")
      acc.push(...cur.formulas);
    else
      acc.push(cur);
    return acc;
  }, []);

  if(formulas.length == 0) return T();
  if(formulas.length == 1) return formulas[0];
  return  {
    formulaType: "conjunction",
    formulas
  };
}
function disjunction(formulas: Formula[]): Formula {
  formulas = formulas.reduce((acc: Formula[], cur) => {
    if (cur.formulaType == "false") return acc;
    if(cur.formulaType == "disjunction")
      acc.push(...cur.formulas);
    else
      acc.push(cur);
    return acc;
  }, []);

  if(formulas.length == 0) return F();
  if(formulas.length == 1) return formulas[0];
  return  {
    formulaType: "disjunction",
    formulas
  };
}
//存在グラフを論理式に変換。主に量化が難点
function formularize(graph:Graph): Formula{
  function recursion(graph: Graph, inner: Variable[]): Formula {
    const core: Formula = conjunction(graph.children.map(subgraph => {
      switch (subgraph.subgraphType) {
        case "cut": {
          //内部の数が全体の数と一致するもの、一致しないものに分ける
          const a: Variable[] = [];
          const b: Variable[] = [];
          inner.forEach(x=>(count(x, subgraph.content.usings)===count(x, inner)?a:b).push(x));
          //一致しないものはinnerに戻し、一致するものを使って内部で再帰
          inner = b;
          return negation(recursion(subgraph.content, a));
        }
        case "predicate":
          //predicateはsubgraphとformulaを兼ねてる
          return subgraph;
      }
    }));
    //どこのcutでも数が合わなかった（複数のcutで使われてるか、定名詞が直置きされてる）変数のみ量化
    return removeDup(inner).reduce((a, c)=>exist(c, a), core);
  }
  function count<T>(element: T, array: T[]): number{
    return array.filter(x=>x===element).length;
  }
  function removeDup<T>(array: T[]): T[]{
    return Array.from(new Set(array));
  }
  return recursion(graph, [...graph.usings]);
}

//標準化
function normalize(formula: Formula): Formula {
  if (formula.formulaType === "negation") {
    const f = normalize(formula.formula);
    //￢￢φ → φ
    if (f.formulaType === "negation")
      return f.formula;
    //￢∃x;φ → ∀x;￢φ
    if (f.formulaType === "exist")
      return all(f.variable, normalize(negation(f.formula)));
    //￢∀x;φ → ∃x;￢φ
    if (f.formulaType === "all")
      return exist(f.variable, normalize(negation(f.formula)));
    //￢(φ∧ψ∧...) → (￢φ∨￢ψ∨...)
    if (f.formulaType === "conjunction")
      return normalize(disjunction(f.formulas.map(x=>normalize(negation(x)))));
    //￢(φ∧ψ∧...) → (￢φ∨￢ψ∨...)
    if (f.formulaType === "disjunction")
      return normalize(conjunction(f.formulas.map(x=>normalize(negation(x)))));
    return negation(f);
  }
  if (formula.formulaType === "exist")
    return exist(formula.variable, normalize(formula.formula));
  if (formula.formulaType === "all")
    return all(formula.variable, normalize(formula.formula));

  if (formula.formulaType === "conjunction") {
    let fs = formula.formulas.map(x => normalize(x));

    const q: {type: (variable: Variable, formula: Formula)=>Formula, variable:Variable}[] = [];
    //それぞれの項から量化を剥ぐ
    fs = fs.map(x=>{
      while(true) {
        if(x.formulaType === "exist") {
          q.unshift({type:exist, variable:x.variable});
          x = x.formula;
        }
        else if (x.formulaType === "all") {
          q.unshift({type:all, variable:x.variable});
          x = x.formula;
        }
        else break;
      }
      return x;
    });

    const formula2:Formula = fs.reduce((acc, cur)=>{
      if(cur.formulaType === "conjunction" && acc.formulaType === "conjunction")
        return conjunction([acc, cur]);
      if(cur.formulaType === "disjunction" && acc.formulaType === "conjunction")
        return disjunction(cur.formulas.map(x=>conjunction([acc, x])));
      if(cur.formulaType === "conjunction" && acc.formulaType === "disjunction")
        return disjunction(acc.formulas.map(x=>conjunction([cur, x])));
      if(cur.formulaType === "disjunction" && acc.formulaType === "disjunction")
        return disjunction(cur.formulas.map(x=>disjunction(acc.formulas.map(y=>conjunction([x, y])))));
      return conjunction([acc, cur]);
    }, T());

    //剥いだ量化を被せる
    return q.reduce((acc, cur)=>cur.type(cur.variable, acc), formula2);
  }
  if (formula.formulaType === "disjunction") {
    let fs = formula.formulas.map(x => normalize(x));

    const q: {type: (variable: Variable, formula: Formula)=>Formula, variable:Variable}[] = [];
    //それぞれの項から量化を剥ぐ
    fs = fs.map(x=>{
      while(true) {
        if(x.formulaType === "exist") {
          q.unshift({type:exist, variable:x.variable});
          x = x.formula;
        }
        else if (x.formulaType === "all") {
          q.unshift({type:all, variable:x.variable});
          x = x.formula;
        }
        else break;
      }
      return x;
    });

    const formula2:Formula = fs.reduce((acc, cur)=>{
      return disjunction([acc, cur]);
    }, F());

    //剥いだ量化を被せる
    return q.reduce((acc, cur)=>cur.type(cur.variable, acc), formula2);
  }
  return formula;
}

//文字列化
function stringify(formula: Formula): string {
  if (formula.formulaType === "true")
    return "⊤";
  if (formula.formulaType === "false")
    return "⊥";
  if (formula.formulaType === "exist")
    return "∃" + formula.variable.name + ";" + stringify(formula.formula);
  if (formula.formulaType === "all")
    return "∀" + formula.variable.name + ";" + stringify(formula.formula);
  if (formula.formulaType === "conjunction")
    return "(" + formula.formulas.map(x=>stringify(x)).join("∧") + ")";
  if (formula.formulaType === "disjunction")
    return "(" + formula.formulas.map(x=>stringify(x)).join("∨") + ")";
  if (formula.formulaType === "negation")
    return "￢" + stringify(formula.formula);
  if (formula.formulaType === "predicate")
    return formula.name + "(" + formula.args.map(x=>(x.casus + ":" + x.variable.name)).join(", ") + ")";
  const exhaustion: never = formula;
  return "";
}

function test(): void {
  const inputs = [
    "a",
    "moku",
    "no moku",
    "a no be i moku",
    "no be a moku",
    "be au no moku",
    "be pina moku",
    "fe rana be pina moku",
    "e bei fe rana moku au pina",
    "fe rana be pina moku",
    "fe rana be no pina moku",
    "fe rana no be pina moku",
    "no fe no rana no be pina no moku",
    "e bei fe rana moku au pina",
    "e bei fe no rana moku au pina",
  ];
  inputs.forEach(x=>{
    console.log(">"+x);
    console.log(stringify(formularize(calculate(parse(tokenize(x)))));
    console.log(stringify(normalize(formularize(calculate(parse(tokenize(x))))));
  });
}

function gebi(id :string) {
  return document.getElementById(id);
}

function updatePattern() {
  separatorPattern = new RegExp(gebi("separator_pattern").value);

  const indefinitePattern = new RegExp("^" + gebi("indefinite_pattern").value + "$");
  isIndefinite = literal => indefinitePattern.test(literal);

  const createDefinitePattern = new RegExp("^" + gebi("create_definite_pattern").value + "$");
  const createDefiniteReplacer = gebi("create_definite_replacer").value;
  isCreateDefinite = literal => createDefinitePattern.test(literal);
  createDefiniteToCharacter = literal => literal.replace(createDefinitePattern, createDefiniteReplacer);

  const inheritDefinitePattern = new RegExp("^" + gebi("inherit_definite_pattern").value + "$");
  const inheritDefiniteReplacer = gebi("inherit_definite_replacer").value;
  isInheritDefinite = literal => inheritDefinitePattern.test(literal);
  inheritDefiniteToCharacter = literal => literal.replace(inheritDefinitePattern, inheritDefiniteReplacer);

  const terminateDefinitePattern = new RegExp("^" + gebi("terminate_definite_pattern").value + "$");
  const terminateDefiniteReplacer = gebi("terminate_definite_replacer").value;
  isTerminateDefinite = literal => terminateDefinitePattern.test(literal);
  terminateDefiniteToCharacter = literal => literal.replace(terminateDefinitePattern, terminateDefiniteReplacer);

  const predicatePattern = new RegExp("^" + gebi("predicate_pattern").value + "$");
  const predicateReplacer = gebi("predicate_replacer").value;
  isPredicate = literal => predicatePattern.test(literal);
  predicateToName = literal => literal.replace(predicatePattern, predicateReplacer);

  const relativePattern = new RegExp("^" + gebi("relative_pattern").value + "$");
  const relativeReplacer = gebi("relative_replacer").value;
  isRelative = literal => relativePattern.test(literal);
  relativeToCasus = literal => literal.replace(relativePattern, relativeReplacer);

  const prepositionPattern = new RegExp("^" + gebi("preposition_pattern").value + "$");
  const prepositionReplacer = gebi("preposition_replacer").value;
  isPreposition = literal => prepositionPattern.test(literal);
  prepositionToCasus = literal => literal.replace(prepositionPattern, prepositionReplacer);

  const singleNegationPattern = new RegExp("^" + gebi("single_negation_pattern").value + "$");
  isSingleNegation = literal => singleNegationPattern.test(literal);

  const openNegationPattern = new RegExp("^" + gebi("open_negation_pattern").value + "$");
  isOpenNegation = literal => openNegationPattern.test(literal);

  const closeNegationPattern = new RegExp("^" + gebi("close_negation_pattern").value + "$");
  isCloseNegation = literal => closeNegationPattern.test(literal);

  update();
}

function reset1(): void {
  gebi("separator_pattern").value = "[,.\\s]";

  gebi("indefinite_pattern").value = "au";

  gebi("create_definite_pattern").value = "a('[aeiou])*";
  gebi("create_definite_replacer").value = "$1";

  gebi("inherit_definite_pattern").value = "i('[aeiou])*";
  gebi("inherit_definite_replacer").value = "$1";

  gebi("terminate_definite_pattern").value = "u('[aeiou])*";
  gebi("terminate_definite_replacer").value = "$1";

  gebi("predicate_pattern").value = "(([^aeiou'][aeiou]){2,})";
  gebi("predicate_replacer").value = "$1";

  gebi("relative_pattern").value = "([^aeiou]?)ei";
  gebi("relative_replacer").value = "$1";

  gebi("preposition_pattern").value = "([^aeiou]?)e";
  gebi("preposition_replacer").value = "$1";

  gebi("single_negation_pattern").value = "no";
  gebi("open_negation_pattern").value = "nou";
  gebi("close_negation_pattern").value = "noi";

  updatePattern();
}

function update(): void {
  gebi("output").innerText = "";
  gebi("error").innerText = "";
  const input = gebi("input").value;
  try {
    gebi("output").innerHTML = markupFormula(stringify(formularize(calculate(parse(tokenize(input))))));
  } catch(e) {
    gebi("error").innerText = e.message;
  }
}

window.onload = () => {
  gebi("input").oninput = update;
  gebi("separator_pattern").oninput = updatePattern;
  gebi("indefinite_pattern").oninput = updatePattern;
  gebi("create_definite_pattern").oninput = updatePattern;
  gebi("create_definite_replacer").oninput = updatePattern;
  gebi("inherit_definite_pattern").oninput = updatePattern;
  gebi("inherit_definite_replacer").oninput = updatePattern;
  gebi("terminate_definite_pattern").oninput = updatePattern;
  gebi("terminate_definite_replacer").oninput = updatePattern;
  gebi("predicate_pattern").oninput = updatePattern;
  gebi("predicate_replacer").oninput = updatePattern;
  gebi("relative_pattern").oninput = updatePattern;
  gebi("relative_replacer").oninput = updatePattern;
  gebi("preposition_pattern").oninput = updatePattern;
  gebi("preposition_replacer").oninput = updatePattern;
  gebi("single_negation_pattern").oninput = updatePattern;
  gebi("open_negation_pattern").oninput = updatePattern;
  gebi("close_negation_pattern").oninput = updatePattern;
  reset1();
}
