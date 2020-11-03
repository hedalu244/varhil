type Token = {
  literal: string,
  tokenType: "create_determiner" | "inherit_determiner" | "terminate_determiner",
  label: string;
} | {
  literal: string,
  tokenType: "predicate",
  name: string;
} | {
  literal: string,
  tokenType: "relative" | "preposition",
  casus: string;
} | {
  literal: string,
  tokenType: "isolatedDeterminer" | "single_negation" | "open_negation" | "close_negation" | "open_sentence" | "close_sentence";
};

//字句解析
let separatorPattern: RegExp;

let isIsolatedDeterminer: (literal: string) => boolean;

let isCreateDeterminer: (literal: string) => boolean;
let createDeterminerToLabel: (literal: string) => string;

let isInheritDeterminer: (literal: string) => boolean;
let inheritDeterminerToLabel: (literal: string) => string;

let isTerminateDeterminer: (literal: string) => boolean;
let terminateDeterminerToLabel: (literal: string) => string;

let isPredicate: (literal: string) => boolean;
let predicateToName: (literal: string) => string;

let isRelative: (literal: string) => boolean;
let relativeToCasus: (literal: string) => string;

let isPreposition: (literal: string) => boolean;
let prepositionToCasus: (literal: string) => string;

let isSingleNegation: (literal: string) => boolean;
let isOpenNegation: (literal: string) => boolean;
let isCloseNegation: (literal: string) => boolean;

