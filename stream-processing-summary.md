# Stream Processing - Chapter Summary

## Big Idea

Stream processing continuously processes events as they arrive.

Batch processing handles bounded input:

```text
all records from yesterday
```

Stream processing handles unbounded input:

```text
event 1
event 2
event 3
...
```

If you remember one sentence:

```text
Stream processing creates fresh derived data from unbounded event streams, but correctness depends on offsets, time, state, replay, and duplicate handling.
```

---

## Stream Processing Overview

A stream is an unbounded sequence of events.

Examples:

- video watched
- message sent
- payment attempted
- order created
- sensor reading received
- user clicked ad

Stream processing continuously consumes those events and updates derived state, triggers actions, or writes outputs.

Example: YouTube

```text
watch event arrives
  -> update near-real-time view count
  -> update recommendation signal
  -> detect suspicious activity
  -> feed analytics pipeline
```

Stream processing differs from online processing:

```text
online = user/client waits for response
stream = event-driven processing, often asynchronous/background
```

Stream processing differs from batch:

```text
batch = bounded historical data
stream = unbounded continuous events
```

---

## Events And Event Streams

An event is an immutable record of something that happened.

Example:

```json
{
  "event_id": "e123",
  "event_type": "video_watched",
  "user_id": "u10",
  "video_id": "v9",
  "watched_seconds": 120,
  "timestamp": "2026-06-06T10:00:00Z"
}
```

Events are usually immutable because they represent facts. If something needs correction, append another event rather than editing the old one.

Example:

```text
payment_charged
payment_refunded
```

An event stream is an ordered log/sequence of events.

Example:

```text
offset 100: video_watched u10 v9
offset 101: video_liked u10 v9
offset 102: comment_created u11 v9
```

### Event vs State

Event:

```text
deposit 100
withdraw 50
deposit 200
```

State:

```text
current balance = 500
```

State is the result of applying events over time.

Key takeaway:

```text
Events are immutable facts; state is the result of applying facts.
```

---

## Logs, Offsets, And Consumers

Many stream systems store events in an append-only log.

An offset is an event's position in that log.

Example:

```text
offset 0: user u1 watched video v9
offset 1: user u2 watched video v4
offset 2: user u1 liked video v9
```

A consumer is an application/process that reads events and tracks its offset.

Examples:

- view count updater
- recommendation feature builder
- fraud detector
- notification service
- analytics pipeline

Different consumers can track different offsets independently.

Example:

```text
view count updater: offset 1000
fraud detector: offset 900
analytics pipeline: offset 200
```

### Offset Commit Timing

Commit offset before processing:

```text
crash after commit but before processing -> event may be lost
```

Commit offset after processing:

```text
crash after processing but before commit -> event may be processed again
```

Key takeaway:

```text
Offset commit timing creates the loss-vs-duplicate tradeoff.
```

---

## Messaging Systems: Queues And Pub-Sub

Messaging systems move messages/events from producers to consumers.

### Queue Model

In a queue, each message is handled by one worker in a group.

Good for distributing work:

- email sending
- image resizing
- video transcoding
- payment retry jobs

Shape:

```text
message 1 -> worker A
message 2 -> worker B
message 3 -> worker A
```

### Pub-Sub Model

In pub-sub, multiple subscribers can receive the same event.

Example:

```text
event: order_created
```

Subscribers:

- inventory service
- email service
- analytics service
- fraud service

### Kafka Consumer Groups

Kafka is pub-sub across consumer groups:

```text
analytics group receives all events
fraud group receives all events
recommendations group receives all events
```

Kafka is queue-like within a consumer group:

```text
partitions are divided among consumers
each message is processed by one consumer in that group
```

Key correction:

```text
Kafka queue-vs-pub-sub behavior comes from consumer groups.
There is no producer-group requirement.
```

---

## Partitioned Logs

A topic can be split into multiple partitions.

Each partition is an ordered append-only log.

Ordering is guaranteed within a partition, not across the whole topic.

Example:

```text
topic: watch_events
partition 0: ordered log
partition 1: ordered log
partition 2: ordered log
```

Producers often choose a partition using a key:

```text
partition = hash(key) % number_of_partitions
```

Events with the same key usually go to the same partition.

This preserves per-key ordering.

Example:

```text
all events for user_id=123 -> same partition
```

Consumer group assignment:

```text
6 partitions, 3 consumers -> each consumer may get 2 partitions
4 partitions, 10 consumers -> 6 consumers sit idle
```

Key takeaway:

```text
Partition key is a tradeoff: preserve the ordering you need while avoiding hot partitions.
```

---

## Delivery Semantics

Delivery semantics describe what can happen under failure.

### At-Most-Once

An event is processed zero or one time.

```text
no duplicates
possible loss
```

### At-Least-Once

An event is processed one or more times.

```text
no loss
possible duplicates
```

### Exactly-Once

Exactly-once usually means exactly-once within a specific processing scope.

Example:

