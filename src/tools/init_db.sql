CREATE EXTENSION postgis;

CREATE TABLE mountains(uri TEXT PRIMARY KEY, loc geography(POINTZ), raw_data JSONB);
CREATE TABLE activities(id BIGINT PRIMARY KEY, path geography(LINESTRING), raw_data JSONB);
