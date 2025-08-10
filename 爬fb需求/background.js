// background.js
// 控制爬文流程，popup 關閉後仍可持續執行

let crawlState = {
  urlList: [],
  currentUrlIdx: 0,
  running: false,
  allPosts: [],
  crawlerWindowId: null,
};

// 監聽 popup 指令
// maxPosts 與 keyword 由 popup.html 傳入，存到 crawlState
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('[BG] 收到訊息', msg, sender);
  if (msg.action === 'start-crawl-bg' && Array.isArray(msg.urls)) {
    // 過濾空白網址
    crawlState.urlList = msg.urls.map(u => (typeof u === 'string' ? u.trim() : '')).filter(Boolean);
    crawlState.currentUrlIdx = 0;
    crawlState.running = true;
    crawlState.allPosts = [];
    crawlState.maxPosts = (typeof msg.maxPosts === 'number') ? msg.maxPosts : 1;
    crawlState.keyword = (typeof msg.keyword === 'string') ? msg.keyword : '';
  console.log('[BG] start-crawl-bg, urlList:', crawlState.urlList, 'maxPosts:', crawlState.maxPosts, 'keyword:', crawlState.keyword);
    if (crawlState.urlList.length === 0) {
      console.log('[BG] No valid urls to crawl.');
      crawlState.running = false;
      chrome.runtime.sendMessage({ action: 'crawl-finished-all' });
      return;
    }
    // 開新視窗，第一個網址（只開一個分頁，之後都用同一分頁切換網址）
    chrome.windows.create({ url: crawlState.urlList[0], focused: false, type: 'normal' }, (win) => {
      crawlState.crawlerWindowId = win.id;
      crawlState.crawlerTabId = win.tabs[0].id;
      waitForTabLoad(win.tabs[0].id, () => {
        chrome.scripting.executeScript({
          target: { tabId: win.tabs[0].id },
          files: ['content.js']
        }, () => {
          chrome.tabs.sendMessage(win.tabs[0].id, {
            action: 'start-crawl',
            maxPosts: crawlState.maxPosts,
            keyword: crawlState.keyword
          });
        });
      });
    });
  }
  if (msg.action === 'stop-crawl-bg') {
    crawlState.running = false;
  }
  if (msg.action === 'clear-crawl-bg') {
  crawlState = { urlList: [], currentUrlIdx: 0, running: false, allPosts: [], crawlerWindowId: null };
  }
});

// 收到 content.js 傳來的內容
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.action === 'post-result' && msg.data) {
    crawlState.allPosts.push(msg.data);
    chrome.storage.local.set({ fb_crawler_posts: crawlState.allPosts });
    chrome.runtime.sendMessage({ action: 'post-result', data: msg.data });
  }
  if (msg.action === 'crawl-finished') {
    console.log('[BG] crawl-finished received, currentUrlIdx:', crawlState.currentUrlIdx, 'urlList.length:', crawlState.urlList.length, 'running:', crawlState.running);
    crawlState.currentUrlIdx++;
    if (crawlState.running && crawlState.currentUrlIdx < crawlState.urlList.length) {
      // 用同一分頁切換網址
      console.log('[BG] Update tab to next url:', crawlState.urlList[crawlState.currentUrlIdx], 'at idx', crawlState.currentUrlIdx);
      updateTabToNextUrl();
    } else {
      crawlState.running = false;
      // 全部爬完才關閉視窗
      if (crawlState.crawlerWindowId) {
        chrome.windows.remove(crawlState.crawlerWindowId);
        crawlState.crawlerWindowId = null;
        crawlState.crawlerTabId = null;
      }
      console.log('[BG] All urls finished, sending crawl-finished-all');
      chrome.runtime.sendMessage({ action: 'crawl-finished-all' });
    }
  }
});


// 用同一分頁切換網址
function updateTabToNextUrl() {
  if (!crawlState.running || crawlState.currentUrlIdx >= crawlState.urlList.length) {
    console.log('[BG] updateTabToNextUrl: finished or stopped', 'currentUrlIdx:', crawlState.currentUrlIdx, 'urlList.length:', crawlState.urlList.length, 'running:', crawlState.running);
    return;
  }
  const url = crawlState.urlList[crawlState.currentUrlIdx];
  const tabId = crawlState.crawlerTabId;
  console.log('[BG] updateTabToNextUrl: updating tab', tabId, 'to', url, 'at idx', crawlState.currentUrlIdx, 'urlList:', crawlState.urlList);
  chrome.tabs.update(tabId, { url }, (tab) => {
    waitForTabLoad(tab.id, () => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      }, () => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'start-crawl',
          maxPosts: crawlState.maxPosts,
          keyword: crawlState.keyword
        });
      });
    });
  });
}

function waitForTabLoad(tabId, callback) {
  chrome.tabs.onUpdated.addListener(function listener(updatedTabId, info) {
    if (updatedTabId === tabId && info.status === 'complete') {
      chrome.tabs.onUpdated.removeListener(listener);
      setTimeout(callback, 800);
    }
  });
}
