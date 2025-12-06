CREATE TABLE settings (
    key VARCHAR(255) PRIMARY KEY, 
    value TEXT NOT NULL, 
    value_type VARCHAR(50) NOT NULL DEFAULT 'string', 
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE ON settings
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
