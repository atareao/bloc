CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR NOT NULL UNIQUE,
    slug VARCHAR NOT NULL UNIQUE,
    content TEXT DEFAULT '[]',
    markdown TEXT DEFAULT '',
    excerpt TEXT DEFAULT '',
    meta VARCHAR DEFAULT '',
    outline VARCHAR DEFAULT '',
    comment_on boolean DEFAULT FALSE,
    private boolean DEFAULT TRUE,
    audio_url VARCHAR,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON posts
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
