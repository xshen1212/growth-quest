/**
 * 环境变量配置
 * 部署前需要替换为实际的 Supabase 配置
 */

// 从环境变量或本地存储获取配置
window.ENV = {
    SUPABASE_URL: localStorage.getItem('supabase_url') || 'https://your-project.supabase.co',
    SUPABASE_ANON_KEY: localStorage.getItem('supabase_anon_key') || 'your-anon-key'
};

// 如果配置了环境变量，更新配置
if (typeof process !== 'undefined' && process.env) {
    window.ENV.SUPABASE_URL = process.env.SUPABASE_URL || window.ENV.SUPABASE_URL;
    window.ENV.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || window.ENV.SUPABASE_ANON_KEY;
}
