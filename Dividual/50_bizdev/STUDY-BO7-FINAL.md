> ⛔ **WITHDRAWN-CLAIM BANNER — added 2026-08-22. DO NOT SEND FROM THIS FILE UNTIL RECUT.**
>
> This file asserts the **two-churn typology** (satiation vs friction, "opposite fixes") as a live claim. **It was withdrawn 2026-07-22**: Gate 2 returned Cohen *d* = 0.03 against a pre-registered 0.3, so the two groups do not separate on an independent degradation measure. It survives only as a *paid, pre-registered build* gated on server-side match-experience fields — never as a free-layer existence claim, and never as an opener.
>
> **Lines 13 and 76** carry **'four to six weeks of warning'** (withdrawn, say-list §C2). Line 51 is correct and stays — it records the two-churn set-aside with its effect size, which is the honest version.
>
> **Flagged, not rewritten** — the pitch is Adnan's voice and his call. Recut the named lines, then delete this banner. Found by `~/.claude/tools/crossproject_lockstep.py`, which reaches this directory; `lockstep_check` alone never did.

# Player churn in BO7 multiplayer — a first-passage study

*Capability demonstration on the shared 20,000-player panel · gates-first, case-control-corrected · prepared for Ahmad Azadvar*

---

## Positioning

This is a demonstration, run on your own BO7 multiplayer data, of what a first-passage, gates-first read adds to the churn question. It is meant to complement a mature user-research program, and it is written to be forwarded: the summary and findings stand on their own, every method is auditable, and nothing here overclaims. Where the study can only show a direction, it says so; where a claim needs data you hold and this pull lacked, it names the data rather than guessing. The distinctive thing on offer is a discipline — testing each claim to destruction before believing it — and an instrument that falls out of it.

## Executive summary

Churn in BO7 multiplayer reads as a single, abrupt-dominated exit from an active, schedule-driven state. Half of the players who leave are still playing at close to their normal weekly volume the week before they go — the exit is a sudden crossing into quiet, not a gradual fade you can watch approach. A simple, leakage-safe risk score concentrates churn at three times the base rate in its top quintile, and a rolling version gives four to six weeks of warning on the players a one-shot model misses. Six plausible explanations for why players leave were tested and set aside; the handful that survive are the ones the data earns. What this document shows is the read and that the instrument works. The fitted models, the production scoring, and the causal experiments are the work a collaboration would take on.

## 1. The data, and the trap built into it

The panel is one row per player-match — 3.59 million rows, 20,000 players, split evenly into 10,000 who churned and 10,000 who stayed, over 2026-03-20 to 2026-07-18. The two groups were chosen after the fact by how recently they had played. That is a case-control design, borrowed from epidemiology, and it is efficient for studying the difference between leavers and stayers.

It also carries a trap worth flagging for anyone handed an extract like this. Because the groups were selected on recency, "days since last played" separates them perfectly — an AUC of 1.000 — while telling a live team nothing they can act on, since by the time recency is high the player is already gone. A model trained naively on such an extract posts a spectacular score that measures the sampling rather than the behavior. Two rules follow and are enforced throughout: recency and total play-volume are never used as predictors, and only relative risk on equal-exposure windows is reported, never absolute churn rates. Most of the value in the sections below is in having built the analysis to respect that boundary.

## 2. Method — running the gates first

A first pass through this data did what exploratory analysis usually does: it clustered players, found two shapes, and named them a satisfying story. The correction was an order of operations, not a better cluster.

A gate is a test a candidate finding must pass before it is believed, fixed in advance so it cannot be moved afterward. For a claim that two groups differ by mechanism, the gates ask whether the groups actually separate on an independent measure of the proposed cause, and whether the split survives controlling for skill and tenure. Writing those tests down first, then fitting, is the whole method. When the gates ran, the tidy two-mechanism story dissolved, and what remained — described below — turned out to be more useful. A team that will demote its own headline is worth more than one that accumulates confident claims, and with a quant readership that willingness is the credential.

## 3. Churn morphology — a sudden crossing, not a slow fade

There are two ways a player can stop. They can taper off over weeks, a decay you can see approach, or they can be playing normally and then not come back, a crossing with no run-up. We measured which dominates by comparing each churned player's final week to their own lifetime weekly pace.

The crossing dominates. Forty-nine percent of churned players were still at 80% or more of their normal weekly volume the week before they disappeared; only 16% gradually faded. The distribution is one continuous population with a fat tail, not two separate types. For about half of churn, there is no wind-down in play volume to catch — the player is there, and then is not.

![Exit-abruptness: most churned players leave abruptly, still near their normal pace.](fresh_PA1_morphology.png)

Modeled as a state-crossing, the picture is clean. We track each player's smoothed activity as a "state" and ask when it crosses into quiet. For churned players the state drops out of a live level; for the active reference group it stays up. The activity state is itself the churn signal, and the exit is a first passage of that state across a line rather than a decline toward it. The consequence for intervention is concrete: a win-back offer sent after a player lapses is too late for half the problem, because there was no slope to see coming. The intervention has to sit earlier, inside the active window.

