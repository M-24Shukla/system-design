# Consistency And Consensus - Chapter Summary

## Big Idea

Replication makes data systems more available and fault tolerant, but it creates a hard question:

```text
If I write data on one node, what are other nodes allowed to return when someone reads?
```

Chapter 9 is about the guarantees distributed systems can provide when many nodes must agree despite unreliable networks, partial failures, process pauses, and clocks that cannot be fully trusted.

The chapter moves through three major ideas:

```text
1. Consistency guarantees
2. Ordering and causality
3. Atomic commit and consensus
```

If you remember one sentence:

```text
Distributed correctness depends on agreeing what happened, in what order, and whether a decision is final.
```

---

## Consistency Guarantees

A consistency guarantee is the database's promise about what reads may return after writes.

In a replicated system, different replicas may temporarily have different versions of the same data:

```text
Replica A: x = 1
Replica B: x = old value
Replica C: x = old value
```

A consistency guarantee tells the application what assumptions are safe.

Weak consistency may allow stale reads:

```text
Profile photo updated.
Some users still see the old photo for a few seconds.
```

Stronger consistency gives simpler application logic but requires more coordination.

Important correction:

```text
Strong consistency does not necessarily mean every replica is instantly updated.
It means the system coordinates operations so the visible behavior satisfies the guarantee.
```

---

## Linearizability

Linearizability is a strong consistency guarantee for individual objects.

It makes replicated data behave as if there is one single, up-to-date copy.

Core rule:

```text
If a write completes before a read begins,
the read must see that write or a newer one.
```

Example:

```text
Initial: x = 0

Client A writes x = 1.
Write completes.

Client B reads x.
Read must return 1 or newer.
It must not return 0.
```

### Overlapping Operations

Linearizability does not mean every read always sees the newest concurrent write.

If a read overlaps a write, the system may order the read either before or after the write.

Example:

```text
Write x = 1 starts.
Read x starts before write finishes.
Read may return 0 or 1.
```

Both can be linearizable because the operations overlap.

Key rule:

```text
Real-time order matters only when one operation completes before another begins.
```

---

## Linearization Points

A linearization point is the single instant where an operation appears to take effect.

Every operation has:

```text
start time
finish time
```

Linearizability asks:

```text
Can we place each operation at one point between its start and finish,
so the whole history looks like a valid single-copy execution?
```

Example:

```text
Write x = 1 starts at t1 and finishes at t4.
Read x starts at t2 and finishes at t3.
```

The read overlaps the write, so it may be placed before or after the write's linearization point.

Non-linearizable history:

```text
Write x = 1 completes.
Read returns 1.
Later read returns 0.
```

Once the completed write has been observed, later reads cannot go backward to the old value unless a newer write changed it back.

---

## Linearizability vs Serializability

These terms sound similar but mean different things.

```text
Linearizability = freshness / recency guarantee
Serializability = transaction isolation guarantee
```

### Linearizability

Usually applies to individual objects.

It answers:

```text
Do later reads see completed writes?
```

### Serializability

Applies to transactions.

It answers:

```text
Is the result equivalent to transactions running one at a time in some order?
```

Plain serializability does not necessarily preserve real-time order.

### Strict Serializability

Strict serializability combines both:

```text
serializability + real-time order
```

It means transactions behave as if they ran one at a time, and that order respects real-time ordering.

Key distinction:

```text
Serializability says: some one-at-a-time order.
Linearizability says: respect real-time freshness.
Strict serializability gives both.
```

---

## When Linearizability Is Useful

Linearizability is useful when stale reads break correctness.

Common examples:

- distributed locks
- leader election metadata
- uniqueness constraints
- compare-and-set
- claiming scarce resources
- reading an account balance after a completed deposit

### Distributed Locks

If Client A successfully acquires a lock, Client B must not later read stale state and also acquire it.

### Uniqueness Constraints

Example:

```text
User A claims username "maya".
User B also tries to claim "maya".
```

Once one claim succeeds, all later checks must see the username as taken.

### Compare-And-Set

Compare-and-set means:

```text
Update value only if current value equals expected old value.
```

Example:

```text
Set lock owner to Client B only if current owner is empty.
```

CAS requires linearizable behavior, otherwise two clients may both believe the condition was true.

### Cross-Channel Timing Dependencies

Sometimes information travels through two channels.

Example:

```text
User uploads a photo.
Then sends a message: "look at my new photo."
```

