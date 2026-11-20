# Cover note: Odyssey, Member of Technical Staff, Forward Deployed Machine Learning Engineer

For four years at PhysicsAI, a DARPA-funded program, my job was to make generated data useful in the real world. Real drone footage with labels was scarce, so we generated synthetic images. I turned tuning the generator into an RL problem: an agent set the generator's parameters, a detector trained on what it made, and the detector's accuracy on real footage was the reward. I also built the meta-RL code for a fighter-jet simulation, so an agent adapts to a new task in a few tries, and implemented domain adaptation from scratch for when real labels ran short.

Since then I've built each project end to end on my own: a sim-trained PPO policy that kicked a ball on a real Unitree Go1 at Berkeley, a batched quadrotor simulator with randomized payload, wind and motor wear, post-training with SFT, GRPO and DPO, and a toy study of how RL learns to game the checks it's given.

A world model is only worth as much as what someone can do with it on their own data, and that gap between a model and a working system is the part I like most.
