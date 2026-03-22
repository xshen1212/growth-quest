/**
 * 鱼配置管理
 */
(function () {
    const defaultFishConfig = [
        { id: 1, name: '小鱼1', coin: 1, defaultCaptureRate: 0.55, icon: '🐟' },
        { id: 2, name: '小鱼2', coin: 3, defaultCaptureRate: 0.50, icon: '🐟' },
        { id: 3, name: '小鱼3', coin: 5, defaultCaptureRate: 0.45, icon: '🐟' },
        { id: 4, name: '中鱼4', coin: 8, defaultCaptureRate: 0.40, icon: '🐠' },
        { id: 5, name: '中鱼5', coin: 10, defaultCaptureRate: 0.35, icon: '🐠' },
        { id: 6, name: '中鱼6', coin: 20, defaultCaptureRate: 0.30, icon: '🐡' },
        { id: 7, name: '大鱼7', coin: 30, defaultCaptureRate: 0.25, icon: '🦈' },
        { id: 8, name: '大鱼8', coin: 40, defaultCaptureRate: 0.20, icon: '🦈' },
        { id: 9, name: '大鱼9', coin: 50, defaultCaptureRate: 0.15, icon: '🦈' },
        { id: 10, name: '大鱼10', coin: 60, defaultCaptureRate: 0.10, icon: '🦈' },
        { id: 11, name: '鲨鱼1', coin: 100, defaultCaptureRate: 0.05, icon: '🦈' },
        { id: 12, name: '鲨鱼2', coin: 200, defaultCaptureRate: 0.02, icon: '🦈' }
    ];

    const fishProbabilities = [
        0.245, 0.168, 0.129, 0.105, 0.086, 0.071,
        0.059, 0.048, 0.038, 0.029, 0.019, 0.009
    ];

    function loadFishConfig() {
        let config = localStorage.getItem('gq_fish_config');
        if (config) {
            try {
                config = JSON.parse(config);
            } catch(e) {
                config = null;
            }
        }
        if (!config || !Array.isArray(config)) {
            config = defaultFishConfig.map(fish => ({
                ...fish,
                captureRate: fish.defaultCaptureRate
            }));
        }
        return config;
    }

    function renderFishConfig() {
        const config = loadFishConfig();
        const listEl = document.getElementById('fish-config-list');

        listEl.innerHTML = config.map((fish, index) => `
            <div style="display:flex;align-items:center;gap:12px;padding:12px;background:#F8F9FA;border-radius:8px;margin-bottom:8px">
                <div style="font-size:2rem;min-width:40px;text-align:center">${fish.icon}</div>
                <div style="flex:1">
                    <div style="font-weight:600">${fish.name}</div>
                    <div style="font-size:0.85rem;color:var(--text-secondary)">
                        金币: ${fish.coin} | 默认捕获率: ${(fish.defaultCaptureRate * 100).toFixed(0)}%
                    </div>
                </div>
                <div style="width:120px">
                    <input type="number" 
                           class="gq-input" 
                           id="fish-rate-${index}"
                           min="0.01" 
                           max="0.99" 
                           step="0.01"
                           value="${fish.captureRate.toFixed(2)}">
                </div>
                <div style="width:60px;text-align:center;font-weight:700;color:var(--color-primary)">
                    ${(fish.captureRate * 100).toFixed(0)}%
                </div>
            </div>
        `).join('');

        renderConversionRatePreview();
    }

    function calculateConversionRate(config, level) {
        let totalExpected = 0;
        config.forEach((fish, index) => {
            const adjustedRate = fish.captureRate * (1 + level * 0.05);
            totalExpected += fishProbabilities[index] * Math.min(adjustedRate, 1) * fish.coin;
        });
        return totalExpected;
    }

    function renderConversionRatePreview() {
        const config = loadFishConfig();
        const previewEl = document.getElementById('conversion-rate-preview');

        const levels = [1, 2, 3, 4, 5, 6, 7];
        const costs = [1, 2, 3, 4, 5, 6, 7];

        previewEl.innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px">
                ${levels.map((level, index) => {
                    const expected = calculateConversionRate(config, level);
                    const rate = (expected / costs[index] * 100).toFixed(0);
                    const isGood = rate >= 100;
                    return `
                        <div style="text-align:center;padding:12px;background:${isGood ? '#E8F5E9' : '#FFF3E0'};border-radius:8px">
                            <div style="font-weight:700;font-size:1.2rem">${level}级</div>
                            <div style="font-size:0.85rem;color:var(--text-secondary);margin-top:4px">消耗: ${costs[index]}分</div>
                            <div style="font-size:0.85rem;color:var(--text-secondary);margin-top:2px">期望: ${expected.toFixed(2)}金币</div>
                            <div style="font-weight:700;font-size:1.1rem;margin-top:4px;color:${isGood ? '#4CAF50' : '#FF9800'}">
                                ${rate}%
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    function saveFishConfig() {
        const config = loadFishConfig();
        config.forEach((fish, index) => {
            const input = document.getElementById(`fish-rate-${index}`);
            let value = parseFloat(input.value);
            if (isNaN(value)) value = fish.defaultCaptureRate;
            value = Math.max(0.01, Math.min(0.99, value));
            fish.captureRate = value;
        });

        localStorage.setItem('gq_fish_config', JSON.stringify(config));
        Utils.showToast('配置已保存 ✅', 'success');
        renderFishConfig();
    }

    function resetFishConfig() {
        localStorage.removeItem('gq_fish_config');
        Utils.showToast('已恢复默认配置 ✅', 'success');
        renderFishConfig();
    }

    document.getElementById('save-fish-config-btn').addEventListener('click', saveFishConfig);
    document.getElementById('reset-fish-config-btn').addEventListener('click', resetFishConfig);

    renderFishConfig();
    Utils.renderAdminNav('fish');
})();
