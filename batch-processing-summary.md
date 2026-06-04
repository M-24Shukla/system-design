# Batch Processing - Chapter Summary

## Big Idea

Batch processing takes a bounded collection of input records, processes them in bulk, and writes a derived output dataset.

The core shape is:

```text
source data
  -> batch job
  -> derived data
```

Batch jobs are usually not user-facing request/response systems. They are used to compute reports, indexes, feature tables, analytics, recommendations, and other derived views from source-of-truth data.

If you remember one sentence:

```text
Batch processing is about reliably transforming large bounded datasets into rebuildable derived data.
```

---

## System Of Record And Derived Data

A system of record is the authoritative source of truth.

Examples:

- users database
- orders database
- payments database
- raw event log
- source files in a data lake

Derived data is computed from source data.

Examples:

- search indexes
- caches
- analytics dashboards
- recommendation feature tables
- materialized views
- daily revenue reports

Important idea:

```text
Protect the source of truth.
Treat derived data as rebuildable.
```

If derived data becomes corrupted or the logic has a bug, you can fix the code and recompute it from the source data.

Example:

```text
Raw YouTube watch events
  -> batch job
  -> trending videos, creator analytics, recommendation features
```

---

## What Is A Batch?

A batch is a selected group/window/chunk of input records processed together.

It is not the output.

Example:

```text
Batch = all watch events from June 3, 2026
```

or:

```text
Batch = all logs from 10:00 to 11:00
```

Then a batch job processes that input batch and writes output.

Example:

```text
Input batch:
all watch events from June 3

Output:
daily view counts for June 3
```

Weak-area correction:

```text
Batch = input slice/window.
Batch job = program that processes it.
Derived output = result produced from it.
```

---

## Online vs Batch vs Stream Processing

### Online Processing

Online processing is request/response processing while a user or client waits.

Shape:

```text
request -> process now -> response
```

Examples:

- login
- checkout
- search query
- open a YouTube video
- read account balance

Properties:

- low latency
- user-facing
- direct response expected

### Batch Processing

Batch processing handles bounded stored data in bulk.

Shape:

```text
many stored records -> batch job -> later output
```

Examples:

- daily revenue report
- nightly recommendation features
- monthly billing
- data warehouse ETL
- fraud analysis over historical data

Properties:

- high throughput
- higher latency
- bounded input
- output is derived data

### Stream Processing

Stream processing continuously reacts to events as they arrive.

Shape:

```text
event -> background processing -> updated derived state
```

Examples:

- live view count update
- real-time fraud alert
- notification pipeline
- live dashboard metrics

Properties:

- event-driven
- continuous
- often asynchronous
- lower latency than batch

Key distinction:

```text
Online processing answers a request.
Stream processing reacts to events.
Batch processing processes bounded stored data in bulk.
```

Systems often combine batch and stream:

```text
streaming for fresh approximate results
batch for accurate large-scale recomputation
```

---

## Unix Tools As Batch Processors

Unix pipelines are a small-scale model of batch processing.

Example:

```bash
cat access.log | awk '{print $7}' | sort | uniq -c | sort -nr | head -10
```

This pipeline:

```text
reads input
extracts a field
sorts records
groups/counts records
sorts by count
writes top results
```

Unix tools demonstrate key batch-processing principles:

- simple data model: one line is one record
- composability: output of one tool is input to another
- streaming execution: process records without loading the full file
- explicit input/output
- sorting as a grouping primitive

### Huge Files

A TB-sized file does not need to be loaded into memory.

Good:

```python
with open("big.log") as f:
    for line in f:
        process(line)
```

Bad:

```python
lines = open("big.log").readlines()
```

The good version processes one line at a time.

### Searching Sorted Logs

If logs are sorted by timestamp, binary search can work by byte offset, not by line number.

Why?

Log lines are usually variable length, so line `N` does not have a predictable byte location.

Process:

```text
seek to byte offset
discard partial line
read next full line
compare timestamp
binary search until near start timestamp
scan forward until end timestamp
```

For repeated queries, partition by time or build an index:

```text
timestamp -> byte offset
```

---

## MapReduce Basics

MapReduce is a distributed batch processing model.

Shape:

```text
input records
  -> mapper emits key-value pairs
  -> framework groups by key
  -> reducer processes each key group
  -> output
```

