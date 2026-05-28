# The Trouble With Distributed Systems - Chapter Summary

## Big Idea

Distributed systems are hard because components can fail independently, messages can be delayed or lost, clocks can disagree, and no node has a perfect view of the whole system.

The central lesson:

```text
In a distributed system, absence of evidence is not evidence of absence.
```

If a node does not respond, you do not know whether:

- the node crashed
- the node is slow
- the request was lost
- the response was lost
- the network is congested
- the process is paused
- the node processed the request but you never heard back

Distributed systems must make decisions under uncertainty.

---

## Partial Failures

A partial failure happens when some parts of a distributed system fail, slow down, or become unreachable while other parts continue running.

This is different from a single-machine program, where failure is often simpler:

```text
works
or
crashes
```

In a distributed system, one component can be alive while another cannot reach it.

Example:

```text
Service A sends payment request to Service B.
Service B charges the card.
The response is lost.
Service A sees timeout.
```

Service A does not know whether the charge happened.

### Safe Retries

Blind retries can duplicate side effects.

Example:

```text
Retrying a payment request may charge the customer twice.
```

A common solution is an idempotency key:

```text
payment_id = unique request ID
```

If the same request is retried, the payment system recognizes it and does not repeat the charge.

### Key Takeaway

```text
Timeout means "I don't know," not "the operation definitely failed."
```

---

## Unreliable Networks

Distributed systems communicate by sending messages over networks.

Network messages can be:

- lost
- delayed
- duplicated
- reordered
- delivered while the response is lost

If a sender gets no response, it cannot know whether the receiver crashed, the request was lost, the response was lost, or the receiver is just slow.

### Failure Detection

Failure detection is based on suspicion, not certainty.

```text
No response -> suspected failure
```

not:

```text
No response -> proven failure
```

### Key Takeaway

```text
You cannot reliably distinguish a crashed node from a slow or unreachable node using messages alone.
```

---

## Timeouts And Fault Detection

Distributed systems use timeouts because they cannot wait forever.

A timeout is a decision boundary:

```text
If no response arrives by this time, stop waiting and take action.
```

Possible actions:

- retry the request
- return an error
- mark a node as suspected failed
- route traffic elsewhere
- start leader election

But a timeout does not prove failure. It only says no response arrived within the chosen time.

### Short Timeout

Pros:

- detects real failures quickly
- faster recovery

Cons:

- more false positives
- healthy but slow nodes may be marked failed
- unnecessary retries and elections

### Long Timeout

Pros:

- fewer false positives

Cons:

- slow recovery from real failures
- users wait longer

### Sources Of Delay

Delays can come from:

- network congestion
- queueing
- packet loss and retransmission
- overloaded CPU
- garbage collection pause
- disk I/O
- operating system scheduling
- virtual machine pause

### Key Takeaway

```text
A timeout converts uncertainty into an operational decision, not certainty.
```

---

## Network Congestion And Queueing

Requests wait in queues at many layers:

- client application
- client OS
- network card
- switches and routers
- server network card
- server OS
- application thread pool
- CPU scheduler
- disk scheduler

This waiting time is called queueing delay.

Under low load:

```text
request latency = 5 ms
```

Under high load:

```text
request latency = 50 ms, 500 ms, 5 seconds, or timeout
```

Queueing delay can look like node failure.

### Tail Latency

Tail latency is the latency of the slowest fraction of requests, such as:

- p95
- p99
- p99.9

Average latency can hide severe outliers.

Example:

```text
95 requests finish in 10 ms
4 requests finish in 100 ms
1 request finishes in 5 seconds
```

The average may look acceptable, but the slowest request can dominate user experience.

### Fanout

If one user request calls 20 backend services, the whole request may be delayed by the slowest backend call.

The more services involved, the higher the chance of hitting tail latency.

### Key Takeaway

```text
In distributed systems, the slow tail often matters more than the average.
```

---

## Unreliable Clocks

Each machine has its own clock, and clocks may not agree.

Clocks can:

- drift
- jump forward
- jump backward
- pause during VM suspension
- be adjusted by NTP
- behave strangely around leap seconds

