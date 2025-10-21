/**
 * Performance Monitoring for MonaAI Backend
 */

const os = require('os');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        errors: 0,
        latencies: []
      },
      system: {
        cpuUsage: [],
        memoryUsage: [],
        uptime: 0
      },
      endpoints: {}
    };

    this.startTime = Date.now();
    this.startSystemMonitoring();
  }

  /**
   * Middleware to track request metrics
   */
  trackRequest() {
    return (req, res, next) => {
      const startTime = Date.now();

      // Track endpoint
      const endpoint = `${req.method} ${req.route?.path || req.path}`;
      if (!this.metrics.endpoints[endpoint]) {
        this.metrics.endpoints[endpoint] = {
          count: 0,
          avgLatency: 0,
          errors: 0
        };
      }

      // Intercept response
      const originalSend = res.send;
      res.send = function (data) {
        const latency = Date.now() - startTime;

        // Update metrics
        this.metrics.requests.total++;
        this.metrics.requests.latencies.push(latency);

        // Keep only last 1000 latencies
        if (this.metrics.requests.latencies.length > 1000) {
          this.metrics.requests.latencies.shift();
        }

        // Update endpoint metrics
        const endpointMetrics = this.metrics.endpoints[endpoint];
        endpointMetrics.count++;
        endpointMetrics.avgLatency =
          (endpointMetrics.avgLatency * (endpointMetrics.count - 1) + latency) /
          endpointMetrics.count;

        if (res.statusCode >= 400) {
          this.metrics.requests.errors++;
          endpointMetrics.errors++;
        } else {
          this.metrics.requests.success++;
        }

        return originalSend.call(this, data);
      }.bind(this);

      next();
    };
  }

  /**
   * Start monitoring system resources
   */
  startSystemMonitoring() {
    setInterval(() => {
      // CPU Usage
      const cpus = os.cpus();
      const cpuUsage = cpus.reduce((acc, cpu) => {
        const total = Object.values(cpu.times).reduce((a, b) => a + b);
        const idle = cpu.times.idle;
        return acc + (100 - (idle / total) * 100);
      }, 0) / cpus.length;

      this.metrics.system.cpuUsage.push({
        timestamp: Date.now(),
        usage: cpuUsage
      });

      // Keep only last 100 readings
      if (this.metrics.system.cpuUsage.length > 100) {
        this.metrics.system.cpuUsage.shift();
      }

      // Memory Usage
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryUsagePercent = (usedMemory / totalMemory) * 100;

      this.metrics.system.memoryUsage.push({
        timestamp: Date.now(),
        used: usedMemory,
        total: totalMemory,
        percentage: memoryUsagePercent
      });

      // Keep only last 100 readings
      if (this.metrics.system.memoryUsage.length > 100) {
        this.metrics.system.memoryUsage.shift();
      }

      // Uptime
      this.metrics.system.uptime = Date.now() - this.startTime;
    }, 5000); // Every 5 seconds
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    const avgLatency =
      this.metrics.requests.latencies.length > 0
        ? this.metrics.requests.latencies.reduce((a, b) => a + b, 0) /
          this.metrics.requests.latencies.length
        : 0;

    const p95Latency = this.calculatePercentile(this.metrics.requests.latencies, 95);
    const p99Latency = this.calculatePercentile(this.metrics.requests.latencies, 99);

    const latestCPU = this.metrics.system.cpuUsage.slice(-10);
    const avgCPU = latestCPU.length > 0
      ? latestCPU.reduce((acc, reading) => acc + reading.usage, 0) / latestCPU.length
      : 0;

    const latestMemory = this.metrics.system.memoryUsage[this.metrics.system.memoryUsage.length - 1];

    return {
      requests: {
        total: this.metrics.requests.total,
        success: this.metrics.requests.success,
        errors: this.metrics.requests.errors,
        successRate: this.metrics.requests.total > 0
          ? (this.metrics.requests.success / this.metrics.requests.total * 100).toFixed(2) + '%'
          : '0%',
        latency: {
          avg: avgLatency.toFixed(2) + 'ms',
          p95: p95Latency.toFixed(2) + 'ms',
          p99: p99Latency.toFixed(2) + 'ms'
        }
      },
      system: {
        uptime: this.formatUptime(this.metrics.system.uptime),
        cpu: {
          usage: avgCPU.toFixed(2) + '%',
          cores: os.cpus().length
        },
        memory: latestMemory ? {
          used: this.formatBytes(latestMemory.used),
          total: this.formatBytes(latestMemory.total),
          percentage: latestMemory.percentage.toFixed(2) + '%'
        } : {},
        platform: os.platform(),
        nodeVersion: process.version
      },
      endpoints: this.getTopEndpoints(10)
    };
  }

  /**
   * Calculate percentile
   */
  calculatePercentile(arr, percentile) {
    if (arr.length === 0) return 0;

    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  /**
   * Get top endpoints by request count
   */
  getTopEndpoints(limit = 10) {
    return Object.entries(this.metrics.endpoints)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, limit)
      .map(([endpoint, metrics]) => ({
        endpoint,
        count: metrics.count,
        avgLatency: metrics.avgLatency.toFixed(2) + 'ms',
        errors: metrics.errors,
        errorRate: metrics.count > 0
          ? (metrics.errors / metrics.count * 100).toFixed(2) + '%'
          : '0%'
      }));
  }

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Format uptime
   */
  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        errors: 0,
        latencies: []
      },
      system: {
        cpuUsage: [],
        memoryUsage: [],
        uptime: 0
      },
      endpoints: {}
    };
    this.startTime = Date.now();
  }

  /**
   * Health check
   */
  getHealthStatus() {
    const latestMemory = this.metrics.system.memoryUsage[this.metrics.system.memoryUsage.length - 1];
    const latestCPU = this.metrics.system.cpuUsage.slice(-10);
    const avgCPU = latestCPU.length > 0
      ? latestCPU.reduce((acc, reading) => acc + reading.usage, 0) / latestCPU.length
      : 0;

    const errorRate = this.metrics.requests.total > 0
      ? (this.metrics.requests.errors / this.metrics.requests.total) * 100
      : 0;

    let status = 'healthy';
    const issues = [];

    if (avgCPU > 80) {
      status = 'warning';
      issues.push('High CPU usage');
    }

    if (latestMemory && latestMemory.percentage > 90) {
      status = 'warning';
      issues.push('High memory usage');
    }

    if (errorRate > 10) {
      status = 'unhealthy';
      issues.push('High error rate');
    }

    return {
      status,
      issues,
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
const monitor = new PerformanceMonitor();

module.exports = monitor;