If the message arrives before the photo update is visible, another user may see missing or stale data.

Linearizability can help when one channel depends on another being up to date.

---

## The Cost Of Linearizability

Linearizability is expensive because it requires coordination.

If a read must see the latest completed write, a stale local replica cannot always answer safely.

Systems may need to:

- route reads to a leader
- use quorum reads/writes
- wait for replication
- check freshness
- reject requests during partitions

### Latency Cost

Coordination requires network round trips.

```text
Local stale read: 2 ms
Linearizable read: 20 ms, 50 ms, or more
```

### Availability Cost

If a node cannot contact the leader or quorum, it may have to reject linearizable reads/writes.

This preserves correctness but reduces availability.

### Throughput Cost

Coordination can create bottlenecks.

Example:

```text
A leader serializes writes for a key or partition.
```

Key correction:

```text
Linearizability does not require every replica to always be fresh.
It requires every completed operation response to preserve the single-copy illusion.
```

---

## Ordering And Causality

Distributed systems often need to reason about event order.

Physical clocks are unreliable, so systems often reason in terms of causality:

```text
Did event B depend on event A?
Could A have influenced B?
```

If A could have influenced B:

```text
A happens-before B
```

Example:

```text
User reads a post.
User comments on the post.
```

The post/read happens-before the comment.

### Concurrent Events

Two events are concurrent if neither causally depends on the other.

Concurrent does not mean simultaneous in wall-clock time.

It means:

```text
Neither event knew about or depended on the other.
```

Example:

```text
Alice updates her profile photo.
Bob independently updates his location.
```

If neither update depends on the other, they are concurrent.

Key takeaway:

```text
Causal order is about dependency, not physical timestamp order.
```

---

## Sequence Numbers And Logical Clocks

Physical timestamps are unreliable, so systems often use sequence numbers or logical clocks.

Instead of asking:

```text
What wall-clock time did this happen?
```

we ask:

```text
What logical order did the system assign?
```

### Sequence Numbers

A sequence number is a monotonically increasing number.

Example:

```text
event A -> 101
event B -> 102
event C -> 103
```

If a single leader assigns sequence numbers, replicas can apply operations in that order.

### Lamport Clocks

A Lamport clock is a per-node logical counter.

Rules:

```text
1. Increment counter before each local event.
2. Include counter when sending a message.
3. On receive, set local counter to max(local, received) + 1.
```

Property:

```text
If A happens-before B, then L(A) < L(B).
```

But the reverse is not guaranteed:

```text
L(A) < L(B) does not prove A caused B.
```

Why?

Because concurrent unrelated events still receive numeric timestamps.

Important correction:

```text
Lamport clocks are per-node counters exchanged in messages.
They are not one shared global clock.
```

---

## Vector Clocks

Lamport clocks preserve happens-before ordering, but they cannot reliably detect concurrency.

Vector clocks solve this by keeping a counter per replica.

Example:

```text
[A: 2, B: 1, C: 0]
```

This means the version has seen:

```text
2 updates from A
1 update from B
0 updates from C
```

### Comparing Vector Clocks

One vector is causally newer if every counter is greater than or equal and at least one is greater.

Example:

```text
V1 = [A: 2, B: 1]
V2 = [A: 3, B: 1]
```

`V2` dominates `V1`, so V2 causally supersedes V1.

Concurrent example:

```text
V1 = [A: 2, B: 1]
V2 = [A: 1, B: 2]
```

Neither dominates.

That means the versions are concurrent.

### Shopping Cart Example

Replica A:

```text
Add milk
[A: 1, B: 0]
```

Replica B:

```text
Add eggs
[A: 0, B: 1]
```

Neither vector dominates, so the system knows these are concurrent updates and may merge:

```text
cart = milk + eggs
```

Key distinction:

```text
Lamport clocks give an order but cannot detect concurrency.
Vector clocks detect whether one version supersedes another or whether versions are concurrent.
```

---

## Total Order Broadcast

Causal order is sometimes not enough.

Some systems need all nodes to process messages in the exact same order.

Total order broadcast guarantees:

```text
All correct nodes deliver the same messages in the same order.
```

Two main guarantees:

```text
1. Reliable delivery
2. Total ordered delivery
```

Example:

```text
Node A delivers: m1, m2, m3
Node B delivers: m1, m2, m3
Node C delivers: m1, m2, m3
```

No node may deliver:

```text
m2, m1, m3
```

### State Machine Replication

