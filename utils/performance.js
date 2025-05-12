const performanceMetrics = {
  apiCalls: {},
  cacheStats: {
    hits: 0,
    misses: 0
  },
  componentRenders: {}
};

export const trackApiCall = (endpoint, startTime) => {
  const duration = Date.now() - startTime;
  if (!performanceMetrics.apiCalls[endpoint]) {
    performanceMetrics.apiCalls[endpoint] = {
      count: 0,
      totalDuration: 0,
      averageDuration: 0
    };
  }
  
  performanceMetrics.apiCalls[endpoint].count++;
  performanceMetrics.apiCalls[endpoint].totalDuration += duration;
  performanceMetrics.apiCalls[endpoint].averageDuration = 
    performanceMetrics.apiCalls[endpoint].totalDuration / performanceMetrics.apiCalls[endpoint].count;
};

export const trackCacheOperation = (isHit) => {
  if (isHit) {
    performanceMetrics.cacheStats.hits++;
  } else {
    performanceMetrics.cacheStats.misses++;
  }
};

export const trackComponentRender = (componentName, duration) => {
  if (!performanceMetrics.componentRenders[componentName]) {
    performanceMetrics.componentRenders[componentName] = {
      count: 0,
      totalDuration: 0,
      averageDuration: 0
    };
  }
  
  performanceMetrics.componentRenders[componentName].count++;
  performanceMetrics.componentRenders[componentName].totalDuration += duration;
  performanceMetrics.componentRenders[componentName].averageDuration = 
    performanceMetrics.componentRenders[componentName].totalDuration / 
    performanceMetrics.componentRenders[componentName].count;
};

export const getPerformanceMetrics = () => {
  return {
    ...performanceMetrics,
    cacheHitRate: performanceMetrics.cacheStats.hits / 
      (performanceMetrics.cacheStats.hits + performanceMetrics.cacheStats.misses) || 0
  };
}; 