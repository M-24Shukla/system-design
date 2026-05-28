# Transactions Chapter Summary

## Big Idea

A transaction is a group of database operations treated as one logical unit. Transactions help applications handle partial failures, crashes, and concurrent access without forcing the application to manually reason about every possible interleaving.

Classic example:

```text
Transfer money from Alice to Bob:
1. Subtract money from Alice
2. Add money to Bob
```

Both operations must succeed together, or neither should take effect.

---

## ACID

ACID describes four important transaction properties:

```text
A = Atomicity
C = Consistency
I = Isolation
D = Durability
```

### Atomicity

Atomicity means all-or-nothing.

If a transaction commits, all its writes take effect. If it aborts or crashes before commit, its partial writes are rolled back or ignored during recovery.

Important:

```text
Atomicity is about abortability and partial failure.
It is not mainly about concurrency.
```

Example:

```text
Create order
Reduce inventory
Record payment
```

If payment recording fails, the order creation and inventory update should not remain half-applied.

### Consistency

Consistency means a transaction should preserve validity rules:

```text
valid database state -> transaction -> valid database state
```

But consistency is partly an application responsibility. The database can enforce some constraints, such as:

- unique constraints
- foreign keys
- not-null constraints
- check constraints

The application defines many business invariants:

- stock should not become negative
- an order should not ship before payment
- at least one doctor must be on call
- no two bookings should overlap for the same room

Important:

```text
ACID consistency is about validity/invariants.
Replication consistency is about replicas agreeing or freshness of reads.
```

### Isolation

Isolation protects transactions from concurrency problems.

The strongest version is serializability:

```text
Concurrent transactions produce the same result as if they ran one at a time in some serial order.
```

Important:

```text
Isolation does not always mean transactions literally run one at a time.
It means their interaction is controlled so the result remains correct.
```

### Durability

Durability means once a transaction commits, its writes should survive failures covered by the database's guarantees.

Mechanisms include:

- write-ahead logs
- fsync or similar persistence calls
- replication
- recovery procedures

Important:

```text
Durability is not magic.
It does not mean data can never be lost under any possible disaster.
It is defined within a failure model.
```

---

## Single-Object vs Multi-Object Transactions

### Single-Object Operation

A single-object operation reads or writes one row, document, or record.

Example:

```sql
UPDATE users
SET login_count = login_count + 1
WHERE id = 123;
```

Many databases can make single-object writes atomic fairly easily.

### Multi-Object Transaction

A multi-object transaction groups operations across multiple rows, documents, or records.

Example: sending an email might require:

```text
1. Add message to sender's Sent folder
2. Add message to recipient's Inbox
3. Update unread count
4. Save delivery metadata
```

Multi-object transactions are harder, especially in partitioned or distributed databases, because the affected objects may live on different nodes. The system must coordinate commit, rollback, isolation, and recovery across participants.

---

## Weak Isolation Levels

Serializability is strong but can be expensive. Many databases use weaker isolation levels by default to improve:

- concurrency
- latency
- throughput
- availability of locks/resources

But weak isolation may allow anomalies.

Examples of anomalies:

- dirty reads
- dirty writes
- non-repeatable reads
- lost updates
- write skew
- phantoms

Important:

```text
Weak isolation is dangerous when developers assume it behaves like serializability.
```

Concurrency bugs are often hard to reproduce because they depend on unlucky timing.

---

## Read Committed

Read Committed is a common weak isolation level.

It gives two main guarantees:

```text
1. No dirty reads
2. No dirty writes
```

### Dirty Read

A dirty read happens when one transaction reads another transaction's uncommitted write.

Read Committed prevents this.

### Dirty Write

A dirty write happens when one transaction overwrites another transaction's uncommitted write.

Read Committed prevents this.

### What Read Committed Still Allows

Read Committed does not provide a stable snapshot for the whole transaction.

Each read sees the latest committed data at that moment.

Example:

```text
Initial:
Alice = 500
Bob = 500

Report transaction reads Alice = 500

Another transaction commits transfer:
Alice = 400
Bob = 600

Report transaction reads Bob = 600

Report sees:
Alice + Bob = 1100
```

Every value read was committed when read, but the report saw a mixed view that never existed as one consistent database state.

Important:

```text
Read Committed prevents uncommitted reads.
It does not guarantee a consistent multi-read snapshot.
```

---

## Snapshot Isolation / Repeatable Read

Snapshot isolation gives each transaction a stable view of committed data from one point in time.

```text
Transaction starts at T1.
All reads inside the transaction see the database as of T1.
```

If other transactions commit later, their writes are not visible to the current transaction's snapshot.

### MVCC

Snapshot isolation is often implemented with MVCC: multi-version concurrency control.

MVCC means the database keeps multiple versions of records.

Example:

```text
Alice balance:
version 1: 500, visible at T1
version 2: 400, visible at T2
```

Each transaction reads the version visible to its snapshot.

