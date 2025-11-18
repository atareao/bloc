CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER NOT NULL,
    title VARCHAR NOT NULL UNIQUE,
    slug VARCHAR NOT NULL UNIQUE,
    status VARCHAR NOT NULL default 'draft',
    content TEXT NOT NULL default '',
    excerpt TEXT NOT NULL default '',
    user_id INTEGER NOT NULL,
    podcast_url VARCHAR,
    video_url VARCHAR,
    comment_on boolean DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
