"use strict";
//字句解析
let separatorPattern;
let isIsolatedDeterminer;
let isNewDeterminer;
let newDeterminerToKey;
let isInheritDeterminer;
let inheritDeterminerToKey;
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
        if (isIsolatedDeterminer(literal))
            return { literal, tokenType: "isolatedDeterminer" };
        if (isNewDeterminer(literal))
            return { literal, tokenType: "new_determiner", key: newDeterminerToKey(literal) };
        if (isInheritDeterminer(literal))
            return { literal, tokenType: "inherit_determiner", key: inheritDeterminerToKey(literal) };
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
            case "new_determiner": return 0;
            case "inherit_determiner": return 0;
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
function T() {
    return { formulaType: "true" };
}
function F() {
    return { formulaType: "false" };
}
function PredicateFormula(name, args) {
    return {
        formulaType: "predicate",
        name,
        args
    };
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
;
function calculate(tree) {
    const variableMap = [];
    let variableCount = 0;
    function issueVariable() { return { id: "" + variableCount++ }; }
    function findVariable(key) {
        const a = variableMap.find(closure => closure.some(entry => entry.key === key));
        const b = a === undefined ? undefined : a.find(entry => entry.key === key);
        return b === undefined ? undefined : b.variable;
        //return variableMap.map(map=>map.get(key)).find((x):x is Variable=>x !== undefined);
    }
    function isNounPhrase(phrase) { return phrase.mainVariable !== undefined; }
    function isPredicatePhrase(phrase) { return phrase.mainPredicate !== undefined; }
    function convertToNoun(a) {
        if (isNounPhrase(a))
            return a;
        if (!isPredicatePhrase(a))
            throw new Error("CalcError: Unexpected Phrase");
        return calcRelative("", a, calcIsolatedDeterminer());
    }
    function calcIsolatedDeterminer() {
        const variable = issueVariable();
        variableMap[0].unshift({ key: null, variable });
        return {
            formula: T(),
            mainPredicate: undefined,
            mainVariable: variable
        };
    }
    function calcNewDeterminer(key) {
        const variable = issueVariable();
        variableMap[0].unshift({ key, variable });
        return {
            formula: T(),
            mainPredicate: undefined,
            mainVariable: variable
        };
    }
    function calcInheritDeterminer(key) {
        const variable = findVariable(key);
        if (variable === undefined) {
            console.warn();
            return calcNewDeterminer(key);
        }
        return {
            formula: T(),
            mainPredicate: undefined,
            mainVariable: variable
        };
    }
    function calcPredicate(name) {
        const predicate = PredicateFormula(name, []);
        return {
            formula: predicate,
            mainPredicate: predicate,
            mainVariable: undefined
        };
    }
    function calcRelative(casus, a, b) {
        if (!isPredicatePhrase(a))
            throw new Error("CalcError: Unexpected Phrase");
        const bb = convertToNoun(b);
        a.mainPredicate.args.unshift({ casus: casus, variable: bb.mainVariable });
        return {
            formula: conjunction([a.formula, bb.formula]),
            mainPredicate: undefined,
            mainVariable: bb.mainVariable
        };
    }
    function calcPreposition(casus, a, b) {
        const aa = convertToNoun(a);
        if (!isPredicatePhrase(b))
            throw new Error("CalcError: Unexpected Phrase");
        b.mainPredicate.args.unshift({ casus: casus, variable: aa.mainVariable });
        return {
            formula: conjunction([aa.formula, b.formula]),
            mainPredicate: b.mainPredicate,
            mainVariable: undefined
        };
    }
    function calcSingleNegation(phrase) {
        const v = variableMap.shift();
        if (v === undefined)
            throw new Error();
        const variables = v.map(entry => entry.variable);
        return {
            formula: negation(variables.reduce((f, v) => exist(v, f), phrase.formula)),
            mainPredicate: phrase.mainPredicate,
            mainVariable: phrase.mainVariable
        };
    }
    function calcNegation(phrases) {
        return {
            formula: negation(calcSentence(phrases).formula),
            mainPredicate: undefined,
            mainVariable: undefined
        };
    }
    function calcSentence(phrases) {
        const v = variableMap.shift();
        if (v === undefined)
            throw new Error();
        const variables = v.map(entry => entry.variable);
        return {
            formula: variables.reduce((f, v) => exist(v, f), conjunction(phrases.map(x => x.formula))),
            mainPredicate: undefined,
            mainVariable: undefined
        };
    }
    function recursion(tree) {
        // 否定はクロージャを生成
        switch (tree.token.tokenType) {
            case "open_negation":
            case "single_negation":
            case "open_sentence":
                variableMap.unshift([]);
        }
        const phrases = tree.children.map(x => recursion(x));
        switch (tree.token.tokenType) {
            case "new_determiner": return calcNewDeterminer(tree.token.key);
            case "inherit_determiner": return calcInheritDeterminer(tree.token.key);
            case "isolatedDeterminer": return calcIsolatedDeterminer();
            case "predicate": return calcPredicate(tree.token.name);
            case "relative": return calcRelative(tree.token.casus, phrases[0], phrases[1]);
            case "preposition": return calcPreposition(tree.token.casus, phrases[0], phrases[1]);
            case "single_negation": return calcSingleNegation(phrases[0]);
            case "open_negation": return calcNegation(phrases);
            case "open_sentence": return calcSentence(phrases);
            // parseでふくめてないので来ないはず
            case "close_negation":
            case "close_sentence": throw 0;
        }
    }
    const result = recursion(tree);
    return result.formula;
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
        return "⊤";
    if (formula.formulaType === "false")
        return "⊥";
    if (formula.formulaType === "exist")
        return "∃" + formula.variable.id + ";" + stringify(formula.formula);
    if (formula.formulaType === "all")
        return "∀" + formula.variable.id + ";" + stringify(formula.formula);
    if (formula.formulaType === "conjunction")
        return "(" + formula.formulas.map(x => stringify(x)).join("∧") + ")";
    if (formula.formulaType === "disjunction")
        return "(" + formula.formulas.map(x => stringify(x)).join("∨") + ")";
    if (formula.formulaType === "negation")
        return "￢" + stringify(formula.formula);
    if (formula.formulaType === "predicate")
        return formula.name + "(" + formula.args.map(x => (x.casus + ":" + x.variable.id)).join(", ") + ")";
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
        console.log(stringify(calculate(parse(tokenize(x)))));
        console.log(stringify(normalize(calculate(parse(tokenize(x))))));
    });
}
function gebi(id) {
    return document.getElementById(id);
}
const doms = (function () {
    const input = gebi("input");
    if (!(input instanceof HTMLTextAreaElement))
        throw new Error("DOM not found");
    const formula_output = gebi("formula_output");
    if (!(formula_output instanceof HTMLDivElement))
        throw new Error("DOM not found");
    const normalized_formula_output = gebi("normalized_formula_output");
    if (!(normalized_formula_output instanceof HTMLDivElement))
        throw new Error("DOM not found");
    const error_output = gebi("error_output");
    if (!(error_output instanceof HTMLDivElement))
        throw new Error("DOM not found");
    const separator_pattern = gebi("separator_pattern");
    if (!(separator_pattern instanceof HTMLInputElement))
        throw new Error("DOM not found");
    const isolated_determiner_pattern = gebi("isolated_determiner_pattern");
    if (!(isolated_determiner_pattern instanceof HTMLInputElement))
        throw new Error("DOM not found");
    const new_determiner_pattern = gebi("new_determiner_pattern");
    if (!(new_determiner_pattern instanceof HTMLInputElement))
        throw new Error("DOM not found");
    const new_determiner_replacer = gebi("new_determiner_replacer");
    if (!(new_determiner_replacer instanceof HTMLInputElement))
        throw new Error("DOM not found");
    const inherit_determiner_pattern = gebi("inherit_determiner_pattern");
    if (!(inherit_determiner_pattern instanceof HTMLInputElement))
        throw new Error("DOM not found");
    const inherit_determiner_replacer = gebi("inherit_determiner_replacer");
    if (!(inherit_determiner_replacer instanceof HTMLInputElement))
        throw new Error("DOM not found");
    const predicate_pattern = gebi("predicate_pattern");
    if (!(predicate_pattern instanceof HTMLInputElement))
        throw new Error("DOM not found");
    const predicate_replacer = gebi("predicate_replacer");
    if (!(predicate_replacer instanceof HTMLInputElement))
        throw new Error("DOM not found");
    const relative_pattern = gebi("relative_pattern");
    if (!(relative_pattern instanceof HTMLInputElement))
        throw new Error("DOM not found");
    const relative_replacer = gebi("relative_replacer");
    if (!(relative_replacer instanceof HTMLInputElement))
        throw new Error("DOM not found");
    const preposition_pattern = gebi("preposition_pattern");
    if (!(preposition_pattern instanceof HTMLInputElement))
        throw new Error("DOM not found");
    const preposition_replacer = gebi("preposition_replacer");
    if (!(preposition_replacer instanceof HTMLInputElement))
        throw new Error("DOM not found");
    const single_negation_pattern = gebi("single_negation_pattern");
    if (!(single_negation_pattern instanceof HTMLInputElement))
        throw new Error("DOM not found");
    const open_negation_pattern = gebi("open_negation_pattern");
    if (!(open_negation_pattern instanceof HTMLInputElement))
        throw new Error("DOM not found");
    const close_negation_pattern = gebi("close_negation_pattern");
    if (!(close_negation_pattern instanceof HTMLInputElement))
        throw new Error("DOM not found");
    return {
        input,
        formula_output,
        normalized_formula_output,
        error_output,
        separator_pattern,
        isolated_determiner_pattern,
        new_determiner_pattern,
        new_determiner_replacer,
        inherit_determiner_pattern,
        inherit_determiner_replacer,
        predicate_pattern,
        predicate_replacer,
        relative_pattern,
        relative_replacer,
        preposition_pattern,
        preposition_replacer,
        single_negation_pattern,
        open_negation_pattern,
        close_negation_pattern,
    };
})();
function updatePattern() {
    separatorPattern = new RegExp(doms.separator_pattern.value);
    const isolatedDeterminerPattern = new RegExp("^" + doms.isolated_determiner_pattern.value + "$");
    isIsolatedDeterminer = literal => isolatedDeterminerPattern.test(literal);
    const newDeterminerPattern = new RegExp("^" + doms.new_determiner_pattern.value + "$");
    const newDeterminerReplacer = doms.new_determiner_replacer.value;
    isNewDeterminer = literal => newDeterminerPattern.test(literal);
    newDeterminerToKey = literal => literal.replace(newDeterminerPattern, newDeterminerReplacer);
    const inheritDeterminerPattern = new RegExp("^" + doms.inherit_determiner_pattern.value + "$");
    const inheritDeterminerReplacer = doms.inherit_determiner_replacer.value;
    isInheritDeterminer = literal => inheritDeterminerPattern.test(literal);
    inheritDeterminerToKey = literal => literal.replace(inheritDeterminerPattern, inheritDeterminerReplacer);
    const predicatePattern = new RegExp("^" + doms.predicate_pattern.value + "$");
    const predicateReplacer = doms.predicate_replacer.value;
    isPredicate = literal => predicatePattern.test(literal);
    predicateToName = literal => literal.replace(predicatePattern, predicateReplacer);
    const relativePattern = new RegExp("^" + doms.relative_pattern.value + "$");
    const relativeReplacer = doms.relative_replacer.value;
    isRelative = literal => relativePattern.test(literal);
    relativeToCasus = literal => literal.replace(relativePattern, relativeReplacer);
    const prepositionPattern = new RegExp("^" + doms.preposition_pattern.value + "$");
    const prepositionReplacer = doms.preposition_replacer.value;
    isPreposition = literal => prepositionPattern.test(literal);
    prepositionToCasus = literal => literal.replace(prepositionPattern, prepositionReplacer);
    const singleNegationPattern = new RegExp("^" + doms.single_negation_pattern.value + "$");
    isSingleNegation = literal => singleNegationPattern.test(literal);
    const openNegationPattern = new RegExp("^" + doms.open_negation_pattern.value + "$");
    isOpenNegation = literal => openNegationPattern.test(literal);
    const closeNegationPattern = new RegExp("^" + doms.close_negation_pattern.value + "$");
    isCloseNegation = literal => closeNegationPattern.test(literal);
    update();
}
function reset1() {
    doms.separator_pattern.value = "[,.\\s]";
    doms.isolated_determiner_pattern.value = "au";
    doms.new_determiner_pattern.value = "a('[aeiou])*";
    doms.new_determiner_replacer.value = "$1";
    doms.inherit_determiner_pattern.value = "i('[aeiou])*";
    doms.inherit_determiner_replacer.value = "$1";
    doms.predicate_pattern.value = "(([^aeiou'][aeiou]){2,})";
    doms.predicate_replacer.value = "$1";
    doms.relative_pattern.value = "([^aeiou]?)ei";
    doms.relative_replacer.value = "$1";
    doms.preposition_pattern.value = "([^aeiou]?)e";
    doms.preposition_replacer.value = "$1";
    doms.single_negation_pattern.value = "no";
    doms.open_negation_pattern.value = "nou";
    doms.close_negation_pattern.value = "noi";
    updatePattern();
}
function update() {
    doms.formula_output.innerText = "";
    doms.normalized_formula_output.innerText = "";
    doms.error_output.innerText = "";
    const input = doms.input.value;
    try {
        doms.formula_output.innerHTML = markupFormula(stringify(calculate(parse(tokenize(input)))));
        doms.normalized_formula_output.innerHTML = markupFormula(stringify(normalize(calculate(parse(tokenize(input))))));
    }
    catch (e) {
        doms.error_output.innerText = e.message;
    }
}
window.onload = () => {
    doms.input.oninput = update;
    doms.separator_pattern.oninput = updatePattern;
    doms.isolated_determiner_pattern.oninput = updatePattern;
    doms.new_determiner_pattern.oninput = updatePattern;
    doms.new_determiner_replacer.oninput = updatePattern;
    doms.inherit_determiner_pattern.oninput = updatePattern;
    doms.inherit_determiner_replacer.oninput = updatePattern;
    doms.predicate_pattern.oninput = updatePattern;
    doms.predicate_replacer.oninput = updatePattern;
    doms.relative_pattern.oninput = updatePattern;
    doms.relative_replacer.oninput = updatePattern;
    doms.preposition_pattern.oninput = updatePattern;
    doms.preposition_replacer.oninput = updatePattern;
    doms.single_negation_pattern.oninput = updatePattern;
    doms.open_negation_pattern.oninput = updatePattern;
    doms.close_negation_pattern.oninput = updatePattern;
    reset1();
};
