---
layout: default
title: Parser
---

Varhil文法案に従った構文/意味解析器です。JavaScriptで動作しています。

<textarea id="input" rows="8" cols="80"></textarea>
<div id="output" class="formula"></div>
<div id="error"></div>

| separator | <input type="text" id="separator_pattern"> |
| single_variable | <input type="text" id="single_variable_pattern"> |
| new_variable | <input type="text" id="new_variable_pattern"> | character | <input type="text" id="new_variable_replacer"> |
| continued_variable | <input type="text" id="continued_variable_pattern"> | character | <input type="text" id="continued_variable_replacer"> |
| last_variable | <input type="text" id="last_variable_pattern"> | character | <input type="text" id="last_variable_replacer"> |
| predicate | <input type="text" id="predicate_pattern"> | name | <input type="text" id="predicate_replacer"> |
| preposition | <input type="text" id="preposition_pattern"> | casus | <input type="text" id="preposition_replacer"> |
| relative | <input type="text" id="relative_pattern"> | casus | <input type="text" id="relative_replacer"> |
| single_negation | <input type="text" id="single_negation_pattern"> |
| open_negation | <input type="text" id="open_negation_pattern"> |
| close_negation | <input type="text" id="close_negation_pattern"> |

<script type="text/javascript" src="main.js"></script>
