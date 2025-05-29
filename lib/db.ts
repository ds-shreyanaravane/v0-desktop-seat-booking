import sql from 'mssql';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config = {
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

export async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('Connection config:', {
      server: config.server,
      database: config.database,
      authType: config.authentication?.type,
      domain: (config.authentication?.options as any)?.domain
    });

    // Test connection
    await sql.connect(config);
    console.log('Database connection successful');

    // Test table access
    const result = await sql.query`
      SELECT COUNT(*) as count 
      FROM submissions
    `;
    console.log('Successfully accessed submissions table');
    console.log('Number of records:', result.recordset[0].count);

    return {
      success: true,
      message: 'Connection and table access successful',
      recordCount: result.recordset[0].count
    };
  } catch (err) {
    console.error('Connection test failed:', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : String(err),
      error: err
    };
  }
}

export async function executeQuery(query: string, params: any[] = []) {
  try {
    await sql.connect(config);
    const request = new sql.Request();
    // Bind parameters if provided
    if (params && params.length) {
      if (params[0] !== undefined) request.input('status', sql.NVarChar(20), params[0]);
      if (params[1] !== undefined) request.input('id', sql.Int, params[1]);
      if (params[2] !== undefined) request.input('approver', sql.NVarChar(50), params[2]);
    }
    const result = await request.query(query);
    return result.recordset;
  } catch (err) {
    console.error('SQL error', err);
    throw err;
  }
}

export async function insertSubmission(amount: number, reason: string, approver: string, finalApprover: string | null = null) {
  const query = `
    INSERT INTO submissions (
      amount, 
      reason, 
      approver,
      manager_approval,
      cio_approval,
      cfo_approval,
      final_approver
    )
    VALUES (
      @amount, 
      @reason, 
      @approver,
      CASE WHEN @approver = 'manager' THEN 0 ELSE NULL END,
      CASE WHEN @approver = 'cio' THEN 0 ELSE NULL END,
      CASE WHEN @approver = 'cfo' THEN 0 ELSE NULL END,
      @final_approver
    );
    SELECT SCOPE_IDENTITY() as id;
  `;

  try {
    await sql.connect(config);
    const request = new sql.Request();
    request.input('amount', sql.Decimal(18, 2), amount);
    request.input('reason', sql.NVarChar(sql.MAX), reason);
    request.input('approver', sql.NVarChar(50), approver);
    request.input('final_approver', sql.NVarChar(50), finalApprover);
    
    const result = await request.query(query);
    return result.recordset[0].id;
  } catch (err) {
    console.error('Error inserting submission:', err);
    throw err;
  }
}

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