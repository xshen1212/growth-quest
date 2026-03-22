/**
 * ============================================
 * 成长冒险岛 - Supabase 客户端
 * ============================================
 * 用于与 Supabase 后端通信
 */

// Supabase 配置（部署前需要替换为实际的配置）
const SUPABASE_CONFIG = {
    url: window.ENV?.SUPABASE_URL || 'https://your-project.supabase.co',
    anonKey: window.ENV?.SUPABASE_ANON_KEY || 'your-anon-key'
};

// Supabase 客户端类
class SupabaseClient {
    constructor() {
        this.baseUrl = SUPABASE_CONFIG.url;
        this.apiKey = SUPABASE_CONFIG.anonKey;
        this.user = null;
        this.session = null;
    }

    // 初始化并检查会话
    async init() {
        // 从 localStorage 恢复会话
        const savedSession = localStorage.getItem('gq_supabase_session');
        if (savedSession) {
            try {
                this.session = JSON.parse(savedSession);
                // 验证会话是否有效
                const user = await this.getUser();
                if (user) {
                    this.user = user;
                    return true;
                }
            } catch (e) {
                console.error('恢复会话失败:', e);
            }
        }
        return false;
    }

    // 获取当前用户
    async getUser() {
        if (!this.session) return null;
        
        try {
            const response = await fetch(`${this.baseUrl}/auth/v1/user`, {
                headers: {
                    'Authorization': `Bearer ${this.session.access_token}`,
                    'apikey': this.apiKey
                }
            });
            
            if (response.ok) {
                const { user } = await response.json();
                this.user = user;
                return user;
            }
        } catch (e) {
            console.error('获取用户信息失败:', e);
        }
        return null;
    }

    // 注册新用户
    async signUp(email, password) {
        try {
            const response = await fetch(`${this.baseUrl}/auth/v1/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': this.apiKey
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.session = data.session;
                this.user = data.user;
                localStorage.setItem('gq_supabase_session', JSON.stringify(this.session));
                return { success: true, user: data.user };
            } else {
                return { success: false, error: data.msg || '注册失败' };
            }
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    // 用户登录
    async signIn(email, password) {
        try {
            const response = await fetch(`${this.baseUrl}/auth/v1/token?grant_type=password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': this.apiKey
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.session = data;
                this.user = data.user;
                localStorage.setItem('gq_supabase_session', JSON.stringify(this.session));
                return { success: true, user: data.user };
            } else {
                return { success: false, error: data.error_description || '登录失败' };
            }
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    // 用户登出
    async signOut() {
        if (!this.session) return;
        
        try {
            await fetch(`${this.baseUrl}/auth/v1/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.session.access_token}`,
                    'apikey': this.apiKey
                }
            });
        } catch (e) {
            console.error('登出失败:', e);
        }
        
        this.session = null;
        this.user = null;
        localStorage.removeItem('gq_supabase_session');
    }

    // 获取数据
    async getData(key) {
        if (!this.session) return null;
        
        try {
            const response = await fetch(
                `${this.baseUrl}/rest/v1/user_data?data_key=eq.${key}&select=data_value`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.session.access_token}`,
                        'apikey': this.apiKey
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                if (data && data.length > 0) {
                    return data[0].data_value;
                }
            }
        } catch (e) {
            console.error(`获取 ${key} 失败:`, e);
        }
        return null;
    }

    // 保存数据
    async setData(key, value) {
        if (!this.session) return false;
        
        try {
            // 先尝试更新
            const updateResponse = await fetch(
                `${this.baseUrl}/rest/v1/user_data?data_key=eq.${key}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.session.access_token}`,
                        'apikey': this.apiKey,
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({ data_value: value })
                }
            );

            // 如果更新失败（记录不存在），则插入新记录
            if (updateResponse.status === 404 || updateResponse.status === 204) {
                const insertResponse = await fetch(
                    `${this.baseUrl}/rest/v1/user_data`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${this.session.access_token}`,
                            'apikey': this.apiKey,
                            'Prefer': 'return=minimal'
                        },
                        body: JSON.stringify({
                            data_key: key,
                            data_value: value
                        })
                    }
                );
                
                return insertResponse.ok;
            }

            return updateResponse.ok;
        } catch (e) {
            console.error(`保存 ${key} 失败:`, e);
            return false;
        }
    }

    // 删除数据
    async removeData(key) {
        if (!this.session) return false;
        
        try {
            const response = await fetch(
                `${this.baseUrl}/rest/v1/user_data?data_key=eq.${key}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.session.access_token}`,
                        'apikey': this.apiKey
                    }
                }
            );

            return response.ok;
        } catch (e) {
            console.error(`删除 ${key} 失败:`, e);
            return false;
        }
    }

    // 获取所有数据
    async getAllData() {
        if (!this.session) return {};
        
        try {
            const response = await fetch(
                `${this.baseUrl}/rest/v1/user_data?select=data_key,data_value`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.session.access_token}`,
                        'apikey': this.apiKey
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                const result = {};
                data.forEach(item => {
                    result[item.data_key] = item.data_value;
                });
                return result;
            }
        } catch (e) {
            console.error('获取所有数据失败:', e);
        }
        return {};
    }
}

// 创建全局实例
const supabaseClient = new SupabaseClient();
