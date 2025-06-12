import { PrismaClient } from '../../generated/prisma';
import * as fs from 'fs';
import * as path from 'path';

export async function seedNations(prisma: PrismaClient) {
  console.log('Seeding nations into the database...');
  
  try {
    // Read the SQL file (assuming it exists in the same location as Python version)
    const sqlFilePath = path.join(process.cwd(), 'prisma', 'seeds', 'data', 'nation.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      console.log('nation.sql file not found, skipping nations seeding');
      return;
    }
    
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      const stmt = statement.trim();
      if (stmt) {
        await prisma.$executeRawUnsafe(stmt);
      }
    }
    
    console.log('✅ Nations seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding nations:', error);
    throw error;
  }
} 