If all replicas start from the same state and apply the same deterministic operations in the same order, they reach the same final state.

```text
Same initial state
+ same operations
+ same order
= same final state
```

This is state machine replication.

### Relationship To Consensus

Consensus chooses one value.

Total order broadcast chooses a sequence of values.

```text
Consensus = one log slot
Total order broadcast = full replicated log
```

Important correction:

```text
Total order broadcast does not discover the true physical-time order.
It makes replicas agree on one chosen order.
```

---

## Distributed Transactions

A distributed transaction spans multiple participants:

- nodes
- partitions
- databases
- services

Example:

```text
Participant A: debit Alice
Participant B: credit Bob
Participant C: write audit record
```

The goal is atomic commit:

```text
All participants commit
or
all participants abort
```

Distributed transactions are hard because:

- messages can be lost
- responses can be delayed
- participants can crash
- coordinator can crash
- processes can pause
- network partitions can split participants
- timeouts create uncertainty

Many systems avoid distributed transactions and use:

- idempotency
- retries
- outbox pattern
- sagas
- compensating actions
- eventual consistency

---

## Two-Phase Commit

Two-phase commit, or 2PC, is a classic atomic commit protocol for distributed transactions.

Roles:

```text
Coordinator
Participants
```

Phases:

```text
1. Prepare phase
2. Commit/abort phase
```

### Phase 1: Prepare

Coordinator asks each participant:

```text
Can you commit?
```

Each participant checks locally.

If it can commit, it writes a durable prepared record and replies:

```text
yes / prepared
```

If it cannot commit, it replies:

```text
no / abort
```

Once a participant votes yes, it promises it can commit later and cannot safely decide on its own.

### Phase 2: Commit Or Abort

If all participants vote yes:

```text
Coordinator durably records COMMIT.
Coordinator tells participants to commit.
```

If any participant votes no, or does not vote yes during prepare:

```text
Coordinator decides ABORT.
Coordinator tells participants to abort.
```

### Durable Logs

Durable logs are essential.

Coordinator must remember:

```text
final commit/abort decision
```

Participants must remember:

```text
I voted yes/prepared and need final decision.
```

### Blocking Problem

2PC is blocking.

If a participant voted yes and the coordinator crashes before the participant learns the final decision, the participant cannot safely self-abort after timeout.

Why?

Maybe the coordinator already decided commit and told other participants.

If one participant self-aborts while others commit, atomicity breaks.

Key rules:

```text
No yes from every participant during prepare -> coordinator can abort.

All yes + coordinator durably decides commit -> unreachable participants must eventually commit.

Prepared participant + unknown coordinator decision -> participant blocks.

Retry exhaustion does not change a durable commit decision.
```

---

## Consensus

Consensus is the problem of getting several nodes to agree on one value.

It must satisfy properties such as:

### Agreement

No two nodes decide differently.

### Integrity

A node decides only once.

### Validity

The decided value was proposed by some node.

### Termination

Nodes eventually decide, assuming conditions are good enough.

Consensus is difficult because distributed systems have:

- crashes
- message delay
- message loss
- network partitions
- stale views
- imperfect timeouts

### Relationship To Total Order Broadcast

```text
Consensus = agree on one value
Total order broadcast = agree on a sequence of values
```

A replicated log can be viewed as repeated consensus:

```text
log[1] consensus -> first command
log[2] consensus -> second command
log[3] consensus -> third command
```

### FLP Intuition

Consensus cannot guarantee progress in a fully asynchronous system with even one crash failure.

Why?

Because there is no upper bound on message delay.

If a node does not respond, the system cannot know whether it crashed or is merely very slow.

Practical systems usually assume partial synchrony:

```text
Eventually, messages arrive within reasonable time.
Eventually, a stable leader can communicate with a majority.
```

---

## Coordination Services And Membership

Coordination services provide a small strongly consistent core for distributed metadata.

Examples:

- ZooKeeper
- etcd
- Consul

Used for:

- leader election
- service discovery
- configuration management
- distributed locks
- membership tracking
- failure detection metadata

### Membership

Membership tracks which nodes are currently considered part of a cluster.

Example:

```text
Members:
Node A
Node B
Node C
```

Membership is hard because failure detection is imperfect.

A node that appears dead may only be:

- slow
- paused
- partitioned
- overloaded

### Watches

A watch lets a client subscribe to changes on a key/path.

Example:

```text
watch /leader
```

If `/leader` changes, the client is notified instead of constantly polling.

