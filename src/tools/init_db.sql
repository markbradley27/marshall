CREATE EXTENSION postgis;

CREATE TABLE mountains(uri TEXT PRIMARY KEY, loc geography(POINTZ), raw_data JSONB);
