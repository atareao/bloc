CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    class VARCHAR NOT NULL,
    parent_id INTEGER,
    title VARCHAR NOT NULL,
    slug VARCHAR NOT NULL UNIQUE,
    content TEXT DEFAULT '',
    excerpt TEXT DEFAULT '',
    user_id INTEGER NOT NULL,
    comment_on boolean DEFAULT FALSE,
    private boolean DEFAULT TRUE,
    audio_url VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(title, parent_id),
    UNIQUE(slug, parent_id)
);
