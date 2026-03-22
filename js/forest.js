/**
 * 成长冒险岛 - 能力森林页逻辑
 */
(function () {
    const trees = Store.get('trees') || [];

    function renderForest() {
        const grid = document.getElementById('forest-grid');
        grid.innerHTML = '';

        const stageEmojis = { '种子': '🌰', '幼苗': '🌱', '小树': '🌿', '大树': '🌳' };

        trees.forEach(tree => {
            let currentStageIdx = 0;
            let totalNodes = 0, unlockedNodes = 0;
            tree.stages.forEach((stage, i) => {
                const allUnlocked = stage.nodes.every(n => n.unlocked);
                stage.nodes.forEach(n => { totalNodes++; if (n.unlocked) unlockedNodes++; });
                if (allUnlocked && i < tree.stages.length - 1) currentStageIdx = i + 1;
            });

            const currentStage = tree.stages[currentStageIdx];
            const stageEmoji = stageEmojis[currentStage.name] || '🌱';

            const el = document.createElement('div');
            el.className = 'tree-card';
            el.innerHTML = `
                <div class="tree-icon" style="font-size:2.8rem">${tree.icon}</div>
                <div class="tree-name">${tree.name}</div>
                <div class="tree-stage">${stageEmoji} ${currentStage.name} · ${unlockedNodes}/${totalNodes}</div>
                ${Utils.createProgressBar(unlockedNodes, totalNodes, 'var(--color-secondary)')}
            `;
            el.addEventListener('click', () => showTreeDetail(tree));
            grid.appendChild(el);
        });

        if (trees.length === 0) {
            grid.innerHTML = '<div class="gq-empty"><div class="gq-empty-icon">🌱</div><div>还没有能力树哦，去管理后台添加吧！</div></div>';
        }
    }

    function showTreeDetail(tree) {
        const detail = document.getElementById('tree-detail');
        const stageEmojis = { '种子': '🌰', '幼苗': '🌱', '小树': '🌿', '大树': '🌳' };

        let html = `<div class="gq-card">
            <div class="gq-card-title" style="font-size:1.2rem">${tree.icon} ${tree.name}</div>
            <div class="tree-detail-stages">`;

        tree.stages.forEach(stage => {
            const emoji = stageEmojis[stage.name] || '🌿';
            html += `<div class="stage-group">
                <div class="stage-title">${emoji} ${stage.name}</div>`;

            stage.nodes.forEach(node => {
                const pct = node.requiredGrowth > 0 ? Math.min(100, Math.round(node.currentGrowth / node.requiredGrowth * 100)) : 0;
                html += `<div class="node-item ${node.unlocked ? 'unlocked' : ''}" onclick="${node.unlocked ? `showNodeInfo('${node.id}','${node.name}','${node.unlockDate}')` : ''}">
                    <div class="node-dot ${node.unlocked ? 'unlocked' : ''}">${node.unlocked ? '✓' : ''}</div>
                    <div style="flex:1">
                        <div class="node-name">${node.name}</div>
                        <div style="font-size:0.8rem;color:var(--text-secondary)">
                            ${node.unlocked ?
                                `✅ ${Utils.formatDate(node.unlockDate)} 解锁` :
                                `${node.currentGrowth}/${node.requiredGrowth} (${pct}%)`
                            }
                        </div>
                        ${!node.unlocked ? Utils.createProgressBar(node.currentGrowth, node.requiredGrowth, 'var(--color-secondary)') : ''}
                    </div>
                </div>`;
            });

            html += '</div>';
        });

        html += '</div></div>';
        detail.innerHTML = html;
        detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    window.showNodeInfo = function (nodeId, nodeName, unlockDate) {
        Utils.showModal({
            title: '🌟 节点解锁记录',
            content: `<div style="text-align:center">
                <div style="font-size:2rem;margin:8px 0">🏆</div>
                <div style="font-weight:700;font-size:1.1rem">${nodeName}</div>
                <div style="color:var(--text-secondary);margin-top:6px">解锁时间：${Utils.formatDateTime(unlockDate)}</div>
            </div>`,
            buttons: [{ text: '真棒！', class: 'gq-btn-accent' }]
        });
    };

    renderForest();
    Utils.renderNav('forest');
})();
