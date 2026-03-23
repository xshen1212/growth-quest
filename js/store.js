/**
 * ============================================
 * 成长冒险岛 - 数据存储层 (Adapter Pattern)
 * ============================================
 * 当前使用 LocalStorageAdapter
 * 后期上云只需实现 ApiAdapter 并切换 Store.adapter 即可
 */

// ==================== 适配器接口 ====================

/**
 * 数据适配器基类（接口定义）
 * 后期实现 ApiAdapter 时继承此类
 */
class DataAdapter {
    get(key) { throw new Error('未实现'); }
    set(key, data) { throw new Error('未实现'); }
    remove(key) { throw new Error('未实现'); }
    getAll() { throw new Error('未实现'); }
}

/**
 * LocalStorage 适配器 — 当前默认实现
 */
class LocalStorageAdapter extends DataAdapter {
    constructor(prefix = 'gq_') {
        super();
        this.prefix = prefix;
    }

    get(key) {
        try {
            const raw = localStorage.getItem(this.prefix + key);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            console.error(`读取 ${key} 失败:`, e);
            return null;
        }
    }

    set(key, data) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error(`写入 ${key} 失败:`, e);
            return false;
        }
    }

    remove(key) {
        localStorage.removeItem(this.prefix + key);
    }

    getAll() {
        const result = {};
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k.startsWith(this.prefix)) {
                try {
                    result[k.replace(this.prefix, '')] = JSON.parse(localStorage.getItem(k));
                } catch (e) {
                    result[k.replace(this.prefix, '')] = localStorage.getItem(k);
                }
            }
        }
        return result;
    }
}

/**
 * ========== 后期 API 适配器模板（取消注释即可使用）==========
 *
 * class ApiAdapter extends DataAdapter {
 *     constructor(baseUrl) {
 *         super();
 *         this.baseUrl = baseUrl;
 *     }
 *     async get(key) {
 *         const res = await fetch(`${this.baseUrl}/data/${key}`);
 *         return res.json();
 *     }
 *     async set(key, data) {
 *         await fetch(`${this.baseUrl}/data/${key}`, {
 *             method: 'PUT',
 *             headers: { 'Content-Type': 'application/json' },
 *             body: JSON.stringify(data)
 *         });
 *     }
 *     async remove(key) {
 *         await fetch(`${this.baseUrl}/data/${key}`, { method: 'DELETE' });
 *     }
 *     async getAll() {
 *         const res = await fetch(`${this.baseUrl}/data`);
 *         return res.json();
 *     }
 * }
 */

// ==================== Store 主对象 ====================

