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
  }
];
