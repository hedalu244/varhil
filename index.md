---
layout: default
title: Varhil
---

Varhil(VARiable-HIding Logic)[ˈvɑ˞ .hɪl]は述語論理に基づいた人工言語です。

## 動機
無機質な述語論理であっても適切に述語を選べば自然言語で表現される意味を表現できる（だろうか）という仮説を立て、一見すると自然言語のような文法や文法用語を持った言語でありながら、形式的かつ厳密に述語論理に対応付けられる表現力を持つ言語を作り運用することで、検証しようとした。

## 特徴
+ シンプルな文法（内容語の品詞が一つだったり、ポーランド記法だったり……）
+ 構文厳密（どんな文も一つの構文木にのみ解釈される）
+ 意味厳密（どんな文も（標準化による差を除く）一つの論理式にのみ解釈される）
+ 述語論理と等価（古典述語論理のすべての閉論理式に対応した文が作れる。また述語論理以上の意味（態や法など）を文法によって表現しない）

## 目次

1. 文法
    1. [統語論](grammer/syntax)
    2. [一階階述語論理](grammer/first-order-logic)
    3. [メタ論理](grammer/meta-logic)（暫定）
2. 語形（暫定）
    1. [音韻論](lexicology/phonology)
    2. [形態論](lexicology/morphology)
    2. [辞書](lexicology/dictionaly)

<!--
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
-->

## 課題  

* メタ、二階の整理（文字列やVarhil文を引用したり、Varhil内で述語を定義したりしたい）
* 形態論と造語

## コンタクト

[GitHub](https://github.com/hedalu244/varhil)  
[Twitter](https://twitter.com/hedalu244)


質問、指摘、要望、研究お待ちしています。
