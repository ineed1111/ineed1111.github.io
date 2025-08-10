// 統計總會員數並顯示到管理員界面
async function updateTotalUserCount() {
    try {
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);
        const total = snapshot.size;
        const countSpan = document.getElementById("total-user-count");
        if (countSpan) countSpan.textContent = total;
    } catch (e) {
        console.error("獲取會員數失敗", e);
    }
}

// 管理員面板載入時自動更新會員數
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(updateTotalUserCount, 1200); // 等待 firebase 初始化
});

// 需求網 https://www.doubao.com/thread/w392c0a67fbaabef1

/*

將
login.js
u.html
放到 index同層


在index.html head 加入

<script type="module" src="login.js"></script>
<style>.hidden {display: none !important;}</style>


在index.html body 加入

        <div id="login-form">
            <!-- Google 登入鍵 登入後隱藏 -->
            <button onclick="loginWithGoogle()" class="大鍵" >Google 登入</button>
            <div id="error-message" class="error"></div>
        </div>

        <div class="admin-panel hidden" > 
            admin 功能 <!-- Google 登入後 admin 功能 -->
        </div>

        <div class="user-info hidden" ><!-- Google 登入後 一般會員 功能 -->
            <button onclick="充值()" title="充值" >💰 = </button>
            <span class="user-score"  title="悠的點數" >0</span>
            🙂 = <span class="user-email"></span>
            <button onclick="logout()">登出</button>
            <div id="success-message" class="success"></div>
            <div id="db-error-message" class="error"></div>

            <button class="大鍵"  title="執行搵客鍠 🔍" onclick="執行搵客鍠()">執行搵客鍠 🔍</button>
        </div>



*/

/*

建立 Firebase 專案
https://console.firebase.google.com/



新增應用程式 網頁
copy CDN 碼貼到login.js


Authentication 開始使用
登入方式 google
專案的支援電子郵件地址 你的


設定 授權網域 
測試用 = 127.0.0.1 
正式用 = 你的網址


Firestore Database
建立資料庫 位置 hk
正式模式
貼上規則

*/



/*  規則

rules_version = '2';
service cloud.firestore {
match /databases/{database}/documents {
match /users/{userId} {
// 允許用戶讀寫自己的數據
allow read, write: if request.auth != null &&
request.auth.uid == userId;


  // 允許管理員讀寫所有用戶數據（測試階段暫不強制MFA）
  allow read, write: if isAdmin(request.auth.uid);
  
  match /{subCollection}/{docId} {
    allow read, write: if request.auth != null && 
                       (request.auth.uid == userId || isAdmin(request.auth.uid));
  }
}

match /admins/{adminId} {
  allow read: if isAdmin(request.auth.uid);
  allow write: if false;
}

function isAdmin(uid) {
  return exists(/databases/$(database)/documents/admins/$(uid));
}


}
}

*/ 



/*

http://127.0.0.1:5500/u.html
用總admin帳號登入


回到 Firestore Database

複製 你的總admin帳號UID
新增集合 
集合 ID ： admins
文件 ID： 你的總admin帳號UID

新增欄位
createdAt：  timestamp  現在

新增欄位
role：  string  admin

回 http://127.0.0.1:5500/u.html
看到 管理員控制檯 = 成功


*/































const 新用戶送分 = 16; //20250803 ineed 送分






















