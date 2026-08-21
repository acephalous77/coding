# Response prep — Ahmad's likely questions, staged

First-person, for you to answer in your own words. Each item: the question as he'd pose it, a two-or-three-line answer with the number to cite, and where useful the follow-up if he pushes. The through-line to hold: this is additive to his program, the honesty is the point, and the fitted work is the collaboration.

## The posture to keep

Ahmad is a hard quant and he'll probe every claim — that is the good case, because the study was built to survive it. Answer plainly, concede limits early, and let the killed hypotheses do the credibility work. Never let a finding read as a knock on his team's models; frame the gaps as what his richer telemetry would resolve. If he's testing whether you overclaim, the win is that you don't.

## The question bank

**1. "Recency predicts churn at AUC 1.0 — but is your 0.71 on the same confounded cohort? Why should I trust any number off a case-control extract?"**
The 0.71 uses only first-30-day behavior, with recency and total-volume barred, so it isn't inheriting the sampling — it's relative discrimination among equally-exposed players. Absolute incidence I don't quote at all; the panel can't support it. The prospective re-pull is what turns relative discrimination into calendar-time hazard, which is exactly why it's the first data ask.

**2. "Why first-passage-of-state rather than a standard survival model with time-varying covariates?"**
First-passage is a survival object — it's the first hitting time of the activity state. The finding is about the shape of the hazard, not a rejection of survival: about half of churn is an abrupt crossing from a live level, which a proportional-hazards model mis-specifies. The gradual faders fit a PH decay; the abrupt majority don't. The fragility score is just the sufficient statistics of that crossing — level, drift, distance to a floor.
*If he pushes:* 49% abrupt vs 16% gradual, and the abruptness distribution is unimodal (bimodality coefficient 0.41), so it's one fat-tailed process, not two.

**3. "You dropped the satiation/friction split. Is the mechanism not there, or can your data not see it?"**
The split failed its own gate — the two shapes don't separate on an independent degradation axis (effect size 0.03) — but that's a data limit, not a refutation. The mechanism needs server-side match-quality and reward-event telemetry this pull didn't carry. The shapes are real; the mechanism labels aren't earned on this data. This is precisely where your instrumentation would settle it.

**4. "We already run churn models. What does yours add?"**
Probably not raw prediction — a production model tuned on recency and volume will rank well. What this adds is the framing and the discipline: churn as an abrupt first-passage means the intervention has to sit early, before any lapse shows; the two-tier addressability tells you which population is reachable at which moment; and the leakage-safe ceiling (~0.71 from clean first-month behavior) is an honest read of what's learnable before the wind-down. It's a lens and an operating logic, not a replacement for your scoring.

**5. "You call MP low-branching. On what basis — and can you even fit a branching ratio without the content calendar?"**
I don't fit one, deliberately — without the calendar, the exogenous schedule masquerades as self-excitation, so a fitted branching ratio would be measuring your content cadence. What I have is converging proxy evidence: within-session match timing is essentially Poisson (CV 1.0), and reward-response is flat across three methods. The regime split — habit loop here versus a reward loop in Warzone — is explicitly untested; it needs a WZ panel and the calendar.

**6. "Reward-response doesn't decay? That cuts against the satiation story."**
On this telemetry it's flat, including in a within-player fixed-effects panel — but the reward marks I had were win/loss and per-match XP, not the loot, rank-up, and tier events the mechanism actually keys on. So it's a null under-powered by construction, pre-registered as a demotion, not a claim that satiation is absent. The proper marked-Hawkes with reward-event marks is gated on data you hold.

**7. "Six hypotheses failed. Is anything left standing?"**
Yes, and it's the part that survived adversarial testing: the morphology (abrupt first-passage, verified two ways), the low-branching read on MP, the case-control confound, and the fragility instrument — 3× top-quintile lift, stable across thresholds, and it holds under a non-linear model too. The failures are why I trust those four; a first pass would have shipped the two-churns story, and the gates caught it.

**8. "Progression exhaustion — you found the opposite?"**
Right — churners are less progressed than stayers, 19.6% maxed against 30%, and it holds even at equal play. Low attainment tracks churn; the maxed veterans stay. So the progression lever is helping players climb, not adding endgame content for a boredom that isn't in the data. Association, not yet causal.

**9. "Focus beats variety is counterintuitive. Real, or an artifact?"**
Equal-exposure, first 30 matches, and very tight (p ≈ 1e-25) — mode-hoppers churn more than players who settle into a main. I can't yet separate cause from symptom; spreading across modes may just mark a player who never found a fit. That's exactly what a guide-to-a-main-mode experiment resolves, and it's cheap to run.

**10. "Show me how you did it."**
Happy to walk the gates and the pre-registration end to end — the discipline is the shareable part. The fitted separator, the feature construction, and the scoring pipeline are the build, so those stay on my side of the line until there's an engagement, but nothing about the method is hidden.

## The ask — keep it low-pressure and concrete

Land on one of these depending on the temperature, not all:
- If he's warm: "The two experiments and the fitted instrument are a quarter or two of well-scoped work — is there an appetite to do this properly, as a role or an engagement?"
- If he's cautious: "The cheapest next step is the reward-event and server-side fields on the same cohort — that unlocks the mechanism questions. Can we get those?"
- Either way, name the prospective re-pull (Oct 15) as the thing that turns the whole study prospective.

## Relationship notes

- Credit his pull generously; the panel was a favor, and the case-control shape is almost certainly a de-identification default, not a mistake.
- Keep every gap framed as "what your telemetry would resolve," never as a deficiency in what they run.
- If he offers to take it up-chain, make it easy: the executive summary and the report stand alone, and nothing in them overclaims, so his name is safe on it.
