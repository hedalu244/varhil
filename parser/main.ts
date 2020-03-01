type Token = {
  literal: string,
  tokenType: "new_variable" | "continued_variable" | "last_variable",
  character: string
} | {
  literal: string,
  tokenType: "predicate",
  name: string
} | {
  literal: string,
  tokenType: "article" | "preposition",
  casus: string
} | {
  literal: string,
  tokenType: "single_variable" | "single_negation" | "open_negation" | "close_negation" | "open_sentence" | "close_sentence"
};

//字句解析
let tokenPattern: RegExp;

let isSingleVariable: (literal :string)=>boolean;

let isNewVariable: (literal :string)=>boolean;
let newVariableToCharacter: (literal :string)=>string;

let isContinuedVariable: (literal :string)=>boolean;
let continuedVariableToCharacter: (literal :string)=>string;

let isLastVariable: (literal :string)=>boolean;
let lastVariableToCharacter: (literal :string)=>string;

let isPredicate: (literal :string)=>boolean;
let predicateToName: (literal :string)=>string;

let isArticle: (literal :string)=>boolean;
let articleToCasus: (literal :string)=>string;

let isPreposition: (literal :string)=>boolean;
let prepositionToCasus: (literal :string)=>string;

let isSingleNegation: (literal :string)=>boolean;
let isOpenNegation: (literal :string)=>boolean;
let isCloseNegation: (literal :string)=>boolean;


