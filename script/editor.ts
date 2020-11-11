

function showGloss(tokens: Token[]) {
    const output = document.createElement("span");
    output.classList.add("glossed");

    tokens.forEach(token => {
        const ruby = document.createElement("ruby");
        ruby.appendChild(document.createTextNode(token.literal));
        const rt = document.createElement("rt");
        rt.appendChild(document.createTextNode(token.gloss));
        ruby.appendChild(rt);
        output.appendChild(ruby);
        output.appendChild(document.createTextNode(" "));
    });

    return output;
}

function visualizePhraseStructure(phrases: Phrase[]) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    document.body.appendChild(svg);

    const u = 3;
    const spaceWidth = 10;

    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "#444");
    svg.setAttribute("stroke-width", "3");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");

    const result = phrases.reduce((state, child) => {
        const result = recursion(child, state.nextX);
        return { nextX: result.nextX, height: Math.max(state.height, result.height) };
    }, { nextX: 10, height: 0 });
    const height = (2 * result.height + 20 * u + 20);
    const width = result.nextX;
    svg.setAttribute("height", "" + height);
    svg.setAttribute("width", "" + width);
    svg.setAttribute("viewBox", [0, -height / 2, width, height].join(" "));

    document.body.removeChild(svg);

    return svg;

    function recursion(phrase: Phrase, x: number): {
        height: number,
        varX: number; varY: number;
        argX: number; argY: number,
        predX: number;
        nextX: number;
    } {

        function createOverPath(startX: number, endX: number, endY: number, height: number, convert: boolean) {
            if (convert) {
                const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path1.setAttribute("d", [
                    "M", startX, -10 * u,
                    "c", 0, -2 * u, 0, -2 * u, 2 * u, -5 * u,
                    "l", height / 6 * 4 - 4 * u, -height + 6 * u,
                    "c", u, -1.5 * u, 2 * u, -3 * u, 4 * u, -3 * u,
                    "l", endX - (2 * height - endY) / 6 * 4 - 6 * u - startX, 0,
                    "c", 2 * u, 0, 3 * u, 1.5 * u, 4 * u, 3 * u,
                    "l", height / 6 * 4 - 4 * u, height - 6 * u,
                ].join(" "));
                svg.appendChild(path1);

                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute("cx", "" + (endX));
                circle.setAttribute("cy", "" + (endY - 9 * u));
                circle.setAttribute("r", "15");
                svg.appendChild(circle);

                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute("x", "" + (endX));
                text.setAttribute("y", "" + (endY - 9 * u - 2));
                text.setAttribute("fill", "#222");
                text.setAttribute("stroke", "none");
                text.setAttribute("font-size", "20px");
                text.setAttribute("text-anchor", "middle");
                text.setAttribute("dominant-baseline", "central");
                text.textContent = "e";
                svg.appendChild(text);

                return;
            }
            if (endY == 0) {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute("d", [
                    "M", startX, -10 * u,
                    "c", 0, -2 * u, 0, -2 * u, 2 * u, -5 * u,
                    "l", height / 6 * 4 - 4 * u, -height + 6 * u,
                    "c", u, -1.5 * u, 2 * u, -3 * u, 4 * u, -3 * u,
                    "l", endX - (2 * height - endY) / 6 * 4 - 6 * u - startX, 0,
                    "c", 2 * u, 0, 3 * u, 1.5 * u, 4 * u, 3 * u,
                    "l", height / 6 * 4, height
                ].join(" "));
                svg.appendChild(path);
                return;
            }

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute("d", [
                "M", startX, -10 * u,
                "c", 0, -2 * u, 0, -2 * u, 2 * u, -5 * u,
                "l", height / 6 * 4 - 4 * u, -height + 6 * u,
                "c", u, -1.5 * u, 2 * u, -3 * u, 4 * u, -3 * u,
                "l", endX - (2 * height - endY) / 6 * 4 - 6 * u - startX, 0,
                "c", 2 * u, 0, 3 * u, 1.5 * u, 4 * u, 3 * u,
                "l", (height - endY) / 6 * 4 - 4 * u, height - endY - 6 * u,
                "c", 1 * u, 1.5 * u, 2 * u, 3 * u, 4 * u, 3 * u
            ].join(" "));
            svg.appendChild(path);
        }
        function createUnderPath(startX: number, endX: number, endY: number, height: number) {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute("stroke-dasharray", "5");
            if (endY == 0) {
                path.setAttribute("d", [
                    "M", startX, 10 * u,
                    "c", 0, 2 * u, 0, 2 * u, 2 * u, 5 * u,
                    "l", height / 6 * 4 - 4 * u, height - 6 * u,
                    "c", u, 1.5 * u, 2 * u, 3 * u, 4 * u, 3 * u,
                    "l", endX - (2 * height - endY) / 6 * 4 - 6 * u - startX, 0,
                    "c", 2 * u, 0, 3 * u, -1.5 * u, 4 * u, -3 * u,
                    "l", (height - endY) / 6 * 4, - height + endY
                ].join(" "));
            }
            else {
                path.setAttribute("d", [
                    "M", startX, 10 * u,
                    "c", 0, 2 * u, 0, 2 * u, 2 * u, 5 * u,
                    "l", height / 6 * 4 - 4 * u, height - 6 * u,
                    "c", u, 1.5 * u, 2 * u, 3 * u, 4 * u, 3 * u,
                    "l", endX - (2 * height - endY) / 6 * 4 - 6 * u - startX, 0,
                    "c", 2 * u, 0, 3 * u, -1.5 * u, 4 * u, -3 * u,
                    "l", (height - endY) / 6 * 4 - 2 * u, - height + endY + 3 * u
                ].join(" "));
            }
            svg.appendChild(path);
        }

        const wrapperWidth =
            (phrase.phraseType === "isolated_determiner"
                || phrase.phraseType === "new_determiner"
                || phrase.phraseType === "inherit_determiner"
                || phrase.phraseType === "preposition"
                || phrase.phraseType === "relative" ? 15 : 0);

        const literalSVG = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        literalSVG.textContent = phrase.token.literal;
        literalSVG.setAttribute("fill", "#222");
        literalSVG.setAttribute("stroke", "none");
        literalSVG.setAttribute("font-size", "20px");
        literalSVG.setAttribute("x", "" + (x + wrapperWidth));
        literalSVG.setAttribute("y", "0");
        literalSVG.setAttribute("dominant-baseline", "central");
        svg.appendChild(literalSVG);

        const literalWidth = literalSVG.getBoundingClientRect().width + 2 * wrapperWidth;
        let literalNextX = x + literalWidth + spaceWidth;
        const literalCenterX = x + literalWidth / 2;

        switch (phrase.phraseType) {
            case "negation": {
                const childrenResult = phrase.children.reduce((state, child) => {
                    const result = recursion(child, state.nextX);
                    return { nextX: result.nextX, height: Math.max(state.height, result.height) };
                }, { nextX: literalNextX, height: 0 });

                const closeLiteralSVG = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                closeLiteralSVG.textContent = phrase.closeToken.literal;
                closeLiteralSVG.setAttribute("fill", "#222");
                closeLiteralSVG.setAttribute("font-size", "20px");
                closeLiteralSVG.setAttribute("stroke", "none");
                closeLiteralSVG.setAttribute("x", "" + childrenResult.nextX);
                closeLiteralSVG.setAttribute("dominant-baseline", "central");
                svg.appendChild(closeLiteralSVG);
                let closeLiteralNextX = childrenResult.nextX + closeLiteralSVG.getBoundingClientRect().width + spaceWidth;
                const closeLiteralCenterX = childrenResult.nextX + closeLiteralSVG.getBoundingClientRect().width / 2;

                const startX = literalCenterX;
                const endX = closeLiteralCenterX;
                const height = childrenResult.height + 6 * u;
                const overPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                overPath.setAttribute("stroke-width", "1px");
                overPath.setAttribute("d", [
                    "M", literalCenterX, -10 * u,
                    "c", 0, -2 * u, 0, -2 * u, 2 * u, -5 * u,
                    "l", height / 6 * 4 - 4 * u, -height + 6 * u,
                    "c", u, -1.5 * u, 2 * u, -3 * u, 4 * u, -3 * u,
                    "l", endX - height / 6 * 8 - 4 * u - startX, 0,
                    "c", 2 * u, 0, 3 * u, 1.5 * u, 4 * u, 3 * u,
                    "l", height / 6 * 4 - 4 * u, height - 6 * u,
                    "c", 2 * u, 3 * u, 2 * u, 3 * u, 2 * u, 5 * u].join(" "));
                svg.appendChild(overPath);

                const underPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                underPath.setAttribute("stroke-width", "1px");
                underPath.setAttribute("d", [
                    "M", literalCenterX, 10 * u,
                    "c", 0, 2 * u, 0, 2 * u, 2 * u, 5 * u,
                    "l", height / 6 * 4 - 4 * u, height - 6 * u,
                    "c", u, 1.5 * u, 2 * u, 3 * u, 4 * u, 3 * u,
                    "l", endX - height / 6 * 8 - 4 * u - startX, 0,
                    "c", 2 * u, 0, 3 * u, -1.5 * u, 4 * u, -3 * u,
                    "l", height / 6 * 4 - 4 * u, -height + 6 * u,
                    "c", 2 * u, -3 * u, 2 * u, -3 * u, 2 * u, -5 * u].join(" "));
                svg.appendChild(underPath);

                return {
                    nextX: closeLiteralNextX + spaceWidth,
                    height: childrenResult.height + 6 * u,
                    varX: NaN,
                    varY: NaN,
                    argX: NaN,
                    argY: NaN,
                    predX: NaN,
                };
            }
            case "single_negation": {
                const child = recursion(phrase.child, literalNextX);

                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const startX = literalCenterX;
                const endX = child.nextX;
                const height = child.height + 6 * u;
                path.setAttribute("d", [
                    "M", literalCenterX, -10 * u,
                    "c", 0, -2 * u, 0, -2 * u, 2 * u, -5 * u,
                    "l", height / 6 * 4 - 4 * u, -height + 6 * u,
                    "c", u, -1.5 * u, 2 * u, -3 * u, 4 * u, -3 * u,
                    "l", endX - height / 6 * 8 - 4 * u - startX, 0,
                    "c", 2 * u, 0, 3 * u, 1.5 * u, 4 * u, 3 * u,
                    "l", height / 6 * 4 - 4 * u, height - 6 * u,
                    "c", 2 * u, 3 * u, 2 * u, 3 * u, 2 * u, 5 * u,
                    "l", 0, 20 * u,
                    "c", 0, 2 * u, 0, 2 * u, -2 * u, 5 * u,
                    "l", -height / 6 * 4 + 4 * u, height - 6 * u,
                    "c", -u, 1.5 * u, -2 * u, 3 * u, -4 * u, 3 * u,
                    "l", -endX + height / 6 * 8 + 4 * u + startX, 0,
                    "c", -2 * u, 0, -3 * u, -1.5 * u, -4 * u, -3 * u,
                    "l", -height / 6 * 4 + 4 * u, -height + 6 * u,
                    "c", -2 * u, -3 * u, -2 * u, -3 * u, -2 * u, -5 * u].join(" "));
                svg.appendChild(path);
                path.setAttribute("stroke-width", "1px");

                return {
                    height: child.height + 6 * u,
                    varX: child.varX,
                    varY: child.varY,
                    argX: child.argX,
                    argY: child.argY,
                    predX: child.predX,
                    nextX: child.nextX + spaceWidth,
                };
            }
            case "isolated_determiner":
            case "new_determiner":
            case "inherit_determiner": {
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute("x", "" + (literalCenterX - 5 * u));
                rect.setAttribute("y", "" + (-5 * u));
                rect.setAttribute("width", "" + (10 * u));
                rect.setAttribute("height", "" + (10 * u));
                rect.setAttribute("transform", "rotate(45, " + literalCenterX + ", 0)");
                svg.appendChild(rect);

                return {
                    height: 0,
                    varX: literalCenterX,
                    varY: 0,
                    argX: NaN,
                    argY: NaN,
                    predX: NaN,
                    nextX: literalNextX,
                };
            }
            case "preposition": {
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute("cx", "" + literalCenterX);
                circle.setAttribute("cy", "0");
                circle.setAttribute("r", "" + (6 * u));
                svg.appendChild(circle);

                const left = recursion(phrase.left, literalNextX);
                const right = recursion(phrase.right, left.nextX);

                const overEndX = isNaN(left.varX) ? left.predX : left.varX;
                const overEndY = isNaN(left.varY) ? 0 : left.varY;
                const overHeight = left.height + 6 * u;
                createOverPath(literalCenterX, overEndX, overEndY, overHeight, isNaN(left.varX));

                const underEndX = right.argX;
                const underEndY = right.argY;
                const underHeight = Math.max(left.height, right.height) + 6 * u;
                createUnderPath(literalCenterX, underEndX, underEndY, underHeight);

                return {
                    height: Math.max(left.height, right.height) + 6 * u,
                    varX: NaN,
                    varY: NaN,
                    argX: underEndX - underHeight / 6 * 4,
                    argY: underHeight,
                    predX: right.predX,
                    nextX: right.nextX,
                };
            }
            case "relative": {
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute("x", "" + (literalCenterX - 5.5 * u));
                rect.setAttribute("y", "" + (-5.5 * u));
                rect.setAttribute("width", "" + (11 * u));
                rect.setAttribute("height", "" + (11 * u));
                svg.appendChild(rect);

                const left = recursion(phrase.left, literalNextX);
                const right = recursion(phrase.right, left.nextX);

                const overEndX = isNaN(right.varX) ? right.predX : right.varX;
                const overEndY = isNaN(right.varY) ? 0 : right.varY;
                const overHeight = Math.max(left.height, right.height) + 6 * u;
                createOverPath(literalCenterX, overEndX, overEndY, overHeight, isNaN(right.varX));

                const underEndX = left.argX;
                const underEndY = left.argY;
                const underHeight = left.height + 6 * u;
                createUnderPath(literalCenterX, underEndX, underEndY, underHeight);

                return {
                    height: Math.max(left.height, right.height) + 6 * u,
                    varX: Math.min((literalCenterX + overEndX) / 2, literalCenterX + overHeight / 6 * 4 + 20),
                    varY: overHeight,
                    argX: NaN,
                    argY: NaN,
                    predX: NaN,
                    nextX: right.nextX,
                };
            }
            case "predicate": {
                return {
                    height: 0,
                    varX: NaN,
                    varY: NaN,
                    argX: literalCenterX,
                    argY: 0,
                    predX: literalCenterX,
                    nextX: literalNextX,
                };
            }
        }
    }
}

