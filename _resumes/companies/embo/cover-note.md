# Cover letter: Embo, Research Scientist, Reinforcement Learning

Practising in a learned world model is how I think robots get general, and Dreamer is why I think so.

At Berkeley's Hybrid Robotics Lab I trained one PPO policy in IsaacGym that took a Unitree Go1 from tracking a ball to kicking it at a target, about 60% on hardware. Most of the work was the reward and the gap between the simulator and the real robot, and I prototyped RLPD to fine-tune on real data. A world model you can practise in is the version of that simulator I want to build on.

When a robot practises in imagination, the reward is all it has. I've spent the last year on how that breaks: recovering rewards from preferences and demonstrations, and showing that EPIC distance predicts a learned reward's regret better than raw correlation (0.61 against 0.54). In a toy code-repair task, RL on narrow checks drove real correctness from 31% to 2%.

I haven't trained a world model yet. That's the part I'd come to Embo to learn.