function tokenize(input: string): Token[] {
  let literals = input.match(tokenPattern);
  if (literals === null) literals = [];

  let tokens: Token[] = literals.map(literal => {
    if (isSingleVariable(literal))
      return { literal, tokenType: "single_variable"};
    if (isNewVariable(literal))
      return { literal, tokenType: "new_variable", character: newVariableToCharacter(literal)};
    if (isContinuedVariable(literal))
      return { literal, tokenType: "continued_variable",  character: continuedVariableToCharacter(literal) };
    if (isLastVariable(literal))
      return { literal, tokenType: "last_variable", character: lastVariableToCharacter(literal) };
    if (isPredicate(literal))
      return { literal, tokenType: "predicate", name: predicateToName(literal) };
    if (isArticle(literal))
      return { literal, tokenType: "article", casus: articleToCasus(literal) };
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
  let token = tokens.shift();
  if (token === undefined) throw new Error("ParseError: Unxpected End of Tokens");

  let arity = getArity(token);
  if (arity === ")") throw new Error("ParseError: Unxpected Token " + token.literal);

  let children: Tree[] = [];
  if (arity === "(") {
    while (true) {
      var next: Token = tokens[0];
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
    for(var i = 0; i < arity; i++)
      children.push(parse(tokens));
  }
  return {token: token, children: children};

  function getArity(token: Token): Arity {
    switch(token.tokenType) {
      case "new_variable": return 0;
      case "continued_variable": return 0;
      case "last_variable": return 0;
      case "single_variable": return 0;
      case "predicate": return 0;
      case "article": return 2;
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
interface TrueFormula {
  formulaType: "true";
}
interface FalseFormula {
  formulaType: "false";
}
interface PredicateFormula {
  formulaType: "predicate",
  name: string,
  args: {casus:string, variable:Variable}[]
}
interface EquationFormula {
  formulaType: "equation",
  a: Variable,
  b: Variable
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

type Formula = TrueFormula | FalseFormula | PredicateFormula | EquationFormula | NegationFormula | ExistFormula | AllFormula | ConjunctionFormula | DisjunctionFormula ;

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
function predicate(name: string, args: {casus:string, variable:Variable}[]): PredicateFormula {
  return { formulaType: "predicate", name, args };
}
function equation(a: Variable, b: Variable): EquationFormula {
  return { formulaType: "equation", a, b };
}
interface Value {
  formula: Formula,
  mainVariable: Variable | undefined,
  mainPredicate: PredicateFormula | undefined
};
interface NounValue extends Value {
  mainVariable: Variable
}
interface PredicateValue extends Value {
  mainPredicate: PredicateFormula
}

function calculate(tree: Tree): Formula {
  let variableTable: { [key: string]: Variable } = {};
  let variableCount: number = 0;

  function issueVariable(): Variable { return {name: "" + variableCount++ }; }

  function combine(formulas: Formula[]): Formula {
    let variables = formulas.map(x=>enumrateQuantify(x)).reduce((acc: Variable[], cur)=>[...acc, ...cur], []);
    let duplication = variables.filter((x, i, self) => self.indexOf(x) === i && i !== self.lastIndexOf(x));

    return duplication.reduce((acc:Formula, cur:Variable) => exist(cur, acc),
        duplication.reduce((acc:Formula, cur:Variable) => removeQuantify(acc, cur), conjunction(formulas)));

    function enumrateQuantify(formula: Formula): Variable[]{
      if (formula.formulaType === "exist")
        return [formula.variable, ...enumrateQuantify(formula.formula)];
      else if (formula.formulaType === "negation")
        return enumrateQuantify(formula.formula);
      else if (formula.formulaType === "conjunction")
        return formula.formulas.map(x=>enumrateQuantify(x)).reduce((cur, acc)=>[...cur, ...acc]);
      else return [];
    }

    function removeQuantify (formula: Formula, variable: Variable): Formula{
      if (formula.formulaType === "exist") {
        if (variable === formula.variable)
          return formula.formula;
        else return exist(formula.variable, removeQuantify(formula.formula, variable));
      }
      else if (formula.formulaType === "negation")
        return negation(removeQuantify(formula.formula, variable));
      else if (formula.formulaType === "conjunction")
        return conjunction(formula.formulas.map(x=>removeQuantify(x, variable)));
      return formula;
    }
  }

  function isNounValue(value : Value): value is NounValue { return value.mainVariable !== undefined; }
  function isPredicateValue(value : Value): value is PredicateValue {return value.mainPredicate !== undefined; }

  function calcNewVariable(character: string): NounValue {
    let variable = issueVariable();
    variableTable[character] = variable;
    return {
      formula: exist(variable, T()),
      mainPredicate: undefined,
      mainVariable: variable
    };
  }
  function calcContinuedVariable(character: string): NounValue {
    let variable = variableTable[character];
    if (variable === undefined) {
      console.warn();
      variable = issueVariable();
      variableTable[character] = variable;
    }
    return {
      formula: exist(variable, T()),
      mainPredicate: undefined,
      mainVariable: variable
    };
  }
  function calcLastVariable(character: string): NounValue {
    let variable = variableTable[character];
    if (variable === undefined) {
      console.warn();
      variable = issueVariable();
    }
    else delete variableTable[character];
    return {
      formula: exist(variable, T()),
      mainPredicate: undefined,
      mainVariable: variable
    };
  }
  function calcSingleVariable(): NounValue {
    let variable = issueVariable();
    return {
      formula: exist(variable, T()),
      mainPredicate: undefined,
      mainVariable: variable
    };
  }
  function calcPredicate(name: string): PredicateValue {
    let formula: Formula = predicate(name, []);
    return {
      formula: formula,
      mainPredicate: formula,
      mainVariable: undefined
    };
  }
  function convertToNoun(a: Value): NounValue {
    if (isNounValue(a)) return a;

    if (!isPredicateValue(a)) throw new Error("CalcError: Unexpected Value");
    let variable = issueVariable();
    a.mainPredicate.args.unshift({casus: "", variable: variable});
    return {
      formula: exist(variable, a.formula),
      mainPredicate: undefined,
      mainVariable: variable
    };
  }
  function calcArticle(casus: string, a: Value, b: Value): NounValue {
    if (!isPredicateValue(a)) throw new Error("CalcError: Unexpected Value");
    let bb: NounValue = convertToNoun(b);
    a.mainPredicate.args.unshift({casus: casus, variable: bb.mainVariable});

    return {
      formula: combine([a.formula, bb.formula]),
      mainPredicate: undefined,
      mainVariable: bb.mainVariable
    };
  }
  function calcPreposition(casus: string, a: Value, b: Value): PredicateValue {
    let aa: NounValue = convertToNoun(a);
    if (!isPredicateValue(b)) throw new Error("CalcError: Unexpected Value");
    b.mainPredicate.args.unshift({casus: casus, variable: aa.mainVariable});

    return {
      formula: combine([aa.formula, b.formula]),
      mainPredicate: b.mainPredicate,
      mainVariable: undefined
    };
  }
  function calcSingleNegation(value: Value): Value {
    return {
      formula: negation(value.formula),
      mainPredicate: value.mainPredicate,
      mainVariable: value.mainVariable
    };
  }
  function calcNegation (values: Value[]): Value {
    return {
      formula: negation(combine(values.map(x=>x.formula))),
      mainPredicate: undefined,
      mainVariable: undefined
    };
  }

  function calcSentence(values: Value[]): Value {
    return {
      formula: combine(values.map(x=>x.formula)),
      mainPredicate: undefined,
      mainVariable: undefined
    };
  }

  function recursion(tree: Tree): Value {
    let values: Value[] = tree.children.map(x => recursion(x));
    switch(tree.token.tokenType){
      case "new_variable": return calcNewVariable(tree.token.character);
      case "continued_variable": return calcContinuedVariable(tree.token.character);
      case "last_variable": return calcLastVariable(tree.token.character);
      case "single_variable": return calcSingleVariable();
      case "predicate": return calcPredicate(tree.token.name);
      case "article": return calcArticle(tree.token.casus, values[0], values[1]);
      case "preposition": return calcPreposition(tree.token.casus, values[0], values[1]);
      case "single_negation": return calcSingleNegation(values[0]);
      case "open_negation": return calcNegation(values);
      case "open_sentence": return calcSentence(values);
      // parseでふくめてないので来ないはず
      case "close_negation":
      case "close_sentence": throw 0;
    }
  }
  let result = recursion(tree);
  return result.formula;
}

//標準化
function normalize(formula: Formula): Formula {
  if (formula.formulaType === "negation") {
    let f = normalize(formula.formula);
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

    let q: {type: (variable: Variable, formula: Formula)=>Formula, variable:Variable}[] = [];
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

    let formula2:Formula = fs.reduce((acc, cur)=>{
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

    let q: {type: (variable: Variable, formula: Formula)=>Formula, variable:Variable}[] = [];
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

    let formula2:Formula = fs.reduce((acc, cur)=>{
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
    return "T";
  if (formula.formulaType === "false")
    return "F";
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
  if (formula.formulaType === "equation")
    return "(" + formula.a.name + "=" + formula.b.name + ")";
  let exhaustion: never = formula;
  return "";
}

function test(): void {
  let inputs = [
    /*
    "a",
    "moku",
    "no moku",
    "a no be i moku",
    "no be a moku",
    "be au no moku",
    "be pina moku",
    "fe rana be pina moku",
    "e bei fe rana moku pina",*/
    "fe rana be pina moku",
    "fe rana be no pina moku",
    "fe rana no be pina moku",
    "no fe no rana no be pina no moku",
    "e bei fe rana moku pina",
    "e bei fe no rana moku pina",
  ];
  inputs.forEach(x=>{
    console.log(">"+x);
    console.log(stringify(calculate(parse(tokenize(x)))));
    console.log(stringify(normalize(calculate(parse(tokenize(x))))));
  });
}

function gebi(id :string) {
  return document.getElementById(id);
}

function updatePattern() {
  tokenPattern = new RegExp(gebi("token_pattern").value, "g");
  let singleVariablePattern = new RegExp("^" + gebi("single_variable_pattern").value + "$");
  isSingleVariable = literal => singleVariablePattern.test(literal);

  let newVariablePattern = new RegExp("^" + gebi("new_variable_pattern").value + "$");
  let newVariableReplacer = gebi("new_variable_replacer").value;
  isNewVariable = literal => newVariablePattern.test(literal);
  newVariableToCharacter = literal => literal.replace(newVariablePattern, newVariableReplacer);

  let continuedVariablePattern = new RegExp("^" + gebi("continued_variable_pattern").value + "$");
  let continuedVariableReplacer = gebi("continued_variable_replacer").value;
  isContinuedVariable = literal => continuedVariablePattern.test(literal);
  continuedVariableToCharacter = literal => literal.replace(continuedVariablePattern, continuedVariableReplacer);

  let lastVariablePattern = new RegExp("^" + gebi("last_variable_pattern").value + "$");
  let lastVariableReplacer = gebi("last_variable_replacer").value;
  isLastVariable = literal => lastVariablePattern.test(literal);
  lastVariableToCharacter = literal => literal.replace(lastVariablePattern, lastVariableReplacer);

  let predicatePattern = new RegExp("^" + gebi("predicate_pattern").value + "$");
  let predicateReplacer = gebi("predicate_replacer").value;
  isPredicate = literal => predicatePattern.test(literal);
  predicateToName = literal => literal.replace(predicatePattern, predicateReplacer);

  let articlePattern = new RegExp("^" + gebi("article_pattern").value + "$");
  let articleReplacer = gebi("article_replacer").value;
  isArticle = literal => articlePattern.test(literal);
  articleToCasus = literal => literal.replace(articlePattern, articleReplacer);

  let prepositionPattern = new RegExp("^" + gebi("preposition_pattern").value + "$");
  let prepositionReplacer = gebi("preposition_replacer").value;
  isPreposition = literal => prepositionPattern.test(literal);
  prepositionToCasus = literal => literal.replace(prepositionPattern, prepositionReplacer);

  let singleNegationPattern = new RegExp("^" + gebi("single_negation_pattern").value + "$");
  isSingleNegation = literal => singleNegationPattern.test(literal);

  let openNegationPattern = new RegExp("^" + gebi("open_negation_pattern").value + "$");
  isOpenNegation = literal => openNegationPattern.test(literal);

  let closeNegationPattern = new RegExp("^" + gebi("close_negation_pattern").value + "$");
  isCloseNegation = literal => closeNegationPattern.test(literal);

  update();
}

function reset1(): void {
  gebi("token_pattern").value = "[a-z']+";

  gebi("single_variable_pattern").value = "au";

  gebi("new_variable_pattern").value = "a('[aeiou])*";
  gebi("new_variable_replacer").value = "$1";

  gebi("continued_variable_pattern").value = "i('[aeiou])*";
  gebi("continued_variable_replacer").value = "$1";

  gebi("last_variable_pattern").value = "u('[aeiou])*";
  gebi("last_variable_replacer").value = "$1";

  gebi("predicate_pattern").value = "(([^aeiou'][aeiou]){2,})";
  gebi("predicate_replacer").value = "$1";

  gebi("article_pattern").value = "([^aeiou]?)ei";
  gebi("article_replacer").value = "$1";

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
  let input = gebi("input").value;
  try {
    gebi("output").innerText = stringify((calculate(parse(tokenize(input)))));
  } catch(e) {
    gebi("error").innerText = e.message;
  }
}

window.onload = () => {
  gebi("input").oninput = update;
  gebi("token_pattern").oninput = updatePattern;
  gebi("single_variable_pattern").oninput = updatePattern;
  gebi("new_variable_pattern").oninput = updatePattern;
  gebi("new_variable_replacer").oninput = updatePattern;
  gebi("continued_variable_pattern").oninput = updatePattern;
  gebi("continued_variable_replacer").oninput = updatePattern;
  gebi("last_variable_pattern").oninput = updatePattern;
  gebi("last_variable_replacer").oninput = updatePattern;
  gebi("predicate_pattern").oninput = updatePattern;
  gebi("predicate_replacer").oninput = updatePattern;
  gebi("article_pattern").oninput = updatePattern;
  gebi("article_replacer").oninput = updatePattern;
  gebi("preposition_pattern").oninput = updatePattern;
  gebi("preposition_replacer").oninput = updatePattern;
  gebi("single_negation_pattern").oninput = updatePattern;
  gebi("open_negation_pattern").oninput = updatePattern;
  gebi("close_negation_pattern").oninput = updatePattern;
  reset1();
}