//文字列化
function stringifyFormula(formula: Formula): string {
    if (formula.formulaType === "true")
        return "⊤";
    if (formula.formulaType === "false")
        return "⊥";
    if (formula.formulaType === "negation")
        return "￢" + stringifyFormula(formula.formula);
    if (formula.formulaType === "exist")
        return "∃" + formula.variable.id + ";" + stringifyFormula(formula.formula);
    if (formula.formulaType === "all")
        return "∀" + formula.variable.id + ";" + stringifyFormula(formula.formula);
    if (formula.formulaType === "conjunction")
        return "(" + formula.formulas.map(x => stringifyFormula(x)).join("∧") + ")";
    if (formula.formulaType === "disjunction")
        return "(" + formula.formulas.map(x => stringifyFormula(x)).join("∨") + ")";
    if (formula.formulaType === "predicate")
        return formula.name + "(" + formula.args.map(x => (x.casus + ":" + x.variable.id)).join(", ") + ")";
    // 網羅チェック
    return formula;
}

/*
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
    console.log(stringify(interpret(parse(tokenize(x)))));
    console.log(stringify(normalize(interpret(parse(tokenize(x))))));
  });
}*/

function generateEditor(value: string, multiline: boolean) {
    function getTokenizerOption() {
        return {
            separator: new RegExp(separator.value),
            openNegation: new RegExp("^" + openNegation.value + "$"),
            closeNegation: new RegExp("^" + closeNegation.value + "$"),
            singleNegation: new RegExp("^" + singleNegation.value + "$"),
            isolatedDeterminer: new RegExp("^" + isolatedDeterminer.value + "$"),
            newDeterminer: new RegExp("^" + newDeterminer.value + "$"),
            inheritDeterminer: new RegExp("^" + inheritDeterminer.value + "$"),
            preposition: new RegExp("^" + preposition.value + "$"),
            relative: new RegExp("^" + relative.value + "$"),
            predicate: new RegExp("^" + predicate.value + "$"),

            keyOfNewDeterminer: keyOfNewDeterminer.value,
            keyOfInheritDeterminer: keyOfInheritDeterminer.value,
            casusOfPreposition: casusOfPreposition.value,
            casusOfRelative: casusOfRelative.value,
        };
    }

    function reset1(): void {
        separator.value = "[,.\\s]";
        openNegation.value = "nou";
        closeNegation.value = "noi";
        singleNegation.value = "no";
        isolatedDeterminer.value = "au";
        newDeterminer.value = "a('[aeiou])*";
        inheritDeterminer.value = "i('[aeiou])*";
        preposition.value = "([^aeiou]?)e";
        relative.value = "([^aeiou]?)ei";
        predicate.value = "(([^aeiou'][aeiou]){2,})";

        keyOfNewDeterminer.value = "$1";
        keyOfInheritDeterminer.value = "$1";
        casusOfRelative.value = "$1";
        casusOfPreposition.value = "$1";

        dictionary.value = JSON.stringify({
            predicate: {
                moku: "食べる",
                soweli: "もふもふ",
            },
            casus: {
                "": "は",
                f: "が",
                b: "を",
            }
        });
    }

    function update(): void {
        errorOutput.innerHTML = "";
        glossOutput.innerHTML = "";
        structureOutput.innerHTML = "";
        formulaOutput.innerHTML = "";
        normalizedFormulaOutput.innerHTML = "";
        try {
            const tokenized = tokenize(input.value, getTokenizerOption(), JSON.parse(dictionary.value));
            glossOutput.appendChild(showGloss(tokenized));

            const parsed = parse(tokenized);
            const interpreted = interpret(parsed);

            structureOutput.appendChild(visualizePhraseStructure(parsed));
            formulaOutput.innerHTML = markupFormula(stringifyFormula(interpreted));
            normalizedFormulaOutput.innerHTML = markupFormula(stringifyFormula(normalize(interpreted)));
        } catch (e) {
            errorOutput.innerText = e.message;
        }
    }

    function wrap(tagName: string, ...nodes: Node[]) {
        const wrapper = document.createElement(tagName);
        nodes.forEach((node) => wrapper.appendChild(node));
        return wrapper;
    }

    const input = document.createElement("textarea");
    const errorOutput = document.createElement("div");
    const glossOutput = document.createElement('div');
    const structureOutput = document.createElement('div');
    const formulaOutput = document.createElement("div");
    const normalizedFormulaOutput = document.createElement("div");

    const separator = document.createElement("input");
    const openNegation = document.createElement("input");
    const closeNegation = document.createElement("input");
    const singleNegation = document.createElement("input");
    const isolatedDeterminer = document.createElement("input");
    const newDeterminer = document.createElement("input");
    const inheritDeterminer = document.createElement("input");
    const preposition = document.createElement("input");
    const relative = document.createElement("input");
    const predicate = document.createElement("input");

    const keyOfNewDeterminer = document.createElement("input");
    const keyOfInheritDeterminer = document.createElement("input");
    const casusOfPreposition = document.createElement("input");
    const casusOfRelative = document.createElement("input");

    const dictionary = document.createElement("textarea");

    input.style.width = "100%";
    input.rows = multiline ? 8 : 1;
    input.style.resize = "none";

    structureOutput.style.width = "100%";
    structureOutput.style.overflowX = "scroll";

    formulaOutput.classList.add("formula");
    normalizedFormulaOutput.classList.add("formula");

    dictionary.style.width = "100%";
    dictionary.rows = 8;
    dictionary.style.resize = "none";

    input.oninput = update;
    separator.oninput = update;
    openNegation.oninput = update;
    closeNegation.oninput = update;
    singleNegation.oninput = update;
    isolatedDeterminer.oninput = update;
    newDeterminer.oninput = update;
    inheritDeterminer.oninput = update;
    preposition.oninput = update;
    relative.oninput = update;
    predicate.oninput = update;

    keyOfNewDeterminer.oninput = update;
    keyOfInheritDeterminer.oninput = update;
    casusOfPreposition.oninput = update;
    casusOfRelative.oninput = update;

    input.value = value;
    reset1();
    update();

    const container = wrap("div",
        input,
        document.createElement("br"),
        errorOutput,
        wrap("h4", document.createTextNode("品詞解析")),
        glossOutput,
        wrap("h4", document.createTextNode("構造")),
        structureOutput,
        wrap("h4", document.createTextNode("論理式")),
        formulaOutput,
        wrap("h4", document.createTextNode("標準形論理式")),
        normalizedFormulaOutput,
        wrap("details",
            wrap("summary", document.createTextNode("設定")),
            wrap("table",
                wrap("tr",
                    wrap("td", document.createTextNode("単語境界")),
                    wrap("td", separator)
                ),
                wrap("tr",
                    wrap("td", document.createTextNode("否定開始")),
                    wrap("td", openNegation),
                ),
                wrap("tr",
                    wrap("td", document.createTextNode("否定終止")),
                    wrap("td", closeNegation),
                ),
                wrap("tr",
                    wrap("td", document.createTextNode("単独否定")),
                    wrap("td", singleNegation),
                ),
                wrap("tr",
                    wrap("td", document.createTextNode("孤立限定詞")),
                    wrap("td", isolatedDeterminer)
                ),
                wrap("tr",
                    wrap("td", document.createTextNode("新規限定詞")),
                    wrap("td", newDeterminer),
                    wrap("td", document.createTextNode("キー")),
                    wrap("td", keyOfNewDeterminer)
                ),
                wrap("tr",
                    wrap("td", document.createTextNode("継続限定詞")),
                    wrap("td", inheritDeterminer),
                    wrap("td", document.createTextNode("キー")),
                    wrap("td", keyOfInheritDeterminer)
                ),
                wrap("tr",
                    wrap("td", document.createTextNode("前置詞")),
                    wrap("td", preposition),
                    wrap("td", document.createTextNode("格")),
                    wrap("td", casusOfPreposition)
                ),
                wrap("tr",
                    wrap("td", document.createTextNode("関係詞")),
                    wrap("td", relative),
                    wrap("td", document.createTextNode("格")),
                    wrap("td", casusOfRelative)
                ),
                wrap("tr",
                    wrap("td", document.createTextNode("述語")),
                    wrap("td", predicate)
                ),
            ),
            document.createTextNode("辞書"),
            dictionary,
        )
    );
    container.classList.add(multiline ? "multiline-editor" : "inline-editor");
    return container;
}

function appendInlineEditor(text: string) {
    if (document.currentScript == null || document.currentScript.parentNode == null) return;
    document.currentScript.parentNode.insertBefore(generateEditor(text, false), document.currentScript);
}

function appendMultilineEditor(text: string) {
    if (document.currentScript == null || document.currentScript.parentNode == null) return;
    document.currentScript.parentNode.insertBefore(generateEditor(text, true), document.currentScript);
}