const Store = {
    // 🔄 适配器实例
    _adapter: null,
    
    // 获取适配器（自动初始化）
    get adapter() {
        if (!this._adapter) {
            // 检查是否启用了云端存储
            const useCloud = localStorage.getItem('gq_use_cloud') === 'true';
            if (useCloud && typeof SupabaseAdapter !== 'undefined') {
                this._adapter = supabaseAdapter;
            } else {
                this._adapter = new LocalStorageAdapter('gq_');
            }
        }
        return this._adapter;
    },
    
    // 设置适配器
    set adapter(adapter) {
        this._adapter = adapter;
    },
    
    // 切换到云端存储
    async switchToCloud() {
        if (typeof SupabaseAdapter === 'undefined') {
            console.error('SupabaseAdapter 未加载');
            return false;
        }
        
        // 先同步本地数据到云端
        const localData = this.adapter.getAll();
        this._adapter = supabaseAdapter;
        localStorage.setItem('gq_use_cloud', 'true');
        
        // 同步数据
        for (const [key, value] of Object.entries(localData)) {
            await this._adapter.set(key, value);
        }
        
        console.log('已切换到云端存储');
        return true;
    },
    
    // 切换到本地存储
    switchToLocal() {
        this._adapter = new LocalStorageAdapter('gq_');
        localStorage.removeItem('gq_use_cloud');
        console.log('已切换到本地存储');
    },

    // 快捷方法（支持异步）
    get(key) { 
        const result = this.adapter.get(key);
        return result instanceof Promise ? result : result;
    },
    set(key, data) { 
        const result = this.adapter.set(key, data);
        return result instanceof Promise ? result : result;
    },
    remove(key) { 
        const result = this.adapter.remove(key);
        return result instanceof Promise ? result : result;
    },

    // ==================== 初始化默认数据 ====================
    init() {
        console.log('Store.init() called');
        if (this.get('initialized')) {
            console.log('Store already initialized');
            return;
        }
        console.log('Initializing default data...');
        this.initDefaultData();
        this.set('initialized', true);
        console.log('Store initialized successfully');
    },

    initDefaultData() {
        // 孩子信息
        this.set('profile', {
            nickname: '小冒险家',
            avatar: '🦸',
            level: 1,
            totalPoints: 0,
            currentPoints: 0,
            coins: 0
        });

        // 能力树 — 按科目/爱好
        this.set('trees', [
            {
                id: 'tree_001', name: '语文', icon: '📖',
                stages: [
                    { name: '种子', nodes: [{ id: 'n1_1', name: '认识100个汉字', requiredGrowth: 100, currentGrowth: 0, unlocked: false, unlockDate: null }] },
                    { name: '幼苗', nodes: [{ id: 'n1_2', name: '能写完整的句子', requiredGrowth: 200, currentGrowth: 0, unlocked: false, unlockDate: null }] },
                    { name: '小树', nodes: [{ id: 'n1_3', name: '独立阅读一本书', requiredGrowth: 500, currentGrowth: 0, unlocked: false, unlockDate: null }] },
                    { name: '大树', nodes: [{ id: 'n1_4', name: '写出优秀作文', requiredGrowth: 1000, currentGrowth: 0, unlocked: false, unlockDate: null }] }
                ]
            },
            {
                id: 'tree_002', name: '数学', icon: '🔢',
                stages: [
                    { name: '种子', nodes: [{ id: 'n2_1', name: '熟练加减法', requiredGrowth: 100, currentGrowth: 0, unlocked: false, unlockDate: null }] },
                    { name: '幼苗', nodes: [{ id: 'n2_2', name: '掌握乘法表', requiredGrowth: 200, currentGrowth: 0, unlocked: false, unlockDate: null }] },
                    { name: '小树', nodes: [{ id: 'n2_3', name: '解决应用题', requiredGrowth: 500, currentGrowth: 0, unlocked: false, unlockDate: null }] },
                    { name: '大树', nodes: [{ id: 'n2_4', name: '数学思维达人', requiredGrowth: 1000, currentGrowth: 0, unlocked: false, unlockDate: null }] }
                ]
            },
            {
                id: 'tree_003', name: '英语', icon: '🔤',
                stages: [
                    { name: '种子', nodes: [{ id: 'n3_1', name: '学会26个字母', requiredGrowth: 50, currentGrowth: 0, unlocked: false, unlockDate: null }] },
                    { name: '幼苗', nodes: [{ id: 'n3_2', name: '掌握100个单词', requiredGrowth: 200, currentGrowth: 0, unlocked: false, unlockDate: null }] },
                    { name: '小树', nodes: [{ id: 'n3_3', name: '能进行简单对话', requiredGrowth: 500, currentGrowth: 0, unlocked: false, unlockDate: null }] },
                    { name: '大树', nodes: [{ id: 'n3_4', name: '流利阅读英文绘本', requiredGrowth: 1000, currentGrowth: 0, unlocked: false, unlockDate: null }] }
                ]
            },
            {
                id: 'tree_004', name: '魔方', icon: '🎲',
                stages: [
                    { name: '种子', nodes: [{ id: 'n4_1', name: '认识魔方结构', requiredGrowth: 50, currentGrowth: 0, unlocked: false, unlockDate: null }] },
                    { name: '幼苗', nodes: [{ id: 'n4_2', name: '还原一面', requiredGrowth: 150, currentGrowth: 0, unlocked: false, unlockDate: null }] },
                    { name: '小树', nodes: [{ id: 'n4_3', name: '完整还原三阶', requiredGrowth: 400, currentGrowth: 0, unlocked: false, unlockDate: null }] },
                    { name: '大树', nodes: [{ id: 'n4_4', name: '1分钟内还原', requiredGrowth: 800, currentGrowth: 0, unlocked: false, unlockDate: null }] }
                ]
            },
            {
                id: 'tree_005', name: '跳绳', icon: '🤸',
                stages: [
                    { name: '种子', nodes: [{ id: 'n5_1', name: '连续跳10个', requiredGrowth: 50, currentGrowth: 0, unlocked: false, unlockDate: null }] },
                    { name: '幼苗', nodes: [{ id: 'n5_2', name: '1分钟跳50个', requiredGrowth: 150, currentGrowth: 0, unlocked: false, unlockDate: null }] },
                    { name: '小树', nodes: [{ id: 'n5_3', name: '学会花式跳绳', requiredGrowth: 400, currentGrowth: 0, unlocked: false, unlockDate: null }] },
                    { name: '大树', nodes: [{ id: 'n5_4', name: '1分钟跳120个', requiredGrowth: 800, currentGrowth: 0, unlocked: false, unlockDate: null }] }
                ]
            },
            {
                id: 'tree_006', name: '街舞', icon: '💃',
                stages: [
                    { name: '种子', nodes: [{ id: 'n6_1', name: '学会基本律动', requiredGrowth: 80, currentGrowth: 0, unlocked: false, unlockDate: null }] },
                    { name: '幼苗', nodes: [{ id: 'n6_2', name: '掌握一套基础舞步', requiredGrowth: 200, currentGrowth: 0, unlocked: false, unlockDate: null }] },
                    { name: '小树', nodes: [{ id: 'n6_3', name: '完成一支完整舞蹈', requiredGrowth: 500, currentGrowth: 0, unlocked: false, unlockDate: null }] },
                    { name: '大树', nodes: [{ id: 'n6_4', name: '登台表演', requiredGrowth: 1000, currentGrowth: 0, unlocked: false, unlockDate: null }] }
                ]
            }
        ]);

        // 日常任务
        this.set('daily_tasks', [
            { id: 'dt_001', name: '完成学校作业', category: '学习', points: 15, treeId: 'tree_001', growthValue: 15, required: true },
            { id: 'dt_002', name: '阅读20分钟', category: '学习', points: 10, treeId: 'tree_001', growthValue: 10, required: true },
            { id: 'dt_003', name: '背诵10个英语单词', category: '学习', points: 12, treeId: 'tree_003', growthValue: 12, required: true },
            { id: 'dt_004', name: '计算20题', category: '学习', points: 10, treeId: 'tree_002', growthValue: 10, required: true },
            { id: 'dt_005', name: '户外运动40分钟', category: '运动', points: 15, treeId: 'tree_005', growthValue: 15, required: true },
            { id: 'dt_006', name: '跳绳1000个/慢跑2公里', category: '运动', points: 20, treeId: 'tree_005', growthValue: 20, required: true },
            { id: 'dt_007', name: '自己吃饭/自己洗漱', category: '生活', points: 8, treeId: null, growthValue: 0, required: true },
            { id: 'dt_008', name: '整理书包和书桌', category: '生活', points: 5, treeId: null, growthValue: 0, required: true },
            { id: 'dt_009', name: '9：30以前完成所有日常任务，上床睡觉', category: '生活', points: 10, treeId: null, growthValue: 0, required: true }
        ]);

        // 随机任务类别与概率
        this.set('random_categories', [
            { id: 'rc_001', name: '语文', icon: '📖', probability: 20 },
            { id: 'rc_002', name: '数学', icon: '🔢', probability: 20 },
            { id: 'rc_003', name: '英语', icon: '🔤', probability: 15 },
            { id: 'rc_004', name: '体魄', icon: '💪', probability: 15 },
            { id: 'rc_005', name: '信息', icon: '💻', probability: 10 },
            { id: 'rc_006', name: '角色扮演', icon: '🎭', probability: 10 },
            { id: 'rc_007', name: '生活技能', icon: '🏠', probability: 10 }
        ]);

        // 随机任务库
        this.set('random_tasks', [
            // 语文
            { id: 'rt_001', categoryId: 'rc_001', name: '用"如果...就..."造3个句子', difficulty: 2, points: 15, treeId: 'tree_001', growthValue: 15 },
            { id: 'rt_002', categoryId: 'rc_001', name: '朗读一首古诗并背诵', difficulty: 1, points: 10, treeId: 'tree_001', growthValue: 10 },
            { id: 'rt_003', categoryId: 'rc_001', name: '看图写一段50字的小故事', difficulty: 3, points: 20, treeId: 'tree_001', growthValue: 20 },
            { id: 'rt_004', categoryId: 'rc_001', name: '找出5个形近字并组词', difficulty: 2, points: 15, treeId: 'tree_001', growthValue: 15 },
            // 数学
            { id: 'rt_005', categoryId: 'rc_002', name: '完成一页数学练习题', difficulty: 2, points: 15, treeId: 'tree_002', growthValue: 15 },
            { id: 'rt_006', categoryId: 'rc_002', name: '用实物理解分数的概念', difficulty: 3, points: 20, treeId: 'tree_002', growthValue: 20 },
            { id: 'rt_007', categoryId: 'rc_002', name: '玩数独游戏一局', difficulty: 2, points: 15, treeId: 'tree_002', growthValue: 15 },
            { id: 'rt_008', categoryId: 'rc_002', name: '测量房间里5样东西的长度', difficulty: 1, points: 10, treeId: 'tree_002', growthValue: 10 },
            // 英语
            { id: 'rt_009', categoryId: 'rc_003', name: '听一首英文儿歌并跟唱', difficulty: 1, points: 10, treeId: 'tree_003', growthValue: 10 },
            { id: 'rt_010', categoryId: 'rc_003', name: '用英语介绍自己的家庭', difficulty: 3, points: 20, treeId: 'tree_003', growthValue: 20 },
            { id: 'rt_011', categoryId: 'rc_003', name: '背诵5个新单词并造句', difficulty: 2, points: 15, treeId: 'tree_003', growthValue: 15 },
            // 体魄
            { id: 'rt_012', categoryId: 'rc_004', name: '做20个开合跳', difficulty: 1, points: 10, treeId: 'tree_005', growthValue: 10 },
            { id: 'rt_013', categoryId: 'rc_004', name: '平板支撑坚持30秒', difficulty: 2, points: 15, treeId: 'tree_005', growthValue: 15 },
            { id: 'rt_014', categoryId: 'rc_004', name: '和爸爸进行一次拍球比赛', difficulty: 2, points: 15, treeId: 'tree_005', growthValue: 15 },
            // 信息
            { id: 'rt_015', categoryId: 'rc_005', name: '认识键盘上的字母位置', difficulty: 1, points: 10, treeId: null, growthValue: 0 },
            { id: 'rt_016', categoryId: 'rc_005', name: '用画图软件画一幅画', difficulty: 2, points: 15, treeId: null, growthValue: 0 },
            { id: 'rt_017', categoryId: 'rc_005', name: '学习打字练习10分钟', difficulty: 2, points: 15, treeId: null, growthValue: 0 },
            // 角色扮演
            { id: 'rt_018', categoryId: 'rc_006', name: '扮演小老师给爸爸讲一道数学题', difficulty: 2, points: 20, treeId: 'tree_002', growthValue: 15 },
            { id: 'rt_019', categoryId: 'rc_006', name: '扮演导游介绍自己的房间', difficulty: 2, points: 20, treeId: 'tree_001', growthValue: 15 },
            { id: 'rt_020', categoryId: 'rc_006', name: '扮演厨师帮忙准备晚餐', difficulty: 3, points: 25, treeId: null, growthValue: 0 },
            { id: 'rt_021', categoryId: 'rc_006', name: '扮演小记者采访家人的一天', difficulty: 3, points: 25, treeId: 'tree_001', growthValue: 20 },
            // 生活技能
            { id: 'rt_022', categoryId: 'rc_007', name: '自己叠被子和整理床铺', difficulty: 1, points: 10, treeId: null, growthValue: 0 },
            { id: 'rt_023', categoryId: 'rc_007', name: '学习系鞋带（如果还不会的话）', difficulty: 1, points: 10, treeId: null, growthValue: 0 },
            { id: 'rt_024', categoryId: 'rc_007', name: '帮忙择菜或洗水果', difficulty: 1, points: 10, treeId: null, growthValue: 0 },
            { id: 'rt_025', categoryId: 'rc_007', name: '独立完成一次垃圾分类', difficulty: 2, points: 15, treeId: null, growthValue: 0 }
        ]);

        // 成就系统
        this.set('achievements', [
            { id: 'ach_001', name: '初出茅庐', description: '完成第一个日常任务', icon: '🏅', condition: { type: 'daily_complete_count', value: 1 }, rewardPoints: 50, hidden: false, unlocked: false, unlockDate: null },
            { id: 'ach_002', name: '勤劳小蜜蜂', description: '累计完成50个日常任务', icon: '🐝', condition: { type: 'daily_complete_count', value: 50 }, rewardPoints: 200, hidden: false, unlocked: false, unlockDate: null },
            { id: 'ach_003', name: '坚持不懈', description: '连续7天完成全部必做任务', icon: '🔥', condition: { type: 'streak_days', value: 7 }, rewardPoints: 300, hidden: false, unlocked: false, unlockDate: null },
            { id: 'ach_004', name: '积分猎人', description: '累计获得500积分', icon: '💎', condition: { type: 'total_points', value: 500 }, rewardPoints: 100, hidden: false, unlocked: false, unlockDate: null },
            { id: 'ach_005', name: '百分学霸', description: '累计获得1000积分', icon: '🎓', condition: { type: 'total_points', value: 1000 }, rewardPoints: 200, hidden: false, unlocked: false, unlockDate: null },
            { id: 'ach_006', name: '盲盒达人', description: '完成10个随机任务', icon: '🎁', condition: { type: 'random_complete_count', value: 10 }, rewardPoints: 150, hidden: false, unlocked: false, unlockDate: null },
            { id: 'ach_007', name: '森林守护者', description: '解锁任意能力树的第一个节点', icon: '🌱', condition: { type: 'tree_node_unlock', value: 1 }, rewardPoints: 100, hidden: false, unlocked: false, unlockDate: null },
            { id: 'ach_008', name: '全能小将', description: '在3棵不同的能力树上解锁节点', icon: '⭐', condition: { type: 'tree_count_with_unlocks', value: 3 }, rewardPoints: 300, hidden: false, unlocked: false, unlockDate: null },
            { id: 'ach_009', name: '购物专家', description: '在商城兑换3件商品', icon: '🛒', condition: { type: 'exchange_count', value: 3 }, rewardPoints: 100, hidden: false, unlocked: false, unlockDate: null },
            { id: 'ach_010', name: '完美一天', description: '一天内完成所有必做任务+3个随机任务', icon: '🌟', condition: { type: 'perfect_day', value: 1 }, rewardPoints: 200, hidden: false, unlocked: false, unlockDate: null },
            // 隐藏成就
            { id: 'ach_011', name: '???', description: '连续30天不间断', icon: '🏆', condition: { type: 'streak_days', value: 30 }, rewardPoints: 1000, hidden: true, unlocked: false, unlockDate: null },
            { id: 'ach_012', name: '???', description: '累计获得5000积分', icon: '👑', condition: { type: 'total_points', value: 5000 }, rewardPoints: 500, hidden: true, unlocked: false, unlockDate: null },
            { id: 'ach_013', name: '???', description: '所有能力树都解锁至少一个节点', icon: '🌈', condition: { type: 'all_trees_have_unlock', value: 1 }, rewardPoints: 500, hidden: true, unlocked: false, unlockDate: null },
            { id: 'ach_014', name: '???', description: '完成100个随机任务', icon: '🎯', condition: { type: 'random_complete_count', value: 100 }, rewardPoints: 500, hidden: true, unlocked: false, unlockDate: null },
            { id: 'ach_015', name: '???', description: '爸爸的特别惊喜', icon: '🎉', condition: { type: 'manual', value: 0 }, rewardPoints: 300, hidden: true, unlocked: false, unlockDate: null }
        ]);

        // 商城商品
        this.set('shop_items', [
            { id: 'si_001', name: '看一集动画片', cost: 100, type: 'privilege', icon: '📺' },
            { id: 'si_002', name: '玩30分钟游戏', cost: 150, type: 'privilege', icon: '🎮' },
            { id: 'si_003', name: '选择今天的晚餐', cost: 80, type: 'privilege', icon: '🍕' },
            { id: 'si_004', name: '周末去公园玩', cost: 200, type: 'privilege', icon: '🏞️' },
            { id: 'si_005', name: '买一本喜欢的书', cost: 300, type: 'material', icon: '📚' },
            { id: 'si_006', name: '小玩具一个', cost: 500, type: 'material', icon: '🧸' },
            { id: 'si_007', name: '能力森林加速包(x2)', cost: 200, type: 'boost', icon: '🚀' },
            { id: 'si_008', name: '免写一次作业(非必做)', cost: 250, type: 'privilege', icon: '📝' },
            { id: 'si_009', name: '和爸爸下一盘棋', cost: 50, type: 'privilege', icon: '♟️' },
            { id: 'si_010', name: '周末电影之夜', cost: 350, type: 'privilege', icon: '🎬' },
            { id: 'si_011', name: '任务得分转换卡', cost: 300, type: 'convert_card', icon: '🎫' }
        ]);

        // 初始化空记录
        this.set('points_log', []);
        this.set('task_history', {});
        this.set('achievement_log', []);
        this.set('exchange_log', []);
        this.set('admin_password', '123456');
        this.set('settings', {
            dailyRandomCount: 3,     // 每日随机任务数量 3-5
            perfectDayBonus: 20,     // 全勤奖励积分
            theme: 'default'
        });
    },

    // ==================== 积分操作 ====================

    /** 加积分 */
    addPoints(amount, reason) {
        const profile = this.get('profile');
        profile.totalPoints += amount;
        profile.currentPoints += amount;
        // 等级计算：每200分升一级
        profile.level = Math.floor(profile.totalPoints / 200) + 1;
        this.set('profile', profile);

        const log = this.get('points_log') || [];
        log.push({ date: new Date().toISOString(), amount, reason, type: 'earn' });
        this.set('points_log', log);
    },

    /** 扣积分（兑换商品） */
    spendPoints(amount, reason) {
        const profile = this.get('profile');
        if (profile.currentPoints < amount) return false;
        profile.currentPoints -= amount;
        this.set('profile', profile);

        const log = this.get('points_log') || [];
        log.push({ date: new Date().toISOString(), amount: -amount, reason, type: 'spend' });
        this.set('points_log', log);
        return true;
    },

    // ==================== 任务历史 ====================

    /** 获取今天的日期字符串 */
    today() {
        return new Date().toISOString().split('T')[0];
    },

    /** 记录完成日常任务 */
    completeDailyTask(taskId) {
        const history = this.get('task_history') || {};
        const today = this.today();
        if (!history[today]) {
            history[today] = { daily: [], random: [], allComplete: false, totalPoints: 0 };
        }
        // 避免重复
        if (history[today].daily.find(d => d.taskId === taskId)) return false;

        const task = (this.get('daily_tasks') || []).find(t => t.id === taskId);
        if (!task) return false;

        history[today].daily.push({
            taskId, completed: true,
            time: new Date().toTimeString().slice(0, 5)
        });
        history[today].totalPoints += task.points;
        this.set('task_history', history);

        // 加积分
        this.addPoints(task.points, `完成日常任务：${task.name}`);

        // 更新能力树
        if (task.treeId) {
            this.addTreeGrowth(task.treeId, task.growthValue);
        }

        // 检查全勤
        this.checkPerfectDay();

        // 检查成就
        this.checkAchievements();

        return true;
    },

    /** 记录完成随机任务 */
    completeRandomTask(taskId) {
        const history = this.get('task_history') || {};
        const today = this.today();
        if (!history[today]) {
            history[today] = { daily: [], random: [], allComplete: false, totalPoints: 0 };
        }
        if (history[today].random.find(d => d.taskId === taskId)) return false;

        const task = (this.get('random_tasks') || []).find(t => t.id === taskId);
        if (!task) return false;

        history[today].random.push({
            taskId, completed: true,
            time: new Date().toTimeString().slice(0, 5)
        });
        history[today].totalPoints += task.points;
        this.set('task_history', history);

        this.addPoints(task.points, `完成随机任务：${task.name}`);

        if (task.treeId) {
            this.addTreeGrowth(task.treeId, task.growthValue);
        }

        this.checkAchievements();
        return true;
    },

    // ==================== 能力树 ====================

    /** 给指定树增加成长值，自动检查节点解锁 */
    addTreeGrowth(treeId, amount) {
        const trees = this.get('trees') || [];
        const tree = trees.find(t => t.id === treeId);
        if (!tree) return;

        let unlocked = false;
        for (const stage of tree.stages) {
            for (const node of stage.nodes) {
                if (!node.unlocked) {
                    node.currentGrowth += amount;
                    if (node.currentGrowth >= node.requiredGrowth) {
                        node.unlocked = true;
                        node.unlockDate = new Date().toISOString();
                        unlocked = true;
                    }
                    // 一次只增长一个未解锁节点
                    this.set('trees', trees);
                    if (unlocked) {
                        this.checkAchievements();
                    }
                    return unlocked;
                }
            }
        }
        this.set('trees', trees);
        return unlocked;
    },

    // ==================== 成就检查 ====================

    checkAchievements() {
        const achievements = this.get('achievements') || [];
        const profile = this.get('profile');
        const history = this.get('task_history') || {};
        const exchangeLog = this.get('exchange_log') || [];
        const trees = this.get('trees') || [];
        const achLog = this.get('achievement_log') || [];

        let newUnlocks = [];

        // 统计数据
        let totalDailyCount = 0;
        let totalRandomCount = 0;
        Object.values(history).forEach(day => {
            totalDailyCount += (day.daily || []).length;
            totalRandomCount += (day.random || []).length;
        });

        // 连续天数
        const streakDays = this.getStreakDays();

        // 解锁的节点数
        let totalUnlockedNodes = 0;
        let treesWithUnlocks = 0;
        trees.forEach(tree => {
            let hasUnlock = false;
            tree.stages.forEach(stage => {
                stage.nodes.forEach(node => {
                    if (node.unlocked) {
                        totalUnlockedNodes++;
                        hasUnlock = true;
                    }
                });
            });
            if (hasUnlock) treesWithUnlocks++;
        });

        const allTreesHaveUnlock = trees.length > 0 && treesWithUnlocks === trees.length;

        // 今日是否完美
        const todayData = history[this.today()];
        const dailyTasks = this.get('daily_tasks') || [];
        const requiredTasks = dailyTasks.filter(t => t.required);
        const todayDailyIds = todayData ? todayData.daily.map(d => d.taskId) : [];
        const allRequiredDone = requiredTasks.every(t => todayDailyIds.includes(t.id));
        const todayRandomCount = todayData ? (todayData.random || []).length : 0;
        const isPerfectDay = allRequiredDone && todayRandomCount >= 3;

        achievements.forEach(ach => {
            if (ach.unlocked) return;
            if (ach.condition.type === 'manual') return;

            let met = false;
            switch (ach.condition.type) {
                case 'daily_complete_count': met = totalDailyCount >= ach.condition.value; break;
                case 'random_complete_count': met = totalRandomCount >= ach.condition.value; break;
                case 'streak_days': met = streakDays >= ach.condition.value; break;
                case 'total_points': met = profile.totalPoints >= ach.condition.value; break;
                case 'tree_node_unlock': met = totalUnlockedNodes >= ach.condition.value; break;
                case 'tree_count_with_unlocks': met = treesWithUnlocks >= ach.condition.value; break;
                case 'all_trees_have_unlock': met = allTreesHaveUnlock; break;
                case 'exchange_count': met = exchangeLog.length >= ach.condition.value; break;
                case 'perfect_day': met = isPerfectDay; break;
            }

            if (met) {
                ach.unlocked = true;
                ach.unlockDate = new Date().toISOString();
                newUnlocks.push(ach);
                // 成就奖励积分
                this.addPoints(ach.rewardPoints, `解锁成就：${ach.hidden ? ach.description : ach.name}`);
                achLog.push({ achievementId: ach.id, name: ach.hidden ? ach.description : ach.name, date: new Date().toISOString() });
            }
        });

        this.set('achievements', achievements);
        this.set('achievement_log', achLog);
        return newUnlocks;
    },

    /** 计算连续天数 */
    getStreakDays() {
        const history = this.get('task_history') || {};
        const dailyTasks = this.get('daily_tasks') || [];
        const requiredIds = dailyTasks.filter(t => t.required).map(t => t.id);
        if (requiredIds.length === 0) return 0;

        let streak = 0;
        let d = new Date();
        while (true) {
            const dateStr = d.toISOString().split('T')[0];
            const dayData = history[dateStr];
            if (!dayData) break;
            const completedIds = (dayData.daily || []).map(x => x.taskId);
            const allDone = requiredIds.every(id => completedIds.includes(id));
            if (!allDone) break;
            streak++;
            d.setDate(d.getDate() - 1);
        }
        return streak;
    },

    /** 检查全勤奖励 */
    checkPerfectDay() {
        const history = this.get('task_history') || {};
        const today = this.today();
        const dayData = history[today];
        if (!dayData) return;

        const dailyTasks = this.get('daily_tasks') || [];
        const requiredIds = dailyTasks.filter(t => t.required).map(t => t.id);
        const completedIds = dayData.daily.map(d => d.taskId);

        if (requiredIds.every(id => completedIds.includes(id)) && !dayData.allComplete) {
            dayData.allComplete = true;
            const settings = this.get('settings') || {};
            const bonus = settings.perfectDayBonus || 20;
            this.addPoints(bonus, '全勤奖励 🎉');
            this.set('task_history', history);
        }
    },

    // ==================== 随机任务抽取 ====================

    /** 按概率抽取随机任务 */
    drawRandomTasks(count) {
        const categories = this.get('random_categories') || [];
        const allTasks = this.get('random_tasks') || [];
        if (allTasks.length === 0) return [];

        const drawn = [];
        const usedIds = new Set();

        for (let i = 0; i < count; i++) {
            // 按概率选类别
            const roll = Math.random() * 100;
            let cumulative = 0;
            let selectedCat = categories[0];
            for (const cat of categories) {
                cumulative += cat.probability;
                if (roll <= cumulative) {
                    selectedCat = cat;
                    break;
                }
            }

            // 从该类别随机选一个未选过的任务
            const catTasks = allTasks.filter(t => t.categoryId === selectedCat.id && !usedIds.has(t.id));
            if (catTasks.length > 0) {
                const task = catTasks[Math.floor(Math.random() * catTasks.length)];
                drawn.push({ ...task, categoryName: selectedCat.name, categoryIcon: selectedCat.icon });
                usedIds.add(task.id);
            } else {
                // 类别任务不够，从其他类别补
                const remaining = allTasks.filter(t => !usedIds.has(t.id));
                if (remaining.length > 0) {
                    const task = remaining[Math.floor(Math.random() * remaining.length)];
                    const cat = categories.find(c => c.id === task.categoryId) || { name: '其他', icon: '📋' };
                    drawn.push({ ...task, categoryName: cat.name, categoryIcon: cat.icon });
                    usedIds.add(task.id);
                }
            }
        }
        return drawn;
    },

    // ==================== 商城兑换 ====================

    exchangeItem(itemId) {
        const items = this.get('shop_items') || [];
        const item = items.find(i => i.id === itemId);
        if (!item) return { success: false, msg: '商品不存在' };

        if (!this.spendCoins(item.cost, `兑换商品：${item.name}`)) {
            return { success: false, msg: '金币不足' };
        }

        // 添加到已购列表
        const purchased = this.get('purchased_items') || [];
        purchased.push({
            itemId: item.id,
            name: item.name,
            cost: item.cost,
            type: item.type,
            icon: item.icon,
            purchaseDate: new Date().toISOString(),
            used: false
        });
        this.set('purchased_items', purchased);

        // 记录兑换日志
        const log = this.get('exchange_log') || [];
        log.push({
            itemId: item.id,
            name: item.name,
            cost: item.cost,
            date: new Date().toISOString(),
            fulfilled: true
        });
        this.set('exchange_log', log);

        this.checkAchievements();
        return { success: true, msg: `成功兑换：${item.name}` };
    },

    // 使用已购商品
    usePurchasedItem(index) {
        const purchased = this.get('purchased_items') || [];
        if (index < 0 || index >= purchased.length) {
            return { success: false, msg: '商品不存在' };
        }

        const item = purchased[index];
        if (item.used) {
            return { success: false, msg: '该商品已使用' };
        }

        // 标记为已使用
        item.used = true;
        item.useDate = new Date().toISOString();

        // 如果是任务得分转换卡，增加今日转换次数
        if (item.type === 'convert_card') {
            const today = this.today();
            const convertHistory = JSON.parse(localStorage.getItem('gq_convert_history') || '{}');
            convertHistory[today] = (convertHistory[today] || 0) - 1;
            localStorage.setItem('gq_convert_history', JSON.stringify(convertHistory));
        }

        // 更新已购列表
        purchased.splice(index, 1);
        this.set('purchased_items', purchased);

        return { success: true, msg: `成功使用：${item.name}` };
    },

    // ==================== 金币操作 ====================

    /** 加金币 */
    addCoins(amount, reason) {
        const profile = this.get('profile');
        profile.coins = (profile.coins || 0) + amount;
        this.set('profile', profile);

        const log = this.get('coins_log') || [];
        log.push({ date: new Date().toISOString(), amount, reason, type: 'earn' });
        this.set('coins_log', log);
    },

    /** 扣金币（兑换商品） */
    spendCoins(amount, reason) {
        const profile = this.get('profile');
        if ((profile.coins || 0) < amount) return false;
        profile.coins -= amount;
        this.set('profile', profile);

        const log = this.get('coins_log') || [];
        log.push({ date: new Date().toISOString(), amount: -amount, reason, type: 'spend' });
        this.set('coins_log', log);
        return true;
    },

    // ==================== 备份与恢复 ====================

    /** 导出全部数据为 JSON */
    exportBackup() {
        const data = this.adapter.getAll();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `growth-quest-backup-${this.today()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    /** 从 JSON 恢复全部数据 */
    importBackup(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            // 先清除旧数据
            const keys = Object.keys(this.adapter.getAll());
            keys.forEach(k => this.adapter.remove(k));
            // 写入新数据
            Object.entries(data).forEach(([k, v]) => {
                this.adapter.set(k, v);
            });
            return { success: true, msg: '数据恢复成功' };
        } catch (e) {
            return { success: false, msg: '数据格式错误：' + e.message };
        }
    },

    /** 重置全部数据 */
    resetAll() {
        const keys = Object.keys(this.adapter.getAll());
        keys.forEach(k => this.adapter.remove(k));
        this.initDefaultData();
        this.set('initialized', true);
    },

    // ==================== ID 生成工具 ====================
    generateId(prefix) {
        return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }
};

// 页面加载时自动初始化
Store.init();
