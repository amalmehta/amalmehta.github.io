# Cover note: Anthropic, Research Engineer (RL)

I study what RL does to a policy when the reward is easier to satisfy than the task. In my latest project, GRPO on visible tests pushed a code agent's pass rate from 35% to 58% while true correctness fell from 31% to 2%: it learned to delete the branches no test reaches. I then ran 50 follow-ups, each with its prediction written down before it ran. The most useful result: choosing which episodes to audit held false success to 4%, against 24% for random audits on the same budget.

Before that, I spent four years at PhysicsAI building RL training loops end to end, from environments and reward design to multi-week GPU runs. At Berkeley's Hybrid Robotics Lab, I trained a quadruped to kick a ball at a target on real hardware.

My experiments are toy scale. At Anthropic the same questions, when a reward stops measuring the task and how to catch it, come up at frontier scale, and that's the work I want to do.