This is dangerous when systems use time for correctness.

---

## Time-Of-Day Clocks

A time-of-day clock reports the current date and time.

Example:

```text
2026-05-28 10:30:00
```

Useful for:

- logs
- human-readable timestamps
- expiration dates
- wall-clock schedules

Danger:

```text
Time-of-day clocks can jump forward or backward.
```

So they are bad for measuring elapsed time.

Example:

```text
start = 10:00:05
clock jumps backward
end = 10:00:03
elapsed = -2 seconds
```

That result makes no sense.

---

## Monotonic Clocks

A monotonic clock is used to measure elapsed time.

It only moves forward.

Useful for:

- timeouts
- retry delays
- measuring request duration
- performance metrics

But monotonic clocks do not tell you the actual date/time.

Also, monotonic clock values from different machines cannot be compared directly because each machine has its own local reference point.

### Key Takeaway

```text
Time-of-day clocks are for wall-clock time.
Monotonic clocks are for elapsed time.
Neither gives perfect cross-node event ordering.
```

---

## Clock Synchronization And Clock Drift

Clock drift means a machine's hardware clock runs slightly fast or slow compared with real time or other machines' clocks.

This causes clocks to diverge over time.

NTP, the Network Time Protocol, tries to synchronize clocks and reduce differences.

But NTP cannot make clocks perfect because:

- synchronization messages have variable network delay
- clocks drift between syncs
- NTP servers can be misconfigured
- virtual machines can pause
- hardware clocks can behave badly
- clocks may jump when corrected

### Last-Write-Wins Problem

If a system uses physical timestamps to decide which write is newer, clock drift can corrupt data.

Example:

```text
Write A happens first on Node A at 10:00:05
Write B happens later on Node B at 10:00:04
```

If the system chooses the latest timestamp, it may incorrectly keep Write A and discard Write B.

The physical timestamp order does not necessarily match the real causal order.

### Key Takeaway

```text
Synchronized clocks are useful approximations, not a perfect source of truth for distributed correctness.
```

---

## Process Pauses

A process pause happens when a process stops making progress for a while without necessarily crashing.

During a pause, it may not:

- respond to messages
- send heartbeats
- release locks
- notice lease expiration
- update internal state

Causes include:

- garbage collection stop-the-world pause
- OS scheduling delay
- VM suspension
- swapping
- page faults
- disk I/O stall
- overloaded CPU
- hypervisor pause
- debugger pause

### Paused Leader Problem

Example:

```text
Leader sends heartbeat every 1 second.
Followers expect heartbeat within 5 seconds.
Leader pauses for 30 seconds.
Followers elect a new leader.
Old leader resumes and still thinks it is leader.
```

This can cause split brain unless the system has safeguards.

### Paused vs Crashed

A crashed process stops acting.

A paused process may resume later and act on stale beliefs.

That can be more dangerous.

### Key Takeaway

```text
A crashed node stops.
A paused node may return with stale assumptions.
```

---

## Leases

A lease is a time-limited lock or permission.

Example:

```text
Node A owns the lease until 10:00:30.
```

Leases are often used for:

- leadership
- exclusive access
- distributed locks

But leases are dangerous if a process pauses.

Example:

```text
Node A gets lease.
Node A pauses.
Lease expires.
Node B gets lease.
Node A resumes and still thinks it owns the lease.
```

Without safeguards, Node A may perform unsafe writes.

---

## Fencing Tokens

A fencing token is a monotonically increasing number given to a process when it acquires a lease or lock.

Example:

```text
Node A gets token 33.
Node A pauses.
Lease expires.
Node B gets token 34.
Node A resumes and sends write with token 33.
Resource rejects token 33.
```

Fencing tokens protect against stale lease holders.

### Important Rule

The shared resource must enforce the fencing token.

It must:

- require a token with every operation
- remember or compare the newest accepted token
- reject requests with older tokens

The resource usually does not conduct elections. A coordination service may issue tokens, but the resource must check them.

### Key Takeaway

