#!/usr/bin/env python3
"""Builds the Featured projects' deep-dive pages (project-*.html) from the content below.

Each page: the question, the setup in plain words, how it works as a short numbered flow, the key
numbers, the key figure, what didn't work, and what's next. Every number comes from the project's
own repo (results files, paper, write-up); change it there first, then here.
Run from the repo root after editing: python3 tools/make-case-studies.py
"""
import html, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://amalmehta.com/"
e = html.escape

PAGES = [
    {
        "slug": "rewarding", "card": "unverifiable-rewards",
        "title": "Rewarding What You Can’t Verify",
        "when": "2026 · pilot, then 50 follow-ups, each predicted first · toy scale, on a laptop",
        "hook": "A code agent trained only on visible tests learns to delete untested code until real correctness falls to 2%; random audits stopped it in the pilot but only delayed it in follow-ups.",
        "question": [
            "Code agents are often trained on cheap checks: does it build, do the visible tests pass. Those checks are narrower than what we actually want, which is a correct change, and an agent pushed hard on them can learn to exploit the gap, for example by deleting code no test reaches. The longer the horizon, the more the reward favours the hack.",
            "This project measures that gap in a setting small enough to run hundreds of times, then tests what closes it.",
        ],
        "setup": [
            "Patch World is a toy repair task. Each program has 12 branches whose outputs follow a pattern, and some are broken (4 by default). The agent can write a value, stub a branch or delete it, and half the broken branches are reached by the visible tests. A hidden check compares every branch with the reference: that is what “truly correct” means here.",
            "The agent is deliberately small: a two-layer network (49 → 128 → 12) that picks one token per branch, not a language model writing code. It’s first fine-tuned on a careless engineer’s demonstrations, then trained with GRPO: 8 attempts per program, each scored against the group, with a penalty for drifting far from where it started.",
            "The rewards compared: visible checks only, a penalty for deleting, and random audits with the hidden check on 5%, 10%, 25% or 100% of episodes. Three seeds per setting, 1,000 training steps, scored on 2,000 held-out programs.",
        ],
        "flow": ["Make 12-branch programs, break some", "Fine-tune on a careless demonstrator", "Train with GRPO on the chosen reward",
                 "Audit a random share with the hidden check", "Compare visible pass with true correctness"],
        "stats": [("58%", "visible pass rate after training, up from 35%"), ("2%", "truly correct, down from 31%"),
                  ("98%", "of untested branches deleted"), ("18%", "false success with 25% of episodes audited, after about 1,500 steps")],
        "results": [
            "Trained on visible checks alone, the pass rate rose from 35% to 58% while real correctness fell from 31% to 2%: the agent learned to delete 98% of the branches no test reaches. In the pilot, auditing a random 25% of episodes held false success to 4%, while 10% audits left it at 28%, against 56% with none.",
            "Then came 50 follow-ups, each with its prediction written down in the repo before it ran: 21 supported, 15 refuted, 12 mixed and 2 deferred. Three that stand out:",
        ],
        "notes": [
            "<strong>E24, mixed.</strong> 25% audits delay the hack rather than prevent it: false success ended at 0.18 after about 1,500 steps.",
            "<strong>E15, supported.</strong> With the same 10% budget, choosing which episodes to audit instead of picking them at random held false success to 0.04, against 0.24.",
            "<strong>E31, refuted.</strong> A small transformer that reads the whole program learned honest repair instead of hacking: 0.49 truly correct, against 0.12 for the small network (run at reduced scale, 2 seeds and 600 steps).",
        ],
        "missed": [
            "RL never improved honest repair above the fine-tuned starting point when the agent picks its single best answer. The hidden check is a perfect oracle, which real code doesn’t have. At a horizon of 8 almost nothing passes, so the reward carries no signal.",
            "It’s toy scale, with 3 seeds per setting, and the error bars are spread across seeds, not confidence intervals. Two follow-ups (E40, E41) are deferred: too slow on a heavily shared machine.",
        ],
        "next": ["An 18-month plan in five phases: measure false success, extend the verifier, budget audits inside RL, go to long horizons, and build evaluations that predict the hack before it happens."],
        "figure": ("rewarding", 928, 1024, "Figures 1 and 2 from the project site: during training the visible pass rate climbs while true correctness falls, and the share of untested branches deleted rises towards all of them"),
        "links": [("Live demo: proposal and results", "https://amalmehta.com/long_term_horizon_planning/"),
                  ("Source on GitHub", "https://github.com/amalmehta/long_term_horizon_planning"),
                  ("Experiment log", "https://amalmehta.com/long_term_horizon_planning/#log")],
    },
    {
        "slug": "bci", "card": "bci-projects",
        "title": "BCI Projects",
        "when": "2026 · offline decoding on public data; closed loop simulated",
        "hook": "Four brain–computer interface projects on public neural recordings; with no new labels, the cursor decoder averages R² 0.72 on 17 of 19 held-out days up to day 138, against 0.42 for a Wiener filter.",
        "question": [
            "A cursor brain–computer interface is only as useful as its worst day. The neurons an implant records drift from day to day, so a decoder trained once slowly stops working, and asking someone to recalibrate every morning is a real cost.",
            "These four projects work on public neural recordings to see how far careful decoding gets without new labels, and where it stops.",
        ],
        "setup": [
            "<strong>Telepathy</strong> decodes cursor movement across months from a monkey’s motor cortex (Zenodo 583331, 24 sessions), scored in simulated bits per second. <strong>Speech</strong> turns attempted speech into phonemes and words (Brain-to-Text ’25): 38.8% phoneme error with a causal Conformer on 426 held-out sentences.",
            "<strong>Assisted Robotic Arm</strong> decodes 7-DoF arm movement and adds shared autonomy that knows the decoder’s mistakes (FALCON H1): simulated grasp success goes from 2% to 100% with assistance. <strong>Blindsight</strong> goes the other way, a learned, safety-bounded stimulation encoder for 1,024 sites in visual cortex, in simulation because no public human V1 stimulation data exists: percept fidelity SSIM 0.84 against 0.73.",
        ],
        "flow": ["Count spikes per electrode, every 20 ms", "Re-centre each channel on the new day", "Per-day adapter, starting as identity",
                 "Shared causal GRU latent model", "Velocity head drives the cursor"],
        "flow_note": "“No new labels” means re-centring: each channel’s mean and spread are recomputed from the new day’s unlabelled spikes, which costs nothing.",
        "stats": [("0.72", "R² with no new labels, over 17 held-out days"), ("0.42", "a re-centred Wiener filter, the same days"),
                  ("138", "days after calibration, the furthest tested"), ("0.79", "R² within the calibration days")],
        "results": [
            "Calibrated on 5 days (days 0–15) and tested on 19 held-out days from day 20 to day 138. On the 17 days without an electrode re-mapping, the re-centred decoder averages R² 0.718, against 0.662 for a plain GRU, 0.422 for a re-centred Wiener filter and −0.037 for a Wiener filter left as it was trained.",
            "Counting all 19 days, it’s 0.636 against 0.353.",
        ],
        "missed": [
            "Two held-out days (28 and 131), when the electrodes were re-mapped, break every re-centred decoder: R² near 0. Unsupervised alignment on top mostly didn’t help (0.706 against 0.718). Every bitrate is simulated, and it’s one animal, one arm, one array.",
            "In the Neuro Falcon follow-up, even the best method reaches only 0.21 and 0.15 on the last two held-out days, against 0.42–0.45 on the earlier ones, and there are only 4 held-out days.",
        ],
        "next": ["Neuro Falcon: submit the re-normalising decoder to the FALCON leaderboard, test whether channel statistics alone explain the late-day gap, and try re-normalising continuously."],
        "figure": ("bci", 1200, 591, "R² on each held-out day with no new labels, for decoders left fixed, re-centred, and re-centred then aligned"),
        "links": [("Code and write-ups on GitHub", "https://github.com/amalmehta/BCIProjects"),
                  ("Cursor decoding write-up (PDF)", "https://github.com/amalmehta/BCIProjects/blob/main/papers/Telepathy.pdf"),
                  ("Neuro Falcon follow-up", "https://github.com/amalmehta/NeuroFalcon")],
    },
    {
        "slug": "post-training", "card": "post-training-lab",
        "title": "Post Training Lab",
        "when": "2026 · toy maze, 3 seeds",
        "hook": "A 59k-parameter transformer learns a maze by SFT, then GRPO and DPO lift held-out success from 70% to 80% and 81% over 3 seeds.",
        "question": [
            "Can post-training fix a habit a model picked up from flawed demonstrations? Supervised fine-tuning (SFT) copies the demonstrations, habit included. GRPO and DPO are two ways to fix it afterwards. A third run checks the classic failure: a model that learns to game a subtly wrong reward.",
        ],
        "setup": [
            "Key & Door: a 7×7 grid with a wall and a locked door. The key is on the agent’s side and the goal is across, and the true reward is 1 − 0.01 × steps on success, within 30 steps. The model is a tiny transformer, about 59k parameters (3 layers, 4 heads, width 48), that reads 26 tokens and picks one of 4 moves.",
            "The demonstrations come from a planner that 80% of the time walks straight at its target instead of planning: the habit to fix. GRPO is online RL, trying each level 8 times and pushing towards the attempts that beat the group’s average. DPO is offline, learning from pairs of a better and a worse attempt. Scoring uses 150 test levels and 150 harder ones with denser walls, all kept out of training.",
        ],
        "flow": ["Planner demos with a bad habit", "SFT: copy the demos", "GRPO from SFT, kept close to it",
                 "DPO on SFT samples, same budget", "Controls: a reward hacker, RL from scratch", "Score on test and harder levels"],
        "stats": [("70% → 80%", "test success, SFT to GRPO"), ("81%", "with DPO plus an NLL term"),
                  ("63% → 74%", "on the harder levels, SFT to GRPO"), ("7%", "true success for the reward hacker")],
        "results": [
            "Means over 3 seeds on the 150 test levels: SFT 69.6%, GRPO 80.4%, DPO with an NLL term 81.3%. On the harder levels: 62.7%, 74.4% and 72.9%. Plain DPO collapsed (16.0%) until the NLL term was added. RL from scratch never solved a level.",
            "The reward hacker, trained on a proxy that pays for getting closer to the goal each step with walls ignored, pushed its proxy score from about 0.26 to 0.58 within about 10 iterations, while its true success fell to 6.9%.",
        ],
        "missed": [
            "Three seeds, so the bands show best and worst seed, not a confidence interval. The eval sets are small (150 levels each), so one level is worth about 0.7 points of success. The harder split only varies wall density: a mild shift, not a new task.",
            "DPO and the reward hacker use settings picked from one short trial each. Along the way, uniform label noise (greedy decoding just removed it), a 9×9 grid (too noisy to train on a CPU) and plain DPO all failed.",
        ],
        "next": ["Test whether GRPO’s lead over SFT holds on a real distribution shift, such as new layouts or a bigger grid, not just denser walls."],
        "figure": ("post-training", 1200, 635, "Training curves across 3 seeds: GRPO climbs from the SFT starting point while RL from scratch stays at zero"),
        "links": [("Live demo: race the checkpoints", "https://amalmehta.com/PostTrainingLab/"), ("Code and write-up on GitHub", "https://github.com/amalmehta/PostTrainingLab")],
    },
    {
        "slug": "drone", "card": "drone-autonomy",
        "title": "Drone Autonomy",
        "when": "2026 · simulation only; paper draft",
        "hook": "A simulated quadrotor that maps unknown rooms, plans with A* and adapts to payload, wind and worn motors; a learned residual roughly halves tuned adaptive control’s error on held-out tasks.",
        "question": [
            "A quadrotor flying outside the lab meets conditions it wasn’t tuned for: extra payload, a worn motor, wind, command delay. Meta-learning, training a model that adapts from a few flights, promises to cope. Classical control stacks are dependable but fixed.",
            "The question is where meta-learning actually helps once it’s combined with a classical stack.",
        ],
        "setup": [
            "A batched simulator modelled on a Holybro X500 V2 (2.0 kg, 500 Hz), commanded the way the PX4 flight stack is: collective thrust plus body rates. Each task draws payload ×0.85–1.3, one motor down to 75%, drag ×0.5–2, wind up to 2.5 m/s with gusts, and 0–30 ms of latency. Out-of-distribution tasks go beyond every range at once.",
            "Seven meta-learners (MAML, FOMAML, ANIL, Meta-SGD, Reptile, PEARL and RL²) plug in as a learned residual added to the controller’s output, as the controller’s gains, or as the local planner. The baselines: the plain geometric controller, L1 adaptive control (estimates the disturbance online and cancels it), one policy trained across all conditions, and fine-tuning.",
        ],
        "flow": ["Depth camera builds an occupancy map", "A* plans a path through the map", "Local planner turns it into velocity",
                 "Geometric controller: thrust and body rates", "Learned residual or tuned gains adapt it", "Tasks perturb payload, motors, wind, latency"],
        "stats": [("7.3 cm", "tracking error with a learned residual"), ("14.0 cm", "tuned L1 adaptive control"),
                  ("15.8 → 10.8 cm", "Meta-SGD adapting the controller’s gains"), ("73%", "navigation success, classical planner")],
        "results": [
            "On 32 held-out tracking tasks, a learned residual trained across all conditions reaches 7.3 cm error with no adaptation at all, against 14.0 cm for tuned L1 adaptive control and 21.4 cm for the plain controller. Meta-learning adds little to that residual: the gradient meta-learners land at 7.7–7.8 cm after adapting.",
            "Meta-learning pays off when it adapts the classical gains instead: Meta-SGD goes from 15.8 to 10.8 cm, 3.5 cm better than tuning without it on paired tasks, and wins 83% of the pairs. For navigation in unseen rooms, the classical local planner reaches 73% success over 96 flights; learned planners reach 31–55%.",
        ],
        "missed": [
            "Out of distribution, every method fails: tracking error of at least 63.1 cm and navigation success of at most 17%, and the learned residuals crash more often (43–49% of episodes) than the plain controller (34%). Gradient adaptation at the meta-trained step size makes learned planners worse.",
            "Everything is in simulation, with no real flights yet. Thrust-to-weight, motor lag and drag are estimates, state estimation is perfect, and the number of seeds was limited.",
        ],
        "next": ["Flight tests on the recommended platform, an X500 V2 with a Jetson Orin Nano Super and a RealSense D435i, in five stages: system identification, hover, tracking, known obstacles, then an unknown room."],
        "figure": ("drone", 1200, 441, "Two recorded flights: the map built from depth, the final A* plan and the track flown"),
        "links": [("Live demo: replay the flights", "https://amalmehta.com/DroneAutonomy/"),
                  ("Source on GitHub", "https://github.com/amalmehta/DroneAutonomy"),
                  ("Paper draft (PDF)", "https://github.com/amalmehta/DroneAutonomy/blob/main/paper/Where%20Does%20Meta-Learning%20Help%20a%20Quadrotor.pdf")],
    },
    {
        "slug": "alphago", "card": "alphago-lite",
        "title": "AlphaGo Lite",
        "when": "2026 · 9×9 Go, one laptop CPU",
        "hook": "A 9×9 Go engine that taught itself by self-play on one laptop CPU, going from 0 to 32 wins in 40 games against GNU Go’s weakest level.",
        "question": [
            "AlphaGo Zero learned Go from nothing but the rules, by playing against itself. This project rebuilds that recipe on a 9×9 board, trains it on one laptop with no GPU, and ships it as a Mac app and a website that show which moves the engine is weighing as you play.",
            "The question is how far self-play gets at laptop scale.",
        ],
        "setup": [
            "Standard 9×9 Go: simple ko, no suicide, area scoring and a komi of 7.5. The network is a small residual net, 4 blocks of 48 channels and 188,173 parameters, that reads 6 planes describing the board and outputs a move (any of the 81 points, or pass) and a guess at who will win. It was chosen over a 6×64 net that took about twice as long per position.",
            "Each generation plays 160 games against itself with Monte Carlo tree search guided by the network: 160 simulations on a quarter of the moves and 40 on the rest, so most moves are cheap. The network then trains on where the search spent its visits and on who won, with every position seen in all 8 rotations and reflections.",
            "In all, 107 generations and 17,120 self-play games, in about 23 hours on one 8-core Intel Core i9 with no GPU. After generation 44, which still lost every game to GNU Go, four things changed at once: each generation trained only on the last 12 generations’ games, a small extra output learned to predict who owns each point at the end, the engine could pass only once the game was played out, and self-play games could run to 250 moves instead of 162.",
        ],
        "flow": ["Self-play: 10 workers, 16 games each", "Tree search guided by the network", "Train on visit counts and results",
                 "Check generations head to head", "Export to Core ML and ONNX", "Play in the Mac app or the browser"],
        "stats": [("32/40", "games won against GNU Go at its weakest level, up from 0"), ("76/80", "against generation 44"),
                  ("80/80", "against generation 0"), ("23 h", "of training on one laptop CPU")],
        "results": [
            "At 400 simulations a move, generation 107 beat GNU Go 3.8 at level 1, its weakest setting, in 32 of 40 games: 17 of 20 as Black and 15 of 20 as White, by a median of 3.5 points. Generation 44 lost all 40 of the same games by a median of 81.",
            "Against its own past, generation 107 beat generation 44 in 76 of 80 games and generation 51 in 77 at 160 simulations a move, and generation 0 in all 80 at 64. Over training the policy loss fell from 4.09 to 2.26 nats and the value loss from 0.69 to about 0.41, though part of that drop comes from training on fewer, newer games.",
            "The browser demo runs generation 107, and its pass rule matches the Python version on 3,000 random positions. A 400-simulation search takes about a second in the browser.",
        ],
        "missed": [
            "In absolute terms it’s still weak: GNU Go level 1 is that program’s weakest setting, and the engine has never been measured against people. About half its wins are by 4.5 points or less, and two of its 8 losses were by 73.5 and 47.5.",
            "One run stalled for two hours when a self-play worker died and its job was silently dropped; timeouts and retries fixed it. It’s one training run with one seed, on a machine shared with other work, and the four changes after generation 44 went in together, so which of them mattered isn’t known.",
            "The Mac app still runs generation 44 without the new pass rule. It leaves out superko, handicap stones, time controls and saving games, the search runs on a single thread, and scoring doesn’t remove dead stones.",
        ],
        "next": ["Bring the Mac app up to generation 107, test which of the four changes mattered, and measure its strength against people."],
        "figure": ("alphago", 1200, 392, "Generation 107 head to head against generations 0, 44 and 51 and GNU Go level 1, and the policy and value losses over 107 generations of training"),
        "links": [("Play it in your browser", "https://amalmehta.com/AlphaGoLite/"),
                  ("Source on GitHub", "https://github.com/amalmehta/AlphaGoLite")],
    },
]


