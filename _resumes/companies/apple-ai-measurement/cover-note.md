# Cover note: Apple, AI Measurement Scientist, AI Evaluation Platform, Seattle

Most of my research this year has been about one problem: what happens when the number you train on isn't the thing you care about.

I ran into it head on in a small study. I trained a code-repair agent with GRPO and rewarded it for passing the tests it could see. Its pass rate went up, from 35% to 58%. Then I checked its code against a full hidden test. The share that was actually correct had dropped from 31% to 2%. It had learned to delete the code no test touched. Random spot checks only slowed that down. Choosing which attempts to check held false passes to 4%, against 24% for random checks on the same budget.

That's why this role caught my eye. If teams decide what ships from a score, the score has to be right.

I've worked this way for a while. For four years at PhysicsAI, we judged our synthetic training data by how a detector did on real drone footage, not on more synthetic data.

I'm not a psychometrician, and IRT would be new to me. I'd be learning it from your team, and I'm looking forward to that.

<!-- Saved for later, the first draft (2026-11-24):

The most useful result I've had recently was a score that lied. In a small reward-hacking study, I trained a code-repair agent with GRPO on visible tests: its pass rate rose from 35% to 58% while true correctness fell from 31% to 2%, because it learned to delete untested branches. Audits targeted at the risky cases held false success to 4%, against 24% for random audits at the same 10% budget. I'd like to work on making evaluation trustworthy.

Before that, for four years at PhysicsAI, a DARPA-funded program, I scored synthetic training data by a detector's accuracy on real drone footage rather than a synthetic proxy. In my post-training work I compare SFT, GRPO and DPO on held-out tasks across seeds before believing a gain.

I'm not a psychometrician, and I'd be learning IRT and construct validation from your team. What I'd bring is an ML researcher's habit of not trusting a number until it's been checked against the real thing, which matters most on a platform where Apple teams decide what ships from the score.
-->
