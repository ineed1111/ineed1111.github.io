// 類別導航欄展開/收合功能
document.addEventListener('DOMContentLoaded', function() {
  const nav = document.getElementById('category-nav');
  const btn = document.getElementById('expand-category-btn');
  if (!nav || !btn) return;

  function checkOverflow() {
    // 內容超過 max-height 才顯示展開按鈕
    if (nav.scrollHeight > nav.offsetHeight) {
      btn.style.display = 'block';
    } else {
      btn.style.display = 'none';
    }
  }

  btn.addEventListener('click', function() {
    if (nav.classList.contains('category-nav-collapsed')) {
      nav.classList.remove('category-nav-collapsed');
      nav.classList.add('category-nav-expanded');
      btn.textContent = '收合類別';
    } else {
      nav.classList.remove('category-nav-expanded');
      nav.classList.add('category-nav-collapsed');
      btn.textContent = '顯示全部類別';
    }
  });

  // 初始檢查
  setTimeout(checkOverflow, 300);

  // 監聽類別動態插入（MutationObserver）
  const observer = new MutationObserver(checkOverflow);
  observer.observe(nav, { childList: true, subtree: true });
});
document.addEventListener('DOMContentLoaded', async () => {
    // 等待 Firebase 加載完成
    await waitForFirebase();

    // 獲取 DOM 元素並檢查存在性
    const taskListContainer = document.getElementById('task-list');
    const categoryNav = document.getElementById('category-nav');
    const searchBox = document.getElementById('search-box');
    const publishModal = document.getElementById('publish-modal');
    const showModalBtn = document.getElementById('show-publish-modal-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const publishForm = document.getElementById('publish-form');
    const formCategory = document.getElementById('form-category');
    const formTitle = document.getElementById('form-title');
    const formDescription = document.getElementById('form-description');
    const formDate = document.getElementById('form-date');
    const formContact = document.getElementById('form-contact');
    const categoryDatalist = document.getElementById('category-list');
    const loginPrompt = document.getElementById('login-prompt');

    // 檢查必要元素
    checkRequiredElements();

    // Firebase 引用
    const { collection, getDocs, addDoc, deleteDoc, doc, getDoc, onSnapshot, updateDoc } = window.firestore;
    const db = window.firebaseDb;
    const auth = window.firebaseAuth;

    // 狀態管理
    let currentUser = null;
    let isCurrentUserAdmin = false;
    let currentFilter = { category: 'All', keyword: '' };
    let formMode = "create"; // 發佈模式：create / edit
    let editingTaskId = null;

    // 全局狀態變量：新增 VIP 標識
    let isCurrentUserVIP = false;







































/*
       #   #                 #    
  ######## ## #     ###########   
  #   ## ###  ##            ##    
   # ##   ## ##      #########    
   ####   ###               ##    
    ##     ##               ## #  
   ###########    ############### 
  ## #      ####        ##    #   
 #   ######## #     ######  ####  
     ##    ##          ### ###    
     ##    ##         ######      
     ########        ## ## ##     
     #     #        ##  ##  ###   
     ###  ###      ##   ##   #### 
      #  ##  #    #   ####    ##  
   ############        ##         

*/

// 修改登錄狀態監聽函數
let vipUnsubscribe = null;
auth.onAuthStateChanged(async (user) => {

    // 取消之前的監聽
    if (vipUnsubscribe) {
        vipUnsubscribe();
        vipUnsubscribe = null;
    }

    currentUser = user;
    if (currentUser) {
        // 檢查管理員和VIP身份（含過期判斷）
        isCurrentUserAdmin = await checkIfAdmin(currentUser.uid);
        const vipResult = await checkIfVIP(currentUser.uid);
        isCurrentUserVIP = vipResult.isVIP;
        vipEndDate = vipResult.endDate; // 保存有效期
        vipIsTrial = vipResult.isTrial; // 保存試用狀態

        // 更新UI顯示（VIP標識+有效期）
        updateVIPDisplay(vipResult); // 傳遞vipResult參數

        // 其他登錄狀態處理...
        showModalBtn?.style.setProperty('display', 'block');
        loginPrompt?.style.setProperty('display', 'none');

        // 添加VIP狀態實時監聽
        const vipDocRef = doc(db, 'vipusers', currentUser.uid);
        vipUnsubscribe = onSnapshot(vipDocRef, async (doc) => {
            const vipResult = await checkIfVIP(currentUser.uid);
            isCurrentUserVIP = vipResult.isVIP;
            vipEndDate = vipResult.endDate;
            vipIsTrial = vipResult.isTrial;
            updateVIPDisplay(vipResult);
            reloadTasksOnFilter(); // VIP狀態變動時刷新任務列表
        });

    } else {
        // 未登錄狀態重置
        isCurrentUserAdmin = false;
        isCurrentUserVIP = false;
        vipEndDate = null;
        updateVIPDisplay(); // 清空VIP顯示

        // 其他未登錄狀態處理...
        showModalBtn?.style.setProperty('display', 'none');
        loginPrompt?.style.setProperty('display', 'block');
    }
    reloadTasksOnFilter();
});

// 更新VIP標識和有效期顯示
function updateVIPDisplay(vipResult = null) {
    const vipBadge = document.getElementById('vip-badge');
    const vipExpiry = document.getElementById('vip-expiry');
    if (!vipBadge || !vipExpiry) return;

    if (isCurrentUserVIP && vipResult) {
        vipBadge.classList.remove('hidden');
        vipExpiry.classList.remove('hidden');
        
        // 格式化顯示
        let expiryText = `VIP有效期至：${vipEndDate.toLocaleDateString()}`;
        if (vipResult.isTrial) {
            expiryText += " (試用會員)";
        }
        
        vipExpiry.textContent = expiryText;
    } else {
        vipBadge.classList.add('hidden');
        vipExpiry.classList.add('hidden');
    }
}

    // 新增：檢查 VIP 身份的函數 檢查是否為有效VIP用戶（未過期）
    async function checkIfVIP(uid) {
        try {
            const vipDoc = await getDoc(doc(db, 'vipusers', uid));
            if (!vipDoc.exists()) {
                return { isVIP: false, endDate: null };
            }

            const vipData = vipDoc.data();
            const vipEndDate = vipData.vipEndDate?.toDate();
            const currentDate = new Date();
            
            // 檢查VIP是否有效（未過期）
            const isExpired = vipEndDate && currentDate > vipEndDate;

            return {
                isVIP: !isExpired,
                endDate: vipEndDate,
                isTrial: vipData.isTrial || false // 添加試用標記
            };
        } catch (error) {
            console.error('檢查VIP權限失敗:', error);
            return { isVIP: false, endDate: null, isTrial: false };
        }
    }

    // 全局狀態變量（新增）
    let vipEndDate = null; // 存儲VIP結束日期






















    // 等待 Firebase 初始化
    function waitForFirebase() {
        return new Promise((resolve) => {
            const check = () => {
                if (window.firestore && window.firebaseDb && window.firebaseAuth) {
                    resolve();
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    }

    // 檢查元素是否存在
    function checkRequiredElements() {
        const elements = [
            { id: 'task-list', element: taskListContainer },
            { id: 'category-nav', element: categoryNav },
            { id: 'publish-modal', element: publishModal },
            { id: 'show-publish-modal-btn', element: showModalBtn },
            { id: 'close-modal-btn', element: closeModalBtn },
            { id: 'publish-form', element: publishForm }
        ];

        elements.forEach(({ id, element }) => {
            if (!element) {
                console.error(`缺少必要元素: #${id}，請檢查 HTML`);
            }
        });
    }

    // 檢查管理員權限
    async function checkIfAdmin(uid) {
        try {
            const adminDoc = await getDoc(doc(db, 'admins', uid));
            return adminDoc.exists();
        } catch (error) {
            console.error('檢查管理員權限失敗:', error);
            return false;
        }
    }





























/*
              #                #  
  ##############  ############### 
        ##              ##        
    #  ##    #         ##         
    ###########    #  ##       #  
    ##      ##     ############## 
    ##  ##  ##     ## ##   ## ##  
    ##  ##  ##     ## ##   ## ##  
    ##  ##  ##     ## ####### ##  
    ##  ##  ##     ## ##   ## ##  
    ##  ##  ##     ## ##   ## ##  
    #   ##  #      ## ####### ##  
       ## #        ## ##   ## ##  
      ##   ##      ## ##   ## ##  
    ##      ####   #############  
  ##          #    #          #   

*/



    // 無限滾動分批加載需求
    let allTasks = [];
    let loadedCount = 0;
    const PAGE_SIZE = 10; // 每次加載數量
    let isLoading = false;
    let unsubscribeTasks = null;

    function loadTasksInit() {
        if (!db) return;
        if (unsubscribeTasks) unsubscribeTasks();
        isLoading = false;
        const tasksRef = collection(db, 'tasks');
        unsubscribeTasks = onSnapshot(tasksRef, 
            (snapshot) => {
                isLoading = false;
                allTasks = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })).sort((a, b) => {
                    // 日期格式 yyyy-mm-dd，直接字串比較即可
                    if (!a.publishDate) return 1;
                    if (!b.publishDate) return -1;
                    return b.publishDate.localeCompare(a.publishDate);
                });
                loadedCount = 0;
                clearTasks();
                loadMoreTasks();
                renderCategories(allTasks);
            },
            (error) => {
                console.error('任務數據監聽錯誤:', error);
                if (taskListContainer) {
                    taskListContainer.innerHTML = '<p class="text-red-500">加載需求失敗，請刷新頁面重試</p>';
                }
            }
        );
    }

    function clearTasks() {
        const container = document.getElementById('task-list');
        if (container) container.innerHTML = '';
    }

    function loadMoreTasks() {
        if (isLoading) return;
        isLoading = true;
        const container = document.getElementById('task-list');
        if (!container) return;

        // 應用過濾
        const filteredTasks = allTasks.filter(task => {
            const categoryMatch = currentFilter.category === 'All' || task.category === currentFilter.category;
            const keywordMatch = task.title.toLowerCase().includes(currentFilter.keyword.toLowerCase()) ||
                               task.description.toLowerCase().includes(currentFilter.keyword.toLowerCase());
            return categoryMatch && keywordMatch;
        });

        if (loadedCount === 0 && filteredTasks.length === 0) {
            container.innerHTML = '<p class="text-gray-500 py-4 text-center">沒有找到符合條件的需求</p>';
            isLoading = false;
            return;
        }

        const nextTasks = filteredTasks.slice(loadedCount, loadedCount + PAGE_SIZE);
        nextTasks.forEach(task => {
            const taskElement = createTaskElement(task);
            container.appendChild(taskElement);
        });
        loadedCount += nextTasks.length;
        isLoading = false;
    }

    // 滾動監聽
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY || window.pageYOffset;
        const viewportHeight = window.innerHeight;
        const fullHeight = document.body.scrollHeight;
        if (fullHeight - (scrollY + viewportHeight) < 200) {
            // 距底部 200px 內自動加載
            loadMoreTasks();
        }
    });

    // 搜尋/分類切換時重載
    function reloadTasksOnFilter() {
        loadedCount = 0;
        clearTasks();
        loadMoreTasks();
    }

    // 將原本的 renderTasks 拆分為 createTaskElement
    function createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item bg-white rounded-lg shadow-md p-4 mb-4 transition-all duration-300 hover:shadow-lg';

        // 聯繫方式（修改部分）
        let contactHtml;
        if (!currentUser) {
            contactHtml = `
                <div class="task-contact mt-2 p-2 bg-gray-50 rounded">
                    <button onclick="loginWithGoogle()" class="發佈btn">登入查看聯絡方式</button>
                </div>
            `;
        } else if (isCurrentUserAdmin || isCurrentUserVIP) {
            const isUrl = /^https?:\/\/.+/.test(task.contact.trim());
            const contactContent = isUrl 
                ? `<a href="${task.contact}" target="_blank" class="text-blue-600 hover:underline">聯絡客戶</a>`
                : task.contact;
            contactHtml = `
                <div class="task-contact mt-2 p-2 bg-gray-50 rounded">
                    <strong>聯繫方式:</strong> ${contactContent}
                </div>
            `;
        } else {
            contactHtml = `
                <div class="task-contact mt-2 p-2 bg-gray-50 rounded">
                    <button onclick="充值()" class="發佈btn">成為VIP獲取聯絡方式</button>
                </div>
            `;
        }

        const canModify = currentUser && (currentUser.uid === task.userId || isCurrentUserAdmin);
        const actionButtonsHtml = canModify ? `
            <div class="task-actions flex gap-2 mt-3">
                <button class="發佈btn"
                        onclick="editTask('${task.id}', ${JSON.stringify(task).replace(/"/g, '&quot;')})">
                    編輯
                </button>
                <button class="發佈btn" style="background-color: #f87171;"
                        onclick="deleteTask('${task.id}', '${task.userId}')">
                    刪除
                </button>
            </div>
        ` : '';

        taskElement.innerHTML = `
            <div class="task-header flex justify-between items-start">
                <span class="發佈btn">${task.category}</span>
            </div>
            <h3 class="task-title text-xl font-semibold mt-2 mb-1">${task.title}</h3>
            <p class="task-description text-gray-700">${task.description}</p>
            <div class="task-footer text-sm text-gray-500 mt-2">
                <span>發佈於: ${task.publishDate}</span>
            </div>
            ${contactHtml}
            ${actionButtonsHtml}
        `;
        return taskElement;
    }

    // 處理表單提交（統一處理發佈和編輯）
    async function handleFormSubmit(e) {
        e.preventDefault();
        if (!currentUser) {
            alert('請先登錄再操作');
            return;
        }

        // 獲取表單數據
        const formData = {
            category: formCategory?.value.trim() || '',
            title: formTitle?.value.trim() || '',
            description: formDescription?.value.trim() || '',
            publishDate: formDate?.value || '',
            contact: formContact?.value.trim() || '',
            userId: currentUser.uid
        };

        // 驗證表單
        if (!formData.category || !formData.title || !formData.description || !formData.publishDate || !formData.contact) {
            alert('請填寫所有必填字段');
            return;
        }

        try {
            if (formMode === "create") {
                // 發佈新需求
                await addDoc(collection(db, 'tasks'), formData);
                alert('需求發佈成功！');
            } else if (formMode === "edit" && editingTaskId) {
                // 編輯現有需求（移除userId防止篡改）
                const { userId, ...updateData } = formData;
                await updateDoc(doc(db, 'tasks', editingTaskId), updateData);
                alert('需求更新成功！');
            }

            // 重置表單和模態框
            publishForm?.reset();
            publishModal?.style.setProperty('display', 'none');
            resetFormMode();
        } catch (error) {
            console.error('操作失敗:', error);
            alert(formMode === "create" ? '發佈失敗，請重試' : '更新失敗，請重試');
        }
    }

    // 刪除需求
    async function deleteTask(taskId, taskUserId) {
        if (!currentUser) {
            alert('請先登錄');
            return;
        }

        // 權限檢查
        if (currentUser.uid !== taskUserId && !isCurrentUserAdmin) {
            alert('您沒有權限刪除此需求');
            return;
        }

        if (confirm('確定要刪除這個需求嗎？此操作不可恢復。')) {
            try {
                await deleteDoc(doc(db, 'tasks', taskId));
                alert('需求已刪除');
            } catch (error) {
                console.error('刪除失敗:', error);
                alert('刪除失敗，請重試');
            }
        }
    }

    // 編輯需求
    async function editTask(taskId, taskData) {
        if (!currentUser) {
            alert('請先登錄');
            return;
        }

        // 權限檢查
        if (currentUser.uid !== taskData.userId && !isCurrentUserAdmin) {
            alert('您沒有權限編輯此需求');
            return;
        }

        // 設置編輯模式
        formMode = "edit";
        editingTaskId = taskId;

        // 填充表單數據
        if (formCategory) formCategory.value = taskData.category || '';
        if (formTitle) formTitle.value = taskData.title || '';
        if (formDescription) formDescription.value = taskData.description || '';
        if (formDate) formDate.value = taskData.publishDate || '';
        if (formContact) formContact.value = taskData.contact || '';

        // 更新模態框標題
        const modalTitle = publishModal?.querySelector('h2');
        if (modalTitle) modalTitle.textContent = '編輯需求';

        // 顯示模態框
        publishModal?.style.setProperty('display', 'flex');
    }

    // 重置表單模式為發佈
    function resetFormMode() {
        formMode = "create";
        editingTaskId = null;
        // 恢復模態框標題
        const modalTitle = publishModal?.querySelector('h2');
        if (modalTitle) modalTitle.textContent = '發佈新需求';
    }

    // ...已改為 createTaskElement, loadMoreTasks, clearTasks, reloadTasksOnFilter...

    // 渲染分類導航
    function renderCategories(tasks) {
        if (!categoryNav || !categoryDatalist) return;

        const uniqueCategories = ['All', ...new Set(tasks.map(task => task.category))];
        categoryNav.innerHTML = '';
        categoryDatalist.innerHTML = '';

        uniqueCategories.forEach(category => {
            // 分類按鈕
            const link = document.createElement('button');
            link.className = `category-link px-4 py-2 rounded ${currentFilter.category === category ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`;
            link.textContent = category === 'All' ? '所有類別' : category;
            link.dataset.category = category;

            link.addEventListener('click', () => {
                currentFilter.category = category;
                reloadTasksOnFilter();
            });

            categoryNav.appendChild(link);

            // 分類選項（排除"All"）
            if (category !== 'All') {
                const option = document.createElement('option');
                option.value = category;
                categoryDatalist.appendChild(option);
            }
        });
    }
















/*
          #          #    #       
      #   ##         ##   ##      
  ######  ##         ##  ##    #  
          ##  #     ##   ######## 
        ########    #   ####      
       #  ## ##    ###  # ##  #   
 ######## ## ##    ### #  ######  
    ##    ## ##   # ##    ##      
   ##     ## ##     ##    ##      
   ## #   ## ##     ##    ##   #  
  ##  ## ##  ##     ##    ####### 
 ####### ##  ##     ##    ##      
  ##  # ##   ##     ##    ##      
       ##    ##     ##    ##      
       #   ###      ##    ##      
      #     #       #     ##      

*/





    // 事件監聽
    if (searchBox) {
        searchBox.addEventListener('input', () => {
            currentFilter.keyword = searchBox.value;
            reloadTasksOnFilter();
        });
    }

    if (publishForm) {
        publishForm.addEventListener('submit', handleFormSubmit);
    }

    if (showModalBtn) {
        showModalBtn.addEventListener('click', () => {
            resetFormMode(); // 重置為發佈模式
            if (publishForm) publishForm.reset();
            // 設置默認日期為今天
            const today = new Date().toISOString().split('T')[0];
            if (formDate) {
                formDate.max = today;
                formDate.value = today;
            }
            publishModal?.style.setProperty('display', 'flex');
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            publishModal?.style.setProperty('display', 'none');
            resetFormMode();
        });
    }

    // 點擊模態框外部關閉
    window.addEventListener('click', (e) => {
        if (publishModal && e.target === publishModal) {
            publishModal.style.display = 'none';
            resetFormMode();
        }
    });

    // 暴露函數到全局
    window.deleteTask = deleteTask;
    window.editTask = editTask;

    // 初始化加載
    loadTasksInit();
});



















/*
       ##            #    ##      
        ##    #      ##   ##   #  
  ##############     ############ 
       #            ##    ##      
      ### #         #   # ##  #   
     ###   ##      ###  ########  
    ##      ##     ###  ##   ##   
   ############   # ##  ##   ##   
    # #   ## #      ##  #######   
      ##  ##        ##  ##   ##   
      ##  ##        ##  #######   
     ##   ##        ##  ##   ##   
     ##   ##  #     ##  #######   
    ##    ##  #     ##  ##   ##   
   ##     ######    ##  ##   ##   
  #        ####     # ########### 
*/

function 充值() {
    alert(`
        VIP 充值：
                 1  💰  = $         1hkd
                1天VIP = $      16hkd
              30天VIP = $   400hkd
            180天VIP = $1,600hkd
            365天VIP = $2,400hkd
        請按匯率換算為您的貨幣
        付款後請將收據及帳號發信給我們
        謝謝您的支持！
        (確認後將轉到付款頁面))
        `);

    window.open("https://64071181.github.io/PayAki/index.html");
}


