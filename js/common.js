/**
 * ============================================
 * 成长冒险岛 - 公共工具模块
 * ============================================
 */

const Utils = {
    // ==================== 日期工具 ====================
    getToday() {
        return new Date().toISOString().split('T')[0];
    },

    formatDate(dateStr) {
        const d = new Date(dateStr);
        return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
    },

    formatTime(dateStr) {
        const d = new Date(dateStr);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    },

    formatDateTime(dateStr) {
        return this.formatDate(dateStr) + ' ' + this.formatTime(dateStr);
    },

    // ==================== Toast 提示 ====================
    showToast(msg, type = 'info', duration = 2500) {
        const existing = document.querySelector('.gq-toast');
        if (existing) existing.remove();

        const icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️', reward: '🎁' };
        const toast = document.createElement('div');
        toast.className = `gq-toast gq-toast-${type}`;
        toast.innerHTML = `<span class="gq-toast-icon">${icons[type] || ''}</span><span>${msg}</span>`;
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    // ==================== 模态弹窗 ====================
    showModal(options) {
        const { title = '', content = '', buttons = [], onClose = null, className = '' } = options;
        const overlay = document.createElement('div');
        overlay.className = 'gq-modal-overlay';
        overlay.innerHTML = `
            <div class="gq-modal ${className}">
                <div class="gq-modal-header">
                    <h3>${title}</h3>
                    <button class="gq-modal-close" id="gq-modal-close-btn">✕</button>
                </div>
                <div class="gq-modal-body">${content}</div>
                ${buttons.length ? `<div class="gq-modal-footer">${buttons.map((b, i) =>
                    `<button class="gq-btn ${b.class || 'gq-btn-primary'}" data-btn-idx="${i}">${b.text}</button>`
                ).join('')}</div>` : ''}
            </div>
        `;
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('show'));

        const close = () => {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
            if (onClose) onClose();
        };

        overlay.querySelector('#gq-modal-close-btn').addEventListener('click', close);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

        buttons.forEach((b, i) => {
            overlay.querySelector(`[data-btn-idx="${i}"]`).addEventListener('click', () => {
                if (b.onClick) b.onClick(close);
                else close();
            });
        });

        return { close, overlay };
    },

    // ==================== 确认弹窗 ====================
    showConfirm(title, message) {
        return new Promise(resolve => {
            this.showModal({
                title,
                content: `<p>${message}</p>`,
                buttons: [
                    { text: '取消', class: 'gq-btn-secondary', onClick: (close) => { close(); resolve(false); } },
                    { text: '确定', class: 'gq-btn-primary', onClick: (close) => { close(); resolve(true); } }
                ]
            });
        });
    },

    // ==================== 密码输入弹窗 ====================
    showPasswordPrompt(title = '请输入管理密码 🔑') {
        return new Promise(resolve => {
            this.showModal({
                title,
                content: `<input type="password" id="gq-pwd-input" class="gq-input" placeholder="请输入密码..." autofocus>`,
                buttons: [
                    { text: '取消', class: 'gq-btn-secondary', onClick: (close) => { close(); resolve(null); } },
                    { text: '确认', class: 'gq-btn-primary', onClick: (close) => {
                        const pwd = document.getElementById('gq-pwd-input').value;
                        close();
                        resolve(pwd);
                    }}
                ]
            });
            // 支持回车
            setTimeout(() => {
                const input = document.getElementById('gq-pwd-input');
                if (input) {
                    input.focus();
                    input.addEventListener('keyup', (e) => {
                        if (e.key === 'Enter') {
                            document.querySelector('.gq-modal-footer .gq-btn-primary').click();
                        }
                    });
                }
            }, 100);
        });
    },

    // ==================== 撒花/庆祝效果 ====================
    showConfetti() {
        const container = document.createElement('div');
        container.className = 'gq-confetti-container';
        document.body.appendChild(container);

        const colors = ['#FFD54F', '#FF7043', '#66BB6A', '#42A5F5', '#AB47BC', '#EC407A', '#26C6DA'];
        const emojis = ['🎉', '⭐', '🌟', '✨', '🎊', '💫', '🏆'];

        for (let i = 0; i < 50; i++) {
            const piece = document.createElement('div');
            piece.className = 'gq-confetti-piece';
            const isEmoji = Math.random() > 0.6;
            if (isEmoji) {
                piece.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                piece.style.fontSize = (12 + Math.random() * 16) + 'px';
            } else {
                piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                piece.style.width = (6 + Math.random() * 8) + 'px';
                piece.style.height = (6 + Math.random() * 8) + 'px';
                piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
            }
            piece.style.left = Math.random() * 100 + 'vw';
            piece.style.animationDuration = (1.5 + Math.random() * 2) + 's';
            piece.style.animationDelay = Math.random() * 0.5 + 's';
            container.appendChild(piece);
        }

        setTimeout(() => container.remove(), 4000);
    },

    // ==================== 星级渲染 ====================
    renderStars(difficulty, max = 3) {
        return '⭐'.repeat(Math.min(difficulty, max)) + '☆'.repeat(Math.max(0, max - difficulty));
    },

    // ==================== 进度条 ====================
    createProgressBar(current, total, color = 'var(--color-primary)') {
        const pct = total > 0 ? Math.min(100, Math.round(current / total * 100)) : 0;
        return `<div class="gq-progress">
            <div class="gq-progress-bar" style="width:${pct}%; background:${color}"></div>
            <span class="gq-progress-text">${pct}%</span>
        </div>`;
    },

    // ==================== 导航栏 ====================
    renderNav(currentPage) {
        const navItems = [
            { page: 'index', icon: '🏠', label: '首页' },
            { page: 'tasks', icon: '📋', label: '任务' },
            { page: 'forest', icon: '🌳', label: '森林' },
            { page: 'game', icon: '🎮', label: '游戏' },
            { page: 'achievements', icon: '🏅', label: '成就' },
            { page: 'shop', icon: '🎁', label: '商城' }
        ];

        const nav = document.createElement('nav');
        nav.className = 'gq-bottom-nav';
        nav.innerHTML = navItems.map(item => {
            const href = item.page === 'index' ? 'index.html' : `${item.page}.html`;
            const active = currentPage === item.page ? 'active' : '';
            return `<a href="${href}" class="gq-nav-item ${active}">
                <span class="gq-nav-icon">${item.icon}</span>
                <span class="gq-nav-label">${item.label}</span>
            </a>`;
        }).join('');
        document.body.appendChild(nav);
    },

    // ==================== 后台侧栏导航 ====================
    renderAdminSidebar(currentPage) {
        const items = [
            { page: 'dashboard', icon: '📊', label: '数据概览' },
            { page: 'tasks', icon: '📋', label: '任务配置' },
            { page: 'forest', icon: '🌳', label: '能力森林' },
            { page: 'achievements', icon: '🏅', label: '成就配置' },
            { page: 'shop', icon: '🎁', label: '商城配置' },
            { page: 'fish', icon: '🐟', label: '捕鱼配置' },
            { page: 'records', icon: '📅', label: '数据记录' },
            { page: 'settings', icon: '⚙️', label: '系统设置' }
        ];

        const sidebar = document.getElementById('admin-sidebar');
        if (!sidebar) return;
        sidebar.innerHTML = `
            <div class="admin-sidebar-header">
                <h2>🔧 管理后台</h2>
                <a href="../index.html" class="admin-back-link">← 返回前台</a>
            </div>
            <ul class="admin-nav-list">
                ${items.map(item => {
                    const active = currentPage === item.page ? 'active' : '';
                    return `<li><a href="${item.page}.html" class="admin-nav-item ${active}">
                        <span>${item.icon}</span><span>${item.label}</span>
                    </a></li>`;
                }).join('')}
            </ul>
            <div class="admin-sidebar-footer">
                <button onclick="if(confirm('确定退出？')){sessionStorage.removeItem('gq_admin_auth');location.href='login.html';}" class="gq-btn gq-btn-secondary gq-btn-sm">退出登录</button>
            </div>
        `;
    },

    // 后台鉴权检查
    checkAdminAuth() {
        if (!sessionStorage.getItem('gq_admin_auth')) {
            location.href = 'login.html';
            return false;
        }
        return true;
    }
};
