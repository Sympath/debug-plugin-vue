import { eachObj } from "../../util";
// 挂载dom至body
export function mountToBody(dom){
    var bo = document.body; //获取body对象.
    //动态插入到body中
    bo.insertBefore(dom, bo.lastChild);
}
// 类似createElement 根据虚拟dom生成真实dom
export function creatDom(domOpts){
    let {tag,text,opts,childrens = []} = domOpts;
                //创建一个div
    var dom = document.createElement(tag);
    dom.innerHTML = text; //设置显示的数据，可以是标签．

    for (const key in opts) {
      if(key === 'style'){
        let styleOpts = opts[key];
        for (const styleKey in styleOpts) {
          dom.style[styleKey] = styleOpts[styleKey]
        }
      }
      if (key === 'class') {
        dom.className = opts[key];
      }
      if (key === 'on') {
        let eventOpts = opts[key];
        for (const eventKey in eventOpts) {
          let fn = eventOpts[eventKey]
          dom.addEventListener(eventKey,fn)
        }
      }
    }
    childrens.forEach(child => { 
      return dom.appendChild(createElm(child));
    });
    return dom;
}
// 挂载指定dom
export function $mount(el,dom){
el = document.querySelector(el);
el.appendChild(dom);
}
// 清空指定dom
export function remove_items(className) {
var pannel = document.querySelector(className)
if(pannel && pannel.innerHTML) pannel.innerHTML = ""
}
// 设置样式
export function setStyle(opts) {
  
    let content = '';
    let cssContent = '';
    function _setStyle(cssQuery,styleOption){
        eachObj(styleOption,(key,val)=>{
          cssContent += `${key}: ${val}`
        })
        return `.${cssQuery} {${cssContent}}
                `   
    }
    eachObj(opts,(cssQuery,styleOption)=>{
        cssContent = ''
        content += _setStyle(cssQuery,styleOption)
    })
    let styleOption = {
        tag: 'style',
        text: content
    }
    
    let styleDom = creatDom(styleOption)
    document.getElementsByTagName('head').item(0).appendChild(styleDom);
}