/*
          :::        :::::::::       :::::::::::
       :+: :+:      :+:    :+:          :+:
     +:+   +:+     +:+    +:+          +:+
   +#++:++#++:    +#++:++#+           +#+
  +#+     +#+    +#+                 +#+
 #+#     #+#    #+#                 #+#
###     ###    ###             ###########

*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth,
    signInWithPopup, 
    GoogleAuthProvider, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc,
    updateDoc,
    increment ,
    deleteDoc,  // 新增
    onSnapshot  // 新增
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
// 記錄登入
import { 
    collection,
    addDoc,
    query,
    orderBy,
    limit,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
const firebaseConfig = {
    apiKey: "AIzaSyADk5vkYQqpaWUW9tI5erXE6GM3HcVpH18",
    authDomain: "ineed-545cd.firebaseapp.com",
    projectId: "ineed-545cd",
    storageBucket: "ineed-545cd.firebasestorage.app",
    messagingSenderId: "417974294016",
    appId: "1:417974294016:web:c54e783f518c230a242ae5",
    measurementId: "G-QEWY170WME"
  };

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);






























/*
     :::    :::       ::::::::       ::::::::::       :::::::::                       :::::::::       ::::::::       :::    :::
    :+:    :+:      :+:    :+:      :+:              :+:    :+:                      :+:    :+:     :+:    :+:      :+:    :+:
   +:+    +:+      +:+             +:+              +:+    +:+                      +:+    +:+     +:+    +:+       +:+  +:+
  +#+    +:+      +#++:++#++      +#++:++#         +#++:++#:                       +#++:++#+      +#+    +:+        +#++:+
 +#+    +#+             +#+      +#+              +#+    +#+                      +#+    +#+     +#+    +#+       +#+  +#+
#+#    #+#      #+#    #+#      #+#              #+#    #+#                      #+#    #+#     #+#    #+#      #+#    #+#
########        ########       ##########       ###    ###      ##########      #########       ########       ###    ###

*/
// 監聽登入狀態
onAuthStateChanged(auth, async (user) => {
    if (user) {

        // 新增：檢查並初始化新用戶VIP
        const isNewUser = await initializeNewUserVIP(user.uid);

        document.getElementById('login-form').style.display = 'none';
        // 選取所有具有 class="user-email" 的元素
        document.querySelectorAll('.user-email').forEach(element => {
            element.textContent = user.email;
        });

        document.querySelectorAll('.userId').forEach(element => {
            element.textContent = user.uid;
        });
        
        
        // 檢查是否是管理員
        const isAdmin = await checkAdmin();
        if (isAdmin) {
            //document.querySelectorAll('.admin-panel').classList.remove('hidden')
            document.querySelectorAll('.admin-panel').forEach(el => {
                el.classList.remove('hidden');
            });
            
        //document.getElementById('admin-panel').style.display = 'block';
        //document.getElementById('user-info').style.display = 'none';
        await loadAllUsers(); // 加載所有用戶數據
        showSuccess("管理員登錄成功");
        } else {
            //document.querySelectorAll('.user-info').classList.remove('hidden')
            document.querySelectorAll('.user-info').forEach(el => {
                el.classList.remove('hidden');
            });
        //document.getElementById('user-info').style.display = 'block';
        //document.getElementById('admin-panel').style.display = 'none';
        }
        
        // 公共加載部分
        await loadUserScore(user.uid);
        await recordLogin(user.uid);
        await loadLoginHistory(user.uid);

    } else {
        // 用戶未登錄狀態
        document.getElementById('login-form').style.display = 'block';
        //document.getElementById('user-info').style.display = 'none';
        //document.getElementById('admin-panel').style.display = 'none';
    }
    });






























/*
       #                    #             #            #    #       
       #            ##########         #  #         #  #  # #       
      # #           #       #          #   #         # # #  #       
     #   #          #       #         #    #           #   #    #   
    #     #         #########         #     #      ###############  
   #       #                 #       #       #        ##  #    #    
  # ####### ###    ############     #         #      # ##  #   #    
##           #     #         #     #  ####### ###   #  # # #   #    
           #       #    #    #    #    #    #  #      #    #   #    
  ###########      #    #    #         #    #      ####### #  #     
      #            #    #    #         #    #        #   #  # #     
      #            #    #    #         #    #        #   #   #      
     #   #         #   #     #         #    #         # #   # #     
    #     #           #   ##          #     #         ##   #   #    
   #########        ##      ##       #   # #         #  # #    ###  
           #      ##          #     #     #         #    #      #   

*/