![First-passage-of-state: churned players cross into quiet from a live level; active players' state stays high.](fp_state_trajectory.png)

## 4. The regime — a habit loop, not a reward loop

Engagement runs in two very different ways, and the difference decides which levers work. In a reward loop — loot, near-misses, escalating stakes — each session pulls the next, and the system is self-exciting. In a habit loop, play is governed by the player's own schedule, and rewards barely move the timing.

BO7 multiplayer reads as a habit loop. Consecutive matches inside a session arrive at essentially random intervals, the signature of a schedule rather than a self-exciting process; winning barely shortens the wait to the next session, and that small effect does not weaken as a player ages; and players place about 58% of their matches on two weekdays, at roughly 4.5 sessions a week of about 45 minutes each. The practical reading is that mechanics designed to make players chase a reward will find little to grab here, while supports that protect a player's existing weekly routine fit the regime.

## 5. What was tested and set aside

Each row below is an idea a good analyst might have shipped. Each was checked against an independent measure and did not hold. Reporting them is the point of the exercise, because they are why the surviving claims can be trusted.

| Hypothesis | Verdict | What the test showed |
|---|---|---|
| Two churns with opposite fixes (satiation vs friction) | set aside | groups don't separate on an independent degradation measure (effect size 0.03) |
| Satiation shows up as reward-response decay | null | the pull of a reward does not weaken over a player's life (three methods) |
| Players churn from running out of things to unlock | reversed | churners are less progressed than stayers (19.6% maxed vs 30%); progression is protective |
| A rough first week drives players out | null / unmeasurable | first-week experience barely moves churn (AUC ~0.51); the true new-player cliff isn't in this cohort |
| Content variety keeps players engaged | reversed | focus is protective; mode-hoppers churn more than players who settle into one |
| Erratic, volatile play predicts churn | null | volatility adds nothing over simple level and trend |

## 6. Two populations, reachable at two moments

The mechanism split failed; a more actionable segmentation held. Leavers sort into two shapes defined by how much they engaged and when they left — a light-early majority that engages modestly and then leaves abruptly, and a heavy-late minority that plays a lot and then fades. They matter because they are reachable at different moments with different tools, and a single blended churn score serves neither.

![The churn population by shape of leaving, and where each intervention lands.](fig_population_map.png)

## 7. Content — focus is protective

The intuition worth resisting is that showing new players everything keeps them around. Held at equal exposure — each player's first 30 matches — the data points the other way. Players who settle into one main mode early are the ones who stay; players who spread across many are the ones who leave. Search and Destroy mains, in particular, stick. Whether the spreading causes the leaving or simply marks a player who never found a fit is exactly what an experiment would settle, and helping a newcomer find a home mode is a cheap lever to test.

![Focus beats variety: churners spread across more modes early; retained players settle into a main.](fig_focus_variety.png)

## 8. The instrument — a deliberately simple fragility score

The deployable output is a churn-risk score, and its design is intentionally plain. It takes how much a player is playing, whether that is trending down, and how close the trend runs to a low-activity floor, and projects the state forward. We tested whether richer machinery helps — volatility, rebound, full state-space dynamics — and none of it adds anything measurable over level and trend. Simple wins here, which is convenient, because the score runs on match telemetry you already collect.

![The fragility score concentrates churn: top quintile at three times the base rate, robust to thresholds.](fig_fragility_lift.png)

Detection also improves as you watch. A rolling version, updated weekly and using only behavior up to each point, grows more accurate the longer a player is observed, and it catches the heavy-late faders that a one-shot onboarding score misses, with four to six weeks of warning.

![Dynamic detection: accuracy rises from 0.69 to 0.81 as the observation window grows.](deep2_detection_curve.png)

## 9. Interventions — matching the tool to the confidence

The organizing rule is to match the cost of an intervention to how confident the flag is. The month-1 onboarding score is precise — 60 to 69% of the players it flags do churn — so it can carry targeted interventions on the light-early majority. The rolling fragility monitor reaches the heavy-late faders with real lead time, but because those faders are rarer its flags are about 20% precise, so its intervention should be cheap and broad — a nudge, a surfaced fresh mode — never an expensive personal touch. Two pre-registered A/B tests are specified in the companion document: a fragility nudge on the high-risk quintile, and a guide-to-a-main-mode test for new players. Each carries a guardrail with teeth — a retention gain that comes with a fall in session quality or player fit counts as a failure and stops the test — so the interventions stay on the side of genuine satisfaction rather than extracted engagement.

![Two-tier addressability: precision and recall at each operating point.](fig_addressability.png)

## 10. What a collaboration would build

This study shows the reframe and that the instrument works. It holds back the fitted constructions on purpose. The tuned first-passage model, the production scoring pipeline, and the causal read on your experiment logs are the work itself, and they are what I would build inside a role or an engagement. The path is concrete: stand up the fragility monitor on live telemetry, run the two pre-registered experiments to turn these associations causal, and close the mechanism questions with the reward-event and server-side data named below. That is a quarter or two of well-scoped work with a working instrument at the end of it, and it tends to live better inside the team than beside it.

## 11. What would sharpen it — data asks

Every null in Section 5 is a null for want of a specific field, not a closed question. In rough priority: reward-event timestamps (to test reward habituation as a satiation mechanism); server-side match quality — ping, time-to-kill, matchmaking — (to test whether degraded matches drive churn); the content and event calendar (to separate a player's rhythm from the game's schedule); a first-seen new-player cohort (the true onboarding cliff sits outside this panel); playlist and queue-choice logs (to test the guide-to-a-main-mode lever); a Warzone churn panel (to test the reward-loop regime this habit loop is not); and experiment assignment logs (the causal layer under every intervention above).

## 12. Limitations

A balanced case-control panel supports statements about differences and shapes, never absolute incidence — players can be ranked by risk, but no population churn rate can be quoted. The claims about why players leave are gated on telemetry this pull lacked, and their nulls mean "not visible in this data," not "shown false." The content and focus findings are associations awaiting an experiment. The first-session new-player cliff is outside this cohort by construction. Two of the study's own plausible ideas reversed under testing, and two proposed markers came back null. That record is the argument: the surviving claims are trustworthy because the study was willing to lose the others.

*All figures generated from the panel; every analysis leakage-safe and case-control-corrected.*