### Why Snapshot Isolation Helps

It helps long-running read queries because they see a consistent database view.

It avoids mixed results like:

```text
Alice old value + Bob new value
```

Important:

```text
Snapshot isolation gives stable reads.
Stable reads are not the same as full serializability.
```

Snapshot isolation can still allow write skew.

---

## Lost Updates

A lost update happens when two transactions read the same value, both compute a new value, and one update overwrites the other.

Example:

```text
counter = 42

Transaction A reads 42
Transaction B reads 42

Transaction A writes 43
Transaction B writes 43

Expected result: 44
Actual result: 43
```

One increment was lost.

### Why Read-Modify-Write Is Risky

Read-modify-write means:

```text
1. Read value
2. Modify value in application code
3. Write new value
```

This is risky under concurrency because multiple transactions may read the same old value and overwrite each other's results.

### Ways To Prevent Lost Updates

Use atomic database operations:

```sql
UPDATE counters
SET value = value + 1
WHERE id = 1;
```

Use explicit locks:

```sql
SELECT value
FROM counters
WHERE id = 1
FOR UPDATE;
```

Use compare-and-set or version checking:

```sql
UPDATE pages
SET content = 'new content', version = 6
WHERE id = 123 AND version = 5;
```

If zero rows are updated, someone else changed the row first, so retry or show a conflict.

Use serializable isolation when appropriate.

Important:

```text
Lost update usually involves the same object being overwritten.
```

---

## Write Skew

Write skew is subtler than lost update.

It happens when two transactions:

```text
1. Read overlapping data
2. Make decisions that seem valid individually
3. Write different rows
4. Together violate a shared invariant
```

### Doctor On-Call Example

Invariant:

```text
At least one doctor must be on call.
```

Initial state:

```text
Alice on call = true
Bob on call = true
```

Transaction A:

```text
Reads Alice and Bob
Sees Bob is on call
Sets Alice off call
```

Transaction B:

```text
Reads Alice and Bob
Sees Alice is on call
Sets Bob off call
```

Final state:

```text
Alice on call = false
Bob on call = false
```

The invariant is broken.

This is not a lost update because the transactions wrote different rows.

Important:

```text
Lost update = same object overwritten.
Write skew = different objects, shared invariant broken.
```

Snapshot isolation can allow write skew because there may be no direct write-write conflict.

---

## Phantoms

A phantom happens when a transaction's query depends on the existence or non-existence of rows matching a condition, and another transaction changes that set.

Example:

```text
Rule: only one booking allowed for Room 101 at 10:00.
```

Transaction A:

```sql
SELECT *
FROM bookings
WHERE room = 101 AND time = '10:00';
-- finds none
```

Transaction B does the same and also finds none.

Both insert a booking.

Now there are two bookings for the same room and time.

The phantom is the newly inserted row that invalidates the earlier predicate check.

Important:

```text
To prevent phantoms, locking existing rows is not enough.
The database may need predicate locks or index-range locks.
```

---

## Serializability

Serializability is the strongest isolation guarantee discussed in this chapter.

It means:

```text
The result of concurrent transactions is equivalent to some serial order.
```

Important:

```text
Serializable does not mean "same result under every possible order."
It means "same result as one valid serial order."
```

Serializability prevents:

- dirty reads
- dirty writes
- lost updates
- write skew
- phantoms

Why it helps:

```text
Application developers can reason as if transactions run one at a time.
```

Why databases may avoid it by default:

- more locking or conflict detection
- reduced concurrency
- higher latency
- more transaction aborts/retries
- distributed coordination cost

---

## Three Ways To Achieve Serializability

The chapter discusses three main approaches:

```text
1. Actual serial execution
2. Two-phase locking
3. Serializable snapshot isolation
```

---

## Actual Serial Execution

Actual serial execution means transactions literally run one at a time.

```text
Transaction A runs completely.
Then Transaction B runs completely.
Then Transaction C runs completely.
```

This guarantees serializability because the actual execution order is serial.

### When It Can Be Fast

It can work well when transactions are:

- short
- simple
- in-memory
- non-interactive
- free from external network calls
- known in advance, often as stored procedures

### When It Is A Bad Fit

It struggles with:

- long-running transactions
- user interaction
- external service calls
- large scans
- distributed transactions across partitions

### Stored Procedures

Stored procedures help because transaction logic runs inside the database in one request.

Without stored procedure:

```text
client sends query 1
database replies
client computes
client sends query 2
database replies
```

With stored procedure:

```text
client sends "run purchase procedure"
database runs all logic locally
database returns result
```

This avoids client-server round trips while the serial execution thread is occupied.

---

## Two-Phase Locking

Two-phase locking, or 2PL, is a pessimistic serializability technique.

It uses locks to prevent unsafe interleavings.

There are two phases:

```text
1. Growing phase: acquire locks
2. Shrinking phase: release locks
```

After a transaction releases a lock, it cannot acquire new locks.

