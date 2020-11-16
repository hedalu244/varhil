---
layout: default
title: 構文解析器
---

一階述語論理まで対応した構文解析器です。TypeScriptで実装されています。[ソースコード](../script/parser.ts)

<textarea id="input" rows="8"></textarea>
<div id="error_output"></div>

###### 構造
<div id="structure_output"></div>

###### 論理式
<div id="formula_output" class="formula"></div>

###### 標準形論理式
<div id="normalized_formula_output" class="formula"></div>

###### 設定

| 単語境界 | <input id="separator_pattern"> |
| 否定開始 | <input id="open_negation_pattern"> |
| 否定終止 | <input id="close_negation_pattern"> |
| 単独否定 | <input id="single_negation_pattern"> |
| 孤立限定詞 | <input id="isolated_determiner_pattern"> |
| 新規限定詞 | <input id="new_determiner_pattern"> | キー | <input id="key_of_new_determiner_pattern"> |
| 継続限定詞 | <input id="inherit_determiner_pattern"> | キー | <input id="key_of_inherit_determiner_pattern"> |
| 前置詞 | <input id="preposition_pattern"> | 格 | <input id="casus_of_preposition_pattern"> |
| 関係詞 | <input id="relative_pattern"> | 格 | <input id="casus_of_relative_pattern"> |
| 述語 | <input id="predicate_pattern"> |

###### 辞書
<textarea id="dictionary" rows="8"></textarea>

<style>
    #input {
        font-size: 1em;
        width: 100%;
        box-sizing: border-box;
        resize: none;
    }
    #error_output {
        background-color: #fdd;
        padding: 0 10px;
    }
    #structure_output {
        width: 100%;
        overflow-x: auto;
    }

    #dictionary {  
        font-size: 1em;
        width: 100%;
        box-sizing: border-box;
        resize: none;
    }
</style>
<script>
    function getParam(name) {
        const url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }
    enableEditor(getParam("input"));
</script>
    