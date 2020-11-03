---
layout: default
title: 構文解析器
---

一階述語論理まで対応した構文解析器です。TypeScriptで実装されています。[ソースコード](main.ts)

<textarea id="input" rows="8" cols="80"></textarea>
<div id="output" class="formula"></div>
<div id="error"></div>

| separator | <input type="text" id="separator_pattern"> |
| isolated determiner | <input type="text" id="isolated_determiner_pattern"> |
| create determiner | <input type="text" id="create_determiner_pattern"> | label | <input type="text" id="create_determiner_replacer"> |
| inherit determiner | <input type="text" id="inherit_determiner_pattern"> | label | <input type="text" id="inherit_determiner_replacer"> |
| predicate | <input type="text" id="predicate_pattern"> | name | <input type="text" id="predicate_replacer"> |
| preposition | <input type="text" id="preposition_pattern"> | casus | <input type="text" id="preposition_replacer"> |
| relative | <input type="text" id="relative_pattern"> | casus | <input type="text" id="relative_replacer"> |
| single negation | <input type="text" id="single_negation_pattern"> |
| open negation | <input type="text" id="open_negation_pattern"> |
| close negation | <input type="text" id="close_negation_pattern"> |

<script type="text/javascript" src="main.js"></script>
