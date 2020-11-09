function markupFormula(formulaText: string) {
    return formulaText
        .replace(/∃(\w+)/g, "∃<span class=\"variable\">$1</span>")
        .replace(/∀(\w+)/g, "∀<span class=\"variable\">$1</span>")
        .replace(/:(\w+)/g, ":<span class=\"variable\">$1</span>")
        .replace(/([∃∀∧∨￢⇒⇔⊤⊥\(\)])/g, "<span class=\"symbol\">$1</span>");
}

function markupAllFormulas() {
    Array.from(document.getElementsByClassName("formula")).forEach(x => x.innerHTML = markupFormula(x.innerText));
}

function markupGloss(text: string) {
    return text.replace(/(\S+):(\S+)/g, "<ruby>$1<rt>$2</rt></ruby>");
}

function markupAllGlosses() {
    Array.from(document.getElementsByClassName("glossed")).forEach(x => x.innerHTML = markupGloss(x.innerText));
}
