// Per-user, per-conversation scroll state; no message contents are stored here.
function key(page, kind, id) {
  const uid = page.currentUser && page.currentUser.uid
  return uid && id ? `chat_scroll_${uid}_${kind}_${id}` : ''
}

export function measure(page) {
  page.$nextTick(() => {
    uni.createSelectorQuery().in(page).select('.message-list').boundingClientRect(rect => {
      if (rect && rect.height) page.chatViewportHeight = rect.height
    }).exec()
  })
}

export function capture(page, event) {
  const detail = event.detail || {}
  if (typeof detail.scrollTop !== 'number') return
  page.chatLastTop = detail.scrollTop
  if (page.chatViewportHeight && detail.scrollHeight) {
    page.chatNearBottom = detail.scrollHeight - detail.scrollTop - page.chatViewportHeight < 80
  }
}

export function remember(page, kind, id) {
  const storageKey = key(page, kind, id)
  if (storageKey && page.chatScrollReady) uni.setStorageSync(storageKey, { top: page.chatLastTop, nearBottom: page.chatNearBottom })
}

export function bottom(page) {
  page.chatNearBottom = true
  page.scrollTop = 999998
  page.$nextTick(() => { page.scrollTop = 999999 })
}

export function restore(page, kind, id) {
  const storageKey = key(page, kind, id)
  const saved = storageKey && uni.getStorageSync(storageKey)
  page.chatNearBottom = !saved || saved.nearBottom !== false
  page.$nextTick(() => {
    if (saved && saved.nearBottom === false && Number.isFinite(saved.top)) page.scrollTop = Math.max(0, saved.top)
    else bottom(page)
    page.chatScrollReady = true
    measure(page)
  })
}