### Mapper

The mapper reads input records and emits zero or more key-value pairs.

YouTube view-count example:

```text
input: user1 video9 120
mapper emits: (video9, 1)
```

### Reducer

The reducer receives one key and all values for that key.

Example:

```text
video9 -> [1, 1, 1]
```

Reducer sums:

```text
video9 -> 3
```

### Framework

The MapReduce framework handles:

- splitting input
- scheduling tasks
- running mapper/reducer code
- shuffle and sort
- retries
- writing output

### Where They Sit

```text
mapper/reducer = job logic you write
framework = execution engine
cluster/storage = machines, network, HDFS/S3
```

### Hadoop Configuration Weak Area

Hadoop MapReduce is configured in three layers:

```text
1. mapper/reducer code: what to compute
2. job configuration: input path, output path, classes, key/value types, reducers
3. cluster/runtime config: memory, CPU, queue, retry limits, shuffle settings
```

---

## Shuffle And Sort

Mappers and reducers do not directly talk like normal functions.

Between them, the framework performs shuffle and sort.

### Shuffle

Shuffle moves mapper output key-value pairs to the reducer responsible for each key.

Example:

```text
all video9 records -> same reducer
all video4 records -> same reducer
```

Default partitioning often uses:

```text
hash(key) % number_of_reducers
```

### Sort

Sort orders intermediate records by key, so each reducer can process one key group at a time.

Example:

```text
video2 -> [1]
video4 -> [1, 1]
video9 -> [1, 1, 1]
```

### Why Shuffle/Sort Is Expensive

It often involves:

- writing mapper output to local disk
- network transfer
- sorting intermediate data
- merging sorted files
- reducers waiting for mapper output

### Combiner

A combiner performs local partial aggregation before shuffle.

Without combiner:

```text
(video9, 1)
(video9, 1)
(video9, 1)
```

With combiner:

```text
(video9, 3)
```

This reduces shuffle volume.

Combiners are safe for operations like:

- sum
- count
- min
- max

Weak-area correction:

```text
Not every reducer is safe as a combiner.
Combiners operate on partial local data and may run zero, one, or many times.
```

Average is unsafe directly:

```text
avg(avg(10, 20), avg(100)) != avg(10, 20, 100)
```

Make it safe by emitting:

```text
(sum, count)
```

---

## Reduce-Side Joins

A join combines datasets by a shared key.

Reduce-side join performs the join in the reducer.

Example datasets:

Videos:

```text
video9 -> title="Database Internals"
video4 -> title="Distributed Systems"
```

Watch events:

```text
user1 video9 120
user2 video9 300
user3 video4 60
```

Mapper emits tagged records:

```text
(video9, ("video", "Database Internals"))
(video9, ("watch", "user1", 120))
(video9, ("watch", "user2", 300))
```

Shuffle groups by join key:

```text
video9 ->
  video metadata
  watch event
  watch event
```

Reducer joins:

```text
user1 video9 "Database Internals" 120
user2 video9 "Database Internals" 300
```

Key idea:

```text
mapper emits join key
mapper tags source dataset
shuffle groups matching records
reducer performs the join
```

Reduce-side joins are general but expensive because both datasets may be shuffled across the network.

---

## Map-Side Joins

Map-side joins perform the join in the mapper and avoid reducer-side shuffle.

They are faster but require prepared/compatible input.

### Broadcast Hash Join

Use when one dataset is small enough to fit in memory.

Example:

```text
small dataset: video metadata
large dataset: watch events
```

Each mapper loads metadata into a hash table:

```text
video_id -> metadata
```

Then it scans watch events and looks up metadata locally.

Good when:

```text
one dataset is small
```

Bad when:

```text
small dataset is too large for memory
```

### Partitioned Hash Join

Use when both datasets are partitioned by the same join key using the same scheme.

Requirements:

```text
same join key
same partitioning scheme
compatible partition counts/hash function
```

Then corresponding partitions can be joined locally.

### Sort-Merge Join

Use when both datasets are sorted by the same join key.

Mapper reads both sorted inputs and merges matching keys.

Requirements:

```text
both datasets sorted by join key
corresponding sorted ranges can be read together
```

### Map-Side vs Reduce-Side

