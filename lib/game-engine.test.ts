import test from "node:test";
import assert from "node:assert/strict";
import {
  COURSES,
  TUTORS,
  SHOP_ITEMS,
  ROMANCE_EPISODES,
  STORY_CHAPTERS,
  JEALOUSY_SHOWDOWNS,
  getDefaultPlayerStats,
  getAffinityRank,
  getJealousyRank,
  getTutorExpressionImage,
  BLITZ_QUESTIONS,
  CG_GALLERY,
  PHONE_MESSAGES
} from "./game-engine";

test("getDefaultPlayerStats returns deterministic baseline data without hydration drift", () => {
  const stats = getDefaultPlayerStats();
  assert.equal(stats.total_xp, 60);
  assert.equal(stats.coins, 80);
  assert.equal(stats.hearts, 5);
  assert.equal(stats.current_streak, 1);
  assert.equal(stats.memoryFragments, 1);
  assert.equal(stats.last_activity_date, "2026-11-10T00:00:00.000Z");
  assert.equal(stats.affinity.aiko, 25);
  assert.equal(stats.affinity.emily, 15);
  assert.equal(stats.affinity.hana, 10);
  assert.equal(stats.affinity.sofia, 15);
  assert.equal(stats.affinity.chloe, 10);
  assert.equal(stats.jealousy.aiko, 20);
});

test("getAffinityRank scales correctly across relationship milestones", () => {
  assert.equal(getAffinityRank(10).title, "Conhecido(a) Curioso(a) 💬");
  assert.equal(getAffinityRank(25).title, "Companheiro(a) de Estudos 📚");
  assert.equal(getAffinityRank(50).title, "Amigo(a) Íntimo(a) 🌸");
  assert.equal(getAffinityRank(70).title, "Crush Especial da Academia ✨");
  assert.equal(getAffinityRank(90).title, "Alma Gêmea de Estudos 💖");
});

test("getJealousyRank evaluates jealousy thresholds correctly", () => {
  assert.equal(getJealousyRank(10).badge, "CALMA");
  assert.equal(getJealousyRank(20).badge, "INSEGURA");
  assert.equal(getJealousyRank(45).badge, "CIUMENTA");
  assert.equal(getJealousyRank(70).badge, "FURISA");
  assert.equal(getJealousyRank(70).isJealous, true);
});

test("getTutorExpressionImage returns synchronized visual novel master portraits", () => {
  assert.equal(getTutorExpressionImage("aiko", "neutral"), "/assets/presidents/master/aiko_portrait.png");
  assert.equal(getTutorExpressionImage("aiko", "angry"), "/assets/presidents/master/aiko_angry.png");
  assert.equal(getTutorExpressionImage("aiko", "happy"), "/assets/presidents/master/aiko_happy.png");
  assert.equal(getTutorExpressionImage("sofia", "jealous"), "/assets/presidents/master/sofia_jealous.png");
  assert.equal(getTutorExpressionImage("chloe", "pout"), "/assets/presidents/master/chloe_angry.png");
});

test("getTutorExpressionImage honors custom user override images", () => {
  const custom = {
    aiko: {
      neutral: "/custom/aiko_custom_neutral.png",
      happy: "/custom/aiko_custom_happy.png"
    }
  };
  assert.equal(getTutorExpressionImage("aiko", "neutral", custom), "/custom/aiko_custom_neutral.png");
  assert.equal(getTutorExpressionImage("aiko", "happy", custom), "/custom/aiko_custom_happy.png");
  // Non-customized mood falls back to master
  assert.equal(getTutorExpressionImage("aiko", "angry", custom), "/assets/presidents/master/aiko_angry.png");
});

test("JEALOUSY_SHOWDOWNS defines dual-tutor confrontation episodes", () => {
  assert.ok(JEALOUSY_SHOWDOWNS.length >= 2);
  const duel1 = JEALOUSY_SHOWDOWNS[0];
  assert.equal(duel1.tutor1, "aiko");
  assert.equal(duel1.tutor2, "sofia");
  assert.ok(duel1.choices.length >= 3);
});

test("all 5 language courses and club presidents are registered and populated", () => {
  const languageCodes = COURSES.map(c => c.language_code);
  assert.deepEqual(languageCodes, ["ja", "en", "ko", "es", "fr"]);

  assert.ok(TUTORS.aiko.name.includes("Aiko"));
  assert.ok(TUTORS.emily.name.includes("Emily"));
  assert.ok(TUTORS.hana.name.includes("Hana"));
  assert.ok(TUTORS.sofia.name.includes("Sofía"));
  assert.ok(TUTORS.chloe.name.includes("Chloé"));
});

test("story chapters, shop items, CG gallery, and blitz questions exist", () => {
  assert.ok(STORY_CHAPTERS.length >= 6);
  assert.ok(ROMANCE_EPISODES.length >= 6);
  assert.ok(SHOP_ITEMS.length >= 6);
  assert.ok(CG_GALLERY.length >= 5);
  assert.ok(PHONE_MESSAGES.length >= 5);
  assert.ok(BLITZ_QUESTIONS.length >= 8);
});