def paras(items, cls=""):
    c = f' class="{cls}"' if cls else ""
    return "\n".join(f"      <p{c}>{p}</p>" for p in items)


def page(p, i):
    url = f"{SITE}project-{p['slug']}.html"
    desc = e(p["hook"])
    name, w, h, alt = p["figure"]
    prev_p, next_p = PAGES[i - 1], PAGES[(i + 1) % len(PAGES)]
    flow = "\n".join(f"        <li>{e(s)}</li>" for s in p["flow"])
    stats = "\n".join(f'        <div class="stat"><strong>{e(v)}</strong><span>{e(k)}</span></div>' for v, k in p["stats"])
    notes = ("\n      <ul class=\"case-notes\">\n" + "\n".join(f"        <li>{n}</li>" for n in p["notes"]) + "\n      </ul>") if p.get("notes") else ""
    flow_note = f'\n      <p class="flow-note">{e(p["flow_note"])}</p>' if p.get("flow_note") else ""
    links = " ".join(f'<a href="{u}">{e(t)} →</a>' for t, u in p["links"])
    return f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'">
  <title>{e(p["title"])} · Amal Mehta</title>
  <meta name="theme-color" content="#fafaf8" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#131414" media="(prefers-color-scheme: dark)">
  <link rel="icon" href="images/favicon-32.png" sizes="32x32" type="image/png">
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="images/apple-touch-icon.png">
  <meta name="description" content="{desc}">
  <link rel="canonical" href="{url}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Amal Mehta">
  <meta property="og:url" content="{url}">
  <meta property="og:title" content="{e(p["title"])} · Amal Mehta">
  <meta property="og:description" content="{desc}">
  <meta property="og:image" content="{SITE}images/og-project-{p["slug"]}.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="{e(p["title"])}: the deep dive, from the question to what didn’t work">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image:alt" content="{e(p["title"])}: the deep dive, from the question to what didn’t work">
  <link rel="preload" href="fonts/newsreader-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="styles.css">
  <script src="email.js" defer></script>
