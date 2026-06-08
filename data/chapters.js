window.DDIA_CHAPTERS = [
  {
    id: "transactions",
    title: "Transactions",
    subtitle: "ACID, isolation levels, anomalies, and serializability",
    notesPath: "./transactions-chapter-summary.md",
    flashcards: [
      {
        front: "What does atomicity mean?",
        back: "A transaction's writes are all-or-nothing: commit keeps all writes; abort rolls partial writes back."
      },
      {
        front: "How is ACID consistency different from replication consistency?",
        back: "ACID consistency is about preserving validity rules and invariants. Replication consistency is about replicas agreeing or read freshness."
      },
      {
        front: "What does Read Committed prevent?",
        back: "Dirty reads and dirty writes. It does not provide a stable transaction-wide snapshot."
      },
      {
        front: "Why can Read Committed show an inconsistent report?",
        back: "Each read sees the latest committed value at that moment, so different reads can observe different committed points in time."
      },
      {
        front: "What is MVCC?",
        back: "Multi-version concurrency control: the database keeps multiple record versions so transactions can read the version visible to their snapshot."
      },
      {
        front: "Lost update vs write skew?",
        back: "Lost update overwrites the same object. Write skew updates different objects but breaks a shared invariant."
      },
      {
        front: "What does serializability mean?",
        back: "Concurrent transactions have the same result as if they ran one at a time in some serial order."
      },
      {
        front: "2PL vs SSI?",
        back: "2PL pessimistically blocks conflicts with locks. SSI optimistically runs transactions on snapshots and aborts dangerous conflicts."
      }
    ],
    questions: [
      {
        prompt: "Under Read Committed, which anomaly can still happen?",
        options: ["Dirty read", "Dirty write", "Non-repeatable read", "Reading uncommitted data"],
        answer: 2,
        explanation: "Read Committed prevents dirty reads and dirty writes, but the same transaction can read different committed values at different times."
      },
      {
        prompt: "Which statement best describes snapshot isolation?",
        options: [
          "Every read sees the newest committed value",
          "All reads in a transaction see one stable committed snapshot",
          "Transactions literally execute one at a time",
          "Uncommitted writes are visible to readers"
        ],
        answer: 1,
        explanation: "Snapshot isolation gives a stable view of committed data as of a particular point in time."
      },
      {
        prompt: "Two doctors both read that the other is on call, then each marks themselves off call. What anomaly is this?",
        options: ["Dirty read", "Lost update", "Write skew", "Dirty write"],
        answer: 2,
        explanation: "They write different rows, but together violate the invariant that at least one doctor is on call."
      },
      {
        prompt: "Serializable isolation means:",
        options: [
          "Transactions always produce the same result under every possible order",
          "Transactions must physically run one at a time",
          "The result is equivalent to some serial order",
          "Transactions never abort"
        ],
        answer: 2,
        explanation: "Serializable means equivalent to one valid serial order, not every order and not necessarily literal serial execution."
      },
      {
        prompt: "Why do stored procedures help actual serial execution?",
        options: [
          "They guarantee all data is in memory",
          "They avoid client-server round trips during the transaction",
          "They remove the need for durability",
          "They make all queries read-only"
        ],
        answer: 1,
        explanation: "The full transaction logic runs inside the database, so the serial execution thread is not waiting on interactive client round trips."
      }
    ],
    weakAreas: [
      {
        title: "Atomicity is not pending jobs",
        text: "Atomicity means abortability: uncommitted partial writes are rolled back or ignored. Retry queues and sagas are separate application patterns."
      },
      {
        title: "Read Committed has mixed views",
        text: "Every read can be committed and still form an inconsistent report because reads may come from different committed moments."
      },
      {
        title: "Snapshot Isolation is not Serializable",
        text: "Snapshot isolation gives stable reads, but concurrent transactions can still break invariants through write skew."
      },
      {
        title: "Some serial order",
        text: "Serializable means equivalent to some valid serial order, not all possible orders."
      }
    ],
    cheatSheet: [
      ["Atomicity vs Isolation", "Atomicity handles partial failure. Isolation handles concurrent transactions."],
      ["Read Committed vs Snapshot", "Read Committed sees latest committed data per read. Snapshot sees one committed view for the transaction."],
      ["Lost Update vs Write Skew", "Lost update overwrites the same object. Write skew writes different objects and breaks an invariant."],
      ["2PL vs SSI", "2PL blocks conflicts. SSI tracks dangerous dependencies and may abort later."]
    ]
  },
  {
    id: "distributed-trouble",
    title: "The Trouble With Distributed Systems",
    subtitle: "Partial failures, clocks, pauses, quorums, and system models",
    notesPath: "./trouble-with-distributed-systems-summary.md",
    flashcards: [
      {
        front: "What does a timeout prove?",
        back: "Nothing certain. It only proves no response arrived within the deadline; the outcome is unknown."
      },
      {
        front: "Why does tail latency matter?",
        back: "A small slow fraction can dominate user experience, especially when one request fans out to many services."
      },
      {
        front: "Time-of-day clock vs monotonic clock?",
        back: "Time-of-day gives wall-clock date/time and can jump. Monotonic clocks measure elapsed time and only move forward locally."
      },
      {
        front: "What is clock drift?",
        back: "Hardware clocks run at slightly different rates, causing clock differences to grow over time."
      },
      {
        front: "Why is a paused process dangerous?",
        back: "It may resume with stale beliefs, such as thinking it is still leader or still owns a lease."
      },
      {
        front: "What does a fencing token do?",
        back: "It is a monotonically increasing ownership token. Resources reject stale requests with older tokens."
      },
      {
        front: "Why do majorities help prevent split brain?",
        back: "Any two majorities overlap, so two disconnected minorities cannot both make authoritative conflicting decisions."
      },
      {
        front: "Safety vs liveness?",
        back: "Safety means bad things never happen. Liveness means good things eventually happen."
      }
    ],
    questions: [
      {
        prompt: "A request times out. What can the caller safely conclude?",
        options: [
          "The remote node definitely crashed",
          "The operation definitely did not happen",
          "No response arrived before the deadline",
          "The network is permanently broken"
        ],
        answer: 2,
        explanation: "Timeouts indicate uncertainty. The request or response may be delayed, lost, or the operation may have completed."
      },
      {
        prompt: "Which clock should be used for measuring elapsed request duration?",
        options: ["Time-of-day clock", "Monotonic clock", "Wall-clock timestamp", "Last-write-wins timestamp"],
        answer: 1,
        explanation: "Monotonic clocks are designed for elapsed time because they do not jump backward."
      },
      {
        prompt: "Why is a lease alone unsafe with process pauses?",
        options: [
          "Leases cannot expire",
          "A paused process may resume after lease expiry and act on stale ownership",
          "Leases require Byzantine fault tolerance",
          "Leases only work with one node"
        ],
        answer: 1,
        explanation: "The process may not observe that time passed while paused, so it can continue acting as if it still owns the lease."
      },
      {
        prompt: "For fencing tokens to work, what must the shared resource do?",
        options: [
          "Conduct leader elections",
          "Ignore tokens from old leaders",
          "Check tokens and reject stale ones",
          "Use only local clocks"
        ],
        answer: 2,
        explanation: "A token only protects the resource if the resource enforces monotonic token ordering."
      },
      {
        prompt: "In a 5-node cluster split into groups of 2 and 3, which side can make authoritative decisions?",
        options: ["The 2-node side", "The 3-node side", "Both sides", "Neither side ever"],
        answer: 1,
        explanation: "Three nodes form a majority of five. The minority should stop making authoritative decisions."
      }
    ],
    weakAreas: [
      {
        title: "Timeout is not proof",
        text: "After a timeout, the system suspects failure or treats the request as failed operationally. The true outcome is still unknown."
      },
      {
        title: "Clock drift vs offset",
        text: "Offset is the current difference. Drift is clocks running at different rates, causing differences to accumulate."
      },
      {
        title: "Fencing must be enforced",
        text: "A coordinator may issue tokens, but the shared resource must reject older tokens for fencing to work."
      },
      {
        title: "Quorum is broader than election",
        text: "Majority/quorum defines authoritative distributed decisions generally. Leader election is one example."
      }
    ],
    cheatSheet: [
      ["Timeout", "No response by deadline; not proof of failure."],
      ["Tail Latency", "The slowest fraction matters because fanout increases the chance of hitting it."],
      ["Time-of-Day vs Monotonic", "Wall-clock for dates/logs; monotonic for elapsed duration."],
      ["Paused vs Crashed", "Crashed stops. Paused can resume with stale state."],
      ["Lease vs Fencing", "Lease grants temporary ownership; fencing lets resources reject stale owners."],
      ["Safety vs Liveness", "Safety prevents permanent bad states; liveness promises eventual progress."]
    ]
  },
  {
    id: "consistency-consensus",
    title: "Consistency and Consensus",
    subtitle: "Linearizability, causality, atomic commit, and consensus",
    notesPath: "./consistency-and-consensus-summary.md",
    flashcards: [
      {
        front: "What is linearizability?",
        back: "A single-copy illusion: if a write completes before a read begins, the read must see that write or a newer one."
      },
      {
        front: "Linearizability vs serializability?",
        back: "Linearizability is about freshness/real-time order. Serializability is about transaction isolation and equivalence to some serial order."
      },
      {
        front: "What is strict serializability?",
        back: "Serializability plus real-time ordering. Transactions behave as if run one at a time in real-time order."
      },
      {
        front: "What does A happens-before B mean?",
        back: "A could have causally influenced B. B depends on or observed A in some way."
      },
      {
        front: "What can Lamport clocks tell us?",
        back: "If A happens-before B, then L(A) < L(B). But L(A) < L(B) does not prove A caused B."
      },
      {
        front: "What do vector clocks detect?",
        back: "Whether one version causally supersedes another or whether versions are concurrent."
      },
      {
        front: "What is total order broadcast?",
        back: "A primitive where all correct nodes deliver the same messages in the same order."
      },
      {
        front: "Why is 2PC blocking?",
        back: "After voting yes/prepared, a participant cannot safely commit or abort without the coordinator's final decision."
      },
      {
        front: "Consensus vs total order broadcast?",
        back: "Consensus chooses one value. Total order broadcast chooses a sequence/log of values."
      },
      {
        front: "What is a network partition?",
        back: "A network failure that splits nodes into groups that cannot communicate, even though nodes may still be running."
      }
    ],
    questions: [
      {
        prompt: "A write completes before a read begins. In a linearizable system, what must the read return?",
        options: [
          "Any replica's local value",
          "The old value if a follower is stale",
          "That write or a newer value",
          "Only values with the newest physical timestamp"
        ],
        answer: 2,
        explanation: "Linearizability respects real-time order: later reads must observe completed writes or newer ones."
      },
      {
        prompt: "Which statement best distinguishes linearizability from serializability?",
        options: [
          "Linearizability is about compression; serializability is about replication",
          "Linearizability is about freshness; serializability is about transaction isolation",
          "They are exactly the same guarantee",
          "Serializability applies only to physical clocks"
        ],
        answer: 1,
        explanation: "Linearizability is a recency guarantee; serializability is an isolation guarantee for transactions."
      },
      {
        prompt: "If L(A) < L(B) for Lamport timestamps, what can we conclude?",
        options: [
          "A definitely caused B",
          "B definitely caused A",
          "A and B are definitely simultaneous",
          "Nothing definitive about causality; they may be concurrent"
        ],
        answer: 3,
        explanation: "Lamport timestamps preserve happens-before in one direction only. A lower timestamp does not prove causality."
      },
      {
        prompt: "Two vector clocks neither dominate each other. What does that mean?",
        options: [
          "One version is definitely newer",
          "The versions are concurrent",
          "The physical clocks are synchronized",
          "Consensus has been reached"
        ],
        answer: 1,
        explanation: "If neither vector dominates, each has seen updates the other has not, so the versions are concurrent."
      },
      {
        prompt: "What does total order broadcast guarantee?",
        options: [
          "Every node discovers the true physical-time order",
          "Every correct node delivers the same messages in the same order",
          "Every message is delivered instantly",
          "Only causally related messages are ordered"
        ],
        answer: 1,
        explanation: "Total order broadcast makes nodes agree on one delivery order; it does not discover a universal physical-time order."
      },
      {
        prompt: "In 2PC, a participant voted yes/prepared and the coordinator crashes before final decision. What can the participant safely do?",
        options: [
          "Self-abort after timeout",
          "Self-commit after timeout",
          "Wait/retry until it learns the final decision",
          "Forget the transaction"
        ],
        answer: 2,
        explanation: "Prepared participants are blocked because the coordinator may already have decided commit and told others."
      },
      {
        prompt: "Consensus is best described as:",
        options: [
          "Nodes agreeing on one value",
          "Nodes reading from local replicas",
          "Nodes measuring wall-clock time",
          "Nodes detecting all Byzantine faults automatically"
        ],
        answer: 0,
        explanation: "Consensus is the problem of getting nodes to agree on a single value despite failures."
      },
      {
        prompt: "Why should coordination services avoid high-volume application data?",
        options: [
          "They cannot store strings",
          "They rely on strong consistency/consensus, so high-volume data would hurt latency and throughput",
          "They are only usable without networks",
          "They require every client to be a leader"
        ],
        answer: 1,
        explanation: "Coordination services are meant for small critical metadata because strong consistency is coordination-heavy."
      }
    ],
    weakAreas: [
      {
        title: "Linearizability and overlap",
        text: "A read overlapping a write may return old or new data. Only reads that start after a write completes must see it or newer."
      },
      {
        title: "Lamport clocks are local counters",
        text: "Each node has its own counter and exchanges values in messages; there is no single shared Lamport counter."
      },
      {
        title: "Lamport order is not causality proof",
        text: "A happens-before B implies L(A) < L(B), but L(A) < L(B) does not imply A caused B."
      },
      {
        title: "Vector clocks are metadata",
        text: "They track causal history and detect concurrency; they do not make all nodes agree on one global order."
      },
      {
        title: "2PC prepared means blocked",
        text: "Once a participant votes yes, timeout does not allow safe self-abort. It must learn the coordinator's final decision."
      },
      {
        title: "Network partitions are failures",
        text: "They are not required by design; serious systems plan for them because networks can split unexpectedly."
      }
    ],
    cheatSheet: [
      ["Linearizability", "Completed writes must be visible to later reads."],
      ["Serializability", "Transactions are equivalent to some serial order."],
      ["Strict Serializability", "Serializable transactions plus real-time order."],
      ["Lamport Clock", "Per-node logical counter; preserves happens-before one way."],
      ["Vector Clock", "Per-replica counters; detects concurrent versions."],
      ["Total Order Broadcast", "Same messages, same order, all correct replicas."],
      ["2PC", "Prepare votes first, then coordinator decides commit/abort."],
      ["Consensus", "Nodes agree on one value; total order broadcast agrees on a sequence."],
      ["Coordination Service", "Strongly consistent metadata for leaders, locks, config, membership."]
    ]
  },
  {
    id: "batch-processing",
    title: "Batch Processing",
    subtitle: "MapReduce, joins, workflows, skew, and modern batch engines",
    notesPath: "./batch-processing-summary.md",
    flashcards: [
      {
        front: "What is a batch?",
        back: "A bounded input slice/window/chunk of records processed together, such as all logs from one day."
      },
      {
        front: "System of record vs derived data?",
        back: "System of record is the source of truth. Derived data is computed from it and can usually be rebuilt."
      },
      {
        front: "Online vs stream processing?",
        back: "Online processing answers a direct request; stream processing continuously reacts to events in the background."
      },
      {
        front: "What does a mapper do?",
        back: "It reads input records and emits zero or more intermediate key-value pairs."
      },
      {
        front: "What does shuffle do?",
        back: "It moves mapper outputs so all records with the same key reach the same reducer."
      },
      {
        front: "Why are combiners limited?",
        back: "They operate on partial local data and may run zero or many times, so logic must be safe for partial aggregation."
      },
      {
        front: "Reduce-side join vs map-side join?",
        back: "Reduce-side join shuffles matching keys to reducers; map-side join joins locally but requires prepared/compatible inputs."
      },
      {
        front: "What is a hot key?",
        back: "A key with disproportionately many records, causing one reducer/task to get overloaded."
      },
      {
        front: "Why is  MapReduce slow for chained workflows?",
        back: "Each job materializes output to disk before the next job starts, causing repeated I/O and scheduling overhead."
      },
      {
        front: "What did Spark improve?",
        back: "Spark keeps intermediate data in memory when possible, offers richer APIs, and optimizes whole pipelines."
      }
    ],
    questions: [
      {
        prompt: "In batch processing, what is a batch?",
        options: [
          "The final output table",
          "A bounded input slice of records",
          "A single user request",
          "A never-ending event stream"
        ],
        answer: 1,
        explanation: "A batch is the bounded input group/window of records processed together."
      },
      {
        prompt: "Which statement best distinguishes online and stream processing?",
        options: [
          "Online answers a direct request; stream reacts continuously to events",
          "Online is always slower than stream",
          "Stream requires no derived data",
          "Online processing only happens nightly"
        ],
        answer: 0,
        explanation: "Online processing is request/response. Stream processing is event-driven and continuous."
      },
      {
        prompt: "What is the role of shuffle in MapReduce?",
        options: [
          "It deletes duplicate source records",
          "It moves mapper outputs so same-key records reach the same reducer",
          "It makes all reducers run on one machine",
          "It replaces the mapper"
        ],
        answer: 1,
        explanation: "Shuffle is the data movement step that groups intermediate records by key for reducers."
      },
      {
        prompt: "Why is average unsafe as a direct combiner operation?",
        options: [
          "Average cannot be computed in batch systems",
          "Averaging partial averages can produce the wrong global average",
          "Reducers cannot process numbers",
          "Combiners only work with strings"
        ],
        answer: 1,
        explanation: "Average must be represented as sum and count so partial aggregates combine correctly."
      },
      {
        prompt: "When is a broadcast hash join appropriate?",
        options: [
          "When both datasets are huge and unsorted",
          "When the smaller dataset fits in memory on every mapper",
          "When no join key exists",
          "When reducers must receive all data"
        ],
        answer: 1,
        explanation: "Broadcast hash join copies the smaller dataset to each mapper for local lookup."
      },
      {
        prompt: "Why are hot keys painful in reduce-side joins?",
        options: [
          "They make physical clocks drift",
          "All matching records for the hot key converge on one reducer",
          "They prevent mappers from reading files",
          "They remove the need for shuffle"
        ],
        answer: 1,
        explanation: "The reducer for a hot join key gets a massive group from both datasets, causing skew and stragglers."
      },
      {
        prompt: "What is speculative execution?",
        options: [
          "Deleting all failed task output forever",
          "Running a duplicate copy of a slow task and using the first successful result",
          "Replacing batch processing with online processing",
          "Sorting data without reducers"
        ],
        answer: 1,
        explanation: "Speculative execution mitigates stragglers by racing a duplicate copy of a slow task."
      },
      {
        prompt: "Why should batch output be published only after successful completion?",
        options: [
          "To expose partial output faster",
          "To avoid exposing incomplete or inconsistent results",
          "To prevent reruns",
          "To make source data mutable"
        ],
        answer: 1,
        explanation: "Writing to temporary output and atomically publishing after success prevents partial failed output from becoming visible."
      }
    ],
    weakAreas: [
      {
        title: "Batch means input slice",
        text: "A batch is the bounded input window/chunk of records, not the derived output."
      },
      {
        title: "Stream vs online",
        text: "Online processing returns a direct response to a request. Stream processing reacts continuously to events, often asynchronously."
      },
      {
        title: "Huge file binary search",
        text: "For variable-length sorted logs, binary search by byte offset, align to the next full line, then scan forward."
      },
      {
        title: "Hadoop configuration layers",
        text: "Mapper/reducer code defines what to compute; job config defines paths/classes/types/reducers; cluster config defines resources, queues, retries, and shuffle settings."
      },
      {
        title: "Combiner safety",
        text: "Combiners process partial data and may run multiple times. Sum/count/min/max are safe; average needs sum and count."
      },
      {
        title: "Map-side join preconditions",
        text: "Map-side joins are fast only when data is already prepared: small table fits in memory, same partitioning, or same sort order."
      },
      {
        title: "Straggler definition",
        text: "A straggler is the slow task that delays the whole job, often caused by skew or a hot key."
      },
      {
        title: "Materialized output",
        text: "The danger of record-by-record output updates is exposing partial results. Write complete output, then publish atomically."
      }
    ],
    cheatSheet: [
      ["Batch", "Bounded input slice processed in bulk."],
      ["Mapper", "Input record -> zero or more key-value pairs."],
      ["Reducer", "One key and all its values -> output."],
      ["Shuffle", "Move same-key mapper outputs to the same reducer."],
      ["Combiner", "Local partial aggregation before shuffle."],
      ["Reduce-Side Join", "General join; shuffle brings matching records together."],
      ["Map-Side Join", "Fast local join; requires prepared/compatible input."],
      ["Hot Key", "One key has too many records and overloads a reducer."],
      ["Materialized Output", "Durable derived result written after successful batch computation."],
      ["Spark vs MapReduce", "Spark reduces unnecessary disk materialization and optimizes richer pipelines."]
    ]
  },
  {
    id: "stream-processing",
    title: "Stream Processing",
    subtitle: "Events, logs, delivery semantics, windows, joins, state, and CDC",
    notesPath: "./stream-processing-summary.md",
    flashcards: [
      {
        front: "What is a stream?",
        back: "An unbounded sequence of events."
      },
      {
        front: "Event vs state?",
        back: "An event is an immutable fact. State is the current result after applying events."
      },
      {
        front: "What is an offset?",
        back: "An event's position in an append-only log, used by consumers to track progress."
      },
      {
        front: "Kafka queue vs pub-sub?",
        back: "Kafka is pub-sub across consumer groups and queue-like within one consumer group."
      },
      {
        front: "At-most-once vs at-least-once?",
        back: "At-most-once may lose events but avoids duplicates. At-least-once avoids loss but may duplicate events."
      },
      {
        front: "Event time vs processing time?",
        back: "Event time is when the event happened. Processing time is when the processor saw it."
      },
      {
        front: "What is a watermark?",
        back: "An estimate that most events up to a certain event time have arrived."
      },
      {
        front: "Why do streams need windows?",
        back: "Streams are unbounded, so windows create finite ranges for aggregation."
      },
      {
        front: "Why do stream-stream joins need windows?",
        back: "To bound how long old events are kept waiting for matching future events."
      },
      {
        front: "What is CDC?",
        back: "Change Data Capture turns committed database changes into event streams, often by reading WAL/binlog/oplog."
      }
    ],
    questions: [
      {
        prompt: "What is the best definition of an event?",
        options: [
          "The current value of a database row",
          "An immutable record of something that happened",
          "A consumer offset",
          "A network partition"
        ],
        answer: 1,
        explanation: "Events are facts about actions/changes that happened."
      },
      {
        prompt: "If a consumer commits an offset before processing and then crashes, what can happen?",
        options: [
          "The event may be skipped/lost",
          "The event is guaranteed exactly once",
          "The broker deletes the whole topic",
          "All consumer groups reset"
        ],
        answer: 0,
        explanation: "Recovery resumes after the committed offset, so the unprocessed event may be skipped."
      },
      {
        prompt: "Kafka behaves like pub-sub because:",
        options: [
          "Every producer belongs to one producer group",
          "Multiple consumer groups can independently read the same topic",
          "Partitions are unordered",
          "Offsets are global across all topics"
        ],
        answer: 1,
        explanation: "Each consumer group can receive the full stream independently."
      },
      {
        prompt: "Where is ordering guaranteed in a partitioned log?",
        options: [
          "Across all partitions globally",
          "Only within a partition",
          "Only across consumer groups",
          "Only by processing time"
        ],
        answer: 1,
        explanation: "Partitioned logs preserve order within each partition, not across the whole topic."
      },
      {
        prompt: "What is a late event?",
        options: [
          "Any event with a large payload",
          "An event that belongs to an earlier event-time window but arrives after the window was considered complete",
          "Any event processed by a queue",
          "A duplicated CDC snapshot"
        ],
        answer: 1,
        explanation: "Late is relative to event-time windows/watermarks, not simply a large delay."
      },
      {
        prompt: "Which window type is fixed-size and non-overlapping?",
        options: ["Session window", "Tumbling window", "Hopping window", "Join window"],
        answer: 1,
        explanation: "Tumbling windows divide time into fixed non-overlapping ranges."
      },
      {
        prompt: "Why can stream joins cause unbounded state growth?",
        options: [
          "Because topics cannot be partitioned",
          "Because the processor may keep unmatched events forever without windows/retention",
          "Because state is always stateless",
          "Because CDC requires no offsets"
        ],
        answer: 1,
        explanation: "Without windows, watermarks, or expiration, unmatched events may be retained indefinitely."
      },
      {
        prompt: "What must be recovered consistently for stateful stream fault tolerance?",
        options: [
          "Only the latest wall-clock timestamp",
          "State and offsets, plus output consistency where relevant",
          "Only the producer name",
          "Only the topic name"
        ],
        answer: 1,
        explanation: "State and offsets describe the same progress. Outputs also need idempotency or transactions."
      },
      {
        prompt: "Why does CDC reduce the dual-write problem?",
        options: [
          "It derives events from committed database changes",
          "It prevents all database writes",
          "It removes the need for logs",
          "It makes events mutable"
        ],
        answer: 0,
        explanation: "CDC reads committed database changes from logs, avoiding separate application DB write + event publish inconsistency."
      }
    ],
    weakAreas: [
      {
        title: "Exactly-once scope",
        text: "Exactly-once needs transactions/checkpoints/idempotency and does not magically cover email, payment, or third-party side effects."
      },
      {
        title: "Kafka consumer groups",
        text: "Kafka is pub-sub across consumer groups and queue-like within one group."
      },
      {
        title: "Late event definition",
        text: "A late event arrives after its event-time window was considered complete, not merely after a large delay."
      },
      {
        title: "Stream join state",
        text: "Stream-stream joins need windows/retention to avoid keeping unmatched events forever."
      },
      {
        title: "Stateful recovery",
        text: "State, offsets, and outputs must be restored consistently to avoid loss, duplicates, or wrong aggregates."
      },
      {
        title: "CDC logs vs snapshot",
        text: "CDC reads change logs like WAL/binlog/oplog; initial snapshot is a separate bootstrap step."
      }
    ],
    cheatSheet: [
      ["Stream", "Unbounded sequence of events."],
      ["Offset", "Position in a log; consumer progress marker."],
      ["At-Most-Once", "Possible loss, no duplicates."],
      ["At-Least-Once", "No loss, possible duplicates."],
      ["Event Time", "When the event happened."],
      ["Processing Time", "When the processor saw it."],
      ["Watermark", "Estimate that most events up to event time T have arrived."],
      ["Tumbling Window", "Fixed, non-overlapping time window."],
      ["Stream-Table Join", "Event stream enriched with table/reference state."],
      ["Checkpoint", "Snapshot of state plus offsets."],
      ["CDC", "Database changes emitted as event streams."]
    ]
  },
  {
    id: "future-data-systems",
    title: "The Future of Data Systems",
    subtitle: "Data integration, dataflow, correctness, observability, and responsibility",
    notesPath: "./future-of-data-systems-summary.md",
    flashcards: [
      {
        front: "Why are modern data systems more than one database?",
        back: "They combine source stores, logs, caches, indexes, analytics systems, stream processors, and governance controls."
      },
      {
        front: "What is the dual-write problem?",
        back: "An application writes to two systems separately; one write may succeed while the other fails, causing inconsistency."
      },
      {
        front: "How does CDC help integration?",
        back: "CDC turns committed database changes into event streams, letting downstream systems derive updates from the source of truth."
      },
      {
        front: "Derived data vs source data?",
        back: "Source data is the protected truth. Derived data is computed from source data and can usually be rebuilt."
      },
      {
        front: "What is end-to-end correctness?",
        back: "The complete workflow produces the right business outcome, not merely that each component behaved correctly in isolation."
      },
      {
        front: "How does a consumer know it processed event e789?",
        back: "It durably records processed event IDs, ideally atomically with the business effect using a unique event_id."
      },
      {
        front: "Lag vs freshness?",
        back: "Lag measures how far behind a consumer or derived system is. Freshness measures how recently derived state reflects source truth."
      },
      {
        front: "What is reconciliation?",
        back: "Comparing derived outputs against the source of truth using counts, sums, checksums, samples, or business invariants."
      },
      {
        front: "What is lineage?",
        back: "A record of where data came from and which transformations produced a derived value."
      },
      {
        front: "What is data minimization?",
        back: "Collect only the data needed for the purpose, and avoid more precise or longer-retained data than necessary."
      }
    ],
    questions: [
      {
        prompt: "Why does using many specialized data systems create integration risk?",
        options: [
          "Because every system uses the same schema",
          "Because updates may need to flow asynchronously and can fail, lag, duplicate, or transform differently",
          "Because derived data never changes",
          "Because source data can always be ignored"
        ],
        answer: 1,
        explanation: "Specialized systems are powerful, but keeping them consistent requires reliable dataflow, observability, and reconciliation."
      },
      {
        prompt: "What problem does CDC primarily reduce?",
        options: [
          "Clock drift",
          "Dual writes",
          "Hot partitions",
          "Two-phase locking"
        ],
        answer: 1,
        explanation: "CDC derives events from committed database changes, reducing separate application DB-write plus event-publish failure modes."
      },
      {
        prompt: "Which statement best describes derived data?",
        options: [
          "It is the only copy that matters",
          "It is computed from source data and can often be rebuilt",
          "It should never be monitored",
          "It must always be updated with distributed transactions"
        ],
        answer: 1,
        explanation: "Caches, indexes, analytics tables, and materialized views are derived from source data."
      },
      {
        prompt: "End-to-end correctness means:",
        options: [
          "Kafka alone reports success",
          "Each service logs something",
          "The overall business outcome is correct across the complete workflow",
          "All systems are eventually deleted"
        ],
        answer: 2,
        explanation: "A workflow can still be wrong even if individual components behaved according to their local contracts."
      },
      {
        prompt: "What is the safest way to deduplicate event processing?",
        options: [
          "Keep event IDs only in memory",
          "Record processed event IDs durably, ideally in the same transaction as the business update",
          "Assume the broker never redelivers",
          "Use a wall-clock timestamp"
        ],
        answer: 1,
        explanation: "Durable dedupe records with uniqueness constraints let retries become safe."
      },
      {
        prompt: "Freshness is best described as:",
        options: [
          "How many partitions a topic has",
          "How recently derived state reflects source-of-truth changes",
          "Whether data has a primary key",
          "Whether a transaction used 2PC"
        ],
        answer: 1,
        explanation: "Freshness is about the age of the derived view relative to source updates."
      },
      {
        prompt: "What does reconciliation do?",
        options: [
          "Deletes source data",
          "Compares derived results with source truth to detect mismatches",
          "Prevents all network failures",
          "Makes every read linearizable"
        ],
        answer: 1,
        explanation: "Reconciliation catches drift by comparing counts, sums, checksums, samples, and invariants."
      },
      {
        prompt: "Why is anonymization difficult?",
        options: [
          "Names are always required",
          "People can sometimes be re-identified from combinations of attributes and behavior",
          "Data can never be encrypted",
          "Aggregates are always private"
        ],
        answer: 1,
        explanation: "Removing direct identifiers is not enough if quasi-identifiers can be combined."
      },
      {
        prompt: "Which design is most privacy-conscious for delivery location data?",
        options: [
          "Store precise GPS forever for all users",
          "Store precise location only while needed, restrict access, then delete or aggregate it",
          "Put raw locations in every analytics dashboard",
          "Use location for unrelated profiling without notice"
        ],
        answer: 1,
        explanation: "Privacy-conscious design minimizes precision, retention, and access while matching the user-facing purpose."
      }
    ],
    weakAreas: [
      {
        title: "Freshness vs computation time",
        text: "Freshness means how recently a derived view reflects source-of-truth changes, not merely when a job last ran."
      },
      {
        title: "Completeness checks",
        text: "When observing derived state, also ask whether all expected records arrived, not only whether lag is low."
      },
      {
        title: "End-to-end dedupe",
        text: "Consumers know they processed an event only if they durably store processed IDs, preferably atomically with the business update."
      },
      {
        title: "Data quality across many stores",
        text: "Many derived systems can lag, fail, transform differently, or interpret schema changes differently, so quality is a pipeline property."
      },
      {
        title: "Privacy-conscious storage",
        text: "Good privacy design changes what is stored, how precise it is, who can access it, and how long it is retained."
      }
    ],
    cheatSheet: [
      ["Data Integration", "Use specialized systems, then connect them reliably."],
      ["Dual Write", "Separate writes can partially fail and diverge."],
      ["CDC", "Committed DB changes become event streams."],
      ["Source Data", "Protected truth; hard to replace if corrupted."],
      ["Derived Data", "Computed view; can usually be rebuilt."],
      ["Dataflow", "Source update -> log -> processor -> derived view."],
      ["E2E Correctness", "The whole business workflow is correct."],
      ["Idempotency Key", "Stable request/event ID used to make retries safe."],
      ["Lag", "How far behind a consumer/derived view is."],
      ["Freshness", "How recent the derived view is relative to source truth."],
      ["Reconciliation", "Compare derived outputs with source truth."],
      ["Lineage", "Track sources and transformations for a value."],
      ["Governance", "Ownership, access, retention, deletion, audit, compliance."],
      ["Data Minimization", "Collect and retain only what is needed."]
    ]
  }
];
