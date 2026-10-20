import sqlite3

conn = sqlite3.connect('gonnit.db')
cursor = conn.cursor()

# 1. Create system_configs table
cursor.execute('''
CREATE TABLE IF NOT EXISTS system_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key VARCHAR(64) UNIQUE,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
''')

# 2. Add target_device_name to recovery_sessions
cols_sess = [c[1] for c in cursor.execute('PRAGMA table_info(recovery_sessions)').fetchall()]
if 'target_device_name' not in cols_sess:
    cursor.execute('ALTER TABLE recovery_sessions ADD COLUMN target_device_name VARCHAR(100) DEFAULT "Apple iPhone 16"')

# 3. Add custom_match_number and custom_device_name to visitor_presence
cols_vis = [c[1] for c in cursor.execute('PRAGMA table_info(visitor_presence)').fetchall()]
if 'custom_match_number' not in cols_vis:
    cursor.execute('ALTER TABLE visitor_presence ADD COLUMN custom_match_number INTEGER DEFAULT 63')
if 'custom_device_name' not in cols_vis:
    cursor.execute('ALTER TABLE visitor_presence ADD COLUMN custom_device_name VARCHAR(100) DEFAULT "Apple iPhone 16"')

# 4. Add admin_decision to recovery_sessions and visitor_presence
if 'admin_decision' not in cols_sess:
    cursor.execute('ALTER TABLE recovery_sessions ADD COLUMN admin_decision VARCHAR(32) DEFAULT "PENDING"')
if 'admin_decision' not in cols_vis:
    cursor.execute('ALTER TABLE visitor_presence ADD COLUMN admin_decision VARCHAR(32) DEFAULT "PENDING"')

# 5. Insert default initial configs if not exist
cursor.execute('INSERT OR IGNORE INTO system_configs (key, value) VALUES ("default_match_number", "63")')
cursor.execute('INSERT OR IGNORE INTO system_configs (key, value) VALUES ("default_device_name", "Apple iPhone 16")')
cursor.execute('INSERT OR IGNORE INTO system_configs (key, value) VALUES ("auto_permit_password", "false")')

conn.commit()
conn.close()
print("Migration script executed successfully!")