//トークン単位に分割し、必要な情報を付加する
function tokenize(input: string): Token[] {
  const literals = input.split(separatorPattern).filter(x => x !== "");

  const tokens: Token[] = literals.map(literal => {
    if (isIsolatedDeterminer(literal))
      return { literal, tokenType: "isolatedDeterminer" };
    if (isCreateDeterminer(literal))
      return { literal, tokenType: "create_determiner", label: createDeterminerToLabel(literal) };
    if (isInheritDeterminer(literal))
      return { literal, tokenType: "inherit_determiner", label: inheritDeterminerToLabel(literal) };
    if (isTerminateDeterminer(literal))
      return { literal, tokenType: "terminate_determiner", label: terminateDeterminerToLabel(literal) };
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
    tokenType: "open_sentence",
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
  children: Tree[];
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
        if (token.tokenType === "open_negation" && next.tokenType === "close_negation"
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
    for (let i = 0; i < arity; i++)
      children.push(parse(tokens));
  }
  return { token: token, children: children };

  function getArity(token: Token): Arity {
    switch (token.tokenType) {
      case "create_determiner": return 0;
      case "inherit_determiner": return 0;
      case "terminate_determiner": return 0;
      case "isolatedDeterminer": return 0;
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
interface PredicateFormula {
  formulaType: "predicate";
  name: string;
  args: { casus: string, variable: Variable; }[];
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
  formula: Formula;
}
interface ExistFormula {
  formulaType: "exist",
  variable: Variable,
  formula: Formula;
}
interface AllFormula {
  formulaType: "all",
  variable: Variable,
  formula: Formula;
}
interface ConjunctionFormula {
  formulaType: "conjunction",
  formulas: Formula[];
}
interface DisjunctionFormula {
  formulaType: "disjunction",
  formulas: Formula[];
}

type Formula = TrueFormula | FalseFormula | PredicateFormula | NegationFormula | ExistFormula | AllFormula | ConjunctionFormula | DisjunctionFormula;

function T(): TrueFormula {
  return { formulaType: "true" };
}
function F(): FalseFormula {
  return { formulaType: "false" };
}
function PredicateFormula(name: string, args: { casus: string, variable: Variable; }[]): PredicateFormula {
  return {
    formulaType: "predicate",
    name,
    args
  };
}
function negation(formula: Formula): NegationFormula {
  return { formulaType: "negation", formula };
}
function exist(variable: Variable, formula: Formula): ExistFormula {
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

  if (formulas.length == 0) return T();
  if (formulas.length == 1) return formulas[0];
  return {
    formulaType: "conjunction",
    formulas
  };
}
function disjunction(formulas: Formula[]): Formula {
  formulas = formulas.reduce((acc: Formula[], cur) => {
    if (cur.formulaType == "false") return acc;
    if (cur.formulaType == "disjunction")
      acc.push(...cur.formulas);
    else
      acc.push(cur);
    return acc;
  }, []);

  if (formulas.length == 0) return F();
  if (formulas.length == 1) return formulas[0];
  return {
    formulaType: "disjunction",
    formulas
  };
}

interface Phrase {
  formula: Formula,
  mainVariable: Variable | undefined,
  mainPredicate: PredicateFormula | undefined;
};
interface NounPhrase extends Phrase {
  mainVariable: Variable;
}
interface PredicatePhrase extends Phrase {
  mainPredicate: PredicateFormula;
}

interface Environment {
  variableMap: Map<string, Variable>[];
  variableCount: number;
}

function calculate(tree: Tree): Formula {

  function issueVariable(environment: Environment): Variable {
    return { name: "" + environment.variableCount++ };
  }

  function findVariable(label: string, environment: Environment): Variable | undefined {
    const a = environment.variableMap.find(map => map.has(label));
    return a === undefined ? undefined : a.get(label);
    //return variableMap.map(map=>map.get(label)).find((x):x is Variable=>x !== undefined);
  }

  function isNounPhrase(phrase: Phrase): phrase is NounPhrase { return phrase.mainVariable !== undefined; }
  function isPredicatePhrase(phrase: Phrase): phrase is PredicatePhrase { return phrase.mainPredicate !== undefined; }

  function convertToNoun(a: Phrase, environment: Environment): NounPhrase {
    if (isNounPhrase(a)) return a;
    if (!isPredicatePhrase(a)) throw new Error("CalcError: Unexpected Phrase");

    return calcRelative("", a, calcIsolatedDeterminer(environment), environment);
  }

  function calcIsolatedDeterminer(environment: Environment): NounPhrase {
    const variable = issueVariable(environment);
    return {
      formula: T(),
      mainPredicate: undefined,
      mainVariable: variable
    };
  }
  function calcCreateDeterminer(label: string, environment: Environment): NounPhrase {
    const variable = issueVariable(environment);
    environment.variableMap[0].set(label, variable);
    return {
      formula: T(),
      mainPredicate: undefined,
      mainVariable: variable
    };
  }
  function calcInheritDeterminer(label: string, environment: Environment): NounPhrase {
    const variable = findVariable(label, environment);
    if (variable === undefined) {
      console.warn();
      return calcCreateDeterminer(label, environment);
    }
    return {
      formula: T(),
      mainPredicate: undefined,
      mainVariable: variable
    };
  }
  function calcTerminateDeterminer(label: string, environment: Environment): NounPhrase {
    const variable = findVariable(label, environment);
    if (variable === undefined) {
      console.warn();
      return calcIsolatedDeterminer(environment);
    }
    else environment.variableMap[0].delete(label);
    return {
      formula: T(),
      mainPredicate: undefined,
      mainVariable: variable
    };
  }
  function calcPredicate(name: string, environment: Environment): PredicatePhrase {
    const predicate = PredicateFormula(name, []);
    return {
      formula: predicate,
      mainPredicate: predicate,
      mainVariable: undefined
    };
  }
  function calcRelative(casus: string, a: Phrase, b: Phrase, environment: Environment): NounPhrase {
    if (!isPredicatePhrase(a)) throw new Error("CalcError: Unexpected Phrase");
    const bb: NounPhrase = convertToNoun(b, environment);
    a.mainPredicate.args.unshift({ casus: casus, variable: bb.mainVariable });

    return {
      formula: conjunction([a.formula, bb.formula]),
      mainPredicate: undefined,
      mainVariable: bb.mainVariable
    };
  }
  function calcPreposition(casus: string, a: Phrase, b: Phrase, environment: Environment): PredicatePhrase {
    const aa: NounPhrase = convertToNoun(a, environment);
    if (!isPredicatePhrase(b)) throw new Error("CalcError: Unexpected Phrase");
    b.mainPredicate.args.unshift({ casus: casus, variable: aa.mainVariable });

    return {
      formula: conjunction([aa.formula, b.formula]),
      mainPredicate: b.mainPredicate,
      mainVariable: undefined
    };
  }
  function calcSingleNegation(phrase: Phrase, environment: Environment): Phrase {
    const v = environment.variableMap.shift();
    if (v === undefined) throw new Error();
    const variables = [...v.values()];

    return {
      formula: negation(variables.reduce((f, v) => exist(v, f), phrase.formula)),
      mainPredicate: phrase.mainPredicate,
      mainVariable: phrase.mainVariable
    };
  }
  function calcNegation(phrases: Phrase[], environment: Environment): Phrase {
    return {
      formula: negation(calcSentence(phrases, environment).formula),
      mainPredicate: undefined,
      mainVariable: undefined
    };
  }
  function calcSentence(phrases: Phrase[], environment: Environment): Phrase {
    const v = environment.variableMap.shift();
    if (v === undefined) throw new Error();
    const variables = [...v.values()];
    return {
      formula: variables.reduce((f, v) => exist(v, f), conjunction(phrases.map(x => x.formula))),
      mainPredicate: undefined,
      mainVariable: undefined
    };
  }

  function recursion(tree: Tree, environment: Environment): Phrase {
    // 否定は行きがけにクロージャを生成
    switch (tree.token.tokenType) {
      case "open_negation":
      case "open_sentence":
      case "single_negation":
        environment.variableMap.unshift(new Map<string, Variable>());
    }
    const phrases: Phrase[] = tree.children.map(x => recursion(x, environment));
    switch (tree.token.tokenType) {
      case "create_determiner": return calcCreateDeterminer(tree.token.label, environment);
      case "inherit_determiner": return calcInheritDeterminer(tree.token.label, environment);
      case "terminate_determiner": return calcTerminateDeterminer(tree.token.label, environment);
      case "isolatedDeterminer": return calcIsolatedDeterminer(environment);
      case "predicate": return calcPredicate(tree.token.name, environment);
      case "relative": return calcRelative(tree.token.casus, phrases[0], phrases[1], environment);
      case "preposition": return calcPreposition(tree.token.casus, phrases[0], phrases[1], environment);
      case "single_negation": return calcSingleNegation(phrases[0], environment);
      case "open_negation": return calcNegation(phrases, environment);
      case "open_sentence": return calcSentence(phrases, environment);
      // parseでふくめてないので来ないはず
      case "close_negation":
      case "close_sentence": throw 0;
    }
  }
  const result = recursion(tree, { variableMap: [], variableCount: 0 });
  return result.formula;
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
      return normalize(disjunction(f.formulas.map(x => normalize(negation(x)))));
    //￢(φ∧ψ∧...) → (￢φ∨￢ψ∨...)
    if (f.formulaType === "disjunction")
      return normalize(conjunction(f.formulas.map(x => normalize(negation(x)))));
    return negation(f);
  }
  if (formula.formulaType === "exist")
    return exist(formula.variable, normalize(formula.formula));
  if (formula.formulaType === "all")
    return all(formula.variable, normalize(formula.formula));

  if (formula.formulaType === "conjunction") {
    let fs = formula.formulas.map(x => normalize(x));

    const q: { type: (variable: Variable, formula: Formula) => Formula, variable: Variable; }[] = [];
    //それぞれの項から量化を剥ぐ
    fs = fs.map(x => {
      while (true) {
        if (x.formulaType === "exist") {
          q.unshift({ type: exist, variable: x.variable });
          x = x.formula;
        }
        else if (x.formulaType === "all") {
          q.unshift({ type: all, variable: x.variable });
          x = x.formula;
        }
        else break;
      }
      return x;
    });

    const formula2: Formula = fs.reduce((acc, cur) => {
      if (cur.formulaType === "conjunction" && acc.formulaType === "conjunction")
        return conjunction([acc, cur]);
      if (cur.formulaType === "disjunction" && acc.formulaType === "conjunction")
        return disjunction(cur.formulas.map(x => conjunction([acc, x])));
      if (cur.formulaType === "conjunction" && acc.formulaType === "disjunction")
        return disjunction(acc.formulas.map(x => conjunction([cur, x])));
      if (cur.formulaType === "disjunction" && acc.formulaType === "disjunction")
        return disjunction(cur.formulas.map(x => disjunction(acc.formulas.map(y => conjunction([x, y])))));
      return conjunction([acc, cur]);
    }, T());

    //剥いだ量化を被せる
    return q.reduce((acc, cur) => cur.type(cur.variable, acc), formula2);
  }
  if (formula.formulaType === "disjunction") {
    let fs = formula.formulas.map(x => normalize(x));

    const q: { type: (variable: Variable, formula: Formula) => Formula, variable: Variable; }[] = [];
    //それぞれの項から量化を剥ぐ
    fs = fs.map(x => {
      while (true) {
        if (x.formulaType === "exist") {
          q.unshift({ type: exist, variable: x.variable });
          x = x.formula;
        }
        else if (x.formulaType === "all") {
          q.unshift({ type: all, variable: x.variable });
          x = x.formula;
        }
        else break;
      }
      return x;
    });

    const formula2: Formula = fs.reduce((acc, cur) => {
      return disjunction([acc, cur]);
    }, F());

    //剥いだ量化を被せる
    return q.reduce((acc, cur) => cur.type(cur.variable, acc), formula2);
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
    return "(" + formula.formulas.map(x => stringify(x)).join("∧") + ")";
  if (formula.formulaType === "disjunction")
    return "(" + formula.formulas.map(x => stringify(x)).join("∨") + ")";
  if (formula.formulaType === "negation")
    return "￢" + stringify(formula.formula);
  if (formula.formulaType === "predicate")
    return formula.name + "(" + formula.args.map(x => (x.casus + ":" + x.variable.name)).join(", ") + ")";
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
  inputs.forEach(x => {
    console.log(">" + x);
    console.log(stringify(calculate(parse(tokenize(x)))));
    console.log(stringify(normalize(calculate(parse(tokenize(x))))));
  });
}

function gebi(id: string) {
  return document.getElementById(id);
}

function updatePattern() {
  separatorPattern = new RegExp(gebi("separator_pattern").value);

  const isolatedDeterminerPattern = new RegExp("^" + gebi("isolated_determiner_pattern").value + "$");
  isIsolatedDeterminer = literal => isolatedDeterminerPattern.test(literal);

  const createDeterminerPattern = new RegExp("^" + gebi("create_determiner_pattern").value + "$");
  const createDeterminerReplacer = gebi("create_determiner_replacer").value;
  isCreateDeterminer = literal => createDeterminerPattern.test(literal);
  createDeterminerToLabel = literal => literal.replace(createDeterminerPattern, createDeterminerReplacer);

  const inheritDeterminerPattern = new RegExp("^" + gebi("inherit_determiner_pattern").value + "$");
  const inheritDeterminerReplacer = gebi("inherit_determiner_replacer").value;
  isInheritDeterminer = literal => inheritDeterminerPattern.test(literal);
  inheritDeterminerToLabel = literal => literal.replace(inheritDeterminerPattern, inheritDeterminerReplacer);

  const terminateDeterminerPattern = new RegExp("^" + gebi("terminate_determiner_pattern").value + "$");
  const terminateDeterminerReplacer = gebi("terminate_determiner_replacer").value;
  isTerminateDeterminer = literal => terminateDeterminerPattern.test(literal);
  terminateDeterminerToLabel = literal => literal.replace(terminateDeterminerPattern, terminateDeterminerReplacer);

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

  gebi("isolated_determiner_pattern").value = "au";

  gebi("create_determiner_pattern").value = "a('[aeiou])*";
  gebi("create_determiner_replacer").value = "$1";

  gebi("inherit_determiner_pattern").value = "i('[aeiou])*";
  gebi("inherit_determiner_replacer").value = "$1";

  gebi("terminate_determiner_pattern").value = "u('[aeiou])*";
  gebi("terminate_determiner_replacer").value = "$1";

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
    gebi("output").innerHTML = markupFormula(stringify(calculate(parse(tokenize(input)))));
  } catch (e) {
    gebi("error").innerText = e.message;
  }
}

window.onload = () => {
  gebi("input").oninput = update;
  gebi("separator_pattern").oninput = updatePattern;
  gebi("isolated_determiner_pattern").oninput = updatePattern;
  gebi("create_determiner_pattern").oninput = updatePattern;
  gebi("create_determiner_replacer").oninput = updatePattern;
  gebi("inherit_determiner_pattern").oninput = updatePattern;
  gebi("inherit_determiner_replacer").oninput = updatePattern;
  gebi("terminate_determiner_pattern").oninput = updatePattern;
  gebi("terminate_determiner_replacer").oninput = updatePattern;
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
};
