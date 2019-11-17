"use strict";
//字句解析
let tokenPattern;
let isSingleVariable;
let isNewVariable;
let newVariableToCharacter;
let isContinuedVariable;
let continuedVariableToCharacter;
let isLastVariable;
let lastVariableToCharacter;
let isPredicate;
let predicateToName;
let isArticle;
let articleToCasus;
let isPreposition;
let prepositionToCasus;
let isUnion;
let isSingleNegation;
let isOpenNegation;
let isCloseNegation;
function tokenize(input) {
    let literals = input.match(tokenPattern);
    if (literals === null)
        literals = [];
    let tokens = literals.map(literal => {
        if (isSingleVariable(literal))
            return { literal, tokenType: "single_variable" };
        if (isNewVariable(literal))
            return { literal, tokenType: "new_variable", character: newVariableToCharacter(literal) };
        if (isContinuedVariable(literal))
            return { literal, tokenType: "continued_variable", character: continuedVariableToCharacter(literal) };
        if (isLastVariable(literal))
            return { literal, tokenType: "last_variable", character: lastVariableToCharacter(literal) };
        if (isPredicate(literal))
            return { literal, tokenType: "predicate", name: predicateToName(literal) };
        if (isArticle(literal))
            return { literal, tokenType: "article", casus: articleToCasus(literal) };
        if (isPreposition(literal))
            return { literal, tokenType: "preposition", casus: prepositionToCasus(literal) };
        if (isUnion(literal))
            return { literal, tokenType: "union" };
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
// ポーランド記法を解く
function parse(tokens) {
    let token = tokens.shift();
    if (token === undefined)
        throw new Error("ParseError: Unxpected End of Tokens");
    let arity = getArity(token);
    if (arity === ")")
        throw new Error("ParseError: Unxpected Token" + token.literal);
    let children = [];
    if (arity === "(") {
        while (true) {
            var next = tokens[0];
            if (next === undefined)
                throw new Error("ParseError: Unxpected End of Tokens");
            if (getArity(next) === ")") {
                if (token.tokenType === "open_negation" && next.tokenType === "close_negation"
                    || token.tokenType === "open_sentence" && next.tokenType === "close_sentence")
                    break;
                throw new Error("ParseError: Unxpected Token" + next.literal);
            }
            children.push(parse(tokens));
        }
    }
    else {
        for (var i = 0; i < arity; i++)
            children.push(parse(tokens));
    }
    return { token: token, children: children };
    function getArity(token) {
        switch (token.tokenType) {
            case "new_variable": return 0;
            case "continued_variable": return 0;
            case "last_variable": return 0;
            case "single_variable": return 0;
            case "predicate": return 0;
            case "article": return 1;
            case "preposition": return 2;
            case "union": return 2;
            case "single_negation": return 1;
            case "open_negation": return "(";
            case "close_negation": return ")";
            case "open_sentence": return "(";
            case "close_sentence": return ")";
        }
    }
}
function T() {
    return { formulaType: "true" };
}
function F() {
    return { formulaType: "false" };
}
function negation(formula, inner) {
    return { formulaType: "negation", formula, inner };
}
function exist(variable, formula) {
    return { formulaType: "exist", variable, formula };
}
function all(variable, formula) {
    return { formulaType: "all", variable, formula };
}
function isConjunction(formula) {
    return formula.formulaType === "conjunction";
}
function conjunction(formulas) {
    formulas = formulas.reduce((acc, cur) => {
        if (cur.formulaType == "true")
            return acc;
        if (isConjunction(cur))
            acc.push(...cur.formulas);
        else
            acc.push(cur);
        return acc;
    }, []);
    if (formulas.length == 0)
        return T();
    if (formulas.length == 1)
        return formulas[0];
    return {
        formulaType: "conjunction",
        formulas
    };
}
function disjunction(formulas) {
    formulas = formulas.reduce((acc, cur) => {
        if (cur.formulaType == "false")
            return acc;
        if (cur.formulaType == "disjunction")
            acc.push(...cur.formulas);
        else
            acc.push(cur);
        return acc;
    }, []);
    if (formulas.length == 0)
        return F();
    if (formulas.length == 1)
        return formulas[0];
    return {
        formulaType: "disjunction",
        formulas
    };
}
function predicate(name, args) {
    return { formulaType: "predicate", name, args };
}
function equation(a, b) {
    return { formulaType: "equation", a, b };
}
;
function calculate(tree) {
    let variableTable = {};
    let variableCount = 0;
    function issueVariable() { return { name: "" + variableCount++ }; }
    function combine(values) {
        return {
            formula: conjunction(values.map((x) => x.formula)),
            variables: values.reduce((acc, cur) => [...acc, ...cur.variables], [])
        };
    }
    function quantify(formula, variables) {
        let negations = formula.formulaType === "negation" ? [formula] :
            formula.formulaType === "conjunction" ? formula.formulas.filter((x) => {
                return x.formulaType === "negation";
            }) : [];
        negations.forEach((x) => {
            //節の内部でのみ使われいる変項を削除
            variables = variables.filter(y => x.inner.filter(z => y === z).length
                !== variables.filter(z => y === z).length);
            //外部でも使われている変項の量化を内部から削除
            x.formula = removeQuantify(x.formula, variables);
        });
        //variablesから重複を除外し、残った変数に対応する存在量化に包む
        return variables.filter((x, i, a) => a.findIndex(y => x === y) === i).reduce((acc, cur) => exist(cur, acc), formula);
        function removeQuantify(formula, variables) {
            if (variables.length === 0)
                return formula;
            if (formula.formulaType === "exist") {
                if (variables.some(x => x === formula.variable))
                    return removeQuantify(formula.formula, variables.filter(x => x !== formula.variable));
                else
                    return exist(formula.variable, removeQuantify(formula.formula, variables));
            }
            else if (formula.formulaType === "negation")
                return negation(removeQuantify(formula.formula, variables), formula.inner);
            else if (formula.formulaType === "conjunction") {
                return conjunction(formula.formulas.map(x => removeQuantify(x, variables)));
            }
            return formula;
        }
    }
    function isNounValue(value) { return value.mainVariable !== undefined; }
    function isPredicateValue(value) { return value.mainPredicate !== undefined; }
    function calcNewVariable(character) {
        let variable = issueVariable();
        variableTable[character] = variable;
        return {
            formula: T(),
            variables: [variable],
            mainPredicate: undefined,
            mainVariable: variable,
            isVariable: true
        };
    }
    function calcContinuedVariable(character) {
        let variable = variableTable[character];
        if (!variable) {
            console.warn();
            variable = issueVariable();
            variableTable[character] = variable;
        }
        return {
            formula: T(),
            variables: [variable],
            mainPredicate: undefined,
            mainVariable: variable,
            isVariable: true
        };
    }
    function calcLastVariable(character) {
        let variable = variableTable[character];
        if (!variable) {
            console.warn();
            variable = issueVariable();
        }
        else
            delete variableTable[character];
        return {
            formula: T(),
            variables: [variable],
            mainPredicate: undefined,
            mainVariable: variable,
            isVariable: true
        };
    }
    function calcSingleVariable() {
        let variable = issueVariable();
        return {
            formula: T(),
            variables: [variable],
            mainPredicate: undefined,
            mainVariable: variable,
            isVariable: true
        };
    }
    function calcPredicate(name) {
        let formula = predicate(name, []);
        return {
            formula: formula,
            variables: [],
            mainVariable: undefined,
            mainPredicate: formula,
            isVariable: false
        };
    }
    function calcArticle(casus, a) {
        if (!isPredicateValue(a) || isNounValue(a))
            throw new Error("CalcError: Unexpected Value");
        let v = issueVariable();
        a.mainPredicate.args.unshift({ casus: casus, variable: v });
        a.variables.unshift(v);
        return {
            formula: a.formula,
            variables: a.variables,
            mainPredicate: a.mainPredicate,
            mainVariable: v,
            isVariable: false
        };
    }
    function calcPreposition(casus, a, b) {
        if (!isPredicateValue(b))
            throw new Error("CalcError: Unexpected Value");
        let aa = isNounValue(a) ? a : calcArticle("", a);
        b.mainPredicate.args.unshift({ casus: casus, variable: aa.mainVariable });
        b.variables.unshift(aa.mainVariable);
        let comb = combine([aa, b]);
        return {
            formula: comb.formula,
            variables: comb.variables,
            mainPredicate: b.mainPredicate,
            mainVariable: b.mainVariable,
            isVariable: false
        };
    }
    function calcUnion(a, b) {
        let aa = isNounValue(a) ? a : calcArticle("", a);
        let bb = isNounValue(b) ? b : calcArticle("", b);
        let comb = combine([aa, bb]);
        return {
            formula: conjunction([comb.formula, equation(aa.mainVariable, bb.mainVariable)]),
            variables: comb.variables,
            mainVariable: aa.mainVariable,
            mainPredicate: undefined,
            isVariable: false
        };
    }
    function calcSingleNegation(value) {
        return {
            formula: negation(quantify(value.formula, value.variables), value.variables),
            variables: value.variables,
            mainPredicate: value.mainPredicate,
            mainVariable: value.mainVariable,
            isVariable: false
        };
    }
    function calcNegation(values) {
        if (values.some(x => isNounValue(x) && !x.isVariable))
            throw new Error("CalcError: Unexpected Value");
        let comb = combine(values);
        return {
            formula: negation(quantify(comb.formula, comb.variables), comb.variables),
            variables: comb.variables,
            mainPredicate: undefined,
            mainVariable: undefined,
            isVariable: false
        };
    }
    function calcSentence(values) {
        if (values.some(x => isNounValue(x) && !x.isVariable))
            throw new Error("CalcError: Unexpected Value");
        let comb = combine(values);
        return {
            formula: quantify(comb.formula, comb.variables),
            variables: comb.variables,
            mainPredicate: undefined,
            mainVariable: undefined,
            isVariable: false
        };
    }
    function recursion(tree) {
        let values = tree.children.map(x => recursion(x));
        switch (tree.token.tokenType) {
            case "new_variable": return calcNewVariable(tree.token.character);
            case "continued_variable": return calcContinuedVariable(tree.token.character);
            case "last_variable": return calcLastVariable(tree.token.character);
            case "single_variable": return calcSingleVariable();
            case "predicate": return calcPredicate(tree.token.name);
            case "article": return calcArticle(tree.token.casus, values[0]);
            case "preposition": return calcPreposition(tree.token.casus, values[0], values[1]);
            case "union": return calcUnion(values[0], values[1]);
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
function normalize(formula) {
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
        let q = [];
        //それぞれの項から量化を剥ぐ
        fs = fs.map(x => {
            while (true) {
                if (x.formulaType === "exist") {
                    q.push({ type: exist, variable: x.variable });
                    x = x.formula;
                }
                else if (x.formulaType === "all") {
                    q.push({ type: all, variable: x.variable });
                    x = x.formula;
                }
                else
                    break;
            }
            return x;
        });
        let formula2 = fs.reduce((acc, cur) => {
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
        let q = [];
        //それぞれの項から量化を剥ぐ
        fs = fs.map(x => {
            while (true) {
                if (x.formulaType === "exist") {
                    q.push({ type: exist, variable: x.variable });
                    x = x.formula;
                }
                else if (x.formulaType === "all") {
                    q.push({ type: all, variable: x.variable });
                    x = x.formula;
                }
                else
                    break;
            }
            return x;
        });
        let formula2 = fs.reduce((acc, cur) => {
            return disjunction([acc, cur]);
        }, F());
        //剥いだ量化を被せる
        return q.reduce((acc, cur) => cur.type(cur.variable, acc), formula2);
    }
    return formula;
}
//文字列化
function stringify(formula) {
    if (formula.formulaType === "true")
        return "T";
    if (formula.formulaType === "false")
        return "F";
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
    if (formula.formulaType === "equation")
        return "(" + formula.a.name + "=" + formula.b.name + ")";
    let exhaustion = formula;
    return "";
}
function test() {
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
    inputs.forEach(x => {
        console.log(">" + x);
        console.log(stringify(calculate(parse(tokenize(x)))));
        //console.log(stringify(normalize(calculate(parse(tokenize(x))[0]))));
    });
}
function gebi(id) {
    return document.getElementById(id);
}
function updatePattern() {
    tokenPattern = new RegExp(gebi("token_pattern").value, "g");
    {
        let pattern = new RegExp("^" + gebi("single_variable_pattern").value + "$");
        isSingleVariable = literal => pattern.test(literal);
    }
    {
        let pattern = new RegExp("^" + gebi("new_variable_pattern").value + "$");
        let replacer = gebi("new_variable_replacer").value;
        isNewVariable = literal => pattern.test(literal);
        newVariableToCharacter = literal => literal.replace(pattern, replacer);
    }
    {
        let pattern = new RegExp("^" + gebi("continued_variable_pattern").value + "$");
        let replacer = gebi("continued_variable_replacer").value;
        isContinuedVariable = literal => pattern.test(literal);
        continuedVariableToCharacter = literal => literal.replace(pattern, replacer);
    }
    {
        let pattern = new RegExp("^" + gebi("last_variable_pattern").value + "$");
        let replacer = gebi("last_variable_replacer").value;
        isLastVariable = literal => pattern.test(literal);
        lastVariableToCharacter = literal => literal.replace(pattern, replacer);
    }
    {
        let pattern = new RegExp("^" + gebi("predicate_pattern").value + "$");
        let replacer = gebi("predicate_replacer").value;
        isPredicate = literal => pattern.test(literal);
        predicateToName = literal => literal.replace(pattern, replacer);
    }
    {
        let pattern = new RegExp("^" + gebi("article_pattern").value + "$");
        let replacer = gebi("article_replacer").value;
        isArticle = literal => pattern.test(literal);
        articleToCasus = literal => literal.replace(pattern, replacer);
    }
    {
        let pattern = new RegExp("^" + gebi("preposition_pattern").value + "$");
        let replacer = gebi("preposition_replacer").value;
        isPreposition = literal => pattern.test(literal);
        prepositionToCasus = literal => literal.replace(pattern, replacer);
    }
    {
        let pattern = new RegExp("^" + gebi("union_pattern").value + "$");
        isUnion = literal => pattern.test(literal);
    }
    {
        let pattern = new RegExp("^" + gebi("single_negation_pattern").value + "$");
        isSingleNegation = literal => pattern.test(literal);
    }
    {
        let pattern = new RegExp("^" + gebi("open_negation_pattern").value + "$");
        isOpenNegation = literal => pattern.test(literal);
    }
    {
        let pattern = new RegExp("^" + gebi("close_negation_pattern").value + "$");
        isCloseNegation = literal => pattern.test(literal);
    }
    update();
}
function reset1() {
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
    gebi("union_pattern").value = "o";
    gebi("single_negation_pattern").value = "no";
    gebi("open_negation_pattern").value = "nou";
    gebi("close_negation_pattern").value = "noi";
    updatePattern();
}
function update() {
    gebi("output").innerText = "";
    gebi("error").innerText = "";
    let input = gebi("input").value;
    try {
        gebi("output").innerText = stringify(normalize(calculate(parse(tokenize(input)))));
    }
    catch (e) {
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
  gebi("union_pattern").oninput = updatePattern;
  gebi("single_negation_pattern").oninput = updatePattern;
  gebi("open_negation_pattern").oninput = updatePattern;
  gebi("close_negation_pattern").oninput = updatePattern;
  reset1();
}