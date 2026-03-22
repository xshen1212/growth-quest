/**
 * ============================================
 * 成长冒险岛 - Supabase 适配器
 * ============================================
 * 将数据存储从 LocalStorage 切换到 Supabase
 */

/**
 * Supabase 适配器
 */
class SupabaseAdapter extends DataAdapter {
    constructor() {
        super();
        this.cache = {}; // 本地缓存
        this.isOnline = navigator.onLine;
        this.syncQueue = []; // 同步队列
        
        // 监听网络状态
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processSyncQueue();
        });
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    // 检查是否已登录
    isAuthenticated() {
        return supabaseClient.user !== null;
    }

    // 获取数据（优先从缓存，缓存没有则从云端）
    async get(key) {
        // 如果已缓存，直接返回
        if (this.cache[key] !== undefined) {
            return this.cache[key];
        }

        // 如果未登录，尝试从 localStorage 读取（兼容旧数据）
        if (!this.isAuthenticated()) {
            const localData = localStorage.getItem('gq_' + key);
            if (localData) {
                try {
                    return JSON.parse(localData);
                } catch (e) {
                    return null;
                }
            }
            return null;
        }

        // 从云端获取
        try {
            const data = await supabaseClient.getData(key);
            if (data !== null) {
                this.cache[key] = data;
            }
            return data;
        } catch (e) {
            console.error(`获取 ${key} 失败:`, e);
            // 失败时返回本地数据作为备用
            const localData = localStorage.getItem('gq_' + key);
            if (localData) {
                try {
                    return JSON.parse(localData);
                } catch (e) {
                    return null;
                }
            }
            return null;
        }
    }

    // 保存数据（同时更新缓存和云端）
    async set(key, data) {
        // 更新缓存
        this.cache[key] = data;

        // 保存到 localStorage（作为备份）
        try {
            localStorage.setItem('gq_' + key, JSON.stringify(data));
        } catch (e) {
            console.error('本地备份失败:', e);
        }

        // 如果已登录且在线，同步到云端
        if (this.isAuthenticated() && this.isOnline) {
            try {
                const success = await supabaseClient.setData(key, data);
                if (!success) {
                    // 同步失败，加入队列稍后重试
                    this.addToSyncQueue(key, data);
                }
                return success;
            } catch (e) {
                console.error(`保存 ${key} 到云端失败:`, e);
                this.addToSyncQueue(key, data);
                return false;
            }
        } else if (this.isAuthenticated()) {
            // 离线状态，加入同步队列
            this.addToSyncQueue(key, data);
        }

        return true;
    }

    // 删除数据
    async remove(key) {
        delete this.cache[key];
        localStorage.removeItem('gq_' + key);

        if (this.isAuthenticated() && this.isOnline) {
            try {
                return await supabaseClient.removeData(key);
            } catch (e) {
                console.error(`删除 ${key} 失败:`, e);
                return false;
            }
        }
        return true;
    }

    // 获取所有数据
    async getAll() {
        if (!this.isAuthenticated()) {
            // 未登录时返回本地所有数据
            const result = {};
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k.startsWith('gq_')) {
                    try {
                        result[k.replace('gq_', '')] = JSON.parse(localStorage.getItem(k));
                    } catch (e) {
                        result[k.replace('gq_', '')] = localStorage.getItem(k);
                    }
                }
            }
            return result;
        }

        try {
            const data = await supabaseClient.getAllData();
            // 更新缓存
            Object.assign(this.cache, data);
            return data;
        } catch (e) {
            console.error('获取所有数据失败:', e);
            return this.cache;
        }
    }

    // 添加到同步队列
    addToSyncQueue(key, data) {
        const existingIndex = this.syncQueue.findIndex(item => item.key === key);
        if (existingIndex >= 0) {
            this.syncQueue[existingIndex].data = data;
        } else {
            this.syncQueue.push({ key, data });
        }
    }

    // 处理同步队列
    async processSyncQueue() {
        if (!this.isAuthenticated() || !this.isOnline || this.syncQueue.length === 0) {
            return;
        }

        console.log(`正在同步 ${this.syncQueue.length} 条数据...`);
        
        const queue = [...this.syncQueue];
        this.syncQueue = [];

        for (const item of queue) {
            try {
                await supabaseClient.setData(item.key, item.data);
            } catch (e) {
                console.error(`同步 ${item.key} 失败:`, e);
                // 重新加入队列
                this.addToSyncQueue(item.key, item.data);
            }
        }

        if (this.syncQueue.length === 0) {
            console.log('同步完成');
        } else {
            console.log(`还有 ${this.syncQueue.length} 条数据待同步`);
        }
    }

    // 从云端同步数据到本地
    async syncFromCloud() {
        if (!this.isAuthenticated()) return;

        try {
            const cloudData = await supabaseClient.getAllData();
            
            // 合并云端数据和本地数据
            for (const [key, value] of Object.entries(cloudData)) {
                this.cache[key] = value;
                localStorage.setItem('gq_' + key, JSON.stringify(value));
            }

            console.log('从云端同步完成');
        } catch (e) {
            console.error('从云端同步失败:', e);
        }
    }
}

// 创建全局实例
const supabaseAdapter = new SupabaseAdapter();