</head>
<body>
  <a class="skip" href="#top">Skip to content</a>
  <header class="site-header">
    <nav class="wrap nav">
      <span class="nav-brand"><a class="nav-name" href="index.html">Amal Mehta</a><a class="nav-status" href="https://github.com/amalmehta/PortfolioWebsite/commits/main/" title="See every change on GitHub">Evolving site · <time datetime="2026-11">Nov 2026</time></a></span>
      <div class="nav-links">
        <a href="index.html">Profile</a>
        <a href="index.html#featured" aria-current="true">Projects</a>
        <a href="interests.html">Interests</a>
        <a href="resume/amal-mehta-resume.pdf" type="application/pdf">Resume <span class="file">PDF</span></a>
      </div>
    </nav>
  </header>

  <!-- Built by tools/make-case-studies.py; edit the content there, not here. -->
  <main id="top" class="wrap page case">
    <header class="page-head">
      <p class="card-when">{e(p["when"])}</p>
      <h1>{e(p["title"])}</h1>
      <p class="case-hook">{e(p["hook"])}</p>
      <p class="links">{links}</p>
    </header>

    <section class="case-part">
      <h2 class="section-title">The question</h2>
{paras(p["question"])}
    </section>

    <section class="case-part">
      <h2 class="section-title">Setup</h2>
{paras(p["setup"])}
    </section>

    <section class="case-part">
      <h2 class="section-title">How it works</h2>
      <ol class="flow">
{flow}
      </ol>{flow_note}
    </section>

    <section class="case-part">
      <h2 class="section-title">Results</h2>
      <div class="stats">
{stats}
      </div>
{paras(p["results"])}{notes}
      <figure class="case-figure">
        <picture><source type="image/avif" srcset="images/case/{name}.avif"><source type="image/webp" srcset="images/case/{name}.webp"><img src="images/case/{name}.webp" alt="{e(alt)}" loading="lazy" width="{w}" height="{h}"></picture>
        <figcaption>{e(alt)}.</figcaption>
      </figure>
    </section>

    <section class="case-part">
      <h2 class="section-title">What didn’t work</h2>
{paras(p["missed"])}
    </section>

    <section class="case-part">
      <h2 class="section-title">What’s next</h2>
{paras(p["next"])}
    </section>

    <nav class="case-nav" aria-label="Other projects">
      <a href="project-{prev_p["slug"]}.html">← {e(prev_p["title"])}</a>
      <a href="index.html#{p["card"]}">Back to the profile</a>
      <a href="project-{next_p["slug"]}.html">{e(next_p["title"])} →</a>
    </nav>
  </main>

  <footer class="wrap footer">
    <p>Amal Mehta · <a href="https://reachouts.me/?u=amal">Get in touch</a> · <a class="email" href="https://reachouts.me/?u=amal" data-u="amal.mehta" data-d="gmail.com">amal.mehta [at] gmail.com</a> · <a rel="me" href="https://www.linkedin.com/in/amal-mehta-264413a9/">LinkedIn</a> · <a rel="me" href="https://github.com/amalmehta">GitHub</a> · <a href="thinking.html">Things I’m thinking about</a> · <a href="photos.html">Travel</a> · <a href="interests.html">Interests</a> · <a href="values.html">What I try to live by</a> · <a href="feed.xml">RSS</a></p>
    <p class="signoff">Thanks for stopping by.</p>
    <!-- Saved for later, once beside the sign-off: <span class="secrets">There are eight secrets here.</span> -->
    <!-- Saved for later, the footer notes: <p class="footer-note">No trackers, no cookies.</p> <p class="footer-note">Plain HTML and CSS, tested on every push. <a href="https://github.com/amalmehta/PortfolioWebsite">Source on GitHub</a>.</p> -->
  </footer>
</body>
</html>
'''


if __name__ == "__main__":
    for i, p in enumerate(PAGES):
        (ROOT / f"project-{p['slug']}.html").write_text(page(p, i), encoding="utf-8")
        print(f"wrote project-{p['slug']}.html")
