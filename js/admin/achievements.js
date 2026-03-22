/**
 * 管理后台 - 成就配置
 */
(function () {
    if (!Utils.checkAdminAuth()) return;
    Utils.renderAdminSidebar('achievements');

    const conditionTypes = {
        daily_complete_count: '日常完成数',
        random_complete_count: '随机完成数',
        streak_days: '连续天数',
        total_points: '累计积分',
        tree_node_unlock: '解锁节点数',
        tree_count_with_unlocks: '有解锁的树数',
        all_trees_have_unlock: '所有树有解锁',
        exchange_count: '兑换次数',
        perfect_day: '完美一天',
        manual: '手动解锁'
    };

    function render() {
        const achievements = Store.get('achievements') || [];
        document.getElementById('ach-tbody').innerHTML = achievements.map(a => `<tr>
            <td style="font-size:1.5rem">${a.icon}</td>
            <td><strong>${a.name}</strong><br><span style="font-size:0.8rem;color:var(--text-secondary)">${a.description}</span></td>
            <td><span class="gq-badge gq-badge-blue">${conditionTypes[a.condition.type] || a.condition.type}</span> ${a.condition.type !== 'manual' ? '≥' + a.condition.value : ''}</td>
            <td>+${a.rewardPoints}</td>
            <td>${a.hidden ? '🙈 是' : '否'}</td>
            <td>${a.unlocked ? '<span class="gq-badge gq-badge-green">✅ 已解锁</span>' : '<span class="gq-badge gq-badge-yellow">待解锁</span>'}</td>
            <td class="admin-table-actions">
                ${!a.unlocked ? `<button class="gq-btn gq-btn-sm gq-btn-accent" onclick="manualUnlock('${a.id}')">🔓 解锁</button>` : ''}
                <button class="gq-btn gq-btn-sm gq-btn-secondary" onclick="editAch('${a.id}')">编辑</button>
                <button class="gq-btn gq-btn-sm gq-btn-danger" onclick="deleteAch('${a.id}')">删除</button>
            </td>
        </tr>`).join('');
    }

    window.manualUnlock = async function (id) {
        if (!await Utils.showConfirm('手动解锁', '确定手动解锁这个成就？孩子打开前台时会看到惊喜动画！')) return;
        const achievements = Store.get('achievements') || [];
        const ach = achievements.find(a => a.id === id);
        if (ach) {
            ach.unlocked = true;
            ach.unlockDate = new Date().toISOString();
            Store.set('achievements', achievements);
            Store.addPoints(ach.rewardPoints, `手动解锁成就：${ach.hidden ? ach.description : ach.name}`);
            const achLog = Store.get('achievement_log') || [];
            achLog.push({ achievementId: ach.id, name: ach.hidden ? ach.description : ach.name, date: new Date().toISOString() });
            Store.set('achievement_log', achLog);
        }
        render();
        Utils.showToast('已解锁！孩子下次打开首页会看到惊喜 🎉', 'success');
    };

    document.getElementById('add-ach-btn').addEventListener('click', () => showAchForm());

    window.editAch = function (id) {
        const achievements = Store.get('achievements') || [];
        const ach = achievements.find(a => a.id === id);
        if (ach) showAchForm(ach);
    };

    window.deleteAch = async function (id) {
        if (!await Utils.showConfirm('删除确认', '确定删除？')) return;
        let achievements = Store.get('achievements') || [];
        achievements = achievements.filter(a => a.id !== id);
        Store.set('achievements', achievements);
        render();
        Utils.showToast('已删除', 'success');
    };

    function showAchForm(ach = null) {
        const isEdit = !!ach;
        Utils.showModal({
            title: isEdit ? '编辑成就' : '新增成就',
            content: `
                <div class="admin-form-row">
                    <div class="admin-form-group"><label class="admin-form-label">名称</label><input class="gq-input" id="af-name" value="${ach?.name || ''}"></div>
                    <div class="admin-form-group"><label class="admin-form-label">图标(Emoji)</label><input class="gq-input" id="af-icon" value="${ach?.icon || '🏅'}"></div>
                </div>
                <div class="admin-form-group"><label class="admin-form-label">描述/解锁提示</label><input class="gq-input" id="af-desc" value="${ach?.description || ''}"></div>
                <div class="admin-form-row">
                    <div class="admin-form-group">
                        <label class="admin-form-label">条件类型</label>
                        <select class="gq-select" id="af-cond-type">${Object.entries(conditionTypes).map(([k, v]) =>
                            `<option value="${k}" ${ach?.condition.type === k ? 'selected' : ''}>${v}</option>`
                        ).join('')}</select>
                    </div>
                    <div class="admin-form-group"><label class="admin-form-label">条件值</label><input type="number" class="gq-input" id="af-cond-val" value="${ach?.condition.value || 1}"></div>
                </div>
                <div class="admin-form-row">
                    <div class="admin-form-group"><label class="admin-form-label">积分奖励</label><input type="number" class="gq-input" id="af-reward" value="${ach?.rewardPoints || 100}"></div>
                    <div class="admin-form-group" style="display:flex;align-items:center;gap:8px;padding-top:28px">
                        <label class="toggle-switch"><input type="checkbox" id="af-hidden" ${ach?.hidden ? 'checked' : ''}><span class="toggle-switch-slider"></span></label>
                        <span>隐藏成就</span>
                    </div>
                </div>
            `,
            buttons: [
                { text: '取消', class: 'gq-btn-secondary' },
                { text: '保存', class: 'gq-btn-primary', onClick: (close) => {
                    const name = document.getElementById('af-name').value.trim();
                    if (!name) { Utils.showToast('请输入名称', 'error'); return; }
                    const data = {
                        id: ach?.id || Store.generateId('ach'),
                        name,
                        description: document.getElementById('af-desc').value.trim(),
                        icon: document.getElementById('af-icon').value || '🏅',
                        condition: {
                            type: document.getElementById('af-cond-type').value,
                            value: parseInt(document.getElementById('af-cond-val').value) || 0
                        },
                        rewardPoints: parseInt(document.getElementById('af-reward').value) || 100,
                        hidden: document.getElementById('af-hidden').checked,
                        unlocked: ach?.unlocked || false,
                        unlockDate: ach?.unlockDate || null
                    };
                    let achievements = Store.get('achievements') || [];
                    if (isEdit) {
                        const idx = achievements.findIndex(a => a.id === ach.id);
                        if (idx >= 0) achievements[idx] = data;
                    } else {
                        achievements.push(data);
                    }
                    Store.set('achievements', achievements);
                    close(); render();
                    Utils.showToast(isEdit ? '已更新' : '已添加', 'success');
                }}
            ]
        });
    }

    render();
})();
