export interface ProcessingMetrics {
  /** Number of cache hits during processing */
  cache_hits: number;
  /** Number of cache misses during processing */
  cache_misses: number;
  /** Number of operations performed in parallel */
  parallel_operations: number;
  /** Average time to process an operation (seconds) */
  average_processing_time: number;
  /** Total execution time (seconds) */
  execution_time: number;
  /** Start time of processing (ISO string) */
  start_time: string;
  /** End time of processing (ISO string) */
  end_time: string;
}
