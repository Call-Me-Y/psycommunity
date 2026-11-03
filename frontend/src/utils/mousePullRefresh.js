// H5's page refresher listens to touch events; allow a desktop mouse drag on
// non-interactive page background as well. Native platforms use touch refresh.
export function installMousePullRefresh(page) {
  // #ifdef H5
  removeMousePullRefresh(page)
  const root = page.$el
  if (!root || !root.addEventListener) return
  let start = null
  const blocked = 'input,textarea,button,a,select,uni-input,uni-textarea,uni-button,uni-picker,uni-image,uni-text,.dialog-overlay,.post-item,.list-item,.resource-card,.action-card,.tab-bar,.add-button,.refresh-button,.user-info-card'
  const atTop = target => {
    const documentScroll = document.scrollingElement || document.documentElement
    if (documentScroll && documentScroll.scrollTop > 0) return false
    const scrollView = target.closest && target.closest('uni-scroll-view')
    const inner = scrollView && scrollView.querySelector('.uni-scroll-view')
    return !inner || inner.scrollTop <= 0
  }
  const down = event => {
    start = null
    if (event.button !== 0 || !event.target || !root.contains(event.target)) return
    if ((event.target.closest && event.target.closest(blocked)) || !atTop(event.target)) return
    start = { x: event.clientX, y: event.clientY, target: event.target }
  }
  const up = event => {
    if (!start) return
    const initial = start
    start = null
    const dy = event.clientY - initial.y, dx = Math.abs(event.clientX - initial.x)
    if (dy >= 90 && dy > dx * 1.5 && atTop(initial.target)) uni.startPullDownRefresh()
  }
  root.addEventListener('mousedown', down)
  window.addEventListener('mouseup', up)
  page.__mousePullCleanup = () => {
    root.removeEventListener('mousedown', down)
    window.removeEventListener('mouseup', up)
  }
  // #endif
}

export function removeMousePullRefresh(page) {
  // #ifdef H5
  if (page.__mousePullCleanup) page.__mousePullCleanup()
  page.__mousePullCleanup = null
  // #endif
}
