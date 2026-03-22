/**
 * 管理后台 - 仪表盘
 */
(function () {
    if (!Utils.checkAdminAuth()) return;
    Utils.renderAdminSidebar('dashboard');

    const profile = Store.get('profile') || {};
    const achievements = Store.get('achievements') || [];
    const history = Store.get('task_history') || {};
    const dailyTasks = Store.get('daily_tasks') || [];
    const today = Store.today();
    const todayData = history[today] || { daily: [], random: [] };

    // 今日完成率
    const dailyDone = todayData.daily.length;
    const dailyTotal = dailyTasks.length;
    const rate = dailyTotal > 0 ? Math.round(dailyDone / dailyTotal * 100) : 0;

    // 统计
    const unlockedAch = achievements.filter(a => a.unlocked).length;
    const streakDays = Store.getStreakDays();

    const grid = document.getElementById('dashboard-grid');
    grid.innerHTML = `
        <div class="dashboard-stat">
            <div class="dashboard-stat-icon">📋</div>
            <div class="dashboard-stat-value">${rate}%</div>
            <div class="dashboard-stat-label">今日任务完成率</div>
        </div>
        <div class="dashboard-stat">
            <div class="dashboard-stat-icon">💎</div>
            <div class="dashboard-stat-value">${profile.totalPoints || 0}</div>
            <div class="dashboard-stat-label">累计总积分</div>
        </div>
        <div class="dashboard-stat">
            <div class="dashboard-stat-icon">💰</div>
            <div class="dashboard-stat-value">${profile.currentPoints || 0}</div>
            <div class="dashboard-stat-label">当前可用积分</div>
        </div>
        <div class="dashboard-stat">
            <div class="dashboard-stat-icon">🏅</div>
            <div class="dashboard-stat-value">${unlockedAch}/${achievements.length}</div>
            <div class="dashboard-stat-label">已解锁成就</div>
        </div>
        <div class="dashboard-stat">
            <div class="dashboard-stat-icon">🔥</div>
            <div class="dashboard-stat-value">${streakDays}</div>
            <div class="dashboard-stat-label">连续天数</div>
        </div>
        <div class="dashboard-stat">
            <div class="dashboard-stat-icon">⭐</div>
            <div class="dashboard-stat-value">Lv.${profile.level || 1}</div>
            <div class="dashboard-stat-label">当前等级</div>
        </div>
    `;

    // 近7天活动柱状图
    const chart = document.getElementById('weekly-chart');
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayData = history[dateStr] || { daily: [], random: [] };
        days.push({
            label: `${d.getMonth() + 1}/${d.getDate()}`,
            count: dayData.daily.length + dayData.random.length
        });
    }
    const maxCount = Math.max(...days.map(d => d.count), 1);

    chart.innerHTML = days.map(d => {
        const height = Math.max(4, (d.count / maxCount) * 100);
        return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
            <span style="font-size:0.75rem;font-weight:700">${d.count}</span>
            <div style="width:100%;height:${height}px;background:linear-gradient(180deg,var(--color-primary),var(--color-secondary));border-radius:4px;transition:height 0.5s"></div>
            <span style="font-size:0.7rem;color:var(--text-secondary)">${d.label}</span>
        </div>`;
    }).join('');
})();
