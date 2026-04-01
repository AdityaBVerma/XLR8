import { pool } from "./db.js";

export const initpostgre = async ()=>{
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        await client.query(`
            CREATE EXTENSION IF NOT EXISTS vector;
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS document_chunks(
                id UUID PRIMARY KEY,
                content TEXT,
                embedding VECTOR(3072) NOT NULL,
                metadata JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS document_chunks_embeddings_idx ON document_chunks
            USING hnsw (embedding vector_cosine_ops);
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS document_chunks_user_idx ON document_chunks((metadata->>'user_id'));
        `);
        
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error in initializing postgres :" , error);
    } finally {
        client.release();
    }
}