```text
A lease alone says who should own something.
A fencing token lets the resource reject stale owners.
```

---

## Truth Is Defined By The Majority

In distributed systems, one node's belief is not enough.

A node may think:

```text
I am the leader.
```

But if the majority disagrees, that belief is not authoritative.

Many systems use quorum, often majority quorum.

Example:

```text
Cluster size = 5
Majority = 3
```

A decision is valid only if it is accepted by a majority.

### Why Majority Works

Any two majorities overlap.

Example:

```text
Majority 1: nodes 1, 2, 3
Majority 2: nodes 3, 4, 5
```

They share node 3.

This overlap helps prevent two conflicting decisions from both being accepted.

### Network Partition

If a 5-node cluster splits:

```text
Side A: 2 nodes
Side B: 3 nodes
```

Only Side B has a majority.

Side A may still be alive, but it should not make authoritative decisions.

### Key Takeaway

```text
Majority/quorum is not only for leader election.
It is for making authoritative distributed decisions.
```

---

## Byzantine Faults

A Byzantine fault means a node behaves arbitrarily, dishonestly, inconsistently, or maliciously.

It may:

- lie
- send different messages to different nodes
- corrupt data
- violate the protocol
- return incorrect results
- pretend to be another node if authentication is missing

### Crash Fault vs Byzantine Fault

Crash fault:

```text
Node stops functioning or stops responding.
```

Byzantine fault:

```text
Node may keep responding, but with false or inconsistent behavior.
```

Most databases assume non-Byzantine faults:

```text
Nodes may crash, pause, or become unreachable.
Nodes do not intentionally lie.
```

### Why Not Always Use Byzantine Fault Tolerance?

BFT is expensive.

It often requires:

- more replicas
- cryptographic authentication
- more messages
- more complex protocols

Classic BFT systems often need at least:

```text
3f + 1 nodes to tolerate f Byzantine faults
```

### Where BFT Matters

Byzantine fault tolerance matters in adversarial or low-trust environments, such as:

- blockchains
- cross-organization systems
- some financial networks
- systems with mutually distrustful participants

### Key Takeaway

```text
Fault tolerance depends on what kind of bad behavior the system assumes can happen.
```

---

## System Model And Reality

A system model states assumptions about how the distributed system behaves.

It usually covers:

```text
1. Network behavior
2. Clock behavior
3. Node failure behavior
```

Algorithms are correct only under their assumed model.

### Network Models

Reliable network:

```text
Messages are delivered correctly.
```

Partially synchronous network:

```text
Messages may be delayed unpredictably, but eventually timing behaves well enough.
```

Asynchronous network:

```text
Messages can be delayed arbitrarily, with no known upper bound.
```

### Clock Models

Perfect clocks:

```text
All nodes have exact synchronized time.
```

Bounded-drift clocks:

```text
Clocks may drift, but within a known bound.
```

No useful clocks:

```text
Algorithm cannot rely on physical time for correctness.
```

### Failure Models

Crash-stop:

```text
Node crashes and never returns.
```

Crash-recovery:

```text
Node may crash and later restart.
```

Byzantine:

```text
Node may behave arbitrarily or maliciously.
```

### Reality Can Violate The Model

Example:

```text
Protocol assumes pauses are less than 10 seconds.
Real GC pause lasts 2 minutes.
```

Then the protocol may fail even if it was correct under its model.

### Key Takeaway

```text
An algorithm is only as correct as the assumptions it is running under.
```

---

## Safety And Liveness

Distributed algorithms are often described using two kinds of properties:

```text
Safety
Liveness
```

### Safety

Safety means:

```text
Nothing bad happens.
```

Examples:

- two leaders are not elected for the same term
- two clients do not hold the same lock simultaneously
- committed data is not lost
- corrupted data is not returned

If safety is violated, the damage is often permanent.

Waiting does not automatically fix corrupted state.

### Liveness

Liveness means:

```text
Something good eventually happens.
```

Examples:

- a request eventually receives a response
- a leader is eventually elected
- a retry eventually succeeds
- a transaction eventually commits or aborts

