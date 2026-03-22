/**
 * 成长冒险岛 - 奖励商城逻辑
 */
(function () {
    const profile = Store.get('profile') || {};
    document.getElementById('current-points').textContent = profile.coins || 0;

    function renderShop() {
        const items = Store.get('shop_items') || [];
        const grid = document.getElementById('shop-grid');
        const currentCoins = (Store.get('profile') || {}).coins || 0;

        grid.innerHTML = items.map(item => {
            const canAfford = currentCoins >= item.cost;
            const typeLabels = { privilege: '🌟 特权', material: '📦 实物', boost: '🚀 加速包', convert_card: '🎫 转换卡' };
            return `<div class="shop-item">
                <div class="shop-item-icon">${item.icon}</div>
                <div class="shop-item-name">${item.name}</div>
                <div class="shop-item-cost">🪙 ${item.cost}</div>
                <div style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:8px">${typeLabels[item.type] || item.type}</div>
                <button class="gq-btn ${canAfford ? 'gq-btn-accent' : 'gq-btn-secondary'} gq-btn-sm"
                    ${canAfford ? '' : 'disabled'}
                    onclick="exchangeItem('${item.id}')">
                    ${canAfford ? '兑换' : '金币不足'}
                </button>
            </div>`;
        }).join('');

        document.getElementById('current-points').textContent = currentCoins;
    }

    window.exchangeItem = async function (itemId) {
        const items = Store.get('shop_items') || [];
        const item = items.find(i => i.id === itemId);
        if (!item) return;

        const confirmed = await Utils.showConfirm('确认兑换', `确定要花 🪙${item.cost} 金币兑换「${item.name}」吗？`);
        if (!confirmed) return;

        const result = Store.exchangeItem(itemId);
        if (result.success) {
            Utils.showToast(`🎉 ${result.msg}`, 'success');
            Utils.showConfetti();
            renderShop();
            renderPurchasedItems();
            renderExchangeLog();
        } else {
            Utils.showToast(result.msg, 'error');
        }
    };

    function renderPurchasedItems() {
        const purchased = Store.get('purchased_items') || [];
        const el = document.getElementById('purchased-items');

        if (purchased.length === 0) {
            el.innerHTML = '<div class="gq-empty"><div class="gq-empty-icon">📭</div><div>还没有已购商品</div></div>';
            return;
        }

        el.innerHTML = purchased.map((item, index) => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:#F8F9FA;border-radius:8px;margin-bottom:8px">
                <div style="display:flex;align-items:center;gap:12px">
                    <div style="font-size:2rem">${item.icon}</div>
                    <div>
                        <div style="font-weight:600">${item.name}</div>
                        <div style="font-size:0.8rem;color:var(--text-secondary)">${Utils.formatDateTime(item.purchaseDate)}</div>
                    </div>
                </div>
                <button class="gq-btn gq-btn-primary gq-btn-sm" onclick="usePurchasedItem(${index})">
                    使用
                </button>
            </div>
        `).join('');
    }

    window.usePurchasedItem = async function (index) {
        const confirmed = await Utils.showConfirm('确认使用', '确定要使用这个商品吗？');
        if (!confirmed) return;

        const result = Store.usePurchasedItem(index);
        if (result.success) {
            Utils.showToast(`🎉 ${result.msg}`, 'success');
            renderPurchasedItems();
        } else {
            Utils.showToast(result.msg, 'error');
        }
    };

    function renderExchangeLog() {
        const log = Store.get('exchange_log') || [];
        const el = document.getElementById('exchange-log');

        if (log.length === 0) {
            el.innerHTML = '<div class="gq-empty"><div class="gq-empty-icon">📭</div><div>还没有兑换记录</div></div>';
            return;
        }

        el.innerHTML = log.slice().reverse().map(entry => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #F0F0F0">
                <div>
                    <div style="font-weight:600">${entry.name}</div>
                    <div style="font-size:0.8rem;color:var(--text-secondary)">${Utils.formatDateTime(entry.date)}</div>
                </div>
                <div style="display:flex;align-items:center;gap:8px">
                    <span style="color:var(--color-red);font-weight:700">-${entry.cost}🪙</span>
                    <span class="gq-badge ${entry.fulfilled ? 'gq-badge-green' : 'gq-badge-yellow'}">
                        ${entry.fulfilled ? '✅ 已兑现' : '⏳ 待兑现'}
                    </span>
                </div>
            </div>
        `).join('');
    }

    renderShop();
    renderPurchasedItems();
    renderExchangeLog();
    Utils.renderNav('shop');
})();
