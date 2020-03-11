"use strict";
//字句解析
let separatorPattern;
let isSingleVariable;
let isNewVariable;
let newVariableToCharacter;
let isContinuedVariable;
let continuedVariableToCharacter;
let isLastVariable;
let lastVariableToCharacter;
let isPredicate;
let predicateToName;
let isRelative;
let relativeToCasus;
let isPreposition;
let prepositionToCasus;
let isSingleNegation;
let isOpenNegation;
let isCloseNegation;
//トークン単位に分割し、必要な情報を付加する
function tokenize(input) {
    const literals = input.split(separatorPattern).filter(x => x !== "");
    const tokens = literals.map(literal => {
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
// ポーランド記法を解く
function parse(tokens) {
    const token = tokens.shift();
    if (token === undefined)
        throw new Error("ParseError: Unxpected End of Tokens");
    const arity = getArity(token);
    if (arity === ")")
        throw new Error("ParseError: Unxpected Token " + token.literal);
    const children = [];
    if (arity === "(") {
        while (true) {
            const next = tokens[0];
            if (next === undefined)
                throw new Error("ParseError: Unxpected End of Tokens");
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
    function getArity(token) {
        switch (token.tokenType) {
            case "new_variable": return 0;
            case "continued_variable": return 0;
            case "last_variable": return 0;
            case "single_variable": return 0;
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
;
function calculate(tree) {
    const variableTable = {};
    let variableCount = 0;
    function issueVariable() { return { name: "" + variableCount++ }; }
    function Predicate(name, args) {
        return {
            formulaType: "predicate",
            subgraphType: "predicate",
            name,
            args
        };
    }
    function cut(graph) {
        return {
            children: [{
                    subgraphType: "cut",
                    content: graph
                }],
            usings: graph.usings
        };
    }
    function merge(a, b) {
        return {
            children: [...a.children, ...b.children],
            usings: [...a.usings, ...b.usings]
        };
    }
    function isNounValue(value) { return value.mainVariable !== undefined; }
    function isPredicateValue(value) { return value.mainPredicate !== undefined; }
    function convertToNoun(a) {
        if (isNounValue(a))
            return a;
        if (!isPredicateValue(a))
            throw new Error("CalcError: Unexpected Value");
        return calcRelative("", a, calcSingleVariable());
    }
    function calcNewVariable(character) {
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
    function calcContinuedVariable(character) {
        let variable = variableTable[character];
        if (variable === undefined) {
            console.warn();
            variable = issueVariable();
            variableTable[character] = variable;
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
    function calcLastVariable(character) {
        let variable = variableTable[character];
        if (variable === undefined) {
            console.warn();
            variable = issueVariable();
        }
        else
            delete variableTable[character];
        return {
            graph: {
                children: [],
                usings: [variable]
            },
            mainPredicate: undefined,
            mainVariable: variable
        };
    }
    function calcSingleVariable() {
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
    function calcPredicate(name) {
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
    function calcRelative(casus, a, b) {
        if (!isPredicateValue(a))
            throw new Error("CalcError: Unexpected Value");
        const bb = convertToNoun(b);
        a.mainPredicate.args.unshift({ casus: casus, variable: bb.mainVariable });
        return {
            graph: merge(a.graph, bb.graph),
            mainPredicate: undefined,
            mainVariable: bb.mainVariable
        };
    }
    function calcPreposition(casus, a, b) {
        const aa = convertToNoun(a);
        if (!isPredicateValue(b))
            throw new Error("CalcError: Unexpected Value");
        b.mainPredicate.args.unshift({ casus: casus, variable: aa.mainVariable });
        return {
            graph: merge(aa.graph, b.graph),
            mainPredicate: b.mainPredicate,
            mainVariable: undefined
        };
    }
    function calcSingleNegation(value) {
        return {
            graph: cut(value.graph),
            mainPredicate: value.mainPredicate,
            mainVariable: value.mainVariable
        };
    }
    function calcNegation(values) {
        return {
            graph: cut(calcSentence(values).graph),
            mainPredicate: undefined,
            mainVariable: undefined
        };
    }
    function calcSentence(values) {
        return {
            graph: values.map(x => x.graph).reduce(merge, { children: [], usings: [] }),
            mainPredicate: undefined,
            mainVariable: undefined
        };
    }
    function recursion(tree) {
        const values = tree.children.map(x => recursion(x));
        switch (tree.token.tokenType) {
            case "new_variable": return calcNewVariable(tree.token.character);
            case "continued_variable": return calcContinuedVariable(tree.token.character);
            case "last_variable": return calcLastVariable(tree.token.character);
            case "single_variable": return calcSingleVariable();
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
//存在グラフを論理式に変換。主に量化が難点
function formularize(graph) {
    function recursion(graph, inner) {
        const core = conjunction(graph.children.map(subgraph => {
            switch (subgraph.subgraphType) {
                case "cut": {
                    //内部の数が全体の数と一致するもの、一致しないものに分ける
                    const a = [];
                    const b = [];
                    inner.forEach(x => (count(x, subgraph.content.usings) === count(x, inner) ? a : b).push(x));
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
        return removeDup(inner).reduce((a, c) => exist(c, a), core);
    }
    function count(element, array) {
        return array.filter(x => x === element).length;
    }
    function removeDup(array) {
        return Array.from(new Set(array));
    }
    return recursion(graph, [...graph.usings]);
}
//標準化
function normalize(formula) {
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
        const q = [];
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
                else
                    break;
            }
            return x;
        });
        const formula2 = fs.reduce((acc, cur) => {
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
        const q = [];
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
                else
                    break;
            }
            return x;
        });
        const formula2 = fs.reduce((acc, cur) => {
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
    const exhaustion = formula;
    return "";
}
function test() {
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
        console.log(stringify(formularize(calculate(parse(tokenize(x))))));
        console.log(stringify(normalize(formularize(calculate(parse(tokenize(x)))))));
    });
}
function gebi(id) {
    return document.getElementById(id);
}
function updatePattern() {
    separatorPattern = new RegExp(gebi("separator_pattern").value);
    const singleVariablePattern = new RegExp("^" + gebi("single_variable_pattern").value + "$");
    isSingleVariable = literal => singleVariablePattern.test(literal);
    const newVariablePattern = new RegExp("^" + gebi("new_variable_pattern").value + "$");
    const newVariableReplacer = gebi("new_variable_replacer").value;
    isNewVariable = literal => newVariablePattern.test(literal);
    newVariableToCharacter = literal => literal.replace(newVariablePattern, newVariableReplacer);
    const continuedVariablePattern = new RegExp("^" + gebi("continued_variable_pattern").value + "$");
    const continuedVariableReplacer = gebi("continued_variable_replacer").value;
    isContinuedVariable = literal => continuedVariablePattern.test(literal);
    continuedVariableToCharacter = literal => literal.replace(continuedVariablePattern, continuedVariableReplacer);
    const lastVariablePattern = new RegExp("^" + gebi("last_variable_pattern").value + "$");
    const lastVariableReplacer = gebi("last_variable_replacer").value;
    isLastVariable = literal => lastVariablePattern.test(literal);
    lastVariableToCharacter = literal => literal.replace(lastVariablePattern, lastVariableReplacer);
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
function reset1() {
    gebi("separator_pattern").value = "[,.\\s]";
    gebi("single_variable_pattern").value = "au";
    gebi("new_variable_pattern").value = "a('[aeiou])*";
    gebi("new_variable_replacer").value = "$1";
    gebi("continued_variable_pattern").value = "i('[aeiou])*";
    gebi("continued_variable_replacer").value = "$1";
    gebi("last_variable_pattern").value = "u('[aeiou])*";
    gebi("last_variable_replacer").value = "$1";
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
function update() {
    gebi("output").innerText = "";
    gebi("error").innerText = "";
    const input = gebi("input").value;
    try {
        gebi("output").innerText = stringify(formularize(calculate(parse(tokenize(input)))));
    }
    catch (e) {
        gebi("error").innerText = e.message;
    }
}
window.onload = () => {
    gebi("input").oninput = update;
    gebi("separator_pattern").oninput = updatePattern;
    gebi("single_variable_pattern").oninput = updatePattern;
    gebi("new_variable_pattern").oninput = updatePattern;
    gebi("new_variable_replacer").oninput = updatePattern;
    gebi("continued_variable_pattern").oninput = updatePattern;
    gebi("continued_variable_replacer").oninput = updatePattern;
    gebi("last_variable_pattern").oninput = updatePattern;
    gebi("last_variable_replacer").oninput = updatePattern;
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