Liveness can be temporarily violated during failures and then recover.

### Safety vs Liveness Tradeoff

If a node loses contact with the majority, it may stop accepting writes.

That hurts liveness:

```text
The system is temporarily unavailable.
```

But it preserves safety:

```text
The system avoids split brain and conflicting writes.
```

### Key Takeaway

```text
In severe uncertainty, distributed systems often sacrifice progress to avoid permanent damage.
```

---

## Your Weak Areas And Corrections

### 1. Timeout Does Not Mean Failure

Weak version:

```text
After timeout, the system detects failure.
```

Correct version:

```text
After timeout, the system suspects failure or treats the request as failed operationally.
The real outcome is still unknown.
```

Remember:

```text
Timeout = no response within deadline.
Timeout != proof of crash.
```

### 2. Clock Drift vs Clock Offset

Weak version:

```text
Clock drift is the difference between global time and machine time.
```

Correct version:

```text
Clock drift means clocks run at slightly different rates, so their offsets grow over time.
```

Offset is the current difference.

Drift is the rate mismatch that causes difference to accumulate.

### 3. Time-Of-Day Clock vs Monotonic Clock

Time-of-day clock:

```text
Use for current date/time, logs, schedules.
Can jump forward or backward.
Bad for measuring elapsed time.
```

Monotonic clock:

```text
Use for elapsed time, timeouts, durations.
Only moves forward.
Cannot compare values across machines.
```

### 4. Fencing Token Enforcement

Weak version:

```text
The shared resource conducts elections and sends tokens.
```

Correct version:

```text
A coordination service may issue tokens.
The shared resource must check tokens and reject stale ones.
```

No enforcement means no protection.

### 5. Majority Is Broader Than Leader Election

Weak version:

```text
Majority means replicas elect a leader.
```

Correct version:

```text
Majority/quorum defines authoritative decisions generally.
Leader election is one use case.
```

### 6. Byzantine Faults Are Not "Impossible" Internally

Weak version:

```text
Internal company systems have no chance of Byzantine faults.
```

Correct version:

```text
Most internal databases assume non-Byzantine faults because BFT is expensive and the trust model usually allows that assumption.
But bugs, compromise, and corruption can still happen.
```

---

## Quick Comparison Table

| Concept | Meaning | Key Risk |
|---|---|---|
| Partial failure | Some parts fail while others continue | Uncertain outcome |
| Timeout | Stop waiting after a deadline | False failure suspicion |
| Queueing delay | Waiting inside network/system queues | Looks like failure |
| Tail latency | Slowest fraction of requests | Hidden by averages |
| Time-of-day clock | Current wall-clock time | Can jump |
| Monotonic clock | Elapsed-time measurement | Not comparable across nodes |
| Clock drift | Clocks run at different rates | Wrong ordering |
| Process pause | Process stops making progress temporarily | Resumes with stale beliefs |
| Lease | Time-limited ownership | May expire during pause |
| Fencing token | Increasing ownership token | Useless unless enforced |
| Majority quorum | Decision needs majority | Minority cannot safely decide |
| Byzantine fault | Arbitrary/dishonest behavior | Requires expensive BFT |
| Safety | Bad thing never happens | Violation may corrupt state |
| Liveness | Good thing eventually happens | May be sacrificed for safety |

---

## Final Mental Model

Distributed systems are not hard because computers are slow. They are hard because no machine can know the whole truth at the exact moment it needs to decide.

Every node sees only partial evidence:

```text
messages arrived
messages did not arrive
clock says this time
lease appears valid
heartbeat was missed
majority may or may not be reachable
```

But that evidence may be stale, delayed, or misleading.

So robust distributed systems rely on:

- timeouts, but treat them as suspicion
- retries, but make them safe with idempotency
- monotonic clocks for durations
- caution with physical timestamps
- fencing tokens for stale lease holders
- majority quorums for authoritative decisions
- explicit system models
- safety-first behavior under uncertainty

If you remember only one sentence:

```text
Distributed systems must make decisions without perfect knowledge, so correctness depends on carefully handling uncertainty.
```