```text
Map-side join:
fast, avoids shuffle, requires prepared input

Reduce-side join:
general, works without preparation, expensive shuffle
```

Message queues can help only if data is already partitioned compatibly. Otherwise, pushing records through a broker is just moving the shuffle elsewhere.

---

## Batch Workflows And Chained Jobs

Real batch processing is often a workflow, not one job.

Example:

```text
raw_watch_events
  -> clean_watch_events
  -> video_watch_aggregates
  -> join metadata
  -> recommendation_feature_table
```

A workflow is a pipeline of jobs where output of one job becomes input to another.

### DAG

Batch workflows are often represented as a DAG:

```text
Directed Acyclic Graph
```

Meaning:

```text
directed: dependencies point from earlier jobs to later jobs
acyclic: no cycles
```

### Workflow Schedulers

Examples:

- Airflow
- Oozie
- Luigi
- Dagster
- Prefect

Schedulers handle:

- dependencies
- retries
- schedules
- monitoring
- status

### Materialized Intermediate Outputs

Writing intermediate outputs between jobs adds I/O cost, but it creates checkpoints.

Benefits:

- retry from last successful step
- inspect/debug intermediate data
- reuse outputs in multiple downstream jobs
- isolate failures

Weak-area correction:

```text
Materialization means writing intermediate output to storage as a checkpoint.
```

---

## Data Skew And Hot Keys

Data skew means some keys, partitions, or reducers receive much more data/work than others.

A hot key is a key with disproportionately many records.

Example:

```text
video_viral -> 500 million records
normal_video -> 10,000 records
```

Since all values for the same key go to one reducer, the viral video key can overload one reducer.

### Straggler

A straggler is a task that runs much slower than others and delays the whole job.

Even if 99 reducers finish, the job waits for the last slow reducer.

### Hot Keys In Joins

Hot keys are painful in reduce-side joins because all matching records from both datasets converge on one reducer.

Example:

```text
celebrity_user metadata
+ 1 billion events
-> one reducer
```

### Mitigations

- salting hot keys
- combiners for aggregation
- custom partitioners
- sampling to estimate key distribution
- special-case known hot keys

Salting example:

```text
video_viral#0
video_viral#1
...
video_viral#99
```

Then multiple reducers process partial groups, and a later job combines the results.

---

## Fault Tolerance In Batch Processing

Batch processing systems expect failures.

If one task fails, the framework reruns that task instead of restarting the whole job.

### Map Task Failure

Input data is stored durably in HDFS/S3.

If a map task fails:

```text
rerun the same input split on another worker
```

### Reduce Task Failure

If a reducer fails:

```text
discard partial output
rerun reducer
fetch intermediate mapper outputs again
```

If mapper intermediate output is lost, the corresponding map task may rerun.

### Determinism

Task retries are safe when:

```text
same input -> same output
```

### Speculative Execution

Speculative execution launches a duplicate copy of a slow task.

```text
original task still running
duplicate task starts elsewhere
first successful copy wins
```

This helps with stragglers.

### External Side Effects

Map/reduce tasks should avoid external side effects:

- sending emails
- charging cards
- directly mutating external databases

Retries may duplicate side effects.

### Final Output Visibility

Final output should become visible only after task/job completion.

Why?

```text
partial failed output should not be exposed as valid result
```

The framework can discard incomplete attempts and publish only complete successful output.

---

## Materialized Outputs And Derived Data

Batch jobs usually write materialized output datasets.

Examples:

- daily view count table
- creator analytics table
- recommendation feature table
- search index
- trending video ranking

Avoid updating final serving tables record by record.

Bad:

```text
for each event:
  update final table immediately
```

If the job fails halfway, users may see half-old, half-new results.

Better:

```text
write complete output to temporary location
publish/swap only after success
```

Example:

```text
/output/video_views/date=2026-06-03/tmp
```

After success:

```text
rename tmp -> final
```

Publishing may be:

- atomic rename
- pointer swap
- partition replacement

### Idempotent Batch Jobs

A batch job should be rerunnable.

If run twice over the same input, it should produce the same output without duplicates or double-counting.

This helps with:

- retries
- backfills
- bug fixes
- corruption recovery

---

## Why MapReduce Was Replaced

MapReduce was reliable and scalable, but rigid and slow for complex pipelines.

