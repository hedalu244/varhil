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
  
    const splited = path.split("/");
    const target = document.getElementById("breadcrumbs");
    if (!(target instanceof HTMLUListElement)) throw new Error("DOM not found");
  
    splited.forEach((x,i)=>{
      let li = document.createElement("li");
  
      //末尾（現在のページ）にはリンクを付けない。拡張子とかもめんどくさいし
      if (i === splited.length - 1) {
        li.textContent = x;
      }
      else {
        let a = document.createElement("a");
        a.textContent = x;
        //ルートパス指定
        a.setAttribute('href', "/" + splited.slice(0, i+1).join("/")　+ "/");
        li.appendChild(a);
      }
      target.appendChild(li);
    });
  });
  