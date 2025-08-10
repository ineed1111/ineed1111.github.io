
const urlInput = document.getElementById('urlInput');
const maxPostsInput = document.getElementById('maxPosts');
const keywordInput = document.getElementById('keyword');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const downloadBtn = document.getElementById('downloadBtn');
const clearBtn = document.getElementById('clearBtn');
const statusDiv = document.getElementById('status');
const resultList = document.getElementById('resultList');

let allPosts = [];

// 載入 chrome.storage.local 內容（網址與結果）

// 重新打開時同步顯示所有資料，並監聽 storage 變化
function syncAllPostsFromStorage() {
  chrome.storage.local.get('fb_crawler_posts', (result) => {
    if (result && Array.isArray(result.fb_crawler_posts)) {
      allPosts = result.fb_crawler_posts;
      renderAllPosts();
    } else {
      allPosts = [];
      renderAllPosts();
    }
  });
}


window.addEventListener('DOMContentLoaded', () => {
  syncAllPostsFromStorage();
  const savedUrls = localStorage.getItem('fb_crawler_urls');
  if (savedUrls) {
    urlInput.value = savedUrls;
  }
  // 還原最大帖數
  const savedMaxPosts = localStorage.getItem('fb_crawler_maxPosts');
  if (savedMaxPosts !== null) {
    maxPostsInput.value = savedMaxPosts;
  }
  // 還原關鍵字
  const savedKeyword = localStorage.getItem('fb_crawler_keyword');
  if (savedKeyword !== null) {
    keywordInput.value = savedKeyword;
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.fb_crawler_posts) {
    syncAllPostsFromStorage();
  }
});

// textarea 輸入時自動保存

urlInput.addEventListener('input', () => {
  localStorage.setItem('fb_crawler_urls', urlInput.value);
});
maxPostsInput.addEventListener('input', () => {
  localStorage.setItem('fb_crawler_maxPosts', maxPostsInput.value);
});
keywordInput.addEventListener('input', () => {
  localStorage.setItem('fb_crawler_keyword', keywordInput.value);
});

function renderAllPosts() {
  resultList.innerHTML = '';
  allPosts.forEach(post => {
    const li = document.createElement('li');
    li.textContent = post.text;
    if (post.href) {
      const a = document.createElement('a');
      a.href = post.href;
      a.textContent = ' [聯絡人]';
      a.target = '_blank';
      li.appendChild(a);
    }
    resultList.appendChild(li);
  });
}

// 刪除所有內容
clearBtn.addEventListener('click', () => {
  allPosts = [];
  chrome.storage.local.remove('fb_crawler_posts');
  chrome.runtime.sendMessage({ action: 'clear-crawl-bg' });
  renderAllPosts();
});

startBtn.addEventListener('click', () => {
  statusDiv.textContent = '狀態：執行中';
  allPosts = [];
  resultList.innerHTML = '';
  chrome.storage.local.remove('fb_crawler_posts', () => {
    const urlList = urlInput.value.split(',').map(s => s.trim()).filter(Boolean);
    if (urlList.length === 0) {
      statusDiv.textContent = '請輸入網址';
      return;
    }
    const maxPosts = maxPostsInput.value.trim() === '' ? 1 : parseInt(maxPostsInput.value, 10);
    const keyword = keywordInput.value.trim();
    console.log('[popup] 啟動', {urlList, maxPosts, keyword});
    chrome.runtime.sendMessage({
      action: 'start-crawl-bg',
      urls: urlList,
      maxPosts,
      keyword
    });
  });
});

stopBtn.addEventListener('click', () => {
  statusDiv.textContent = '狀態：已停止';
  chrome.runtime.sendMessage({ action: 'stop-crawl-bg' });
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {action: 'stop-crawl'});
  });
});

// 下載所有文
downloadBtn.addEventListener('click', () => {
  if (allPosts.length === 0) return;
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const publishDate = `${yyyy}-${mm}-${dd}`;
  const userId = 'jVYxNPbwBGWaMxZPVNu2nF4AAmt1';
  const jsonArr = allPosts.map(p => ({
    category: '',
    title: '',
    description: p.text,
    contact: p.href,
    userId,
    publishDate
  }));
  const blob = new Blob([JSON.stringify(jsonArr, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'fb_posts.json';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
});

// 接收 background 傳來的內容


// 只在全部網址都爬完時自動下載 json
function autoDownloadJson() {
  if (allPosts.length === 0) return;
  // 依 description 去重
  const uniqueMap = new Map();
  allPosts.forEach(p => {
    if (p.text && !uniqueMap.has(p.text)) {
      uniqueMap.set(p.text, p);
    }
  });
  const uniquePosts = Array.from(uniqueMap.values());
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const publishDate = `${yyyy}-${mm}-${dd}`;
  const userId = 'jVYxNPbwBGWaMxZPVNu2nF4AAmt1';
  const jsonArr = uniquePosts.map(p => ({
    category: '',
    title: '',
    description: p.text,
    contact: p.href,
    userId,
    publishDate
  }));
  const blob = new Blob([JSON.stringify(jsonArr, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'fb_posts.json';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'post-result' && msg.data) {
    allPosts.push(msg.data);
    chrome.storage.local.set({ fb_crawler_posts: allPosts });
    renderAllPosts();
  }
  if (msg.action === 'crawl-finished-all') {
    statusDiv.textContent = '狀態：全部網址已完成';
    autoDownloadJson();
  }
});