// 新增函數：初始化新用戶VIP
async function initializeNewUserVIP(userId) {
    try {
        // 檢查VIP記錄是否存在
        const vipRef = doc(db, 'vipusers', userId);
        const vipSnap = await getDoc(vipRef);
        
        if (!vipSnap.exists()) {
            // 為新用戶創建VIP記錄，設置1天有效期
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 1); // 1天后
            
            await setDoc(vipRef, {
                vipEndDate: endDate,
                createdAt: new Date(),
                isTrial: true // 標記為試用VIP
            });
            
            return true; // 是新用戶
        }
        return false; // 不是新用戶
    } catch (error) {
        console.error('初始化新用戶VIP失敗:', error);
        return false;
    }
}


// 載入用戶分數 (修改為使用「會員分數」字段)
async function loadUserScore(userId) {
    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            document.querySelectorAll('.user-score').forEach(element => {
                element.textContent = userSnap.data().會員分數 || 0;
            });
        } else {
            // 新用戶初始化
            await setDoc(userRef, {
                email: auth.currentUser.email,
                會員分數: 新用戶送分  // 新用戶送100分
            });
            document.querySelectorAll('.user-score').forEach(element => {
                element.textContent = 0;
            });
        }
    } catch (error) {
        showDbError("載入分數失敗: " + error.message);
    }
}

// 兌換獎勵 (修改為檢查「會員分數」字段)
// const result = await redeemPoints(最多找資料數);
window.redeemPoints = async (pointsToRedeem) => {
    const userId = auth.currentUser.uid;

    pointsToRedeem = Number(pointsToRedeem);
    
    // 檢查傳入的 pointsToRedeem 是否有效
    if (typeof pointsToRedeem !== 'number' || isNaN(pointsToRedeem) || pointsToRedeem <= 0) {
        showDbError("請輸入有效的正整數分數");
        return { success: false, message: "無效的分數" };
    }

    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        const currentScore = userSnap.data().會員分數 || 0;  // 使用中文字段
        
        if (currentScore < pointsToRedeem) {
            showDbError(`分數不足 (需要 ${pointsToRedeem} 分)`);
            return { success: false, message: "分數不足" };
        }
        
        if (pointsToRedeem <= 0) {
            showDbError("使用分數必須大於 0");
            return { success: false, message: "使用分數必須大於 0" };
        }
        
        await updateDoc(userRef, {
            "會員分數": increment(-pointsToRedeem)  // 使用中文字段
        });
        await loadUserScore(userId);
        showSuccess(`已使用 ${pointsToRedeem} 分`);

        // 返回成功狀態及相關數據
        return { 
            success: true, 
            pointsUsed: pointsToRedeem, 
            remainingPoints: currentScore - pointsToRedeem 
        };
    } catch (error) {
        showDbError("使用失敗: " + error.message);
        return { success: false, error: error.message }; // 返回錯誤訊息
    }
};






























/*
        #             #                                       #     
  ##### #  #           #            #         #      ###########    
      # # #             #            # #########              #     
   #  #  #  #           #            #        #               #     
    ##   # #            #                     #       #########     
    #     #            # #                    #               #     
   #########           # #        ####        #               # #   
  #       # ###        # #           #  #######    ###############  
##  ######## #        #   #          #  #     #           #    #    
    #     #           #   #          #  #             #   #   #     
    #     #          #     #         #  #              #  ## #      
    #######          #     #         #  #       #       # # #       
     #   #          #       #        # ##       #      #  #  #      
      # #   #      #        #        ## #       #     #   #   ####  
 #############    #          ###     #   ########   ##  # #     #   
                 #            #                          #          

*/

// 新增：記錄登入信息
async function recordLogin(userId) {
    try {
        const historyRef = collection(db, "users", userId, "loginHistory");
        
        // 獲取客戶端信息
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        
        await addDoc(historyRef, {
            登入時間: new Date(),
            ipAddress: ipData.ip || '未知',
            userAgent: navigator.userAgent,
            deviceType: getDeviceType()
        });
    } catch (error) {
        console.error("記錄登入失敗:", error);
    }
}

