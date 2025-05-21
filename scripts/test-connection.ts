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
  }
};

async function connectToDatabase() {
  try {
    await sql.connect(config);
    console.log('Connected to MSSQL');

    // Check if Employees table exists
    const tableCheck = await sql.query`
      SELECT COUNT(*) as tableCount 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'Employees'
    `;
    console.log('Employees table exists:', tableCheck.recordset[0].tableCount > 0);

    // Get all employees
    const result = await sql.query`SELECT * FROM Employees`;
    console.log('Employees in database:', result.recordset);

    // Test login with a sample email
    const testEmail = 'john.doe@company.com';
    const loginResult = await sql.query`
      SELECT * FROM Employees 
      WHERE employee_email = ${testEmail}
    `;
    console.log('Login test result:', loginResult.recordset);

  } catch (err) {
    console.error('Database connection failed:', err);
  } finally {
    //await sql.close();
  }
}

connectToDatabase();