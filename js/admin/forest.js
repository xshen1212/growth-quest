/**
 * 管理后台 - 能力森林配置
 */
(function () {
    if (!Utils.checkAdminAuth()) return;
    Utils.renderAdminSidebar('forest');

    function render() {
        const trees = Store.get('trees') || [];
        const list = document.getElementById('trees-list');

        list.innerHTML = trees.map(tree => {
            let totalNodes = 0, unlockedNodes = 0;
            tree.stages.forEach(s => s.nodes.forEach(n => { totalNodes++; if (n.unlocked) unlockedNodes++; }));

            return `<div class="gq-card" style="margin-bottom:12px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                    <div class="gq-card-title" style="margin:0">${tree.icon} ${tree.name} <span class="gq-badge gq-badge-green">${unlockedNodes}/${totalNodes} 节点</span></div>
                    <div class="admin-table-actions">
                        <button class="gq-btn gq-btn-sm gq-btn-secondary" onclick="editTree('${tree.id}')">编辑</button>
                        <button class="gq-btn gq-btn-sm gq-btn-danger" onclick="deleteTree('${tree.id}')">删除</button>
                    </div>
                </div>
                ${tree.stages.map((stage, si) => `
                    <div style="margin-bottom:8px;padding:8px;background:#FAFAFA;border-radius:var(--radius-sm)">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                            <strong>${stage.name}</strong>
                            <div class="admin-table-actions">
                                <button class="gq-btn gq-btn-sm gq-btn-secondary" onclick="addNode('${tree.id}',${si})">+ 节点</button>
                            </div>
                        </div>
                        ${stage.nodes.map((node, ni) => `
                            <div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid #F0F0F0">
                                <span style="width:20px;height:20px;border-radius:50%;background:${node.unlocked ? 'var(--color-secondary)' : '#E0E0E0'};display:flex;align-items:center;justify-content:center;font-size:0.7rem;color:white;flex-shrink:0">${node.unlocked ? '✓' : ''}</span>
                                <span style="flex:1">${node.name}</span>
                                <span style="font-size:0.8rem;color:var(--text-secondary)">${node.currentGrowth}/${node.requiredGrowth}</span>
                                <button class="gq-btn gq-btn-sm gq-btn-secondary" onclick="editNode('${tree.id}',${si},${ni})" style="padding:2px 6px">✏️</button>
                                <button class="gq-btn gq-btn-sm gq-btn-danger" onclick="deleteNode('${tree.id}',${si},${ni})" style="padding:2px 6px">✕</button>
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
                <button class="gq-btn gq-btn-sm gq-btn-secondary" onclick="addStage('${tree.id}')" style="margin-top:4px">+ 添加阶段</button>
            </div>`;
        }).join('');

        if (trees.length === 0) {
            list.innerHTML = '<div class="gq-empty"><div class="gq-empty-icon">🌱</div><div>还没有能力树</div></div>';
        }
    }

    document.getElementById('add-tree-btn').addEventListener('click', () => {
        Utils.showModal({
            title: '新增能力树',
            content: `<div class="admin-form-row">
                <div class="admin-form-group"><label class="admin-form-label">树名(科目/爱好)</label><input class="gq-input" id="tf-name"></div>
                <div class="admin-form-group"><label class="admin-form-label">图标(Emoji)</label><input class="gq-input" id="tf-icon" value="🌳"></div>
            </div>`,
            buttons: [
                { text: '取消', class: 'gq-btn-secondary' },
                { text: '添加', class: 'gq-btn-primary', onClick: (close) => {
                    const name = document.getElementById('tf-name').value.trim();
                    if (!name) { Utils.showToast('请输入名称', 'error'); return; }
                    const trees = Store.get('trees') || [];
                    trees.push({
                        id: Store.generateId('tree'),
                        name,
                        icon: document.getElementById('tf-icon').value || '🌳',
                        stages: [{ name: '种子', nodes: [] }]
                    });
                    Store.set('trees', trees);
                    close(); render();
                    Utils.showToast('已添加', 'success');
                }}
            ]
        });
    });

    window.editTree = function (id) {
        const trees = Store.get('trees') || [];
        const tree = trees.find(t => t.id === id);
        if (!tree) return;
        Utils.showModal({
            title: '编辑能力树',
            content: `<div class="admin-form-row">
                <div class="admin-form-group"><label class="admin-form-label">树名</label><input class="gq-input" id="tf-name" value="${tree.name}"></div>
                <div class="admin-form-group"><label class="admin-form-label">图标</label><input class="gq-input" id="tf-icon" value="${tree.icon}"></div>
            </div>`,
            buttons: [
                { text: '取消', class: 'gq-btn-secondary' },
                { text: '保存', class: 'gq-btn-primary', onClick: (close) => {
                    tree.name = document.getElementById('tf-name').value.trim() || tree.name;
                    tree.icon = document.getElementById('tf-icon').value || tree.icon;
                    Store.set('trees', trees);
                    close(); render();
                    Utils.showToast('已更新', 'success');
                }}
            ]
        });
    };

    window.deleteTree = async function (id) {
        if (!await Utils.showConfirm('删除确认', '确定删除这棵能力树？所有节点进度将丢失！')) return;
        let trees = Store.get('trees') || [];
        trees = trees.filter(t => t.id !== id);
        Store.set('trees', trees);
        render();
        Utils.showToast('已删除', 'success');
    };

    window.addStage = function (treeId) {
        Utils.showModal({
            title: '添加阶段',
            content: `<div class="admin-form-group"><label class="admin-form-label">阶段名称</label><input class="gq-input" id="sf-name" placeholder="如：幼苗、小树、大树"></div>`,
            buttons: [
                { text: '取消', class: 'gq-btn-secondary' },
                { text: '添加', class: 'gq-btn-primary', onClick: (close) => {
                    const name = document.getElementById('sf-name').value.trim();
                    if (!name) { Utils.showToast('请输入名称', 'error'); return; }
                    const trees = Store.get('trees') || [];
                    const tree = trees.find(t => t.id === treeId);
                    if (tree) { tree.stages.push({ name, nodes: [] }); Store.set('trees', trees); }
                    close(); render();
                    Utils.showToast('已添加', 'success');
                }}
            ]
        });
    };

    window.addNode = function (treeId, stageIdx) {
        Utils.showModal({
            title: '添加节点',
            content: `
                <div class="admin-form-group"><label class="admin-form-label">节点名称</label><input class="gq-input" id="nf-name"></div>
                <div class="admin-form-group"><label class="admin-form-label">所需成长值</label><input type="number" class="gq-input" id="nf-growth" value="100"></div>
            `,
            buttons: [
                { text: '取消', class: 'gq-btn-secondary' },
                { text: '添加', class: 'gq-btn-primary', onClick: (close) => {
                    const name = document.getElementById('nf-name').value.trim();
                    if (!name) { Utils.showToast('请输入名称', 'error'); return; }
                    const trees = Store.get('trees') || [];
                    const tree = trees.find(t => t.id === treeId);
                    if (tree && tree.stages[stageIdx]) {
                        tree.stages[stageIdx].nodes.push({
                            id: Store.generateId('n'),
                            name,
                            requiredGrowth: parseInt(document.getElementById('nf-growth').value) || 100,
                            currentGrowth: 0,
                            unlocked: false,
                            unlockDate: null
                        });
                        Store.set('trees', trees);
                    }
                    close(); render();
                    Utils.showToast('已添加', 'success');
                }}
            ]
        });
    };

    window.editNode = function (treeId, si, ni) {
        const trees = Store.get('trees') || [];
        const tree = trees.find(t => t.id === treeId);
        if (!tree) return;
        const node = tree.stages[si]?.nodes[ni];
        if (!node) return;
        Utils.showModal({
            title: '编辑节点',
            content: `
                <div class="admin-form-group"><label class="admin-form-label">名称</label><input class="gq-input" id="nf-name" value="${node.name}"></div>
                <div class="admin-form-group"><label class="admin-form-label">所需成长值</label><input type="number" class="gq-input" id="nf-growth" value="${node.requiredGrowth}"></div>
            `,
            buttons: [
                { text: '取消', class: 'gq-btn-secondary' },
                { text: '保存', class: 'gq-btn-primary', onClick: (close) => {
                    node.name = document.getElementById('nf-name').value.trim() || node.name;
                    node.requiredGrowth = parseInt(document.getElementById('nf-growth').value) || node.requiredGrowth;
                    Store.set('trees', trees);
                    close(); render();
                    Utils.showToast('已更新', 'success');
                }}
            ]
        });
    };

    window.deleteNode = async function (treeId, si, ni) {
        if (!await Utils.showConfirm('删除确认', '确定删除该节点？')) return;
        const trees = Store.get('trees') || [];
        const tree = trees.find(t => t.id === treeId);
        if (tree && tree.stages[si]) {
            tree.stages[si].nodes.splice(ni, 1);
            Store.set('trees', trees);
        }
        render();
        Utils.showToast('已删除', 'success');
    };

    render();
})();
