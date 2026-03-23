/**
 * 成长冒险岛 - 首页逻辑（整合任务功能）
 */
(function () {
    // 初始化数据
    Store.init();
    
    const today = Store.today();
    let history = Store.get('task_history') || {};
    let todayData = history[today] || { daily: [], random: [], allComplete: false, totalPoints: 0 };
    const dailyTasks = Store.get('daily_tasks') || [];
    const settings = Store.get('settings') || {};
    const adminPwd = Store.get('admin_password') || '123456';

    // 等级称号
    const levelTitles = ['冒险新手', '小小勇者', '勤奋学徒', '成长之星', '超级冒险家', '传说勇士'];
    function getLevelTitle(level) {
        return levelTitles[Math.min(level - 1, levelTitles.length - 1)] || '传说勇士';
    }

    // ==================== 1. 角色卡 ====================
    const profile = Store.get('profile') || {};
    document.getElementById('hero-avatar').textContent = profile.avatar || '🦸';
    document.getElementById('hero-name').textContent = profile.nickname || '小冒险家';
    document.getElementById('hero-level').textContent = `Lv.${profile.level || 1} ${getLevelTitle(profile.level || 1)}`;
    document.getElementById('hero-points').textContent = profile.currentPoints || 0;

    // ==================== 2. 今日进度 ====================
    function updateTodayProgress() {
        const completedDaily = todayData.daily.length;
        const totalDaily = dailyTasks.length;
        const pct = totalDaily > 0 ? Math.round(completedDaily / totalDaily * 100) : 0;
        document.getElementById('today-progress').innerHTML = Utils.createProgressBar(completedDaily, totalDaily, 'linear-gradient(90deg, var(--color-secondary), var(--color-primary))');
        document.getElementById('today-daily-count').textContent = `已完成 ${completedDaily}/${totalDaily}`;
        document.getElementById('today-random-count').textContent = `随机 ${todayData.random.length} 个`;
    }
    updateTodayProgress();

    // ==================== 3. 日常任务渲染 ====================
    function renderDailyTasks() {
        try {
            const list = document.getElementById('daily-task-list');
            // 确保dailyTasks是数组
            const dailyTasksArray = Array.isArray(dailyTasks) ? dailyTasks : [];
            const completedIds = todayData.daily.map(d => d.taskId);
            const completedCount = completedIds.length;
            const totalCount = dailyTasksArray.length;
            const requiredTasks = dailyTasksArray.filter(t => t.required);
            const requiredDone = requiredTasks.every(t => completedIds.includes(t.id));

            // badge
            document.getElementById('daily-badge').textContent = `${completedCount}/${totalCount}`;
            // 进度条
            document.getElementById('daily-progress-bar').innerHTML = Utils.createProgressBar(completedCount, totalCount);

            // 全勤提示
            if (requiredDone && todayData.allComplete) {
                document.getElementById('perfect-day-hint').style.display = 'block';
                document.getElementById('perfect-bonus').textContent = settings.perfectDayBonus || 20;
                // 更新分数显示
                const updatedProfile = Store.get('profile') || {};
                document.getElementById('hero-points').textContent = updatedProfile.currentPoints || 0;
            } else {
                document.getElementById('perfect-day-hint').style.display = 'none';
            }

            // 按分类分组
            const categories = {};
            dailyTasksArray.forEach(t => {
                if (!categories[t.category]) categories[t.category] = [];
                categories[t.category].push(t);
            });

            list.innerHTML = '';
            Object.entries(categories).forEach(([cat, tasks]) => {
                const catHeader = document.createElement('div');
                catHeader.style.cssText = 'font-size:0.85rem;font-weight:700;color:var(--text-secondary);margin:12px 0 6px 4px;';
                catHeader.textContent = cat;
                list.appendChild(catHeader);

                tasks.forEach(task => {
                    const isCompleted = completedIds.includes(task.id);
                    const el = document.createElement('div');
                    el.className = `task-item ${isCompleted ? 'completed' : ''} animate-slideup`;
                    el.innerHTML = `
                        <div class="task-checkbox ${isCompleted ? 'checked' : ''}" data-task-id="${task.id}">
                            ${isCompleted ? '✓' : ''}
                        </div>
                        <div class="task-info">
                            <div class="task-name">${task.name}</div>
                            <div class="task-meta">
                                <span class="task-points">+${task.points}分</span>
                                ${task.treeId ? `<span>🌱 ${getTreeName(task.treeId)}</span>` : ''}
                                ${task.required ? '<span class="task-required-badge">必做</span>' : ''}
                            </div>
                        </div>
                    `;
                    if (!isCompleted) {
                        el.querySelector('.task-checkbox').addEventListener('click', () => completeTask(task.id));
                    }
                    list.appendChild(el);
                });
            });
        } catch (e) {
            console.error('渲染日常任务出错:', e);
        }
    }

    function getTreeName(treeId) {
        const trees = Store.get('trees') || [];
        const tree = trees.find(t => t.id === treeId);
        return tree ? tree.name : '';
    }

    function completeTask(taskId) {
        const success = Store.completeDailyTask(taskId);
        if (success) {
            const task = dailyTasks.find(t => t.id === taskId);
            Utils.showToast(`+${task.points}分 ${task.name} ✅`, 'success');
            // 刷新数据重新渲染
            history = Store.get('task_history') || {};
            todayData = history[today] || { daily: [], random: [], allComplete: false, totalPoints: 0 };
            renderDailyTasks();
            updateTodayProgress();

            // 更新分数显示
            const updatedProfile = Store.get('profile') || {};
            document.getElementById('hero-points').textContent = updatedProfile.currentPoints || 0;

            // 检查成就
            const newUnlocks = Store.checkAchievements();
            if (newUnlocks.length > 0) {
                setTimeout(() => {
                    Utils.showConfetti();
                    newUnlocks.forEach(ach => {
                        Utils.showToast(`🏅 解锁成就：${ach.hidden ? ach.description : ach.name}`, 'reward', 4000);
                    });
                    renderRecentAchievements();
                }, 500);
            }
        }
    }

    // ==================== 4. 随机任务区 ====================
    const KEY_TODAY_RANDOM = 'gq_today_random_' + today;

    document.getElementById('unlock-random-btn').addEventListener('click', async () => {
        const pwd = await Utils.showPasswordPrompt('请爸爸输入管理密码 🔑');
        if (pwd === null) return;
        if (pwd !== adminPwd) {
            Utils.showToast('密码错误！', 'error');
            return;
        }
        unlockRandom();
    });

    function unlockRandom() {
        document.getElementById('random-locked').style.display = 'none';
        document.getElementById('random-unlocked').style.display = 'block';
        document.getElementById('random-badge').textContent = '已解锁';
        document.getElementById('random-badge').className = 'gq-badge gq-badge-green';

        // 检查今天是否已抽取
        let todayRandom = JSON.parse(localStorage.getItem(KEY_TODAY_RANDOM) || 'null');
        if (todayRandom) {
            // 如果已抽取，直接显示结果
            document.getElementById('slot-machine').style.display = 'none';
            document.getElementById('random-task-list').classList.add('show');
            renderRandomTasks(todayRandom);
        } else {
            // 如果未抽取，显示老虎机第一阶段
            document.getElementById('slot-machine').style.display = 'block';
            document.getElementById('random-task-list').classList.remove('show');
            document.getElementById('phase-1').style.display = 'flex';
            document.getElementById('phase-2').style.display = 'none';
            
            // 绑定第一阶段按钮事件
            document.getElementById('start-number-btn').addEventListener('click', startNumberRolling);
        }
    }

    // 根据星期几获取随机任务数量
    function getTaskCountByDay() {
        const day = new Date().getDay();
        const isWeekend = day === 0 || day === 6;
        
        if (isWeekend) {
            return Math.floor(Math.random() * 4) + 5;
        } else {
            return Math.floor(Math.random() * 3) + 3;
        }
    }

    // 第一阶段：数字滚动
    function startNumberRolling() {
        const btn = document.getElementById('start-number-btn');
        btn.disabled = true;
        btn.textContent = '🎲 抽取中...';

        const numberDisplay = document.getElementById('slot-number');
        const day = new Date().getDay();
        const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const isWeekend = day === 0 || day === 6;
        
        let minCount = isWeekend ? 5 : 3;
        let maxCount = isWeekend ? 8 : 5;
        
        document.getElementById('slot-machine-count').textContent = 
            `今天是${dayNames[day]}，正在抽取 ${minCount}-${maxCount} 个任务`;

        // 数字滚动动画
        let rollInterval;
        let rollCount = 0;
        const finalCount = getTaskCountByDay();
        
        rollInterval = setInterval(() => {
            const randomNum = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
            numberDisplay.textContent = randomNum;
            rollCount++;
            
            // 3秒后停止
            if (rollCount >= 30) {
                clearInterval(rollInterval);
                numberDisplay.textContent = finalCount;
                
                // 显示庆祝效果
                setTimeout(() => {
                    Utils.showToast(`🎉 今日任务数量：${finalCount} 个！`, 'success', 2000);
                    
                    // 进入第二阶段
                    setTimeout(() => {
                        showReelsPhase(finalCount);
                    }, 1000);
                }, 500);
            }
        }, 100);
    }

    // 第二阶段：显示任务条
    function showReelsPhase(count) {
        document.getElementById('phase-1').style.display = 'none';
        document.getElementById('phase-2').style.display = 'flex';
        
        const reelsContainer = document.getElementById('reels-container');
        reelsContainer.innerHTML = '';
        
        // 创建任务条
        for (let i = 0; i < count; i++) {
            const reel = document.createElement('div');
            reel.className = 'slot-machine-reel';
            reel.id = `reel-${i}`;
            reel.innerHTML = `
                <div class="slot-machine-reel-items" id="reel-items-${i}">
                    <div class="slot-machine-reel-item lucky">🎲 幸运大抽奖</div>
                </div>
            `;
            reelsContainer.appendChild(reel);
        }
        
        // 绑定第二阶段按钮事件
        document.getElementById('start-reels-btn').addEventListener('click', () => startReelsRolling(count));
    }

    // 第二阶段：任务条滚动
    function startReelsRolling(count) {
        const btn = document.getElementById('start-reels-btn');
        btn.disabled = true;
        btn.textContent = '🎲 抽奖中...';

        const allTasks = Store.get('random_tasks') || [];
        if (allTasks.length === 0) {
            Utils.showToast('没有可用的随机任务', 'error');
            btn.disabled = false;
            btn.textContent = '🎲 开始幸运大抽奖';
            return;
        }

        // 为每个任务条创建滚屏内容
        for (let i = 0; i < count; i++) {
            const reelItems = document.getElementById(`reel-items-${i}`);
            const reel = document.getElementById(`reel-${i}`);
            
            // 创建滚屏任务列表（复制多次以实现循环滚动）
            const spinningTasks = [];
            for (let j = 0; j < 100; j++) {
                const randomTask = allTasks[Math.floor(Math.random() * allTasks.length)];
                spinningTasks.push(randomTask);
            }
            
            // 渲染滚屏任务
            reelItems.innerHTML = spinningTasks.map(task => 
                `<div class="slot-machine-reel-item">${task.categoryIcon} ${task.name}</div>`
            ).join('');
            
            // 开始滚动
            reel.classList.add('spinning');
        }

        // 5秒后依次停止
        const finalTasks = Store.drawRandomTasks(count);
        localStorage.setItem(KEY_TODAY_RANDOM, JSON.stringify(finalTasks));

        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const reel = document.getElementById(`reel-${i}`);
                const reelItems = document.getElementById(`reel-items-${i}`);
                const task = finalTasks[i];
                
                // 停止滚动，显示最终结果
                reel.classList.remove('spinning');
                
                // 计算最终任务的位置，确保显示在中间
                const itemHeight = 60;
                const totalHeight = reelItems.children.length * itemHeight;
                const targetPosition = Math.floor(totalHeight / 2) - itemHeight / 2;
                
                reelItems.style.transform = `translateY(-${targetPosition}px)`;
                reelItems.style.transition = 'transform 0.5s ease-out';
                
                // 延迟后更新为最终任务
                setTimeout(() => {
                    reelItems.innerHTML = `<div class="slot-machine-reel-item stopped">${task.categoryIcon} ${task.name}</div>`;
                    reelItems.style.transform = 'translateY(0)';
                    reelItems.style.transition = '';
                }, 500);
                
                // 播放停止动画
                reel.style.animation = 'pulse 0.3s';
                setTimeout(() => {
                    reel.style.animation = '';
                }, 300);
                
                // 最后一个任务条停止后
                if (i === count - 1) {
                    setTimeout(() => {
                        showFinalResults(finalTasks);
                    }, 1000);
                }
            }, 5000 + i * 800); // 每个任务条间隔0.8秒停止
        }
    }

    // 显示最终结果
    function showFinalResults(finalTasks) {
        document.getElementById('slot-machine').style.display = 'none';
        document.getElementById('random-task-list').classList.add('show');
        renderRandomTasks(finalTasks);
        
        // 撒花庆祝
        Utils.showConfetti();
        Utils.showToast(`🎉 成功抽取 ${finalTasks.length} 个随机任务！`, 'success', 3000);
    }

    function renderRandomTasks(tasks) {
        const list = document.getElementById('random-task-list');
        const completedIds = todayData.random.map(d => d.taskId);

        list.innerHTML = tasks.map((task, i) => {
            const isCompleted = completedIds.includes(task.id);
            return `<div class="random-card ${isCompleted ? 'completed' : ''}" style="animation-delay:${i * 0.1}s">
                <div class="random-card-header">
                    <span class="random-card-category">${task.categoryIcon} ${task.categoryName}</span>
                    <span class="random-card-difficulty">${Utils.renderStars(task.difficulty)}</span>
                </div>
                <div class="random-card-content">${task.name}</div>
                <div class="random-card-footer">
                    <span class="task-points">+${task.points}分</span>
                    ${isCompleted ?
                        '<span class="gq-badge gq-badge-green">✅ 已完成</span>' :
                        `<button class="gq-btn gq-btn-success gq-btn-sm" onclick="completeRandom('${task.id}')">完成 ✓</button>`
                    }
                </div>
            </div>`;
        }).join('');
    }

    // 全局函数供onclick使用
    window.completeRandom = function (taskId) {
        const success = Store.completeRandomTask(taskId);
        if (success) {
            const task = (Store.get('random_tasks') || []).find(t => t.id === taskId);
            Utils.showToast(`+${task.points}分 随机任务完成！🎲`, 'success');
            Utils.showConfetti();
            history = Store.get('task_history') || {};
            todayData = history[today] || { daily: [], random: [], allComplete: false, totalPoints: 0 };
            const todayRandom = JSON.parse(localStorage.getItem(KEY_TODAY_RANDOM) || '[]');
            renderRandomTasks(todayRandom);
            updateTodayProgress();

            // 更新分数显示
            const updatedProfile = Store.get('profile') || {};
            document.getElementById('hero-points').textContent = updatedProfile.currentPoints || 0;
        }
    };

    // 检查今天是否已解锁过
    if (localStorage.getItem(KEY_TODAY_RANDOM)) {
        unlockRandom();
    }

    // ==================== 5. 近期成就 ====================
    function renderRecentAchievements() {
        try {
            const achievements = Store.get('achievements') || [];
            // 确保achievements是数组
            const achievementsArray = Array.isArray(achievements) ? achievements : [];
            const recentAch = achievementsArray.filter(a => a.unlocked).sort((a, b) => new Date(b.unlockDate) - new Date(a.unlockDate)).slice(0, 4);
            const recentEl = document.getElementById('recent-achievements');
            if (recentAch.length > 0) {
                recentEl.innerHTML = '<div style="display:flex;gap:12px;flex-wrap:wrap">' +
                    recentAch.map(a => `<div class="achievement-badge unlocked" style="flex:1;min-width:70px">
                        <span class="achievement-icon">${a.icon}</span>
                        <span class="achievement-name">${a.name}</span>
                    </div>`).join('') + '</div>';
            }
        } catch (e) {
            console.error('渲染成就出错:', e);
        }
    }
    renderRecentAchievements();

    // ==================== 6. 底部导航栏 ====================
    try {
        Utils.renderNav('index');
    } catch (e) {
        console.error('渲染导航栏出错:', e);
    }

    // ==================== 7. 积分转换功能 ====================
    document.getElementById('convert-btn').addEventListener('click', () => {
        // 重新获取最新的profile数据
        const latestProfile = Store.get('profile') || {};
        const currentPoints = latestProfile.currentPoints || 0;
        if (currentPoints <= 0) {
            Utils.showToast('积分不足，无法转换！', 'error');
            return;
        }

        // 检查今日转换次数
        const today = Store.today();
        const convertHistory = JSON.parse(localStorage.getItem('gq_convert_history') || '{}');
        const todayConvertCount = convertHistory[today] || 0;

        // 显示转换模态窗口
        const content = `
            <div style="padding:16px">
                <p style="margin-bottom:12px">当前积分：<strong>${currentPoints}</strong></p>
                <p style="margin-bottom:12px">今日已转换：<strong>${todayConvertCount}</strong> 次</p>
                <div style="margin-bottom:16px">
                    <label style="display:block;margin-bottom:6px">转换数量：</label>
                    <input type="number" id="convert-amount" class="gq-input" min="1" max="${currentPoints}" value="${Math.min(100, currentPoints)}">
                </div>
                <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:16px">
                    转换比例：1积分 = ${(Store.get('settings') || {}).conversionRatio || 1} 开炮分数
                </p>
            </div>
        `;

        Utils.showModal({
            title: '🎮 积分转换',
            content: content,
            buttons: [
                { text: '取消', class: 'gq-btn-secondary' },
                { text: '确认转换', class: 'gq-btn-primary', onClick: (close) => {
                    // 再次检查今日转换次数
                    const updatedConvertHistory = JSON.parse(localStorage.getItem('gq_convert_history') || '{}');
                    const updatedTodayConvertCount = updatedConvertHistory[today] || 0;

                    if (updatedTodayConvertCount >= 1) {
                        Utils.showToast('今日转换次数已用完，明天再来吧！', 'error');
                        return;
                    }

                    const amount = parseInt(document.getElementById('convert-amount').value) || 0;
                    if (amount <= 0 || amount > currentPoints) {
                        Utils.showToast('请输入有效的转换数量！', 'error');
                        return;
                    }

                    // 计算转换后的分数
                    const ratio = (Store.get('settings') || {}).conversionRatio || 1;
                    const gameScore = amount * ratio;

                    // 更新积分 - 使用最新的profile数据
                    const updatedProfile = Store.get('profile') || {};
                    updatedProfile.currentPoints = currentPoints - amount;
                    Store.set('profile', updatedProfile);

                    // 保存游戏开炮分数到本地存储
                    let gameData = JSON.parse(localStorage.getItem('gq_game_data') || '{}');
                    gameData.shotScore = (gameData.shotScore || 0) + gameScore;
                    localStorage.setItem('gq_game_data', JSON.stringify(gameData));

                    // 记录今日转换次数
                    updatedConvertHistory[today] = updatedTodayConvertCount + 1;
                    localStorage.setItem('gq_convert_history', JSON.stringify(updatedConvertHistory));

                    // 更新显示
                    document.getElementById('hero-points').textContent = updatedProfile.currentPoints;

                    Utils.showToast(`成功转换 ${amount} 积分，获得 ${gameScore} 开炮分数！`, 'success');
                    close();
                }}
            ]
        });
    });

    // ==================== 初始化渲染 ====================
    renderDailyTasks();
})();
