# Cover note: RAI Institute, Sim2Real Robotics Research Scientist - Manipulation

I want to get policies working on real robots again; sim-to-real is the part I liked most on the Go1.

At Berkeley's Hybrid Robotics Lab I trained one multi-stage PPO policy in IsaacGym that took a Unitree Go1 from tracking a ball to kicking it at a target, replacing the separate policies prior work used, and it hit about 60% on hardware. Most of the work was the reward: three stages, plus gait tracking, and I prototyped RLPD to fine-tune it on real robot data.

Before that, at PhysicsAI, I closed a different sim-to-real gap: RL tuned a synthetic image generator against a detector's accuracy on real drone footage, with domain adaptation from scratch when real labels ran short.

My hardware work so far is locomotion, not dexterous manipulation. RAI co-designs the hands, the controls and the learning together, and that's where I'd learn contact-rich manipulation fastest.
