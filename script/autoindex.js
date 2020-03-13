document.addEventListener("DOMContentLoaded", function(){
  let currentUl = document.getElementById("index");
  let currentHierarchy = 2;
  Array.from(document.querySelectorAll('h2, h3, h4')).forEach(x=>{
    let a = document.createElement("a");
    a.href = "#" + x.id;
    a.textContent = x.textContent;
    let li = document.createElement("li");
    li.appendChild(a);
    let targetHierarchy = Number(x.tagName[1]);
    //階層が浅すぎたときは、最後のliにulを足して深くする
    while (currentHierarchy < targetHierarchy) {
      let ul = document.createElement("ul");
      //突然h3から始まったり、h2の次にh4が来たりしたとき
      if (currentUl.lastElementChild === null) {
        currentUl.appendChild(document.createElement(li));
      }
      currentUl.lastElementChild.appendChild(ul);
      currentUl = ul;
      currentHierarchy++;
    }
    //階層が深すぎたときは（ul>li>ulなので）親の親に戻って浅くする
    while (targetHierarchy < currentHierarchy) {
      currentUl = currentUl.parentElement.parentElement;
      currentHierarchy--;
    }
    currentUl.appendChild(li);
  });
});