// 新增：加載登入歷史
async function loadLoginHistory(userId) {  // 接收userId參數
  // 1. 先檢查容器元素是否存在
  const historyContainer = document.getElementById('login-history');
  if (!historyContainer) {
    console.error('錯誤：未找到登錄歷史容器元素，請檢查 HTML 中是否有 id="login-history" 的元素');
    return;
  }

  try {
    // 2. 修正集合路徑：查詢當前用戶的loginHistory子集合
    const historyQuery = query(
      collection(db, 'users', userId, 'loginHistory'),  // 正確的路徑
      orderBy('登入時間', 'desc'),  // 使用正確的字段名（之前記錄時用的是"登入時間"）
      limit(10)
    );
    const querySnapshot = await getDocs(historyQuery);
    const historyList = querySnapshot.docs.map(doc => doc.data());

    // 3. 渲染歷史記錄
    if (historyList.length === 0) {
      historyContainer.innerHTML = '<p>暫無登錄記錄</p>';
    } else {
      historyContainer.innerHTML = historyList.map(item => `
        <div class="history-item">
          <span>IP: ${item.ipAddress}</span>
          <span>設備: ${item.deviceType}</span>
          <span>時間: ${new Date(item.登入時間.toDate()).toLocaleString()}</span>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('加載歷史失敗:', error);
    if (historyContainer) {
      historyContainer.innerHTML = '<p>加載登錄歷史失敗</p>';
    }
  }
}

// 輔助函數：檢測設備類型
function getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        return "平板";
    } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
        return "手機";
    }
    return "電腦";
}






























/*
          :::        :::::::::         :::   :::       :::::::::::       ::::    :::
       :+: :+:      :+:    :+:       :+:+: :+:+:          :+:           :+:+:   :+:
     +:+   +:+     +:+    +:+      +:+ +:+:+ +:+         +:+           :+:+:+  +:+
   +#++:++#++:    +#+    +:+      +#+  +:+  +#+         +#+           +#+ +:+ +#+
  +#+     +#+    +#+    +#+      +#+       +#+         +#+           +#+  +#+#+#
 #+#     #+#    #+#    #+#      #+#       #+#         #+#           #+#   #+#+#
###     ###    #########       ###       ###     ###########       ###    ####

*/








// 檢查管理員權限
async function checkAdmin() {
try {
const adminRef = doc(db, "admins", auth.currentUser.uid);
const snapshot = await getDoc(adminRef);
console.log("Admin check:", {
uid: auth.currentUser.uid,
isAdmin: snapshot.exists(),
data: snapshot.data()
});
return snapshot.exists();
} catch (error) {
console.error("Admin check failed:", error);
return false;
}
}

// 加載所有用戶數據
async function loadAllUsers() {
const usersSnapshot = await getDocs(collection(db, "users"));
const tableBody = document.querySelector("#users-table tbody");
tableBody.innerHTML = "";

usersSnapshot.forEach(async (userDoc) => {
const userData = userDoc.data();
const loginHistoryRef = collection(db, "users", userDoc.id, "loginHistory");
const lastLogin = await getLastLogin(loginHistoryRef);

const row = `
<tr>
  <td>${userData.email || userEmail || '未提供'}<br>${userDoc.id}</td>
  <td>
    <span id="score-${userDoc.id || userId}">${userData.會員分數 || 0}</span>
    <br>
    <input type="number" id="score-input-${userDoc.id || userId}" placeholder="分數" style="width: 50px;">
    <button onclick="changeScore('${userDoc.id || userId}', document.getElementById('score-input-${userDoc.id || userId}').value)">改</button>
  </td>
  <td>${lastLogin || '無記錄'}</td>
</tr>
`;
tableBody.innerHTML += row;
});
}

// 修改用戶分數
async function changeScore(userId, delta) {
if (!(await checkAdmin())) {
showDbError("權限不足：需要管理員權限");
return;
}

try {
const userRef = doc(db, "users", userId);
await updateDoc(userRef, {
"會員分數": increment(delta)
});
showSuccess(`已成功修改用戶 ${userId} 的分數`);
await loadAllUsers(); // 刷新列表
} catch (error) {
showDbError("修改分數失敗: " + error.message);
}
}
// 將函數綁定到window對象
window.changeScore = changeScore;





// 獲取最後登錄時間
async function getLastLogin(historyRef) {
const q = query(historyRef, orderBy("登入時間", "desc"), limit(1));
const snapshot = await getDocs(q);
return snapshot.empty ? null : snapshot.docs[0].data().登入時間.toDate().toLocaleString();
}

// 搜索用戶功能
window.searchUsers = async () => {
if (!(await checkAdmin())) {
showDbError("權限不足：需要管理員權限");
return;
}

const searchTerm = document.getElementById('search-user').value.trim();
if (!searchTerm) {
showDbError("請輸入搜索內容");
return;
}

try {
const usersSnapshot = await getDocs(collection(db, "users"));
const tableBody = document.querySelector("#users-table tbody");
tableBody.innerHTML = "";

let foundUsers = 0;

// 遍歷所有用戶進行篩選
for (const userDoc of usersSnapshot.docs) {
const userData = userDoc.data();
const userId = userDoc.id;
const userEmail = userData.email || '';

// 檢查是否匹配ID或郵箱
if (userId.includes(searchTerm) || userEmail.includes(searchTerm)) {
const loginHistoryRef = collection(db, "users", userId, "loginHistory");
const lastLogin = await getLastLogin(loginHistoryRef);

const row = `
<tr>
  <td>${userData.email || userEmail || '未提供'}<br>${userId}</td>
  <td>
    <span id="score-${userDoc.id || userId}">${userData.會員分數 || 0}</span>
    <br>
    <input type="number" id="score-input-${userDoc.id || userId}" placeholder="分數" style="width: 50px;">
    <button onclick="changeScore('${userDoc.id || userId}', document.getElementById('score-input-${userDoc.id || userId}').value)">改</button>
  </td>
  <td>${lastLogin || '無記錄'}</td>
</tr>
`;
tableBody.innerHTML += row;
foundUsers++;
}
}

if (foundUsers === 0) {
tableBody.innerHTML = '<tr><td colspan="5">未找到匹配的用戶</td></tr>';
} else {
showSuccess(`找到 ${foundUsers} 個匹配用戶`);
}
} catch (error) {
showDbError("搜索失敗: " + error.message);
}
};



































/*
      :::        ::::::::       ::::::::       :::::::::::       ::::    :::
     :+:       :+:    :+:     :+:    :+:          :+:           :+:+:   :+:
    +:+       +:+    +:+     +:+                 +:+           :+:+:+  +:+
   +#+       +#+    +:+     :#:                 +#+           +#+ +:+ +#+
  +#+       +#+    +#+     +#+   +#+#          +#+           +#+  +#+#+#
 #+#       #+#    #+#     #+#    #+#          #+#           #+#   #+#+#
########## ########       ########       ###########       ###    ####

*/
window.loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        showError(translateError(error.code));
    }
};

window.logout = async () => {
    try {
        await signOut(auth);
        // 登出成功後刷新頁面
        window.location.reload();
    } catch (error) {
        showError(translateError(error.code));
    }
};

// 錯誤處理函數保持不變
function translateError(code) {
    const errors = {
        "auth/invalid-credential": "帳號或密碼錯誤",
        "auth/network-request-failed": "網路連線失敗",
        "auth/operation-not-allowed": "此登入方式未啟用"
    };
    return errors[code] || "發生未知錯誤";
}

function showError(message) {
    document.getElementById('error-message').textContent = message;
    setTimeout(() => document.getElementById('error-message').textContent = '', 5000);
}

function showDbError(message) {
    document.getElementById('db-error-message').textContent = message;
    setTimeout(() => document.getElementById('db-error-message').textContent = '', 5000);
}

function showSuccess(message) {
    document.getElementById('success-message').textContent = message;
    setTimeout(() => document.getElementById('success-message').textContent = '', 5000);
}






// 暴露 Firebase 相關對象到全局，供 script.js 使用
window.firebaseAuth = auth;
window.firebaseDb = db;
window.firestore = {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    getDoc,
    onSnapshot,
    updateDoc,
    query,
    orderBy,
    limit
};