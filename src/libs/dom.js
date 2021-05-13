import { callFn, eachObj, getVal, typeCheck } from "../../util";
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
export function remove_items(selector,opts = {
  removeSelf : false,
  isOne : true
},cb) {
  let {removeSelf,isOne} = opts
  if(isOne){
    var pannel = document.querySelector(selector)
    _remove(pannel)
  }else {
    var pannels = document.querySelectorAll(selector)
    Array.from(pannels).forEach(pannel=>_remove(pannel))
  }
  function _remove(dom) {
    if(dom){
      if(removeSelf){
        callFn(cb,dom)
        dom.remove()
      }else if(dom.innerHTML) {
        dom.innerHTML = ""
      }
    } 
  }
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
export function setMask(el){//设置遮罩层
  
  var mask = document.createElement('div');
  if(typeCheck('String')(el)) el = document.querySelector(el)
  if (!el) {
    console.log('获取dom失败');
    return
  }
  mask.className = 'checkDomMask'
  mask.style.width = el.innerWidth + 'px';
  mask.style.height = el.innerHeight + 'px';
  mask.style.background = 'rgba(173,198,235,0.5)';
  mask.style.position = 'absolute';
  mask.style.top = '0';
  mask.style.left = '0';
  mask.style.width = '100%';
  mask.style.height = '100%'; 
  mask.style.zIndex = 10;
  el.appendChild(mask);
  mask._parentPosition = el.style.position;
  el.style.position = 'relative'
}
export function removeMask() {
  remove_items('.checkDomMask',{
    removeSelf : true,
    isOne : false
  },(dom)=>{
    if(getVal(dom,'parentNode.style.position').err){
      console.log(getVal(dom,'parentNode.style.position').errKey);
    }
    else {
      dom.parentNode.style.position = dom._parentPosition
    }
  })
}

// hover事件
export function hover(opts) {  
  let {dom,cb,outCb,cbParams = [],outCbParams = [],delay = 0} = opts;
  var showClothTimer;
  let flag = false; // cb是否执行过
  dom.addEventListener('mouseenter',()=>{
    showClothTimer = setTimeout(()=>{
      callFn(cb,...cbParams)
      flag = true;
    },delay);
  }, false )
  button.addEventListener( 'mouseout', function(event) {
    clearTimeout(showClothTimer);
    if(flag){
      callFn(outCb,...outCbParams)
    }
  }, false );
}