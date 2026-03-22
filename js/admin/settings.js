/**
 * 管理后台 - 系统设置
 */
(function () {
    if (!Utils.checkAdminAuth()) return;
    Utils.renderAdminSidebar('settings');

    // 加载数据
    const profile = Store.get('profile') || {};
    const settings = Store.get('settings') || {};

    document.getElementById('set-nickname').value = profile.nickname || '';
    document.getElementById('set-avatar').value = profile.avatar || '🦸';
    document.getElementById('set-points').value = profile.currentPoints || 0;
    document.getElementById('set-random-count').value = settings.dailyRandomCount || 3;
    document.getElementById('set-perfect-bonus').value = settings.perfectDayBonus || 20;
    document.getElementById('set-conversion-ratio').value = settings.conversionRatio || 1;

    // 保存孩子信息
    document.getElementById('save-profile-btn').addEventListener('click', () => {
        const p = Store.get('profile') || {};
        p.nickname = document.getElementById('set-nickname').value.trim() || '小冒险家';
        p.avatar = document.getElementById('set-avatar').value || '🦸';
        p.currentPoints = parseInt(document.getElementById('set-points').value) || 0;
        Store.set('profile', p);
        Utils.showToast('信息已保存 ✅', 'success');
    });

    // 保存设置
    document.getElementById('save-settings-btn').addEventListener('click', () => {
        const s = Store.get('settings') || {};
        s.dailyRandomCount = Math.max(1, Math.min(10, parseInt(document.getElementById('set-random-count').value) || 3));
        s.perfectDayBonus = parseInt(document.getElementById('set-perfect-bonus').value) || 20;
        s.conversionRatio = Math.max(1, Math.min(100, parseInt(document.getElementById('set-conversion-ratio').value) || 1));
        Store.set('settings', s);
        Utils.showToast('设置已保存 ✅', 'success');
    });

    // 修改密码
    document.getElementById('change-pwd-btn').addEventListener('click', () => {
        const oldPwd = document.getElementById('old-pwd').value;
        const newPwd = document.getElementById('new-pwd').value;
        const confirmPwd = document.getElementById('confirm-pwd').value;
        const currentPwd = Store.get('admin_password') || '123456';

        if (oldPwd !== currentPwd) {
            Utils.showToast('当前密码错误！', 'error');
            return;
        }
        if (!newPwd || newPwd.length < 4) {
            Utils.showToast('新密码至少4位！', 'error');
            return;
        }
        if (newPwd !== confirmPwd) {
            Utils.showToast('两次密码不一致！', 'error');
            return;
        }
        Store.set('admin_password', newPwd);
        document.getElementById('old-pwd').value = '';
        document.getElementById('new-pwd').value = '';
        document.getElementById('confirm-pwd').value = '';
        Utils.showToast('密码已修改 ✅', 'success');
    });

    // 导出备份
    document.getElementById('export-btn').addEventListener('click', () => {
        Store.exportBackup();
        Utils.showToast('备份已下载 📤', 'success');
    });

    // 导入恢复
    document.getElementById('import-input').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const confirmed = await Utils.showConfirm('⚠️ 数据恢复', '导入会覆盖当前所有数据，确定继续？');
        if (!confirmed) { e.target.value = ''; return; }

        const reader = new FileReader();
        reader.onload = (evt) => {
            const result = Store.importBackup(evt.target.result);
            if (result.success) {
                Utils.showToast('数据恢复成功 ✅ 即将刷新页面...', 'success');
                setTimeout(() => location.reload(), 1500);
            } else {
                Utils.showToast(result.msg, 'error');
            }
        };
        reader.readAsText(file);
    });

    // 重置数据
    document.getElementById('reset-btn').addEventListener('click', async () => {
        const confirmed = await Utils.showConfirm('⚠️ 危险操作', '确定要重置全部数据吗？所有进度、积分和成就将被清除！\n此操作不可恢复！');
        if (!confirmed) return;
        const doubleConfirm = await Utils.showConfirm('再次确认', '真的确定吗？建议先导出备份！');
        if (!doubleConfirm) return;

        Store.resetAll();
        Utils.showToast('数据已重置 ✅ 即将刷新...', 'success');
        setTimeout(() => location.reload(), 1500);
    });
})();
