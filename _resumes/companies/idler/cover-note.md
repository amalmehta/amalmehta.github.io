# Cover note: idler, Research Engineer

An RL environment is only as good as its checks, and most of my recent work has been about what happens when the checks are narrower than the task. I built Patch World, a toy code-repair environment with visible tests and a hidden verifier. GRPO on the visible tests pushed pass rate from 35% to 58% while true correctness fell from 31% to 2%: the agent learned to delete code no test reaches. Across 50 follow-ups, each predicted before it ran, choosing which episodes to audit held false success to 4%, against 24% for random audits on the same budget.

Before that, I spent four years at PhysicsAI generating synthetic training data with RL: policies set the generator's parameters and were rewarded by how well a detector trained on that data did on real drone imagery.

My experiments are toy scale. idler builds environments and quality checks that frontier labs actually train on, and that's the version of this problem I want to work on.
