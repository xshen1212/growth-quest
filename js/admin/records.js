/**
 * 管理后台 - 数据记录
 */
(function () {
    if (!Utils.checkAdminAuth()) return;
    Utils.renderAdminSidebar('records');

    // 标签切换
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
            tab.classList.add('active');
            document.getElementById('tab-' + tab.dataset.tab).style.display = 'block';
        });
    });

    // ==================== 日历 ====================
    let calYear, calMonth;
    const now = new Date();
    calYear = now.getFullYear();
    calMonth = now.getMonth();

    function renderCalendar() {
        const grid = document.getElementById('calendar-grid');
        document.getElementById('cal-title').textContent = `${calYear}年${calMonth + 1}月`;
        const firstDay = new Date(calYear, calMonth, 1).getDay();
        const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
        const todayStr = Utils.getToday();
        const history = Store.get('task_history') || {};

        const headers = ['日', '一', '二', '三', '四', '五', '六'];
        let html = headers.map(h => `<div class="calendar-day-header">${h}</div>`).join('');
        for (let i = 0; i < firstDay; i++) html += '<div class="calendar-day other-month"></div>';

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;
            const dayData = history[dateStr];
            const hasData = dayData && (dayData.daily.length > 0 || dayData.random.length > 0);
            let classes = 'calendar-day';
            if (isToday) classes += ' today';
            if (hasData) classes += ' has-data';
            if (dayData?.allComplete) classes += ' all-complete';
            html += `<div class="${classes}" onclick="showDay('${dateStr}')">${d}</div>`;
        }
        grid.innerHTML = html;
    }

    document.getElementById('cal-prev').addEventListener('click', () => { calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } renderCalendar(); });
    document.getElementById('cal-next').addEventListener('click', () => { calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } renderCalendar(); });

    window.showDay = function (dateStr) {
        const history = Store.get('task_history') || {};
        const dayData = history[dateStr];
        const el = document.getElementById('cal-detail');
        if (!dayData || (dayData.daily.length === 0 && dayData.random.length === 0)) {
            el.innerHTML = `<div class="gq-card"><p style="text-align:center;color:var(--text-secondary)">${Utils.formatDate(dateStr)} 无记录</p></div>`;
            return;
        }
        const allDaily = Store.get('daily_tasks') || [];
        const allRandom = Store.get('random_tasks') || [];
        let html = `<div class="gq-card"><h3 style="margin-bottom:8px">📅 ${Utils.formatDate(dateStr)}</h3>`;
        if (dayData.daily.length) {
            html += '<h4 style="margin:8px 0 4px">日常任务</h4>';
            dayData.daily.forEach(d => {
                const t = allDaily.find(x => x.id === d.taskId);
                html += `<div style="padding:4px 0">✅ ${t?.name || d.taskId} <span style="color:var(--text-secondary)">${d.time}</span></div>`;
            });
        }
        if (dayData.random.length) {
            html += '<h4 style="margin:8px 0 4px">随机任务</h4>';
            dayData.random.forEach(d => {
                const t = allRandom.find(x => x.id === d.taskId);
                html += `<div style="padding:4px 0">🎲 ${t?.name || d.taskId} <span style="color:var(--text-secondary)">${d.time}</span></div>`;
            });
        }
        html += `<p style="margin-top:8px;font-weight:700;color:var(--color-accent-dark)">总积分：+${dayData.totalPoints} ${dayData.allComplete ? '🎉全勤' : ''}</p></div>`;
        el.innerHTML = html;
    };

    // ==================== 积分日志 ====================
    function renderPointsLog() {
        const log = Store.get('points_log') || [];
        document.getElementById('points-tbody').innerHTML = log.slice().reverse().slice(0, 100).map(entry => `<tr>
            <td style="font-size:0.85rem;white-space:nowrap">${Utils.formatDateTime(entry.date)}</td>
            <td style="font-weight:700;color:${entry.amount > 0 ? 'var(--color-secondary-dark)' : 'var(--color-red)'}">${entry.amount > 0 ? '+' : ''}${entry.amount}</td>
            <td>${entry.reason}</td>
            <td><span class="gq-badge ${entry.type === 'earn' ? 'gq-badge-green' : 'gq-badge-pink'}">${entry.type === 'earn' ? '获得' : '消费'}</span></td>
        </tr>`).join('');
        if (log.length === 0) {
            document.getElementById('points-tbody').innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-secondary)">暂无记录</td></tr>';
        }
    }

    // ==================== 成就日志 ====================
    function renderAchLog() {
        const log = Store.get('achievement_log') || [];
        const el = document.getElementById('ach-log-list');
        if (log.length === 0) {
            el.innerHTML = '<div class="gq-empty"><div class="gq-empty-icon">🏅</div><div>暂无成就解锁记录</div></div>';
            return;
        }
        el.innerHTML = log.slice().reverse().map(entry => `
            <div class="gq-card" style="margin-bottom:8px;display:flex;align-items:center;gap:12px">
                <span style="font-size:1.5rem">🏆</span>
                <div>
                    <div style="font-weight:700">${entry.name}</div>
                    <div style="font-size:0.85rem;color:var(--text-secondary)">${Utils.formatDateTime(entry.date)}</div>
                </div>
            </div>
        `).join('');
    }

    renderCalendar();
    renderPointsLog();
    renderAchLog();
})();
