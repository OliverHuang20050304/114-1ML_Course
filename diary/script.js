class DiaryApp {
    constructor() {
        this.datePicker = document.getElementById('datePicker');
        this.diaryText = document.getElementById('diaryText');
        this.saveBtn = document.getElementById('saveBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.statusMessage = document.getElementById('statusMessage');
        this.diaryList = document.getElementById('diaryList');
        
        this.init();
    }
    
    init() {
        // 設定今天的日期為預設值
        this.setTodayDate();
        
        // 載入今天的日記內容
        this.loadDiary();
        
        // 載入日記列表
        this.loadDiaryList();
        
        // 綁定事件監聽器
        this.bindEvents();
    }
    
    setTodayDate() {
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];
        this.datePicker.value = dateString;
    }
    
    bindEvents() {
        // 日期選擇器變更事件
        this.datePicker.addEventListener('change', () => {
            this.loadDiary();
        });
        
        // 儲存按鈕事件
        this.saveBtn.addEventListener('click', () => {
            this.saveDiary();
        });
        
        // 清除按鈕事件
        this.clearBtn.addEventListener('click', () => {
            this.clearDiary();
        });
        
        // 文字區域變更事件 - 自動更新列表
        this.diaryText.addEventListener('input', () => {
            // 延遲更新列表，避免頻繁更新
            clearTimeout(this.updateListTimeout);
            this.updateListTimeout = setTimeout(() => {
                this.loadDiaryList();
            }, 1000);
        });
        
        // 自動儲存功能（每30秒檢查一次）
        setInterval(() => {
            this.autoSave();
        }, 30000);
        
        // 頁面關閉前自動儲存
        window.addEventListener('beforeunload', () => {
            this.autoSave();
        });
    }
    
    getStorageKey() {
        return `diary_${this.datePicker.value}`;
    }
    
    loadDiary() {
        const storageKey = this.getStorageKey();
        const savedContent = localStorage.getItem(storageKey);
        
        if (savedContent) {
            this.diaryText.value = savedContent;
            this.showStatus('已載入該日期的日記內容', 'success');
        } else {
            this.diaryText.value = '';
            this.showStatus('這是一個新的日期，開始寫下您的心情吧！', 'success');
        }
    }
    
    saveDiary() {
        const content = this.diaryText.value.trim();
        const storageKey = this.getStorageKey();
        
        if (content) {
            localStorage.setItem(storageKey, content);
            this.showStatus('日記已成功儲存！', 'success');
            // 更新日記列表
            this.loadDiaryList();
        } else {
            this.showStatus('請輸入一些內容再儲存', 'error');
        }
    }
    
    clearDiary() {
        if (confirm('確定要清除今天的日記內容嗎？此操作無法復原。')) {
            this.diaryText.value = '';
            const storageKey = this.getStorageKey();
            localStorage.removeItem(storageKey);
            this.showStatus('日記內容已清除', 'success');
            // 更新日記列表
            this.loadDiaryList();
        }
    }
    
    autoSave() {
        const content = this.diaryText.value.trim();
        if (content) {
            const storageKey = this.getStorageKey();
            localStorage.setItem(storageKey, content);
            // 自動儲存不顯示訊息，避免打擾使用者
        }
    }
    
    showStatus(message, type) {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message ${type} show`;
        
        // 3秒後隱藏訊息
        setTimeout(() => {
            this.statusMessage.classList.remove('show');
        }, 3000);
    }
    
    // 獲取所有已儲存的日記日期
    getAllDiaryDates() {
        const dates = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('diary_')) {
                const date = key.replace('diary_', '');
                dates.push(date);
            }
        }
        return dates.sort();
    }
    
    // 載入日記列表
    loadDiaryList() {
        const allDates = this.getAllDiaryDates();
        
        if (allDates.length === 0) {
            this.diaryList.innerHTML = '<div class="empty-list">📝 還沒有任何日記，開始寫下您的第一篇日記吧！</div>';
            return;
        }
        
        // 按日期倒序排列（最新的在前）
        allDates.sort((a, b) => new Date(b) - new Date(a));
        
        this.diaryList.innerHTML = allDates.map(date => {
            const content = localStorage.getItem(`diary_${date}`);
            const preview = content ? content.substring(0, 100) + (content.length > 100 ? '...' : '') : '';
            const formattedDate = this.formatDate(date);
            
            return `
                <div class="diary-item">
                    <div class="diary-item-header">
                        <div class="diary-date">${formattedDate}</div>
                        <div class="diary-actions">
                            <button class="btn edit-btn" onclick="diaryApp.editDiary('${date}')">✏️ 修改</button>
                            <button class="btn delete-btn" onclick="diaryApp.confirmDelete('${date}')">🗑️ 刪除</button>
                        </div>
                    </div>
                    <div class="diary-preview">${preview}</div>
                </div>
            `;
        }).join('');
    }
    
    // 格式化日期顯示
    formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        const weekday = weekdays[date.getDay()];
        
        return `${year}年${month}月${day}日 (星期${weekday})`;
    }
    
    // 編輯日記
    editDiary(date) {
        this.datePicker.value = date;
        this.loadDiary();
        // 滾動到頂部
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.showStatus(`已載入 ${this.formatDate(date)} 的日記`, 'success');
    }
    
    // 確認刪除對話框
    confirmDelete(date) {
        this.showConfirmDialog(
            '確認刪除',
            `確定要刪除 ${this.formatDate(date)} 的日記嗎？\n此操作無法復原。`,
            () => this.deleteDiary(date)
        );
    }
    
    // 刪除日記
    deleteDiary(date) {
        const storageKey = `diary_${date}`;
        localStorage.removeItem(storageKey);
        this.showStatus(`${this.formatDate(date)} 的日記已刪除`, 'success');
        this.loadDiaryList();
        
        // 如果刪除的是當前選中的日期，清空文字區域
        if (this.datePicker.value === date) {
            this.diaryText.value = '';
        }
    }
    
    // 顯示確認對話框
    showConfirmDialog(title, message, onConfirm) {
        // 創建對話框元素
        const dialog = document.createElement('div');
        dialog.className = 'confirm-dialog';
        dialog.innerHTML = `
            <div class="confirm-content">
                <div class="confirm-title">${title}</div>
                <div class="confirm-message">${message}</div>
                <div class="confirm-buttons">
                    <button class="btn confirm-yes">確定</button>
                    <button class="btn confirm-no">取消</button>
                </div>
            </div>
        `;
        
        // 添加到頁面
        document.body.appendChild(dialog);
        
        // 顯示對話框
        setTimeout(() => dialog.classList.add('show'), 10);
        
        // 綁定事件
        const yesBtn = dialog.querySelector('.confirm-yes');
        const noBtn = dialog.querySelector('.confirm-no');
        
        const closeDialog = () => {
            dialog.classList.remove('show');
            setTimeout(() => document.body.removeChild(dialog), 300);
        };
        
        yesBtn.addEventListener('click', () => {
            onConfirm();
            closeDialog();
        });
        
        noBtn.addEventListener('click', closeDialog);
        
        // 點擊背景關閉
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                closeDialog();
            }
        });
        
        // ESC鍵關閉
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                closeDialog();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }
    
    // 搜尋功能（可選）
    searchDiary(keyword) {
        const allDates = this.getAllDiaryDates();
        const results = [];
        
        allDates.forEach(date => {
            const content = localStorage.getItem(`diary_${date}`);
            if (content && content.toLowerCase().includes(keyword.toLowerCase())) {
                results.push({ date, content });
            }
        });
        
        return results;
    }
}

// 當頁面載入完成後初始化應用
let diaryApp;
document.addEventListener('DOMContentLoaded', () => {
    diaryApp = new DiaryApp();
});

// 添加鍵盤快捷鍵支援
document.addEventListener('keydown', (e) => {
    // Ctrl+S 或 Cmd+S 儲存
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.click();
        }
    }
    
    // Ctrl+N 或 Cmd+N 清除
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.click();
        }
    }
});
