document.addEventListener("DOMContentLoaded", function() {
  // URLを取得
  let path = location.pathname;
  //最初の/を除去
  path = path.substring(1);
  //URLを整形（拡張子やindex.htmlを除去）
  if(path.lastIndexOf("/") < path.lastIndexOf(".")) {
    path = path.substring(0, path.lastIndexOf("."));
    if (path.substring(path.lastIndexOf("/") + 1) === "index"){
      path = path.substring(0, path.lastIndexOf("/"));
    }
  }
  //最後の/を除去
  if(path.endsWith("/"))
    path = path.substring(0, path.length - 1);
  let splited = path.split("/");
  let target = document.getElementById("breadcrumbs");
  splited.forEach((x,i)=>{
    let li = document.createElement("li");
    if (i !== splited.length - 1) {
      let a = document.createElement("a");
      a.textContent = x.substring(0, 1).toUpperCase() + x.substring(1);
      a.setAttribute('href', "/" + splited.slice(0, i+1).join("/")　+ "/");
      li.appendChild(a);
    }
    else {
      li.textContent = x.substring(0, 1).toUpperCase() + x.substring(1);
    }
    target.appendChild(li);
  });
});
