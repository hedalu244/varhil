---
layout: default
title: Varhil
---

Varhil(VARiable-HIding Logic)[ˈvɑ˞ .hɪl]は述語論理をベースにした人工言語です。

## 動機
形式的かつ厳密に述語論理に対応付けられる表現力を持ちながら、一見すると自然言語のような文法や文法用語を持った言語があれば面白いと思った。人間が言語として処理する範囲で、どこまで厳密な解釈ができるのかも気になった。

## 特徴

述語論理に基づくこと、内容語の品詞が単一であること、（ある程度）構文厳密であること、述語の項を省略できることなどはロジバンに似ているが、それを実現するための文法は比較的シンプルである（作者の主観）。ロジバンは述語論理にUI類などでメタ情報を加える機能がある一方、Varhilは述語論理の表現機能のみをサポートする。

また、『意味』の構築などにおいて存在グラフの影響を大きく受けたが、二次元に表現するという存在グラフの特徴は、文字列や音素列で表現するために破棄した。

## 性質

1. すべての『意味』（[統語論](syntax)参照）を表現できること
2. 一つの文が複数の『意味』に翻訳できないこと
3. 変項をできるだけ表記しないこと
4. ポーランド記法を用い、開き括弧＋閉じ括弧状の構造をできるだけ使わないこと。但し、結合順序を示すためだけの演算子を連続して使用するのは避けられるようにする。

## 目次

1. 文法
    1. [統語論](grammer/syntax)
    2. [一階階述語論理](grammer/first-order-logic)
    3. [メタ論理](grammer/meta-logic)（暫定）
2. 語形（暫定）
    1. [音韻論](lexicology/phonology)
    2. [形態論](lexicology/morphology)
    2. [辞書](lexicology/dictionaly)


## 生成文法

C
: Clause

P
: Predicate

N
: Noun

PN
: PredicateNoun

T
: Term

SS
: SingleSentence

CJ
: Conjunctive

S
: Sentence

```
    [Sentence] -> [Conjunctive] .?

    [Conjunctive] -> [SingleSentence] ,? [Conjunctive]
    [Conjunctive] -> [Variable] ,? [Conjunctive]
    [Conjunctive] -> [SingleSentence]

    [SingleSentence] -> no [SingleSentence]
    [SingleSentence] -> [Predicate]
    [SingleSentence] -> [Clause] ([Variable] | [Noun])
    [SingleSentence] -> nou [Conjunctive] noi

    [Noun] -> no [Noun]
    [Noun] -> o ([Variable] | [Noun]) [Noun]
    [Noun] -> [PredicateNoun]
    [Noun] -> [Clause]

    [PredicateNoun] -> no [PredicateNoun]
    [PredicateNoun] -> [Article] [Predicate]
    [PredicateNoun] -> [Preposition] ([Variable] | [Noun]) [PredicateNoun]
    [PredicateNoun] -> [Predicate]
    [PredicateNoun] -> poi

    [Predicate] -> [ContentWord]
    [Predicate] -> po ([Variable] | [Noun])
    [Predicate] -> no [Predicate]
    [Predicate] -> [Preposition] ([Variable] | [Noun]) [Predicate]

    [Clause] -> ro [SingleSentence]
    [Clause] -> rou [Conjunctive] roi

    [ContentWord] -> pina rana lora ...
    [Variable] -> au a i u a'a i'a u'a ...
    [Preposition] -> e be fe ...
    [Article] -> ei bei fei ...
```

## 課題  

* 等号が名詞句であることにより等号のみの意味(`∃x, ∃y, x=y`など)が表現できない問題
* メタ、二階の整理（文字列やVarhil文を引用したり、Varhil内で述語を定義したりしたい）

## コンタクト

[GitHub](https://github.com/hedalu244/varhil)  
[Twitter](https://twitter.com/hedalu244)


質問、指摘、要望、研究お待ちしています。
