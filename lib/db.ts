import sql from 'mssql';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config: sql.config = {
  server: process.env.DB_SERVER || 'MLDBDEV01',
  database: process.env.DB_DATABASE || 'Agentic-Workspace',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    enableArithAbort: process.env.DB_ENABLE_ARITH_ABORT === 'true',
    connectTimeout: 30000,
    requestTimeout: 30000,
    port: 1433
  },
  authentication: {
    type: (process.env.DB_AUTH_TYPE as 'ntlm') || 'ntlm',
    options: {
      domain: process.env.DB_DOMAIN || 'milcorp',
      userName: process.env.DB_USERNAME || 'shreya.naravane',
      password: process.env.DB_PASSWORD || 'SNinfo@2025'
    }
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

export async function connectDB() {
  try {
    console.log('Attempting connection to:', {
      server: config.server,
      database: config.database,
      authType: config.authentication?.type,
      domain: (config.authentication?.options as any)?.domain
    });
    const pool = await sql.connect(config);
    console.log('Database connection successful');
    return pool;
  } catch (err) {
    console.error('Database connection failed:', err);
    throw err;
  }
}

export { sql }; 