### Why Store Only Small Metadata?

Coordination services rely on strong consistency and consensus.

That makes writes relatively expensive.

They should store:

```text
metadata, config, locks, membership
```

not:

```text
large user data, high-volume events, logs, analytics
```

### ZooKeeper Deployment Note

ZooKeeper is usually best deployed on colocated or nearby machines:

```text
same data center
or
same region across availability zones
```

It can technically run across geographic regions, but WAN latency and regional partitions can make quorum writes slow or unavailable.

---

## Network Partitions

A network partition happens when the network splits nodes into groups that cannot communicate with each other, even though the nodes may still be running.

Example:

```text
5-node cluster:

Side 1: A, B
Side 2: C, D, E
```

`A/B` cannot talk to `C/D/E`.

The danger is split brain.

Example:

```text
Side A/B thinks A is leader.
Side C/D/E elects C as leader.
Both sides accept writes.
```

When the network heals, the system has conflicting histories.

Correct quorum-based systems usually allow only the majority side to make authoritative decisions.

In a 5-node cluster:

```text
majority = 3
```

So:

```text
A/B = minority, should stop authoritative writes
C/D/E = majority, can continue
```

Key idea:

```text
Network partitions are not required.
They are unwanted failures that serious systems must survive safely.
```

---

## Your Weak Areas And Corrections

### 1. Linearizability Does Not Mean Every Read Sees The Latest Concurrent Write

Weak version:

```text
Every read always sees the latest value.
```

Correct version:

```text
If a write completes before a read begins, the read must see it or newer.
If read and write overlap, either old or new value may be valid.
```

### 2. Lamport Clocks Are Not A Shared Global Clock

Weak version:

```text
Lamport clocks use a common global sequence number.
```

Correct version:

```text
Each node has its own logical counter.
Counters are exchanged in messages.
```

### 3. Lamport Timestamp Order Does Not Prove Causality

True:

```text
A happens-before B -> L(A) < L(B)
```

Not always true:

```text
L(A) < L(B) -> A happens-before B
```

Concurrent unrelated events can still receive ordered Lamport timestamps.

### 4. Vector Clocks Are Not Consensus

Vector clocks track causal history.

They help answer:

```text
Did one version supersede another,
or are they concurrent?
```

They do not make all nodes agree on one global order.

### 5. Total Order Broadcast Chooses An Agreed Order

Weak version:

```text
Total order broadcast finds the correct physical order.
```

Correct version:

```text
It makes all replicas agree on one chosen order.
```

### 6. Prepared 2PC Participants Cannot Self-Abort After Timeout

Weak version:

```text
If coordinator times out, participants can abort.
```

Correct version:

```text
If a participant has voted yes/prepared, it must wait for the final decision.
Timeout does not safely release it.
```

### 7. Network Partitions Are Not Desired

Network partitions are failures, not design requirements.

Systems plan for them because networks are imperfect.

---

## Quick Comparison Table

| Concept | Main Meaning |
|---|---|
| Consistency guarantee | Promise about what reads may return after writes |
| Linearizability | Single-copy illusion with real-time freshness |
| Serializability | Transactions equivalent to some serial order |
| Strict serializability | Serializability plus real-time order |
| Causality | Dependency between events |
| Lamport clock | Per-node logical counter preserving happens-before |
| Vector clock | Per-replica counters that detect concurrency |
| Total order broadcast | Same messages delivered in same order everywhere |
| Distributed transaction | Transaction spanning multiple participants |
| 2PC | Atomic commit protocol with prepare and commit/abort phases |
| Consensus | Nodes agree on one value |
| Coordination service | Strongly consistent metadata service |
| Network partition | Network splits nodes into groups that cannot communicate |

---

## Final Mental Model

Chapter 9 connects three layers of distributed reasoning.

First, consistency:

```text
What should reads return after writes?
```

Second, ordering:

```text
What happened before what?
Which events are concurrent?
Do all replicas agree on the same sequence?
```

Third, agreement:

```text
Can nodes agree on a value, a log entry, a commit decision, or cluster metadata despite failures?
```

The deeper lesson:

```text
The more global agreement you need, the more coordination you pay for.
```

Linearizability, total order broadcast, 2PC, and consensus all make application reasoning easier, but they cost latency, availability, and operational complexity.

Use the strongest guarantees where stale or conflicting state would break correctness. Use weaker guarantees where temporary staleness is acceptable.
