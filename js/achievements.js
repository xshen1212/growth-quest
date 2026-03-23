/**
 * 成长冒险岛 - 成就页逻辑
 */
(function () {
    // 初始化数据
    Store.init();
    
    const achievements = Store.get('achievements') || [];
    const unlocked = achievements.filter(a => a.unlocked);
    const visible = achievements.filter(a => !a.hidden || a.unlocked);

    document.getElementById('unlocked-count').textContent = unlocked.length;
    document.getElementById('total-count').textContent = visible.length;

    const grid = document.getElementById('achievement-grid');

    // 先显示已解锁，再显示未解锁
    const sorted = [...achievements].sort((a, b) => {
        if (a.unlocked && !b.unlocked) return -1;
        if (!a.unlocked && b.unlocked) return 1;
        return 0;
    });

    sorted.forEach(ach => {
        // 隐藏成就且未解锁：显示神秘样式
        if (ach.hidden && !ach.unlocked) {
            const el = document.createElement('div');
            el.className = 'achievement-badge hidden-locked';
            el.innerHTML = `
                <span class="achievement-icon">🔒</span>
                <span class="achievement-name">???</span>
            `;
            el.addEventListener('click', () => {
                Utils.showModal({
                    title: '🔒 隐藏成就',
                    content: '<p style="text-align:center;color:var(--text-secondary)">这是一个隐藏成就哦！<br>继续努力就能发现它！🌟</p>',
                    buttons: [{ text: '好的', class: 'gq-btn-primary' }]
                });
            });
            grid.appendChild(el);
            return;
        }

        const el = document.createElement('div');
        el.className = `achievement-badge ${ach.unlocked ? 'unlocked' : 'locked'}`;
        el.innerHTML = `
            <span class="achievement-icon">${ach.unlocked ? ach.icon : '❓'}</span>
            <span class="achievement-name">${ach.unlocked ? ach.name : ach.name}</span>
        `;
        el.addEventListener('click', () => showAchDetail(ach));
        grid.appendChild(el);
    });

    function showAchDetail(ach) {
        Utils.showModal({
            title: ach.unlocked ? '🏆 成就详情' : '🔒 未解锁',
            content: `<div style="text-align:center">
                <div style="font-size:3rem;margin:12px 0">${ach.unlocked ? ach.icon : '❓'}</div>
                <div style="font-size:1.1rem;font-weight:700">${ach.name}</div>
                <div style="color:var(--text-secondary);margin:6px 0">${ach.description}</div>
                ${ach.unlocked ?
                    `<div style="margin-top:8px"><span class="gq-badge gq-badge-green">✅ 已解锁</span></div>
                     <div style="color:var(--text-secondary);font-size:0.85rem;margin-top:4px">${Utils.formatDateTime(ach.unlockDate)}</div>
                     <div style="color:var(--color-accent-dark);font-weight:700;margin-top:6px">奖励：+${ach.rewardPoints} 积分</div>` :
                    `<div style="margin-top:8px"><span class="gq-badge gq-badge-yellow">待解锁</span></div>
                     <div style="color:var(--text-secondary);font-size:0.85rem;margin-top:4px">奖励：+${ach.rewardPoints} 积分</div>`
                }
            </div>`,
            buttons: [{ text: '好的', class: ach.unlocked ? 'gq-btn-accent' : 'gq-btn-primary' }]
        });
    }

    if (achievements.length === 0) {
        grid.innerHTML = '<div class="gq-empty"><div class="gq-empty-icon">🏅</div><div>还没有成就哦</div></div>';
    }

    Utils.renderNav('achievements');
})();
