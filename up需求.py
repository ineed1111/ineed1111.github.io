


'''
tasks.json 文件內容示例：
[
    {
        "category": "分類",
        "title": "需求標題",
        "description": "需求描述",
        "contact": "聯繫方式",
        "userId": "管理員的UID",
        "publishDate": "2025-08-03"
    },
]
'''




# pip install firebase-admin
# 
# 
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import json
from datetime import datetime


def batch_import_tasks(json_file_path):
    # 初始化Firebase應用
    cred = credentials.Certificate(".私/密鑰文件.json")  # 替換為你的密鑰文件路徑
    try:
        firebase_admin.get_app()
    except ValueError:
        firebase_admin.initialize_app(cred)

    # 獲取Firestore客戶端
    db = firestore.client()

    # 讀取JSON文件
    with open(json_file_path, 'r', encoding='utf-8') as f:
        tasks = json.load(f)

    print(f"準備導入 {len(tasks)} 條需求...")

    # 批量寫入（每500條一批，Firestore的批量操作上限）
    batch = db.batch()
    count = 0
    total = len(tasks)

    for task in tasks:
        # 生成新文檔的引用（自動生成ID）
        doc_ref = db.collection('tasks').document()

        # 添加到批量操作
        batch.set(doc_ref, task)
        count += 1

        # 每500條提交一次
        if count % 500 == 0:
            batch.commit()
            print(f"已導入 {count}/{total} 條")
            batch = db.batch()  # 重置批次

    # 提交剩餘的記錄
    if count % 500 != 0:
        batch.commit()
        print(f"已導入 {count}/{total} 條")

    print("所有需求導入完成！")

if __name__ == "__main__":
    # 替換為你的JSON文件路徑
    batch_import_tasks(".私/帖.json")
    