```text
Kafka input topic
  -> Kafka Streams processing
  -> Kafka output topic
```

It does not magically guarantee exactly-once external side effects like:

- sending emails
- charging cards
- calling third-party APIs

### How Exactly-Once Is Approached

Mechanisms include:

- idempotent producers
- transactional offset commits and output writes
- checkpoints
- deduplication by event ID
- idempotency keys for external systems

Important failure mode:

```text
send email
crash before committing offset
restart
send email again
```

Key takeaway:

```text
Exactly-once is not magic.
It requires transactions, checkpointing, idempotency, or deduplication.
```

---

## Event Time vs Processing Time

Event time:

```text
when the event actually happened
```

Processing time:

```text
when the processor observed or processed the event
```

Example:

```text
event happened at 10:01
processor received it at 10:06
```

For analytics like:

```text
views between 10:00 and 10:05
```

event time is usually more correct.

### Late Events

A late event is an event that belongs to an earlier event-time window but arrives after that window was considered complete or published.

Example:

```text
event_time = 10:03
window = 10:00-10:05
event arrives at 10:08 after output was emitted
```

### Watermarks

A watermark is the processor's estimate:

```text
I believe I have seen most events up to event time T.
```

Watermarks help decide when to close windows.

They are useful but not perfect because very late events may still arrive.

Key correction:

```text
Late is defined relative to a window/watermark, not merely by a large delay.
```

---

## Windowing

Streams are unbounded, so stream processors use windows to compute finite results.

Example:

```text
views per 5 minutes
orders per hour
errors per 1 minute
```

### Tumbling Windows

Fixed-size, non-overlapping windows.

Example:

```text
10:00-10:05
10:05-10:10
10:10-10:15
```

Each event belongs to one window.

### Hopping / Sliding Windows

Fixed-size windows that start at regular intervals and overlap.

Example:

```text
window size = 10 minutes
hop = 5 minutes

10:00-10:10
10:05-10:15
10:10-10:20
```

An event at 10:07 belongs to multiple windows.

### Session Windows

Session windows group events separated by inactivity gaps.

Example:

```text
user active at 10:01, 10:03, 10:05
inactive for 30 minutes
new activity at 10:40 starts new session
```

Key takeaway:

```text
Windows make infinite streams computable; late events make window results provisional.
```

---

## Stream Joins

A stream join combines events/tables by a join key.

### Stream-Stream Join

Both inputs are event streams.

Example:

```text
ad_impressions stream
ad_clicks stream
```

Join:

```text
impression + click within 30 minutes
```

Stream-stream joins need windows because the processor cannot keep old events forever waiting for a match.

### Stream-Table Join

One input is a stream, the other is table/reference state.

Example:

```text
watch event stream
video metadata table
```

When a watch event arrives:

```text
lookup video metadata
emit enriched watch event
```

### Table-Table Join

Both sides represent changing state.

This is like continuously maintaining a materialized view.

### State Growth

Stream joins can cause unbounded state growth if old unmatched events are kept forever.

Use:

- windows
- watermarks
- retention rules
- expiration policies

Key correction:

```text
Stream-stream joins need windows to bound how long old events are kept waiting for matches.
```

---

## Fault Tolerance And State

Stream processors often maintain state:

- window counts
- aggregates
- join buffers
- deduplication IDs
- session state
- materialized tables
- fraud scores

If the processor crashes, it must restore:

```text
state + input offsets
```

consistently.

### Checkpoints

A checkpoint is a saved snapshot of state and offsets.

Example:

```text
checkpoint:
  offset = 500
  view_count(video9) = 10,000
```

After crash:

```text
restore checkpoint
resume from offset 501
```

### Replay

Logs retain events, so after restoring a checkpoint, the processor can replay events after that checkpoint.

Example:

```text
checkpoint at 500
crash at 540
restore checkpoint 500
replay 501-540
```

### Consistency Of State And Offsets

If offset is ahead of state:

```text
events may be skipped
```

If state is ahead or offset is behind:

```text
events may be processed twice
```

### Output Duplicates

Output may duplicate if:

```text
processor writes output
crashes before checkpoint/offset commit
replays event
writes output again
```

Use idempotent or transactional sinks.

Key takeaway:

```text
Stateful stream recovery must restore state, offsets, and outputs consistently.
```

---

## Change Data Capture

Change Data Capture, or CDC, turns database changes into event streams.

Examples:

```text
row inserted
row updated
row deleted
```

CDC often reads database change logs:

- Postgres WAL
- MySQL binlog
- MongoDB oplog
- SQL Server transaction log

Example:

```sql
UPDATE orders SET status = 'paid' WHERE id = 123;
```

CDC event:

```json
{
  "event_type": "update",
  "table": "orders",
  "id": 123,
  "before": { "status": "created" },
  "after": { "status": "paid" }
}
```

### Why CDC Is Useful

CDC can update derived systems:

