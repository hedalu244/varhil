function markupFormula(formulaText) {
  return formulaText
    .replace(/∃(\w+)/g, "∃<span class=\"variable\">$1</span>")
    .replace(/∀(\w+)/g, "∀<span class=\"variable\">$1</span>")
    .replace(/:(\w+)/g, ":<span class=\"variable\">$1</span>")
    .replace(/([∃∀∧∨￢⇒⇔⊤⊥\(\)])/g, "<span class=\"symbol\">$1</span>");
}

function markupAllFormulas() {
  Array.from(document.getElementsByClassName("formula")).forEach(x=>x.innerHTML=markupFormula(x.innerText));
}
