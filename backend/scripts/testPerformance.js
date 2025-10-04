const mongoose = require('mongoose');
const Student = require('../models/Student');
const Route = require('../models/Route');
const Driver = require('../models/Driver');
require('dotenv').config({ path: '../config/config.env' });

// Performance testing script for 5000+ students
class PerformanceTest {
  constructor() {
    this.testResults = {};
    this.startTime = null;
  }

  async connect() {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('✅ Connected to MongoDB for performance testing');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      process.exit(1);
    }
  }

  startTimer(testName) {
    this.startTime = Date.now();
    console.log(`🚀 Starting test: ${testName}`);
  }

  endTimer(testName) {
    const duration = Date.now() - this.startTime;
    this.testResults[testName] = duration;
    console.log(`✅ ${testName} completed in ${duration}ms`);
    return duration;
  }

  async createTestData() {
    this.startTimer('Data Creation');
    
    // Create test driver
    const testDriver = await Driver.findOneAndUpdate(
      { email: 'test@performance.com' },
      {
        name: 'Performance Test Driver',
        email: 'test@performance.com',
        password: 'hashedpassword',
        phone: '1234567890'
      },
      { upsert: true, new: true }
    );

    // Create test route
    const testRoute = await Route.findOneAndUpdate(
      { routeName: 'Performance Test Route' },
      {
        routeName: 'Performance Test Route',
        startLocation: 'Test Start',
        endLocation: 'Test End',
        driver: testDriver._id,
        stops: ['Stop 1', 'Stop 2', 'Stop 3']
      },
      { upsert: true, new: true }
    );

    // Generate 5000 test students
    const students = [];
    const colleges = ['Engineering', 'Medical', 'Arts', 'Commerce', 'Science'];
    const departments = ['CSE', 'ECE', 'MECH', 'CIVIL', 'IT', 'EEE'];
    const feeStatuses = ['paid', 'pending', 'overdue'];

    for (let i = 1; i <= 5000; i++) {
      students.push({
        name: `Test Student ${i}`,
        rollNumber: `TS${i.toString().padStart(4, '0')}`,
        college: colleges[i % colleges.length],
        department: departments[i % departments.length],
        year: (i % 4) + 1,
        phone: `98765${i.toString().padStart(5, '0')}`,
        email: `student${i}@test.com`,
        address: `Test Address ${i}`,
        feeStatus: feeStatuses[i % feeStatuses.length],
        route: testRoute._id
      });
    }

    // Insert in batches for better performance
    const batchSize = 1000;
    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize);
      await Student.insertMany(batch, { ordered: false });
      console.log(`📝 Inserted batch ${Math.floor(i / batchSize) + 1}/5`);
    }

    this.endTimer('Data Creation');
    return testRoute._id;
  }

  async testPagination(routeId) {
    this.startTimer('Pagination Test');
    
    // Test different page sizes
    const pageSizes = [10, 25, 50, 100];
    
    for (const pageSize of pageSizes) {
      const start = Date.now();
      const students = await Student.find({ route: routeId })
        .select('name rollNumber college department year feeStatus')
        .limit(pageSize)
        .lean();
      
      const duration = Date.now() - start;
      console.log(`📄 Page size ${pageSize}: ${duration}ms (${students.length} records)`);
    }

    this.endTimer('Pagination Test');
  }

  async testSearch(routeId) {
    this.startTimer('Search Test');
    
    // Test text search
    const searchTerms = ['Test Student 1', 'CSE', 'Engineering', 'paid'];
    
    for (const term of searchTerms) {
      const start = Date.now();
      const results = await Student.find({
        route: routeId,
        $text: { $search: term }
      }).limit(50).lean();
      
      const duration = Date.now() - start;
      console.log(`🔍 Search "${term}": ${duration}ms (${results.length} results)`);
    }

    this.endTimer('Search Test');
  }

  async testFiltering(routeId) {
    this.startTimer('Filtering Test');
    
    // Test various filters
    const filters = [
      { college: 'Engineering' },
      { department: 'CSE' },
      { feeStatus: 'paid' },
      { year: 2 },
      { college: 'Engineering', department: 'CSE' }
    ];

    for (const filter of filters) {
      const start = Date.now();
      const results = await Student.find({
        route: routeId,
        ...filter
      }).limit(100).lean();
      
      const duration = Date.now() - start;
      console.log(`🔧 Filter ${JSON.stringify(filter)}: ${duration}ms (${results.length} results)`);
    }

    this.endTimer('Filtering Test');
  }

  async testSorting(routeId) {
    this.startTimer('Sorting Test');
    
    // Test different sort options
    const sortOptions = [
      { name: 1 },
      { rollNumber: 1 },
      { college: 1, department: 1 },
      { year: -1, name: 1 }
    ];

    for (const sort of sortOptions) {
      const start = Date.now();
      const results = await Student.find({ route: routeId })
        .sort(sort)
        .limit(100)
        .lean();
      
      const duration = Date.now() - start;
      console.log(`📊 Sort ${JSON.stringify(sort)}: ${duration}ms`);
    }

    this.endTimer('Sorting Test');
  }

  async testConcurrentRequests(routeId) {
    this.startTimer('Concurrent Requests Test');
    
    // Simulate 10 concurrent requests
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        Student.find({ route: routeId })
          .limit(50)
          .skip(i * 50)
          .lean()
      );
    }

    const results = await Promise.all(promises);
    const totalRecords = results.reduce((sum, batch) => sum + batch.length, 0);
    
    console.log(`🔄 Concurrent requests returned ${totalRecords} total records`);
    this.endTimer('Concurrent Requests Test');
  }

  async testExport(routeId) {
    this.startTimer('Export Test');
    
    // Test streaming export simulation
    const cursor = Student.find({ route: routeId }).cursor();
    let count = 0;
    
    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      count++;
      if (count % 1000 === 0) {
        console.log(`📤 Processed ${count} records for export`);
      }
    }
    
    console.log(`📤 Export simulation completed: ${count} records`);
    this.endTimer('Export Test');
  }

  async cleanup() {
    console.log('🧹 Cleaning up test data...');
    await Student.deleteMany({ email: { $regex: '@test.com$' } });
    await Route.deleteOne({ routeName: 'Performance Test Route' });
    await Driver.deleteOne({ email: 'test@performance.com' });
    console.log('✅ Cleanup completed');
  }

  printResults() {
    console.log('\n📊 PERFORMANCE TEST RESULTS');
    console.log('================================');
    
    Object.entries(this.testResults).forEach(([test, duration]) => {
      const status = duration < 1000 ? '🟢 EXCELLENT' : 
                    duration < 3000 ? '🟡 GOOD' : '🔴 NEEDS OPTIMIZATION';
      console.log(`${test}: ${duration}ms ${status}`);
    });

    console.log('\n📋 RECOMMENDATIONS:');
    if (this.testResults['Pagination Test'] > 500) {
      console.log('⚠️  Consider adding more specific indexes for pagination');
    }
    if (this.testResults['Search Test'] > 1000) {
      console.log('⚠️  Text search performance could be improved with compound indexes');
    }
    if (this.testResults['Export Test'] > 10000) {
      console.log('⚠️  Consider implementing streaming with smaller batch sizes');
    }
    
    console.log('✅ Performance testing completed!');
  }

  async runAllTests() {
    try {
      await this.connect();
      
      console.log('🎯 Creating test data (5000 students)...');
      const routeId = await this.createTestData();
      
      console.log('\n🧪 Running performance tests...');
      await this.testPagination(routeId);
      await this.testSearch(routeId);
      await this.testFiltering(routeId);
      await this.testSorting(routeId);
      await this.testConcurrentRequests(routeId);
      await this.testExport(routeId);
      
      await this.cleanup();
      this.printResults();
      
    } catch (error) {
      console.error('❌ Performance test failed:', error);
    } finally {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the performance test
if (require.main === module) {
  const test = new PerformanceTest();
  test.runAllTests().catch(console.error);
}

module.exports = PerformanceTest;
