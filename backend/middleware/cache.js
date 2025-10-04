const NodeCache = require('node-cache');

// Create cache instances with different TTL for different data types
const routeCache = new NodeCache({ stdTTL: 600, checkperiod: 120 }); // 10 minutes
const driverCache = new NodeCache({ stdTTL: 1800, checkperiod: 300 }); // 30 minutes
const statsCache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // 5 minutes
const studentCache = new NodeCache({ stdTTL: 180, checkperiod: 30 }); // 3 minutes

// Cache key generators
const generateCacheKey = (prefix, ...params) => {
  return `${prefix}:${params.filter(p => p).join(':')}`;
};

// Generic cache middleware
const cacheMiddleware = (cacheInstance, keyPrefix, ttl = null) => {
  return (req, res, next) => {
    // Generate cache key based on request parameters
    const keyParams = [
      req.params.routeId,
      req.params.id,
      req.query.page,
      req.query.limit,
      req.query.search,
      req.query.feeStatus,
      req.query.department,
      req.query.college,
      req.query.sortBy,
      req.query.sortOrder,
      req.driver?._id
    ];
    
    const cacheKey = generateCacheKey(keyPrefix, ...keyParams);
    
    // Try to get from cache
    const cachedData = cacheInstance.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        ...cachedData,
        cached: true,
        cacheTimestamp: new Date().toISOString()
      });
    }
    
    // Store original res.json to intercept response
    const originalJson = res.json;
    res.json = function(data) {
      // Only cache successful responses
      if (data.success && res.statusCode === 200) {
        const cacheData = { ...data };
        delete cacheData.cached;
        delete cacheData.cacheTimestamp;
        
        if (ttl) {
          cacheInstance.set(cacheKey, cacheData, ttl);
        } else {
          cacheInstance.set(cacheKey, cacheData);
        }
      }
      
      // Call original json method
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// Specific cache middlewares for different endpoints
const cacheRoutes = cacheMiddleware(routeCache, 'routes', 600);
const cacheDrivers = cacheMiddleware(driverCache, 'drivers', 1800);
const cacheStats = cacheMiddleware(statsCache, 'stats', 300);
const cacheStudents = cacheMiddleware(studentCache, 'students', 180);

// Cache invalidation helpers
const invalidateCache = {
  routes: (routeId = null) => {
    if (routeId) {
      const keys = routeCache.keys().filter(key => key.includes(routeId));
      routeCache.del(keys);
    } else {
      routeCache.flushAll();
    }
    // Also invalidate related stats
    statsCache.flushAll();
  },
  
  students: (routeId = null) => {
    if (routeId) {
      const keys = studentCache.keys().filter(key => key.includes(routeId));
      studentCache.del(keys);
    } else {
      studentCache.flushAll();
    }
    // Also invalidate related stats
    statsCache.flushAll();
  },
  
  drivers: (driverId = null) => {
    if (driverId) {
      const keys = driverCache.keys().filter(key => key.includes(driverId));
      driverCache.del(keys);
    } else {
      driverCache.flushAll();
    }
  },
  
  stats: () => {
    statsCache.flushAll();
  },
  
  all: () => {
    routeCache.flushAll();
    driverCache.flushAll();
    statsCache.flushAll();
    studentCache.flushAll();
  }
};

// Cache warming functions for frequently accessed data
const warmCache = {
  routes: async () => {
    try {
      const Route = require('../models/Route');
      const routes = await Route.find().populate('driver', 'name email').lean();
      routeCache.set('all_routes', { success: true, data: routes });
      console.log('Routes cache warmed');
    } catch (error) {
      console.error('Error warming routes cache:', error);
    }
  },
  
  stats: async () => {
    try {
      const Student = require('../models/Student');
      const Route = require('../models/Route');
      
      const [totalStudents, totalRoutes, paidCount] = await Promise.all([
        Student.countDocuments(),
        Route.countDocuments(),
        Student.countDocuments({ feeStatus: 'Paid' })
      ]);
      
      const globalStats = {
        totalStudents,
        totalRoutes,
        paidCount,
        unpaidCount: totalStudents - paidCount
      };
      
      statsCache.set('global_stats', { success: true, data: globalStats });
      console.log('Stats cache warmed');
    } catch (error) {
      console.error('Error warming stats cache:', error);
    }
  }
};

// Cache monitoring and metrics
const getCacheStats = () => {
  return {
    routes: {
      keys: routeCache.keys().length,
      hits: routeCache.getStats().hits,
      misses: routeCache.getStats().misses,
      hitRate: routeCache.getStats().hits / (routeCache.getStats().hits + routeCache.getStats().misses) || 0
    },
    drivers: {
      keys: driverCache.keys().length,
      hits: driverCache.getStats().hits,
      misses: driverCache.getStats().misses,
      hitRate: driverCache.getStats().hits / (driverCache.getStats().hits + driverCache.getStats().misses) || 0
    },
    students: {
      keys: studentCache.keys().length,
      hits: studentCache.getStats().hits,
      misses: studentCache.getStats().misses,
      hitRate: studentCache.getStats().hits / (studentCache.getStats().hits + studentCache.getStats().misses) || 0
    },
    stats: {
      keys: statsCache.keys().length,
      hits: statsCache.getStats().hits,
      misses: statsCache.getStats().misses,
      hitRate: statsCache.getStats().hits / (statsCache.getStats().hits + statsCache.getStats().misses) || 0
    }
  };
};

// Initialize cache warming on startup
const initializeCache = async () => {
  console.log('Initializing cache...');
  await Promise.all([
    warmCache.routes(),
    warmCache.stats()
  ]);
  console.log('Cache initialization completed');
};

module.exports = {
  cacheRoutes,
  cacheDrivers,
  cacheStats,
  cacheStudents,
  invalidateCache,
  warmCache,
  getCacheStats,
  initializeCache,
  
  // Direct cache access for custom implementations
  routeCache,
  driverCache,
  statsCache,
  studentCache
};
