-- 成长冒险岛 - Supabase 数据库配置
-- 在 Supabase SQL Editor 中执行以下代码

-- 1. 创建用户数据表
CREATE TABLE IF NOT EXISTS user_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    data_key TEXT NOT NULL,
    data_value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, data_key)
);

-- 2. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_data_key ON user_data(data_key);

-- 3. 启用行级安全策略
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- 4. 创建安全策略：用户只能访问自己的数据
CREATE POLICY "Users can only access their own data"
ON user_data FOR ALL
USING (auth.uid() = user_id);

-- 5. 创建更新时间自动更新函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. 创建触发器
DROP TRIGGER IF EXISTS update_user_data_updated_at ON user_data;
CREATE TRIGGER update_user_data_updated_at
    BEFORE UPDATE ON user_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. 添加注释
COMMENT ON TABLE user_data IS '存储用户游戏数据';
COMMENT ON COLUMN user_data.data_key IS '数据键名，如 profile, trees, daily_tasks 等';
COMMENT ON COLUMN user_data.data_value IS 'JSON格式的数据值';
