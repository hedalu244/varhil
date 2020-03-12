---
layout: default
title: First-order-logic
---

## 述語記号と述語

一階述語論理における述語記号は、一定の数（アリティ）の変数の順序組に対して真偽値を定める命題関数として機能する。

Varhilにおける述語記号は、アリティの代わりに、格集合という有限集合が決まっている。引数はその順番ではなく、格集合から引数への対応（写像）使って区別する（一部のプログラミング言語にある[名前付き引数(named parameter)](https://en.wikipedia.org/wiki/Named_parameter)に似ている）。これによって、引数を書く順番を入れ替えても意味が変わらない仕組みが作られる。

ここでは例として以下のような述語を使う。

{:.words}
{:.logic} リンゴだ(は:x)
: xはリンゴだ

{:.logic} 人間だ(は:x)
: xは人間だ

{:.logic} 赤い(は:x)
: xは赤い

{:.logic} 食べる(が:x, を:y)
: xがyを食べる

**述語** は述語論理の述語記号に対応するトークンであり、識別子のみで表される。

述語は単独でそれ自身を表す **述語句** になれる。

## 変数と定名詞

**変数** は、述語論理の変数記号に対応する概念で、一つの議論対象を意味する。  

**定名詞** は変数を表現するトークンである。
定名詞は, `<自然数>`, `<自然数+>`, `<自然数->` の3種類がある。文中に出現した定名詞と変数の対応は以下のように決定される。  

+ 自然数が異なる定名詞は、異なる変数を指す。
+ `<自然数+>` の形は、それまでに出現したどの定名詞とも異なる変数を指す。
+ `<自然数>` の形と `<自然数->` の形は、同じ番号の定名詞の一つ前の出現と同じ変数を指す。
+ `<自然数->` の形は、それ以後に出現するどの定名詞とも異なる変数を指す。
+ 上記条件が矛盾する場合、エラーである。

ある番号の定名詞を語順で見て最後に使用するとき、あるいは、ある番号の定名詞をその変数を指して使う最後のときは、必ず、`<～+>`とすることで変数が新たに割り当てられたことを明示する。
各々の定名詞を最後に使用するときは `<～->` とすることで、その変数がそれ以後使われないことを明示できる（必須ではない）。

いかなる状況に於いても、例えば文や段落を跨いだ場合や、発話者が変わった場合でも、それぞれの定名詞が表す変数はリセットされない。これを利用すれば、定名詞を介して以前の段落で使った変数や他の発話者が使った変数を以後の段落で参照することもできる（そうされたくない場合は `-` を付ければよい）し、逆に以前とは異なる変数を指したいときは必ず `+` を付ける必要がある。

**不定名詞** `VAR` は出現毎に他のどの定名詞の出現とも異なる変数を指す。

定名詞と不定名詞は単独でその変数を表す **名詞句** になれる。

## 前置詞と述語句

**述語句** は、論理式と述語ポインタを情報として持つ統語的まとまりである。述語ポインタは論理式中のある述語記号の位置の情報である（論理式中に同じ述語記号が複数回現れた場合でも、述語ポインタはそれぞれを区別する）。

述語は単独で述語句になることができる。この場合、論理式は引数を持たない状態の述語記号であり、述語ポインタはその述語記号を指す。

**前置詞** は `//PRE格` の形で表されるトークンである。

前置詞は直後に名詞句、その後ろに述語句を取って述語句を成す前置二項演算子であり、述語句の述語ポインタが表す述語記号の、前置詞が表す格に、名詞句が表す変数を割り当てる操作を行う。形成される述語句は、それぞれの論理式の論理積と、述語句の述語ポインタを表す。

述語句は単独で単文になり、構成された論理式を表す。

{:.example}
{:.glossed} <ruby>e<rt>//PREは</rt></ruby> <ruby>au<rt>VAR</rt></ruby> <ruby>pina<rt>リンゴだ</rt></ruby>
: {:.logic} リンゴだ(は:x)
^
{:.example}
{:.glossed} <ruby>fe<rt>//PREが</rt></ruby> <ruby>a<rt>VAR+0</rt></ruby> <ruby>be<rt>//PREを</rt></ruby> <ruby>a'a<rt>VAR+1</rt></ruby> <ruby>moku<rt>食べる</rt></ruby>
: {:.logic} 食べる(が:x, を:y)

## 関係詞と名詞句

**名詞句** は、論理式と変数を情報として持つ統語的まとまりである。

定名詞と不定名詞は単独でその変数を表す名詞句になれる。この場合、論理式として空積（真）を、変数としてその名詞が表す変数を表す。

**関係詞** は `//REL格` の形で表されるトークンである。

関係詞は直後に述語句、その後ろに名詞句を取って名詞句を成す前置二項演算子であり、述語句の述語ポインタが表す述語記号の、関係詞が表す格に、名詞句が表す変数を割り当てる操作を行う。形成される名詞句は、それぞれの論理式の論理積と、名詞句の変数を表す。

例えば、 名詞句`//RELは リンゴだ VAR` は論理式 `リンゴだ(は:x)`を表しつつ、その変数xを指す定名詞の代わりとして、前置詞の第一引数や、関係詞の第二引数として使うことができる。

{:.example}
{:.glossed} <ruby>e<rt>//PREは</rt></ruby> <ruby>ei<rt>//RELは</rt></ruby> <ruby>pina<rt>リンゴだ</rt></ruby> <ruby>au<rt>VAR</rt></ruby> <ruby>loja<rt>赤い</rt></ruby>
: {:.logic}  リンゴだ(は:x) ∧ 赤い(は:x)
^
{:.example}
{:.glossed} <ruby>fe<rt>//PREが</rt></ruby> <ruby>ei<rt>//RELは</rt></ruby> <ruby>jana<rt>人間だ</rt></ruby> <ruby>au<rt>VAR</rt></ruby> <ruby>be<rt>//PREを</rt></ruby> <ruby>ei<rt>//RELは</rt></ruby> <ruby>loja<rt>赤い</rt></ruby> <ruby>ei<rt>//RELは</rt></ruby> <ruby>pina<rt>リンゴだ</rt></ruby> <ruby>au<rt>VAR</rt></ruby> <ruby>moku<rt>食べる</rt></ruby>
: {:.logic} 人間だ(は:x) ∧ リンゴだ(は:y) ∧ 赤い(は:y) ∧ 食べる(が:x, を:y)

また名詞句は単独で単文になることもでき、構成された論理式を表す。

{:.example}
{:.glossed} <ruby>ei<rt>//RELは</rt></ruby> <ruby>pina<rt>リンゴだ</rt></ruby> <ruby>au<rt>VAR</rt></ruby>
: {:.logic} リンゴだ(は:x)
^
{:.example}
{:.glossed} <ruby>ei<rt>//RELは</rt></ruby> <ruby>loja<rt>赤い</rt></ruby> <ruby>ei<rt>//RELは</rt></ruby> <ruby>pina<rt>リンゴだ</rt></ruby> <ruby>au<rt>VAR</rt></ruby>
: {:.logic} リンゴだ(は:x) ∧ 赤い(は:x)
^
{:.example}
{:.glossed} <ruby>au<rt>VAR</rt></ruby>
: {:.logic} ⊤

### 一般名詞

ある特定の格を **無標格** とする。ここでは格「は」（英語のbe動詞の主語）に対応する格を無標格とする。

無標格を表す関係詞が二番目の引数に不定名詞を取っている場合（ある述語句が無標格関係詞と不定名詞に挟まれている場合）、さらにその名詞句が単文になっていないとき、その関係詞と不定名詞は省略できる。つまり、無標格を取る述語句は単独で名詞句になれる。この名詞句や名詞句に慣れる述語を便宜上 **一般名詞** と呼ぶ。

これを読むときは、名詞句であるべきところ（前置詞の第一引数や関係詞の第二引数）に述語句が置かれていたとき（またその時に限って）、無標格と不定名詞（つまりその場限りの変数）を補えばよい。

{:.example}
{:.glossed} <ruby>e<rt>//PREは</rt></ruby> <ruby>pina<rt>リンゴだ</rt></ruby> <ruby>loja<rt>赤い</rt></ruby>
: {:.logic} リンゴだ(は:x) ∧ 赤い(は:x)
^
{:.example}
{:.glossed} <ruby>be<rt>//PREを</rt></ruby> <ruby>ei<rt>//RELは</rt></ruby> <ruby>loja<rt>赤い</rt></ruby> <ruby>pina<rt>リンゴだ</rt></ruby> <ruby>moku<rt>食べる</rt></ruby>
: {:.logic} リンゴだ(は:x) ∧ 赤い(は:x) ∧ 食べる(を:x)

## 文

単文を0個以上並べたものが **文** である。文はVarhilにおけるトップレベル要素であり、一つの文が一つの命題（論理式）に対応する（Varhil文は全体が文になっている）。

文は、各単文が表す論理式の論理積の、すべての変数を存在量化した論理式を表す。但し、否定を含む場合はその限りではない（後述）。

{:.example}
{:.glossed} <ruby>e<rt>//PREは</rt></ruby> <ruby>a<rt>VAR+0</rt></ruby> <ruby>pina<rt>リンゴだ</rt></ruby> <ruby>e<rt>//PREは</rt></ruby> <ruby>u<rt>VAR-0</rt></ruby> <ruby>loja<rt>赤い</rt></ruby>
: {:.logic} ∃x リンゴだ(は:x) ∧ 赤い(は:x)
^
{:.example}
{:.glossed} <ruby>fe<rt>//PREが</rt></ruby> <ruby>ei<rt>//RELは</rt></ruby> <ruby>jana<rt>人間だ</rt></ruby> <ruby>au<rt>VAR</rt></ruby> <ruby>be<rt>//PREを</rt></ruby> <ruby>ei<rt>//RELは</rt></ruby> <ruby>pina<rt>リンゴだ</rt></ruby> <ruby>au<rt>VAR</rt></ruby> <ruby>moku<rt>食べる</rt></ruby>
: {:.logic} ∃x∃y 人間だ(は:x) ∧ リンゴだ(は:y) ∧ 食べる(が:x, を:y)

## 否定と量化

文を **否定開始** `{NEG` と **否定終止** `}NEG` で挟むことで その文が表す命題の否定命題を表す単文になる。
これを **否定節** と呼ぶ。否定節も他の単文と並べて文を構成したり、他の否定節に入れ子にしたりできる。  

ある変数がその否定部の中でのみ使われている場合（否定部の外にその変数を指す定名詞も、その変数が渡される述語もない場合）、その変数は否定の内部で存在量化される。（￢∃と考えても良いし、∀￢と考えても良い）。

{:.example}
{:.glossed} <ruby>nou<rt>{NEG</rt></ruby> <ruby>e<rt>//PREは</rt></ruby> <ruby>a<rt>VAR+0</rt></ruby> <ruby>pina<rt>リンゴだ</rt></ruby>, <ruby>e<rt>//PREは</rt></ruby> <ruby>u<rt>VAR-0</rt></ruby> <ruby>jana<rt>人間だ</rt></ruby> <ruby>noi<rt>}NEG</rt></ruby>
: {:.logic} ￢ (∃ x リンゴだ(は:x) ∧ 人間だ(は:x))
^
{:.example}
{:.glossed} <ruby>nou<rt>{NEG</rt></ruby> <ruby>e<rt>//PREは</rt></ruby> <ruby>a<rt>VAR+0</rt></ruby> <ruby>pina<rt>リンゴだ</rt></ruby>, <ruby>e<rt>//PREは</rt></ruby> <ruby>i<rt>VAREL0</rt></ruby> <ruby>jana<rt>人間だ</rt></ruby> <ruby>noi<rt>}NEG</rt></ruby> <ruby>u<rt>VAR-0</rt></ruby>
: {:.logic} ∃ x ￢ ( リンゴだ(は:x) ∧ 人間だ(は:x))

### 単独否定

**単独否定** `/NEG` は、直後の句を否定する前置単項演算子である。単文の前にあればその単文の終わりまで、前置詞や関係詞の前にあればそれが形成する述語句や名詞句の終わりまで、述語の前にあればその述語のみを否定する。定名詞、不定名詞の前にあった場合はそれのみを否定するが、これは空積の否定なのでナンセンスである。また、単独否定を二つ重ねることもできるが、二重否定なのでナンセンスである（古典論理に従い、二重否定を除去しても意味が変わらない意味論を採用する）

また、`{NEG` ～ `}NEG` 同様、否定される範囲でのみ使用される変数は否定の中で存在量化され、外側でも使用される変数は否定の外で量化される。

{:.example}
{:.glossed} <ruby>no<rt>/NEG</rt></ruby> <ruby>fe<rt>//PREが</rt></ruby> <ruby>au<rt>VAR</rt></ruby> <ruby>be<rt>//PREを</rt></ruby> <ruby>pina<rt>リンゴだ</rt></ruby> <ruby>moku<rt>食べる</rt></ruby>
: {:.logic} ￢ ∃x ∃y (リンゴだ(は:y) ∧ 食べる(x, y))
^
{:.example}
{:.glossed} <ruby>fe<rt>//PREが</rt></ruby> <ruby>au<rt>VAR</rt></ruby>　<ruby>no<rt>/NEG</rt></ruby> <ruby>be<rt>//PREを</rt></ruby> <ruby>pina<rt>リンゴだ</rt></ruby> <ruby>moku<rt>食べる</rt></ruby>
: {:.logic} ∃x ￢ ∃y (リンゴだ(は:y) ∧ 食べる(x, y))
^
{:.example}
{:.glossed} <ruby>fe<rt>//PREが</rt></ruby> <ruby>au<rt>VAR</rt></ruby> <ruby>be<rt>//PREを</rt></ruby> <ruby>pina<rt>リンゴだ</rt></ruby> <ruby>no<rt>/NEG</rt></ruby> <ruby>moku<rt>食べる</rt></ruby>
: {:.logic} ∃x ∃y (リンゴだ(は:y) ∧ ￢食べる(x, y))
^
{:.example}
{:.glossed} <ruby>no<rt>/NEG</rt></ruby> <ruby>fe<rt>//PREが</rt></ruby> <ruby>au<rt>VAR</rt></ruby> <ruby>be<rt>//PREを</rt></ruby> ￢ <ruby>pina<rt>リンゴだ</rt></ruby> <ruby>moku<rt>食べる</rt></ruby>
: {:.logic} ∃x ∃y (￢リンゴだ(は:y) ∧ 食べる(x, y))


## 論理表現

一階述語論理での各論理記号（否定￢、論理積∧、論理和∨、含意⇒、同値⇔、存在量化∃、全称量化∀）がVarhilでどう表現されるか見てこう。

今まで見てきたように、任意のVarhil文は否定開始、否定終止で挟むことでその否定を、並べることでそれらの論理積を表現できる。また、すべての変数は無標で存在量化されているので、∃も表現できたといえる。

論理和 `P∨Q` は古典論理上で `￢(￢P∧￢Q)` と等価であるので、Varhilではこの組み合わせで表現する。

{:.example}
{:.glossed} <ruby>nou<rt>{NEG</rt></ruby> <ruby>nou<rt>{NEG</rt></ruby> ～ <ruby>noi<rt>}NEG</rt></ruby> <ruby>nou<rt>{NEG</rt></ruby> … <ruby>noi<rt>}NEG</rt></ruby> <ruby>noi<rt>}NEG</rt></ruby>
: {:.logic} ～ ∨ …

含意 `P⇒Q` は古典論理上で`￢(P∧￢Q)` と等価であるので、Varhilではこの組み合わせで表現する。

{:.example}
{:.glossed} <ruby>nou<rt>{NEG</rt></ruby> ～ <ruby>nou<rt>{NEG</rt></ruby> … <ruby>noi<rt>}NEG</rt></ruby> <ruby>noi<rt>}NEG</rt></ruby>
: {:.logic} ～ ⇒ …

同値 `P⇔Q` は `(P⇒Q)∧(Q⇒P)` の糖衣構文であり、古典論理上で `￢(P∧￢Q)∧￢(￢P∧Q)` と等価であるので、Varhilではこの組み合わせで表現する。

{:.example}
{:.glossed} <ruby>nou<rt>{NEG</rt></ruby> ～ <ruby>nou<rt>{NEG</rt></ruby> … <ruby>noi<rt>}NEG</rt></ruby> <ruby>noi<rt>}NEG</rt></ruby> <ruby>nou<rt>{NEG</rt></ruby> <ruby>nou<rt>{NEG</rt></ruby> ～ <ruby>noi<rt>}NEG</rt></ruby> … <ruby>noi<rt>}NEG</rt></ruby>
: {:.logic} ～ ⇔ …

全称量化は `∀x; P` は古典論理上で  `￢∃x￢P`と等価であるので、Varhilではこの組み合わせで表現する。（定名詞も名詞句であるから単文になれるので、二重の否定の間に定名詞を置けばよい）

{:.example}
{:.glossed} <ruby>nou<rt>{NEG</rt></ruby> <ruby>a<rt>VAR+0</rt></ruby> <ruby>nou<rt>{NEG</rt></ruby> ～ <ruby>noi<rt>}NEG</rt></ruby> <ruby>noi<rt>}NEG</rt></ruby>
: {:.logic} ∀x ～

従って、以上のような古典論理に従った同一視を行えば、開論理式を除く一階述語論理のすべての論理式と等価な表現をVarhilでも表現できるといえる。

なお、これらは任意のVarhil文同士の結合ができることを示しているのみで、条件が整えば（単独否定を使える場合などは）より短い形で書くことができる。

{:.example}
{:.glossed} <ruby>no<rt>/NEG</rt></ruby> <ruby>e<rt>//PREは</rt></ruby> <ruby>au<rt>VAR</rt></ruby> <ruby>no<rt>/NEG</rt></ruby> <ruby>pina<rt>リンゴだ</rt></ruby>
: {:.logic} ∀x リンゴだ(は:x)
^
{:.example}
{:.glossed} <ruby>no<rt>/NEG</rt></ruby> <ruby>e<rt>//PREは</rt></ruby> <ruby>pina<rt>リンゴだ</rt></ruby> <ruby>no<rt>/NEG</rt></ruby> <ruby>loja<rt>赤い</rt></ruby>
: {:.logic} ∀x リンゴだ(は:x)⇒赤い(は:x)
^
{:.example}
{:.glossed} <ruby>no<rt>/NEG</rt></ruby> <ruby>e<rt>//PREは</rt></ruby> <ruby>no<rt>/NEG</rt></ruby> <ruby>pina<rt>リンゴだ</rt></ruby> <ruby>no<rt>/NEG</rt></ruby> <ruby>jana<rt>人間だ</rt></ruby>
: {:.logic} ∀x リンゴだ(は:x)∨人間だ(は:x)

また、述語論理には述語記号の他に定数記号や関数記号が存在するが、定数記号は、ある一つの値に対して真となる1変数述語記号として、アリティnの関数記号は、ある引数が一つの値に対してのみ真となるアリティn+1の述語記号として、表現できる。
