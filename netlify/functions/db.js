const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL || 'postgresql://neondb_owner:r1oPQaR0LnfI@ep-wispy-fog-a163z05x.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

const db = {
  async execute(query, params = []) {
    try {
      const result = await sql(query, params);
      return {
        rows: result,
        rowCount: result.length
      };
    } catch (error) {
      console.error('数据库查询错误:', error);
      throw error;
    }
  }
};

module.exports = { db }; 