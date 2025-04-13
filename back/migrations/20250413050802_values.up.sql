CREATE TABLE IF NOT EXISTS values(
    id SERIAL PRIMARY KEY,
    reference VARCHAR NOT NULL,
    value VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(reference, value)
);
