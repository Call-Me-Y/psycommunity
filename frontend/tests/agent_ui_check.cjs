// Run from the frontend directory with Node.js.
const fs=require('fs')
const vm=require('vm')
const assert=require('assert')

async function main() {
  const vue=fs.readFileSync('src/pages/chat/agent.vue','utf8')
  const script=vue.match(/<script>([\s\S]*?)<\/script>/)[1]
    .replace(/^import .*$/gm,'').replace('export default','component =')
  const sandbox={ component:null, config:{}, Database:{}, ChatScroll:{}, uni:{showToast(){}} }
  vm.runInNewContext(script,sandbox)
  const instance=sandbox.component.data()
  Object.assign(instance,sandbox.component.methods)
  instance.draft='测试消息'
  instance.configured=true
  instance.scrollDown=()=>{}
  instance.load=async()=>true
  let complete
  instance.request=()=>new Promise(resolve=>{complete=resolve})
  const response=instance.send()
  assert.strictEqual(instance.draft,'')
  assert.strictEqual(instance.messages.length,1)
  assert.strictEqual(instance.messages[0].content,'测试消息')
  assert.strictEqual(instance.sending,true)
  complete({success:true,reply:'测试回复'})
  await response
  assert.strictEqual(instance.messages[1].content,'测试回复')
  assert.strictEqual(instance.sending,false)

  const scrollCode=fs.readFileSync('src/utils/chatScroll.js','utf8')
  const scroll=await import('data:text/javascript;base64,'+Buffer.from(scrollCode).toString('base64'))
  const store={}
  global.uni={
    setStorageSync:(key,value)=>store[key]=value,
    getStorageSync:key=>store[key],
    createSelectorQuery:()=>({in(){return this},select(){return this},boundingClientRect(cb){cb({height:400});return this},exec(){}})
  }
  const page={currentUser:{uid:'user1'},scrollTop:999999,chatLastTop:0,chatViewportHeight:400,chatNearBottom:true,chatScrollReady:true,$nextTick:fn=>fn()}
  scroll.capture(page,{detail:{scrollTop:200,scrollHeight:1000}})
  scroll.remember(page,'private','friend')
  page.scrollTop=999999
  scroll.restore(page,'private','friend')
  assert.strictEqual(page.scrollTop,200)
  assert.strictEqual(page.chatNearBottom,false)
  scroll.capture(page,{detail:{scrollTop:600,scrollHeight:1000}})
  scroll.remember(page,'private','friend')
  page.scrollTop=0
  scroll.restore(page,'private','friend')
  assert.strictEqual(page.scrollTop,999999)
  page.currentUser.uid='other'
  page.scrollTop=0
  scroll.restore(page,'private','friend')
  assert.strictEqual(page.scrollTop,999999)

  const privateVue=fs.readFileSync('src/pages/chat/private.vue','utf8')
  const privateScript=privateVue.match(/<script>([\s\S]*?)<\/script>/)[1]
    .replace(/^import .*$/gm,'').replace('export default','component =')
  const attempts=[]
  let shouldFail=true
  const privateSandbox={ component:null, config:{}, secureParamsManager:{}, ChatScroll:{},
    console:{log(){},error(){}}, uni:{},
    ChatCache:{savePrivateReadStatus(){}},
    Database:{updatePrivateReadStatus:async (uid,id)=>{attempts.push(id); return shouldFail ? {success:false} : {success:true,last_read_msg_id:id}}} }
  vm.runInNewContext(privateScript,privateSandbox)
  const chat={currentUser:{uid:'admin'},contactInfo:{uid:'admin'},lastReadMsgId:0,
    messages:[{id:3},{id:2},{id:1},{id:Date.now(),pending:true}]}
  await privateSandbox.component.methods.updateReadStatus.call(chat)
  assert.strictEqual(chat.lastReadMsgId,0)
  shouldFail=false
  await privateSandbox.component.methods.updateReadStatus.call(chat)
  assert.deepStrictEqual(attempts,[3,3])
  assert.strictEqual(chat.lastReadMsgId,3)

  const indexVue=fs.readFileSync('src/pages/chat/index.vue','utf8')
  const indexScript=indexVue.match(/<script>([\s\S]*?)<\/script>/)[1]
    .replace(/^import .*$/gm,'').replace('export default','component =')
  const indexSandbox={component:null,config:{},Database:{},ChatNavigation:{},ChatCache:{},backgroundService:{},notificationManager:{},uni:{}}
  vm.runInNewContext(indexScript,indexSandbox)
  const label=indexSandbox.component.methods.formatContactName
  assert.strictEqual(label.call({currentUser:{uid:'admin',type:0}},{chat_type:'private',contact_id:'admin',contact_name:'自己',contact_is_admin:true}),'管理员（自己）')
  assert.strictEqual(label.call({currentUser:{uid:'alice',type:2}},{chat_type:'private',contact_id:'admin',contact_name:'小明',contact_is_admin:true}),'小明（管理员）')
  indexSandbox.Database.getContacts=async()=>({success:true,contacts:[{uid:'admin2',avatar:'/uploads/custom.jpg',is_admin:true}]})
  indexSandbox.Database.getUserById=async()=>({success:true,user:{uid:'admin',name:'管理员',type:0,avatar:'/static/admin.jpg'}})
  Object.assign(indexSandbox.ChatCache,{saveUserInfoCache(){},getGroupsCache(){return []},saveFriendsCache(){},saveLatestMessagesCache(){}})
  const contactPage={currentUser:{uid:'admin',type:0,avatar:'/static/avatar.png'},latestMessages:[
    {chat_type:'private',contact_id:'admin',contact_avatar:'/static/avatar.png'},
    {chat_type:'private',contact_id:'admin2',contact_avatar:'/static/avatar.png'}],
    getAvatarUrl:value=>value,ensureAllContactsInList(){}}
  await indexSandbox.component.methods.refreshContactProfiles.call(contactPage)
  assert.strictEqual(contactPage.latestMessages[0].contact_avatar,'/static/admin.jpg')
  assert.strictEqual(contactPage.latestMessages[1].contact_avatar,'/uploads/custom.jpg')
  console.log('PASS: Agent messages, chat scroll, read receipts, and administrator avatars')
}
main().catch(err=>{console.error(err);process.exit(1)})
