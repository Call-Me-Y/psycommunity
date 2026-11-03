// Run from the frontend directory with Node.js.
const fs=require('fs')
const vm=require('vm')
const assert=require('assert')

function component(path, extra={}) {
  const source=fs.readFileSync(path,'utf8').match(/<script>([\s\S]*?)<\/script>/)[1]
    .replace(/^\s*import .*$/gm,'').replace('export default','component =')
  const scope={component:null,config:{},Database:{},ChatNavigation:{},ChatCache:{},backgroundService:{},notificationManager:{},ShareDialog:{},XLSX:{},uni:{},...extra}
  vm.runInNewContext(source,scope)
  return {component:scope.component,scope}
}

async function main() {
  const pages=JSON.parse(fs.readFileSync('src/pages.json','utf8')).pages
  for(const path of ['pages/community/index','pages/chat/index','pages/resources/index','pages/survey/index']) {
    assert.strictEqual(pages.find(page=>page.path===path).style.enablePullDownRefresh,true,path)
  }
  for(const [path,methods] of [
    ['src/pages/community/index.vue',['fetchPosts']],
    ['src/pages/chat/index.vue',['loadFromServer','loadAgentPreview']],
    ['src/pages/resources/index.vue',['checkAdminStatus','loadSurveys']]
  ]) {
    let stopped=0, calls=[]
    const {component:page}=component(path,{uni:{stopPullDownRefresh(){stopped++}}})
    const instance={loading:false}
    for(const name of methods) instance[name]=async()=>{calls.push(name)}
    await page.onPullDownRefresh.call(instance)
    assert.deepStrictEqual(calls.sort(),methods.slice().sort(),path)
    assert.strictEqual(stopped,1,path)
    instance[methods[0]]=async()=>{throw new Error('test failure')}
    await assert.rejects(page.onPullDownRefresh.call(instance))
    assert.strictEqual(stopped,2,path+' must stop on failure')
  }
  {
    let stopped=0, loaded=[]
    const {component:page}=component('src/pages/survey/index.vue',{uni:{stopPullDownRefresh(){stopped++}}})
    const instance={currentUser:{uid:'u'},contentRefreshing:false,pullRefreshing:false,
      loadUserInfo:async()=>{loaded.push('user')},loadStatistics:async()=>{loaded.push('statistics')}}
    instance.refreshPage=page.methods.refreshPage.bind(instance)
    await page.methods.onContentRefresh.call(instance)
    assert.deepStrictEqual(loaded,['user','statistics'])
    assert.strictEqual(instance.contentRefreshing,false)
    assert.strictEqual(stopped,1)
    loaded=[]
    await page.onPullDownRefresh.call(instance)
    assert.deepStrictEqual(loaded,['user','statistics'])
    assert.strictEqual(stopped,2)
  }
  const source=fs.readFileSync('src/utils/mousePullRefresh.js','utf8')
  const mouse=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))
  const rootEvents={},windowEvents={}
  const root={addEventListener:(name,fn)=>rootEvents[name]=fn,removeEventListener:name=>delete rootEvents[name],contains:()=>true}
  global.document={scrollingElement:{scrollTop:0}}
  global.window={addEventListener:(name,fn)=>windowEvents[name]=fn,removeEventListener:name=>delete windowEvents[name]}
  let triggered=0
  global.uni={startPullDownRefresh(){triggered++}}
  const page={$el:root}
  mouse.installMousePullRefresh(page)
  const target={closest:()=>null}
  rootEvents.mousedown({button:0,target,clientX:10,clientY:20})
  windowEvents.mouseup({clientX:12,clientY:150})
  assert.strictEqual(triggered,1)
  document.scrollingElement.scrollTop=10
  rootEvents.mousedown({button:0,target,clientX:10,clientY:20})
  windowEvents.mouseup({clientX:12,clientY:150})
  assert.strictEqual(triggered,1,'mouse drag must begin at the top')
  document.scrollingElement.scrollTop=0
  const button={closest:selector=>selector==='uni-scroll-view' ? null : {}}
  rootEvents.mousedown({button:0,target:button,clientX:10,clientY:20})
  windowEvents.mouseup({clientX:12,clientY:150})
  assert.strictEqual(triggered,1,'interactive elements must not trigger refresh')
  mouse.removeMousePullRefresh(page)
  assert.strictEqual(rootEvents.mousedown,undefined)
  assert.strictEqual(windowEvents.mouseup,undefined)
  console.log('PASS: four-page refresh, scroll-view refresh, desktop drag, and cleanup')
}
main().catch(error=>{console.error(error);process.exit(1)})
