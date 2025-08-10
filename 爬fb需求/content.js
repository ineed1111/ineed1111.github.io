
// html-div xdj266r x14z9mp xat24cr x1lziwak xexx8yu xyri2b x18d9i69 x1c1uobl
// html-div xdj266r x14z9mp xat24cr x1lziwak xexx8yu xyri2b x18d9i69 x1c1uobl
// html-div xdj266r x14z9mp xat24cr x1lziwak xexx8yu xyri2b x18d9i69 x1c1uobl



// 最大帖數與搜帖關鍵字由 popup.html 傳入



let stopFlag = false;

function clickExpandLinks() {
  const expandDivs = Array.from(document.querySelectorAll('div'))
    .filter(div => div.innerText.includes('顯示更多') || div.innerText.includes('查看更多'));
  expandDivs.forEach(div => div.click());
}

async function extractPosts() {
  let lastCount = 0;
  stopFlag = false;
  let totalCount = 0;
  // 若最大帖數未設定，預設為 1
  if (typeof 最大帖數 !== 'number' || isNaN(最大帖數)) 最大帖數 = 1;
  // 若關鍵字未設定，預設為空字串
  if (typeof 搜帖關鍵字 !== 'string') 搜帖關鍵字 = '';
  let finishedSent = false;
  while (true) {
    console.log('while迴圈', {lastCount, postsLength: document.querySelectorAll('div.x193iq5w.x1xwk8fm div.html-div').length});
    if (stopFlag) {
      console.log('已停止爬文');
      if (!finishedSent) {
        console.log('content.js 準備送 crawl-finished');
        chrome.runtime.sendMessage({ action: 'crawl-finished' }, function(resp) {
          console.log('content.js crawl-finished callback', resp);
        });
        finishedSent = true;
      }
      break;
    }
    const posts = document.querySelectorAll('div.x193iq5w.x1xwk8fm div.html-div');
    if (posts.length === lastCount) {
      console.log('所有貼文已處理完畢，準備送 crawl-finished', {lastCount, postsLength: posts.length, totalCount});
      if (!finishedSent) {
        chrome.runtime.sendMessage({ action: 'crawl-finished' });
        finishedSent = true;
      }
      break;
    }
    for (let idx = lastCount; idx < posts.length; idx++) {
      if (stopFlag) {
        console.log('已停止爬文');
        if (!finishedSent) {
          console.log('content.js 準備送 crawl-finished');
          chrome.runtime.sendMessage({ action: 'crawl-finished' }, function(resp) {
            console.log('content.js crawl-finished callback', resp);
          });
          finishedSent = true;
        }
        return;
      }
      if (totalCount >= 最大帖數) {
        console.log(`已達 ${最大帖數} 貼文上限，結束爬文，totalCount=${totalCount}`);
        if (!finishedSent) {
          console.log('content.js 準備送 crawl-finished');
          chrome.runtime.sendMessage({ action: 'crawl-finished' }, function(resp) {
            console.log('content.js crawl-finished callback', resp);
          });
          finishedSent = true;
        }
        return;
      }
      const post = posts[idx];
      totalCount++;
      post.scrollIntoView({behavior: 'smooth', block: 'center'});
      // 先點擊該貼文內的顯示更多/查看更多
      const expandDivs = Array.from(post.querySelectorAll('div'))
        .filter(div => div.innerText.includes('顯示更多') || div.innerText.includes('查看更多'));
      expandDivs.forEach(div => div.click());
      await new Promise(res => setTimeout(res, 500));

      // 取得指定 class 的 a 標籤 href
      const targetA = post.querySelector('a.x1i10hfl.xjbqb8w.x1ejq31n.x18oe1m7.x1sy0etr.xstzfhl.x972fbf.x10w94by.x1qhh985.x14e42zd.x9f619.x1ypdohk.xt0psk2.x3ct3a4.xdj266r.x14z9mp.xat24cr.x1lziwak.xexx8yu.xyri2b.x18d9i69.x1c1uobl.x16tdsg8.x1hl2dhg.xggy1nq.x1a2a7pz.xkrqix3.x1sur9pj.xzsf02u.x1s688f');
      const postHref = targetA ? targetA.href : '';

      const text = post.innerText.trim();
      const lines = text.split(/\r?\n/);

      // 處理完一個貼文後、自動滾動到下一個貼文下方或頁面底部
      if (idx < posts.length - 1) {
        console.log(`第${idx + 1}個帖`);
        posts[idx + 1].scrollIntoView({behavior: 'smooth', block: 'center'});
      } else {
        console.log(`第${idx + 1}是目前最後一個貼文，嘗試載入更多...`);
        window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'});
      }
      await new Promise(res => setTimeout(res, 500));
      // 檢查是否有連續33行Facebook
      let count = 0;
      let startIdx = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i] === 'Facebook') {
          count++;
          if (count === 33) {
            startIdx = i - 32;
            break;
          }
        } else {
          count = 0;
        }
      }
      if (startIdx !== -1) {
        // 1. 找到連續33行Facebook的起點與終點
        const fbStart = startIdx;
        const fbEnd = startIdx + 33;
        // 2. 取出中間內容（33行Facebook之後到下一個剪斷點或結尾）
        let middleLines = lines.slice(fbEnd);

        // 3. 刪除第2行到遇到一行空行及一點（·）為止
        if (middleLines.length > 2) {
          let delStart = 1; // index 1 = 第2行
          let delEnd = delStart;
          while (delEnd < middleLines.length && !(middleLines[delEnd].trim() === '·' && middleLines[delEnd - 1].trim() === '')) {
            delEnd++;
          }
          if (delEnd < middleLines.length) delEnd++; // 包含「 ·」
          middleLines = [middleLines[0], ...middleLines.slice(delEnd)];
        }

        // 4. 移除所有'讚','留言','傳送','Facebook'行
        middleLines = middleLines.filter(line => !['讚','留言','傳送','Facebook'].includes(line.trim()));

        // 5. 移除「所有心情：」到「則留言」這段內容
        let idx1 = middleLines.findIndex(line => typeof line === 'string' && line.includes('所有心情：'));
        let idx2 = -1;
        if (idx1 !== -1) {
          idx2 = middleLines.findIndex((line, i) => i > idx1 && typeof line === 'string' && line.includes('則留言'));
          if (idx2 !== -1) {
            middleLines.splice(idx1, idx2 - idx1 + 1);
          }
        }

        // 6. 移除所有包含「則留言」或「的身分留言」的行
        middleLines = middleLines.filter(line => {
          if (typeof line !== 'string') return false;
          return !line.includes('則留言') && !line.includes('的身分留言') && !line.includes('的身分回答');
        });

        // 7. 移除包含「所有心情：」的行及其之後的所有行
        let moodIdx = middleLines.findIndex(line => typeof line === 'string' && line.includes('所有心情：'));
        if (moodIdx !== -1) {
          middleLines = middleLines.slice(0, moodIdx);
        }

        const result = middleLines.join('\n').trim();

        console.log(`result = ${result}---`);


        if (
          result &&
          result.includes(搜帖關鍵字) &&
          !result.includes('匿名參與者')
        ) {
          // 傳送給 popup 顯示
          chrome.runtime.sendMessage({
            action: 'post-result',
            data: { text: result, href: postHref }
          });
          console.log(result);
          if (postHref) {
            console.log('聯絡人:', postHref);
          }
        }
      }
    }
    lastCount = posts.length;
    await new Promise(res => setTimeout(res, 1000));
  }
  // while 迴圈結束時，無論有無貼文、關鍵字，皆通知 background 進行下一網址
  if (!stopFlag && !finishedSent) {
    console.log('content.js 準備送 crawl-finished');
    chrome.runtime.sendMessage({ action: 'crawl-finished' }, function(resp) {
      console.log('content.js crawl-finished callback', resp);
    });
    finishedSent = true;
  }
}

// 接收 popup 的訊息，只有收到 start-crawl 才執行
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'start-crawl') {
    if (typeof msg.maxPosts === 'number') 最大帖數 = msg.maxPosts;
    if (typeof msg.keyword === 'string') 搜帖關鍵字 = msg.keyword;
    clickExpandLinks();
    setTimeout(() => { extractPosts(); }, 500);
  }
  if (msg.action === 'stop-crawl') {
    stopFlag = true;
  }
});