In strict 2PL, locks are commonly held until commit or abort.

### Shared Lock

A shared lock is used for reading.

Multiple transactions can hold shared locks on the same object.

```text
Many readers allowed.
Writers blocked.
```

### Exclusive Lock

An exclusive lock is used for writing.

Only one transaction can hold an exclusive lock.

```text
One writer allowed.
Readers and other writers blocked.
```

### Deadlocks

A deadlock happens when transactions wait on each other in a cycle.

Example:

```text
Transaction A holds row 1 and waits for row 2.
Transaction B holds row 2 and waits for row 1.
```

The database must detect the deadlock and abort one transaction.

### 2PL and Phantoms

Locking existing rows is not enough for predicate queries.

To prevent phantoms, databases may use:

- predicate locks
- index-range locks

### Cost of 2PL

2PL can hurt performance because:

- readers can block writers
- writers can block readers
- long transactions hold locks for a long time
- deadlocks can cause aborts

Important:

```text
2PL blocks conflicts.
MVCC/snapshot isolation often avoids reader-writer blocking by keeping versions.
```

---

## Serializable Snapshot Isolation

Serializable Snapshot Isolation, or SSI, tries to combine:

```text
snapshot isolation-style concurrency
+
serializable correctness
```

SSI is optimistic.

That means:

```text
Let transactions proceed concurrently.
Track dangerous dependencies.
Abort one transaction if the pattern could become non-serializable.
```

### How It Differs From Snapshot Isolation

Ordinary snapshot isolation:

```text
Stable reads, but may allow write skew.
```

SSI:

```text
Stable reads plus dependency tracking to prevent non-serializable results.
```

### How It Differs From 2PL

2PL:

```text
Prevent conflicts by blocking with locks.
```

SSI:

```text
Allow concurrency using snapshots.
Track read-write conflicts.
Abort risky transactions if needed.
```

### Doctor Example Under SSI

Two doctors both try to go off call.

Under snapshot isolation:

```text
Both may commit.
No doctor remains on call.
```

Under SSI:

```text
Database detects a dangerous dependency pattern.
One transaction aborts.
Application retries it.
The invariant is preserved.
```

### Tradeoffs

SSI reduces reader-writer blocking compared with 2PL, but it has costs:

- dependency tracking overhead
- possible false positives
- transaction aborts
- application retries
- implementation complexity

Important:

```text
SSI conflicts do not necessarily block immediately.
They are tracked and may cause aborts later.
```

---

## Quick Comparison Table

| Concept | Main Protection | Still Allows / Cost |
|---|---|---|
| Read Committed | Prevents dirty reads and dirty writes | Non-repeatable reads, inconsistent multi-read views |
| Snapshot Isolation | Stable snapshot, repeatable reads | Write skew |
| Serializable Isolation | Equivalent to some serial order | More coordination, blocking, or retries |
| Actual Serial Execution | No interleaving | Bad for long/interactive/distributed transactions |
| Two-Phase Locking | Blocks unsafe conflicts | Blocking, deadlocks, lower concurrency |
| Serializable Snapshot Isolation | Detects dangerous snapshot conflicts | Tracking overhead, aborts/retries |

---

## Most Important Distinctions

### Atomicity vs Isolation

```text
Atomicity = what happens if one transaction fails partway through.
Isolation = what happens when multiple transactions run concurrently.
```

### Read Committed vs Snapshot Isolation

```text
Read Committed:
Each read sees latest committed data at that moment.

Snapshot Isolation:
All reads see the same committed snapshot.
```

### Lost Update vs Write Skew

```text
Lost update:
Two transactions write the same object; one overwrites the other.

Write skew:
Two transactions write different objects; together they break an invariant.
```

### Snapshot Isolation vs Serializability

```text
Snapshot Isolation:
Stable reads, but not all invariants are protected.

Serializability:
Result is equivalent to some one-at-a-time transaction order.
```

### 2PL vs SSI

```text
2PL:
Pessimistic. Block conflicts before they happen.

SSI:
Optimistic. Let transactions run, detect dangerous conflicts, abort if needed.
```

---

## Final Mental Model

Transactions are a tool for making messy reality easier to reason about:

```text
Failures happen.
Transactions need atomicity.

Business rules matter.
Applications need consistency.

Concurrency causes weird bugs.
Transactions need isolation.

Committed data should survive.
Transactions need durability.
```

The hardest part of the chapter is isolation. The main path is:

```text
Read Committed
  -> no dirty reads/writes, but mixed views possible

Snapshot Isolation
  -> stable reads, but write skew possible

Serializability
  -> behaves like some serial order
```

And the main implementation strategies for serializability are:

```text
Actual serial execution
Two-phase locking
Serializable snapshot isolation
```

If you remember only one sentence:

```text
Transactions let applications pretend that a group of operations happens safely as one unit, but the exact safety depends heavily on the isolation level.
```