- search indexes
- caches
- analytics warehouses
- fraud pipelines
- notification systems
- stream processors

### CDC vs Dual Writes

Without CDC:

```text
write to DB
publish event
```

Problem:

```text
DB write succeeds
event publish fails
```

Now downstream systems miss the event.

CDC derives the event from the committed database log, so the database remains the source of truth.

### Initial Snapshot + Change Stream

CDC often needs:

```text
initial snapshot of existing rows
+ ongoing stream of changes
```

The snapshot gives the baseline. The change stream keeps it updated.

Key correction:

```text
CDC reads change logs like WAL/binlog/oplog.
Initial snapshot is a separate bootstrap step.
```

---

## Stream Processing vs Batch Processing

Batch and stream processing both produce derived data.

They solve different timing problems.

### Batch Strengths

Batch is good for:

- historical recomputation
- backfills
- correcting bugs
- training ML models
- official reports
- processing complete datasets
- rebuilding derived views

Batch can say:

```text
Now that I have all data for yesterday, compute final result.
```

### Stream Strengths

Stream is good for:

- low-latency updates
- live dashboards
- fraud alerts
- notifications
- near-real-time derived data
- continuous pipelines

Stream can say:

```text
An event arrived. Update result now.
```

### YouTube Example

Stream:

```text
update live view count
detect suspicious spikes
feed near-real-time recommendations
```

Batch:

```text
recompute official daily counts
remove bot views
fix missed/late events
train models on complete historical data
```

Key summary:

```text
stream = freshness
batch = recomputation/correction/completeness
```

### Lambda Architecture

Lambda uses separate paths:

```text
batch layer
speed/stream layer
serving layer
```

Stream layer gives fresh approximate results.

Batch layer later recomputes accurate results.

Downside:

```text
two code paths to maintain
```

### Kappa Architecture

Kappa treats everything as a stream.

If recomputation is needed:

```text
replay the event log
```

Works well if:

- events are retained long enough
- processing is deterministic
- state can be rebuilt
- replay is efficient

Key takeaway:

```text
Replayability gives stream systems some of the corrective power of batch systems.
```

---

## Your Weak Areas And Corrections

### 1. Exactly-Once Is Not Magic

Exactly-once requires:

- transactional offset/output commits
- checkpointing
- idempotent producers
- idempotent sinks
- deduplication

External side effects like email/payment need their own idempotency support.

### 2. Kafka Queue vs Pub-Sub

Kafka is pub-sub across consumer groups.

Kafka is queue-like within a consumer group.

### 3. Late Event Definition

Weak version:

```text
event time and processing time differ a lot
```

Correct version:

```text
event belongs to an earlier event-time window but arrives after that window was considered complete
```

### 4. Stream-Stream Join State

If no window/expiration exists, the processor may keep unmatched events forever.

Use windows, watermarks, and retention rules.

### 5. Stateful Fault Tolerance

State, offsets, and outputs must be consistent.

If they are not:

- events may be skipped
- events may be double-counted
- joins/windows may be wrong
- outputs may duplicate

### 6. CDC Logs vs Snapshot

CDC reads database change logs like WAL/binlog/oplog.

Initial snapshot is a bootstrap step for existing rows, not the same thing as the change log.

---

## Quick Comparison Table

| Concept | Main Meaning |
|---|---|
| Event | Immutable fact that something happened |
| State | Current result after applying events |
| Log | Append-only ordered event sequence |
| Offset | Position in the log |
| Consumer | Application that reads/processes events |
| Queue | One message handled by one worker in a group |
| Pub-sub | Same message delivered to many subscriber groups |
| Partitioned log | Topic split into ordered partitions |
| At-most-once | Possible loss, no duplicates |
| At-least-once | No loss, possible duplicates |
| Exactly-once | Scoped guarantee using transactions/idempotency/checkpoints |
| Event time | When the event happened |
| Processing time | When processor saw it |
| Watermark | Estimate of event-time progress |
| Tumbling window | Fixed non-overlapping window |
| Hopping window | Fixed overlapping window |
| Session window | Window based on inactivity gap |
| Stream-stream join | Join two event streams, usually with a time window |
| Stream-table join | Enrich event stream with table/reference state |
| Checkpoint | Snapshot of state plus offsets |
| CDC | Database changes emitted as event streams |

---

## Final Mental Model

Stream processing is what happens when derived data needs to be fresh.

The hard parts are not just reading events quickly. The hard parts are:

```text
What order are events in?
What if events arrive late?
What if the processor crashes?
What if output happened but offset commit did not?
How long should join/window state be retained?
Can we replay and rebuild state?
```

A robust stream system combines:

- append-only logs
- offsets
- partitioning
- consumer groups
- idempotency
- checkpoints
- event-time windows
- watermarks
- replay
- transactional or idempotent sinks

Final sentence:

```text
Stream processing trades the simplicity of complete bounded input for low-latency derived data, so correctness depends on careful handling of time, state, failure, and replay.
```
