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
function negation(formula) {
    return { formulaType: "negation", formula };
}
function exist(variable, formula) {
    return { formulaType: "exist", variable, formula };
}
function all(variable, formula) {
    return { formulaType: "all", variable, formula };
}
function conjunction(formulas) {
    formulas = formulas.reduce((acc, cur) => {
        if (cur.formulaType === "true")
            return acc;
        if (cur.formulaType === "conjunction")
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
    function combine(formulas) {
        let variables = formulas.map(x => enumrateQuantify(x)).reduce((acc, cur) => [...acc, ...cur], []);
        let duplication = variables.filter((x, i, self) => self.indexOf(x) === i && i !== self.lastIndexOf(x));
        return duplication.reduce((acc, cur) => exist(cur, acc), duplication.reduce((acc, cur) => removeQuantify(acc, cur), conjunction(formulas)));
        function enumrateQuantify(formula) {
            if (formula.formulaType === "exist")
                return [formula.variable, ...enumrateQuantify(formula.formula)];
            else if (formula.formulaType === "negation")
                return enumrateQuantify(formula.formula);
            else if (formula.formulaType === "conjunction")
                return formula.formulas.map(x => enumrateQuantify(x)).reduce((cur, acc) => [...cur, ...acc]);
            else
                return [];
        }
        function removeQuantify(formula, variable) {
            if (formula.formulaType === "exist") {
                if (variable === formula.variable)
                    return formula.formula;
                else
                    return exist(formula.variable, removeQuantify(formula.formula, variable));
            }
            else if (formula.formulaType === "negation")
                return negation(removeQuantify(formula.formula, variable));
            else if (formula.formulaType === "conjunction")
                return conjunction(formula.formulas.map(x => removeQuantify(x, variable)));
            return formula;
        }
    }
    function isNounValue(value) { return value.mainVariable !== undefined; }
    function isPredicateValue(value) { return value.mainPredicate !== undefined; }
    function calcNewVariable(character) {
        let variable = issueVariable();
        variableTable[character] = variable;
        return {
            formula: exist(variable, T()),
            mainPredicate: undefined,
            mainVariable: variable
        };
    }
    function calcContinuedVariable(character) {
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
    function calcLastVariable(character) {
        let variable = variableTable[character];
        if (variable === undefined) {
            console.warn();
            variable = issueVariable();
        }
        else
            delete variableTable[character];
        return {
            formula: exist(variable, T()),
            mainPredicate: undefined,
            mainVariable: variable
        };
    }
    function calcSingleVariable() {
        let variable = issueVariable();
        return {
            formula: exist(variable, T()),
            mainPredicate: undefined,
            mainVariable: variable
        };
    }
    function calcPredicate(name) {
        let formula = predicate(name, []);
        return {
            formula: formula,
            mainVariable: undefined,
            mainPredicate: formula
        };
    }
    function calcArticle(casus, a) {
        if (!isPredicateValue(a) || isNounValue(a))
            throw new Error("CalcError: Unexpected Value");
        let variable = issueVariable();
        a.mainPredicate.args.unshift({ casus: casus, variable: variable });
        return {
            formula: exist(variable, a.formula),
            mainPredicate: a.mainPredicate,
            mainVariable: variable
        };
    }
    function calcPreposition(casus, a, b) {
        if (!isPredicateValue(b))
            throw new Error("CalcError: Unexpected Value");
        let aa = isNounValue(a) ? a : calcArticle("", a);
        b.mainPredicate.args.unshift({ casus: casus, variable: aa.mainVariable });
        return {
            formula: combine([aa.formula, b.formula]),
            mainPredicate: b.mainPredicate,
            mainVariable: b.mainVariable
        };
    }
    function calcUnion(a, b) {
        let aa = isNounValue(a) ? a : calcArticle("", a);
        let bb = isNounValue(b) ? b : calcArticle("", b);
        return {
            formula: conjunction([combine([aa.formula, bb.formula]), equation(aa.mainVariable, bb.mainVariable)]),
            mainVariable: aa.mainVariable,
            mainPredicate: undefined
        };
    }
    function calcSingleNegation(value) {
        return {
            formula: negation(value.formula),
            mainPredicate: value.mainPredicate,
            mainVariable: value.mainVariable
        };
    }
    function calcNegation(values) {
        return {
            formula: negation(combine(values.map(x => x.formula))),
            mainPredicate: undefined,
            mainVariable: undefined
        };
    }
    function calcSentence(values) {
        return {
            formula: combine(values.map(x => x.formula)),
            mainPredicate: undefined,
            mainVariable: undefined
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
        console.log(stringify(normalize(calculate(parse(tokenize(x))))));
    });
}
function gebi(id) {
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
    let unionPattern = new RegExp("^" + gebi("union_pattern").value + "$");
    isUnion = literal => unionPattern.test(literal);
    let singleNegationPattern = new RegExp("^" + gebi("single_negation_pattern").value + "$");
    isSingleNegation = literal => singleNegationPattern.test(literal);
    let openNegationPattern = new RegExp("^" + gebi("open_negation_pattern").value + "$");
    isOpenNegation = literal => openNegationPattern.test(literal);
    let closeNegationPattern = new RegExp("^" + gebi("close_negation_pattern").value + "$");
    isCloseNegation = literal => closeNegationPattern.test(literal);
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
};
