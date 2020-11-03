---
layout: default
title: 構文解析器
---

一階述語論理まで対応した構文解析器です。TypeScriptで実装されています。[ソースコード](main.ts)

<textarea id="input" rows="8" cols="80"></textarea>

論理式: 
<div id="formula_output" class="formula"></div>

標準形論理式: 
<div id="normalized_formula_output" class="formula"></div>

<div id="error_output"></div>

| 分離符 | <input type="text" id="separator_pattern"> |
| 孤立限定詞 | <input type="text" id="isolated_determiner_pattern"> |
| 新規限定詞 | <input type="text" id="new_determiner_pattern"> | label | <input type="text" id="new_determiner_replacer"> |
| 継続限定詞 | <input type="text" id="inherit_determiner_pattern"> | label | <input type="text" id="inherit_determiner_replacer"> |
| 述語 | <input type="text" id="predicate_pattern"> | name | <input type="text" id="predicate_replacer"> |
| 前置詞 | <input type="text" id="preposition_pattern"> | casus | <input type="text" id="preposition_replacer"> |
| 関係詞 | <input type="text" id="relative_pattern"> | casus | <input type="text" id="relative_replacer"> |
| 単独否定 | <input type="text" id="single_negation_pattern"> |
| 否定開始 | <input type="text" id="open_negation_pattern"> |
| 否定終止 | <input type="text" id="close_negation_pattern"> |

<script type="text/javascript" src="main.js"></script>
