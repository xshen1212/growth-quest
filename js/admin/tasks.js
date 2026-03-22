/**
 * 管理后台 - 任务配置
 */
(function () {
    if (!Utils.checkAdminAuth()) return;
    Utils.renderAdminSidebar('tasks');

    // 标签切换
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
            tab.classList.add('active');
            document.getElementById('tab-' + tab.dataset.tab).style.display = 'block';
        });
    });

    const trees = Store.get('trees') || [];
    function treeOptions(selected) {
        return `<option value="">无</option>` + trees.map(t =>
            `<option value="${t.id}" ${selected === t.id ? 'selected' : ''}>${t.icon} ${t.name}</option>`
        ).join('');
    }

    // ==================== 日常任务 ====================
    function renderDaily() {
        const tasks = Store.get('daily_tasks') || [];
        document.getElementById('daily-tbody').innerHTML = tasks.map(t => `<tr>
            <td>${t.name}</td>
            <td><span class="gq-badge gq-badge-blue">${t.category}</span></td>
            <td>${t.points}</td>
            <td>${trees.find(x => x.id === t.treeId)?.icon || '-'} ${trees.find(x => x.id === t.treeId)?.name || '无'}</td>
            <td>${t.required ? '✅' : ''}</td>
            <td class="admin-table-actions">
                <button class="gq-btn gq-btn-sm gq-btn-secondary" onclick="editDaily('${t.id}')">编辑</button>
                <button class="gq-btn gq-btn-sm gq-btn-danger" onclick="deleteDaily('${t.id}')">删除</button>
            </td>
        </tr>`).join('');
    }

    document.getElementById('add-daily-btn').addEventListener('click', () => showDailyForm());

    window.editDaily = function (id) {
        const tasks = Store.get('daily_tasks') || [];
        const task = tasks.find(t => t.id === id);
        if (task) showDailyForm(task);
    };

    window.deleteDaily = async function (id) {
        if (await Utils.showConfirm('删除确认', '确定要删除这个日常任务吗？')) {
            let tasks = Store.get('daily_tasks') || [];
            tasks = tasks.filter(t => t.id !== id);
            Store.set('daily_tasks', tasks);
            renderDaily();
            Utils.showToast('已删除', 'success');
        }
    };

    function showDailyForm(task = null) {
        const isEdit = !!task;
        Utils.showModal({
            title: isEdit ? '编辑日常任务' : '新增日常任务',
            content: `
                <div class="admin-form-group">
                    <label class="admin-form-label">任务名称</label>
                    <input class="gq-input" id="df-name" value="${task?.name || ''}">
                </div>
                <div class="admin-form-row">
                    <div class="admin-form-group">
                        <label class="admin-form-label">分类</label>
                        <input class="gq-input" id="df-category" value="${task?.category || '学习'}">
                    </div>
                    <div class="admin-form-group">
                        <label class="admin-form-label">积分</label>
                        <input type="number" class="gq-input" id="df-points" value="${task?.points || 10}">
                    </div>
                </div>
                <div class="admin-form-row">
                    <div class="admin-form-group">
                        <label class="admin-form-label">关联能力树</label>
                        <select class="gq-select" id="df-tree">${treeOptions(task?.treeId)}</select>
                    </div>
                    <div class="admin-form-group">
                        <label class="admin-form-label">成长值</label>
                        <input type="number" class="gq-input" id="df-growth" value="${task?.growthValue || 10}">
                    </div>
                </div>
                <div class="admin-form-group" style="display:flex;align-items:center;gap:8px">
                    <label class="toggle-switch">
                        <input type="checkbox" id="df-required" ${task?.required ? 'checked' : ''}>
                        <span class="toggle-switch-slider"></span>
                    </label>
                    <span class="admin-form-label" style="margin:0">是否必做</span>
                </div>
            `,
            buttons: [
                { text: '取消', class: 'gq-btn-secondary' },
                { text: '保存', class: 'gq-btn-primary', onClick: (close) => {
                    const name = document.getElementById('df-name').value.trim();
                    if (!name) { Utils.showToast('请输入名称', 'error'); return; }
                    const data = {
                        id: task?.id || Store.generateId('dt'),
                        name,
                        category: document.getElementById('df-category').value.trim() || '学习',
                        points: parseInt(document.getElementById('df-points').value) || 10,
                        treeId: document.getElementById('df-tree').value || null,
                        growthValue: parseInt(document.getElementById('df-growth').value) || 0,
                        required: document.getElementById('df-required').checked
                    };
                    let tasks = Store.get('daily_tasks') || [];
                    if (isEdit) {
                        const idx = tasks.findIndex(t => t.id === task.id);
                        if (idx >= 0) tasks[idx] = data;
                    } else {
                        tasks.push(data);
                    }
                    Store.set('daily_tasks', tasks);
                    close();
                    renderDaily();
                    Utils.showToast(isEdit ? '已更新' : '已添加', 'success');
                }}
            ]
        });
    }

    // ==================== 随机任务类别 ====================
    function renderCategories() {
        const cats = Store.get('random_categories') || [];
        const list = document.getElementById('random-categories-list');
        list.innerHTML = cats.map(c => `
            <div style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:white;border-radius:var(--radius-md);margin:0 4px 4px 0;box-shadow:var(--shadow-sm)">
                <span>${c.icon} ${c.name}</span>
                <button class="gq-btn gq-btn-sm gq-btn-secondary" onclick="editCategory('${c.id}')" style="padding:2px 6px">✏️</button>
                <button class="gq-btn gq-btn-sm gq-btn-danger" onclick="deleteCategory('${c.id}')" style="padding:2px 6px">✕</button>
            </div>
        `).join('');

        // 筛选器
        document.getElementById('random-filter').innerHTML = `<select class="gq-select" id="filter-cat" style="max-width:200px" onchange="renderRandom()">
            <option value="">全部类别</option>
            ${cats.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
        </select>`;
    }

    document.getElementById('add-category-btn').addEventListener('click', () => {
        Utils.showModal({
            title: '新增任务类别',
            content: `<div class="admin-form-row">
                <div class="admin-form-group"><label class="admin-form-label">类别名</label><input class="gq-input" id="cf-name"></div>
                <div class="admin-form-group"><label class="admin-form-label">图标(Emoji)</label><input class="gq-input" id="cf-icon" value="📋"></div>
            </div>`,
            buttons: [
                { text: '取消', class: 'gq-btn-secondary' },
                { text: '添加', class: 'gq-btn-primary', onClick: (close) => {
                    const name = document.getElementById('cf-name').value.trim();
                    if (!name) { Utils.showToast('请输入名称', 'error'); return; }
                    const cats = Store.get('random_categories') || [];
                    cats.push({ id: Store.generateId('rc'), name, icon: document.getElementById('cf-icon').value || '📋', probability: 0 });
                    Store.set('random_categories', cats);
                    close(); renderCategories(); renderProbability();
                    Utils.showToast('已添加', 'success');
                }}
            ]
        });
    });

    window.editCategory = function (id) {
        const cats = Store.get('random_categories') || [];
        const cat = cats.find(c => c.id === id);
        if (!cat) return;
        Utils.showModal({
            title: '编辑类别',
            content: `<div class="admin-form-row">
                <div class="admin-form-group"><label class="admin-form-label">类别名</label><input class="gq-input" id="cf-name" value="${cat.name}"></div>
                <div class="admin-form-group"><label class="admin-form-label">图标</label><input class="gq-input" id="cf-icon" value="${cat.icon}"></div>
            </div>`,
            buttons: [
                { text: '取消', class: 'gq-btn-secondary' },
                { text: '保存', class: 'gq-btn-primary', onClick: (close) => {
                    cat.name = document.getElementById('cf-name').value.trim() || cat.name;
                    cat.icon = document.getElementById('cf-icon').value || cat.icon;
                    Store.set('random_categories', cats);
                    close(); renderCategories(); renderRandom(); renderProbability();
                    Utils.showToast('已更新', 'success');
                }}
            ]
        });
    };

    window.deleteCategory = async function (id) {
        if (!await Utils.showConfirm('删除确认', '删除类别将同时删除该类别下所有随机任务，确定？')) return;
        let cats = Store.get('random_categories') || [];
        cats = cats.filter(c => c.id !== id);
        Store.set('random_categories', cats);
        let tasks = Store.get('random_tasks') || [];
        tasks = tasks.filter(t => t.categoryId !== id);
        Store.set('random_tasks', tasks);
        renderCategories(); renderRandom(); renderProbability();
        Utils.showToast('已删除', 'success');
    };

    // ==================== 随机任务 ====================
    window.renderRandom = function () {
        const tasks = Store.get('random_tasks') || [];
        const cats = Store.get('random_categories') || [];
        const filterCat = document.getElementById('filter-cat')?.value || '';
        const filtered = filterCat ? tasks.filter(t => t.categoryId === filterCat) : tasks;

        document.getElementById('random-tbody').innerHTML = filtered.map(t => {
            const cat = cats.find(c => c.id === t.categoryId);
            return `<tr>
                <td>${cat ? cat.icon + ' ' + cat.name : '未知'}</td>
                <td>${t.name}</td>
                <td>${Utils.renderStars(t.difficulty)}</td>
                <td>${t.points}</td>
                <td>${trees.find(x => x.id === t.treeId)?.icon || '-'}</td>
                <td class="admin-table-actions">
                    <button class="gq-btn gq-btn-sm gq-btn-secondary" onclick="editRandom('${t.id}')">编辑</button>
                    <button class="gq-btn gq-btn-sm gq-btn-danger" onclick="deleteRandom('${t.id}')">删除</button>
                </td>
            </tr>`;
        }).join('');
    };

    document.getElementById('add-random-btn').addEventListener('click', () => showRandomForm());

    window.editRandom = function (id) {
        const tasks = Store.get('random_tasks') || [];
        const task = tasks.find(t => t.id === id);
        if (task) showRandomForm(task);
    };

    window.deleteRandom = async function (id) {
        if (await Utils.showConfirm('删除确认', '确定删除？')) {
            let tasks = Store.get('random_tasks') || [];
            tasks = tasks.filter(t => t.id !== id);
            Store.set('random_tasks', tasks);
            renderRandom();
            Utils.showToast('已删除', 'success');
        }
    };

    function showRandomForm(task = null) {
        const isEdit = !!task;
        const cats = Store.get('random_categories') || [];
        Utils.showModal({
            title: isEdit ? '编辑随机任务' : '新增随机任务',
            content: `
                <div class="admin-form-group">
                    <label class="admin-form-label">任务名称</label>
                    <input class="gq-input" id="rf-name" value="${task?.name || ''}">
                </div>
                <div class="admin-form-row">
                    <div class="admin-form-group">
                        <label class="admin-form-label">所属类别</label>
                        <select class="gq-select" id="rf-cat">${cats.map(c =>
                            `<option value="${c.id}" ${task?.categoryId === c.id ? 'selected' : ''}>${c.icon} ${c.name}</option>`
                        ).join('')}</select>
                    </div>
                    <div class="admin-form-group">
                        <label class="admin-form-label">难度(1-3)</label>
                        <input type="number" class="gq-input" id="rf-diff" min="1" max="3" value="${task?.difficulty || 1}">
                    </div>
                </div>
                <div class="admin-form-row">
                    <div class="admin-form-group">
                        <label class="admin-form-label">积分</label>
                        <input type="number" class="gq-input" id="rf-points" value="${task?.points || 10}">
                    </div>
                    <div class="admin-form-group">
                        <label class="admin-form-label">关联能力树</label>
                        <select class="gq-select" id="rf-tree">${treeOptions(task?.treeId)}</select>
                    </div>
                </div>
                <div class="admin-form-group">
                    <label class="admin-form-label">成长值</label>
                    <input type="number" class="gq-input" id="rf-growth" value="${task?.growthValue || 10}">
                </div>
            `,
            buttons: [
                { text: '取消', class: 'gq-btn-secondary' },
                { text: '保存', class: 'gq-btn-primary', onClick: (close) => {
                    const name = document.getElementById('rf-name').value.trim();
                    if (!name) { Utils.showToast('请输入名称', 'error'); return; }
                    const data = {
                        id: task?.id || Store.generateId('rt'),
                        categoryId: document.getElementById('rf-cat').value,
                        name,
                        difficulty: Math.min(3, Math.max(1, parseInt(document.getElementById('rf-diff').value) || 1)),
                        points: parseInt(document.getElementById('rf-points').value) || 10,
                        treeId: document.getElementById('rf-tree').value || null,
                        growthValue: parseInt(document.getElementById('rf-growth').value) || 0
                    };
                    let tasks = Store.get('random_tasks') || [];
                    if (isEdit) {
                        const idx = tasks.findIndex(t => t.id === task.id);
                        if (idx >= 0) tasks[idx] = data;
                    } else {
                        tasks.push(data);
                    }
                    Store.set('random_tasks', tasks);
                    close(); renderRandom();
                    Utils.showToast(isEdit ? '已更新' : '已添加', 'success');
                }}
            ]
        });
    }

    // ==================== 概率调节 ====================
    function renderProbability() {
        const cats = Store.get('random_categories') || [];
        const container = document.getElementById('probability-sliders');
        container.innerHTML = cats.map(c => `
            <div class="probability-slider-group">
                <span class="probability-slider-label">${c.icon} ${c.name}</span>
                <input type="range" class="probability-slider" min="0" max="100" value="${c.probability}" data-cat-id="${c.id}" oninput="updateProbability()">
                <span class="probability-value">${c.probability}%</span>
            </div>
        `).join('');
        updateProbabilityTotal();
    }

    window.updateProbability = function () {
        const sliders = document.querySelectorAll('.probability-slider');
        sliders.forEach(s => {
            s.nextElementSibling.textContent = s.value + '%';
        });
        updateProbabilityTotal();
    };

    function updateProbabilityTotal() {
        const sliders = document.querySelectorAll('.probability-slider');
        let total = 0;
        sliders.forEach(s => total += parseInt(s.value));
        const el = document.getElementById('probability-total');
        el.textContent = `总计：${total}%`;
        el.className = 'probability-total ' + (total === 100 ? 'valid' : 'invalid');
    }

    document.getElementById('save-prob-btn').addEventListener('click', () => {
        const sliders = document.querySelectorAll('.probability-slider');
        let total = 0;
        sliders.forEach(s => total += parseInt(s.value));
        if (total !== 100) {
            Utils.showToast('概率总和必须为100%！', 'error');
            return;
        }
        const cats = Store.get('random_categories') || [];
        sliders.forEach(s => {
            const cat = cats.find(c => c.id === s.dataset.catId);
            if (cat) cat.probability = parseInt(s.value);
        });
        Store.set('random_categories', cats);
        Utils.showToast('概率设置已保存 ✅', 'success');
    });

    // 初始渲染
    renderDaily();
    renderCategories();
    renderRandom();
    renderProbability();
})();
