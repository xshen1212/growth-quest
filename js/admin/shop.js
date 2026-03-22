/**
 * 管理后台 - 商城配置
 */
(function () {
    if (!Utils.checkAdminAuth()) return;
    Utils.renderAdminSidebar('shop');

    // 标签切换
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
            tab.classList.add('active');
            document.getElementById('tab-' + tab.dataset.tab).style.display = 'block';
        });
    });

    const typeLabels = { privilege: '🌟 特权', material: '📦 实物', boost: '🚀 加速包' };

    function renderItems() {
        const items = Store.get('shop_items') || [];
        document.getElementById('items-tbody').innerHTML = items.map(item => `<tr>
            <td style="font-size:1.5rem">${item.icon}</td>
            <td>${item.name}</td>
            <td>${item.cost}</td>
            <td>${typeLabels[item.type] || item.type}</td>
            <td class="admin-table-actions">
                <button class="gq-btn gq-btn-sm gq-btn-secondary" onclick="editItem('${item.id}')">编辑</button>
                <button class="gq-btn gq-btn-sm gq-btn-danger" onclick="deleteItem('${item.id}')">删除</button>
            </td>
        </tr>`).join('');
    }

    function renderExchangeLog() {
        const log = Store.get('exchange_log') || [];
        document.getElementById('exchange-tbody').innerHTML = log.slice().reverse().map((entry, i) => `<tr>
            <td>${entry.name}</td>
            <td style="color:var(--color-red);font-weight:700">-${entry.cost}</td>
            <td style="font-size:0.85rem">${Utils.formatDateTime(entry.date)}</td>
            <td><span class="gq-badge ${entry.fulfilled ? 'gq-badge-green' : 'gq-badge-yellow'}">${entry.fulfilled ? '✅ 已兑现' : '⏳ 待兑现'}</span></td>
            <td>${!entry.fulfilled ? `<button class="gq-btn gq-btn-sm gq-btn-success" onclick="fulfillExchange(${log.length - 1 - i})">标记兑现</button>` : ''}</td>
        </tr>`).join('');

        if (log.length === 0) {
            document.getElementById('exchange-tbody').innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-secondary)">暂无兑换记录</td></tr>';
        }
    }

    document.getElementById('add-item-btn').addEventListener('click', () => showItemForm());

    window.editItem = function (id) {
        const items = Store.get('shop_items') || [];
        const item = items.find(i => i.id === id);
        if (item) showItemForm(item);
    };

    window.deleteItem = async function (id) {
        if (!await Utils.showConfirm('删除确认', '确定删除？')) return;
        let items = Store.get('shop_items') || [];
        items = items.filter(i => i.id !== id);
        Store.set('shop_items', items);
        renderItems();
        Utils.showToast('已删除', 'success');
    };

    window.fulfillExchange = function (idx) {
        const log = Store.get('exchange_log') || [];
        if (log[idx]) {
            log[idx].fulfilled = true;
            Store.set('exchange_log', log);
            renderExchangeLog();
            Utils.showToast('已标记兑现 ✅', 'success');
        }
    };

    function showItemForm(item = null) {
        const isEdit = !!item;
        Utils.showModal({
            title: isEdit ? '编辑商品' : '新增商品',
            content: `
                <div class="admin-form-row">
                    <div class="admin-form-group"><label class="admin-form-label">名称</label><input class="gq-input" id="sf-name" value="${item?.name || ''}"></div>
                    <div class="admin-form-group"><label class="admin-form-label">图标(Emoji)</label><input class="gq-input" id="sf-icon" value="${item?.icon || '🎁'}"></div>
                </div>
                <div class="admin-form-row">
                    <div class="admin-form-group"><label class="admin-form-label">所需积分</label><input type="number" class="gq-input" id="sf-cost" value="${item?.cost || 100}"></div>
                    <div class="admin-form-group">
                        <label class="admin-form-label">类型</label>
                        <select class="gq-select" id="sf-type">
                            <option value="privilege" ${item?.type === 'privilege' ? 'selected' : ''}>🌟 特权奖励</option>
                            <option value="material" ${item?.type === 'material' ? 'selected' : ''}>📦 实物奖励</option>
                            <option value="boost" ${item?.type === 'boost' ? 'selected' : ''}>🚀 加速包</option>
                        </select>
                    </div>
                </div>
            `,
            buttons: [
                { text: '取消', class: 'gq-btn-secondary' },
                { text: '保存', class: 'gq-btn-primary', onClick: (close) => {
                    const name = document.getElementById('sf-name').value.trim();
                    if (!name) { Utils.showToast('请输入名称', 'error'); return; }
                    const data = {
                        id: item?.id || Store.generateId('si'),
                        name,
                        icon: document.getElementById('sf-icon').value || '🎁',
                        cost: parseInt(document.getElementById('sf-cost').value) || 100,
                        type: document.getElementById('sf-type').value
                    };
                    let items = Store.get('shop_items') || [];
                    if (isEdit) {
                        const idx = items.findIndex(i => i.id === item.id);
                        if (idx >= 0) items[idx] = data;
                    } else {
                        items.push(data);
                    }
                    Store.set('shop_items', items);
                    close(); renderItems();
                    Utils.showToast(isEdit ? '已更新' : '已添加', 'success');
                }}
            ]
        });
    }

    renderItems();
    renderExchangeLog();
})();
