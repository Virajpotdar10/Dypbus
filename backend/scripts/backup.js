const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: './config/config.env' });

class DatabaseBackup {
  constructor() {
    this.backupDir = path.join(__dirname, '../backups');
    this.ensureBackupDirectory();
  }

  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  generateBackupFilename() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `busdriver-backup-${timestamp}`;
  }

  async createMongoDBDump() {
    return new Promise((resolve, reject) => {
      const filename = this.generateBackupFilename();
      const backupPath = path.join(this.backupDir, filename);
      
      // Extract database name from MONGO_URI
      const dbName = process.env.MONGO_URI.split('/').pop();
      
      const command = `mongodump --uri="${process.env.MONGO_URI}" --out="${backupPath}"`;
      
      console.log('Starting MongoDB backup...');
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('Backup failed:', error);
          reject(error);
          return;
        }
        
        console.log('MongoDB backup completed successfully');
        console.log('Backup location:', backupPath);
        resolve(backupPath);
      });
    });
  }

  async createJSONBackup() {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      
      const Student = require('../models/Student');
      const Route = require('../models/Route');
      const Driver = require('../models/Driver');
      
      console.log('Creating JSON backup...');
      
      const [students, routes, drivers] = await Promise.all([
        Student.find().populate('route').lean(),
        Route.find().populate('driver').lean(),
        Driver.find().lean()
      ]);
      
      const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        collections: {
          students: students,
          routes: routes,
          drivers: drivers.map(driver => ({
            ...driver,
            password: '[ENCRYPTED]' // Don't backup passwords
          }))
        },
        stats: {
          totalStudents: students.length,
          totalRoutes: routes.length,
          totalDrivers: drivers.length
        }
      };
      
      const filename = `${this.generateBackupFilename()}.json`;
      const backupPath = path.join(this.backupDir, filename);
      
      fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
      
      console.log('JSON backup completed successfully');
      console.log('Backup location:', backupPath);
      
      await mongoose.disconnect();
      return backupPath;
    } catch (error) {
      console.error('JSON backup failed:', error);
      throw error;
    }
  }

  async restoreFromJSON(backupPath) {
    try {
      if (!fs.existsSync(backupPath)) {
        throw new Error('Backup file not found');
      }
      
      await mongoose.connect(process.env.MONGO_URI);
      
      const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
      
      const Student = require('../models/Student');
      const Route = require('../models/Route');
      
      console.log('Starting restore from JSON backup...');
      
      // Clear existing data (be careful!)
      await Promise.all([
        Student.deleteMany({}),
        Route.deleteMany({})
      ]);
      
      // Restore routes first (students depend on routes)
      if (backupData.collections.routes.length > 0) {
        await Route.insertMany(backupData.collections.routes);
        console.log(`Restored ${backupData.collections.routes.length} routes`);
      }
      
      // Restore students
      if (backupData.collections.students.length > 0) {
        await Student.insertMany(backupData.collections.students);
        console.log(`Restored ${backupData.collections.students.length} students`);
      }
      
      console.log('Restore completed successfully');
      await mongoose.disconnect();
    } catch (error) {
      console.error('Restore failed:', error);
      throw error;
    }
  }

  async cleanOldBackups(daysToKeep = 30) {
    try {
      const files = fs.readdirSync(this.backupDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      let deletedCount = 0;
      
      files.forEach(file => {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          if (fs.lstatSync(filePath).isDirectory()) {
            fs.rmSync(filePath, { recursive: true });
          } else {
            fs.unlinkSync(filePath);
          }
          deletedCount++;
        }
      });
      
      console.log(`Cleaned up ${deletedCount} old backup files`);
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  async getBackupList() {
    try {
      const files = fs.readdirSync(this.backupDir);
      return files.map(file => {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          size: stats.size,
          created: stats.mtime,
          type: path.extname(file) === '.json' ? 'JSON' : 'MongoDB'
        };
      }).sort((a, b) => b.created - a.created);
    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }
}

// CLI interface
if (require.main === module) {
  const backup = new DatabaseBackup();
  const command = process.argv[2];
  
  switch (command) {
    case 'create':
      backup.createJSONBackup()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    case 'mongo':
      backup.createMongoDBDump()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    case 'restore':
      const backupPath = process.argv[3];
      if (!backupPath) {
        console.error('Please provide backup file path');
        process.exit(1);
      }
      backup.restoreFromJSON(backupPath)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    case 'cleanup':
      const days = parseInt(process.argv[3]) || 30;
      backup.cleanOldBackups(days)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    case 'list':
      backup.getBackupList()
        .then(backups => {
          console.log('Available backups:');
          backups.forEach(b => {
            console.log(`- ${b.name} (${b.type}, ${(b.size / 1024 / 1024).toFixed(2)}MB, ${b.created})`);
          });
          process.exit(0);
        })
        .catch(() => process.exit(1));
      break;
      
    default:
      console.log('Usage:');
      console.log('  node backup.js create     - Create JSON backup');
      console.log('  node backup.js mongo      - Create MongoDB dump');
      console.log('  node backup.js restore <path> - Restore from JSON backup');
      console.log('  node backup.js cleanup [days] - Clean old backups (default: 30 days)');
      console.log('  node backup.js list       - List available backups');
      process.exit(1);
  }
}

module.exports = DatabaseBackup;