Classic MapReduce shape:

```text
read input
map
shuffle/sort
reduce
write output to disk
```

Each job writes materialized output before the next job starts.

For chained workflows:

```text
Job 1 -> disk
Job 2 reads disk -> disk
Job 3 reads disk -> disk
```

This creates lots of:

- disk I/O
- network I/O
- serialization/deserialization
- workflow scheduling overhead
- waiting between jobs

### Iterative Algorithms

Machine learning and graph algorithms often need many iterations.

MapReduce repeatedly reads and writes intermediate state to disk.

That is inefficient.

### Spark And Modern Engines

Spark improved on MapReduce by:

- keeping intermediate data in memory when possible
- offering richer APIs
- optimizing whole pipelines
- reducing unnecessary materialization
- supporting SQL/DataFrames and more expressive transformations

Spark does not eliminate shuffle.

It still has:

- partitioning
- shuffle
- joins
- skew
- retries
- fault tolerance

But it executes more flexibly and efficiently.

### Why MapReduce Still Matters

Modern systems still use the same core ideas:

- partitioning
- shuffle
- sort/group by key
- joins
- combiners/partial aggregation
- fault-tolerant retries
- materialized outputs
- skew handling

Understanding MapReduce helps you understand Spark, Flink, Beam, data warehouses, and distributed SQL engines.

---

## Your Weak Areas And Corrections

### 1. Batch Meaning

Weak version:

```text
Batch is the output/result.
```

Correct version:

```text
Batch is the bounded input slice/window of records processed together.
```

### 2. Stream vs Online

Online:

```text
request -> immediate response
```

Stream:

```text
event -> continuous background processing
```

### 3. Huge File Search

Line-number commands often scan from the beginning.

For timestamp-sorted variable-length logs, binary search by byte offset:

```text
seek offset
align to next full line
compare timestamp
scan forward after finding start
```

### 4. Hadoop MapReduce Configuration

Three layers:

```text
mapper/reducer code: what to compute
job config: paths/classes/types/reducers
cluster config: memory/CPU/queues/retries/shuffle
```

### 5. Combiner Safety

Combiners process partial local data.

Safe:

```text
sum, count, min, max
```

Unsafe directly:

```text
average
```

Fix average using:

```text
(sum, count)
```

### 6. Reduce-Side vs Map-Side Join

Reduce-side:

```text
shuffle brings matching records together
general but expensive
```

Map-side:

```text
matching data already available locally
fast but requires prepared inputs
```

### 7. Straggler Definition

A straggler is a slow task that delays the whole job.

### 8. Materialized Output

The main danger of record-by-record output updates is exposing partial/inconsistent results.

Correct pattern:

```text
write complete output elsewhere
publish atomically after success
```

---

## Quick Comparison Table

| Concept | Main Meaning |
|---|---|
| System of record | Source of truth |
| Derived data | Rebuildable data computed from source |
| Batch | Bounded input slice/window |
| Online processing | Request/response with low latency |
| Stream processing | Continuous event processing |
| Mapper | Emits intermediate key-value pairs |
| Reducer | Processes all values for one key |
| Shuffle | Moves mapper output to reducers by key |
| Sort | Groups ordered keys for reducers |
| Combiner | Local partial aggregation before shuffle |
| Reduce-side join | Join done in reducer after shuffle |
| Map-side join | Join done in mapper with prepared inputs |
| DAG | Directed acyclic job dependency graph |
| Hot key | Key with disproportionately many records |
| Straggler | Slow task delaying whole job |
| Speculative execution | Duplicate slow task; first success wins |
| Materialized output | Durable derived result dataset |
| Spark | Modern engine that avoids unnecessary disk materialization |

---

## Final Mental Model

Batch processing is the engineering discipline of turning large, bounded source datasets into reliable derived outputs.

MapReduce taught the core pattern:

```text
map records into key-value pairs
shuffle/sort by key
reduce grouped values
write materialized output
```

Modern engines like Spark optimize this pattern, but the fundamentals remain:

```text
partitioning
shuffle
joins
skew
fault tolerance
materialized outputs
recomputation
```

The practical design question is always:

```text
Can I transform this source data into derived output in a way that is scalable, retryable, and safe from partial results?
```
