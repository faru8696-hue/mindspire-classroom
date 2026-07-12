const fs = require('fs');
const path = require('path');
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TOPIC_2_1 = 'aaf64999-6dde-4a3e-8f66-d75edfc1aa1f'; // Calculating Average Atomic Mass
const TOPIC_2_2 = 'a70066a6-d52c-46d4-ac09-7bd52abba9be'; // Percent Abundance from Average Mass

// Every number below was independently computed and verified with a script
// before writing the answer key (see the verification pass in the prior
// terminal output) — not copied from a source without checking.

const forward = [
  { title: 'Average Atomic Mass of Carbon', content:
`Carbon has two naturally occurring isotopes: carbon-12 (mass = 12.000 amu, abundance = 98.93%) and carbon-13 (mass = 13.003 amu, abundance = 1.07%).

Calculate the average atomic mass of carbon.`,
    answer: `average atomic mass = (12.000 x 0.9893) + (13.003 x 0.0107)
= 11.872 + 0.139
= 12.01 amu` },

  { title: 'Average Atomic Mass of Nitrogen', content:
`Nitrogen has two naturally occurring isotopes: nitrogen-14 (mass = 14.003 amu, abundance = 99.636%) and nitrogen-15 (mass = 15.000 amu, abundance = 0.364%).

Calculate the average atomic mass of nitrogen.`,
    answer: `average atomic mass = (14.003 x 0.99636) + (15.000 x 0.00364)
= 13.952 + 0.055
= 14.01 amu` },

  { title: 'Average Atomic Mass of Chlorine', content:
`Chlorine has two naturally occurring isotopes: chlorine-35 (mass = 34.969 amu, abundance = 75.76%) and chlorine-37 (mass = 36.966 amu, abundance = 24.24%).

Calculate the average atomic mass of chlorine.`,
    answer: `average atomic mass = (34.969 x 0.7576) + (36.966 x 0.2424)
= 26.494 + 8.961
= 35.45 amu` },

  { title: 'Average Atomic Mass of Magnesium', content:
`Magnesium has three naturally occurring isotopes:
Mg-24: mass = 23.985 amu, abundance = 78.99%
Mg-25: mass = 24.986 amu, abundance = 10.00%
Mg-26: mass = 25.983 amu, abundance = 11.01%

Calculate the average atomic mass of magnesium.`,
    answer: `average atomic mass = (23.985 x 0.7899) + (24.986 x 0.1000) + (25.983 x 0.1101)
= 18.946 + 2.499 + 2.861
= 24.31 amu` },

  { title: 'Average Atomic Mass of Potassium', content:
`Potassium has three naturally occurring isotopes:
K-39: mass = 38.964 amu, abundance = 93.2581%
K-40: mass = 39.964 amu, abundance = 0.0117%
K-41: mass = 40.962 amu, abundance = 6.7302%

Calculate the average atomic mass of potassium.`,
    answer: `average atomic mass = (38.964 x 0.932581) + (39.964 x 0.000117) + (40.962 x 0.067302)
= 36.338 + 0.005 + 2.757
= 39.10 amu` },

  { title: 'Average Atomic Mass of Rubidium', content:
`Rubidium has two naturally occurring isotopes: rubidium-85 (mass = 84.912 amu, abundance = 72.17%) and rubidium-87 (mass = 86.909 amu, abundance = 27.83%).

Calculate the average atomic mass of rubidium.`,
    answer: `average atomic mass = (84.912 x 0.7217) + (86.909 x 0.2783)
= 61.284 + 24.190
= 85.47 amu` },

  { title: 'Average Atomic Mass of Silver', content:
`Silver has two naturally occurring isotopes: silver-107 (mass = 106.905 amu, abundance = 51.84%) and silver-109 (mass = 108.905 amu, abundance = 48.16%).

Calculate the average atomic mass of silver.`,
    answer: `average atomic mass = (106.905 x 0.5184) + (108.905 x 0.4816)
= 55.419 + 52.448
= 107.87 amu` },

  { title: 'Average Atomic Mass of Gallium', content:
`Gallium has two naturally occurring isotopes: gallium-69 (mass = 68.926 amu, abundance = 60.11%) and gallium-71 (mass = 70.925 amu, abundance = 39.89%).

Calculate the average atomic mass of gallium.`,
    answer: `average atomic mass = (68.926 x 0.6011) + (70.925 x 0.3989)
= 41.432 + 28.290
= 69.72 amu` },

  { title: 'Average Atomic Mass of Vanadium', content:
`Vanadium has two naturally occurring isotopes: vanadium-50 (mass = 49.947 amu, abundance = 0.250%) and vanadium-51 (mass = 50.944 amu, abundance = 99.750%).

Calculate the average atomic mass of vanadium.`,
    answer: `average atomic mass = (49.947 x 0.0025) + (50.944 x 0.9975)
= 0.125 + 50.817
= 50.94 amu` },

  { title: 'Average Atomic Mass of Zinc (5 Isotopes)', content:
`Zinc has five naturally occurring isotopes:
Zn-64: mass = 63.929 amu, abundance = 49.17%
Zn-66: mass = 65.926 amu, abundance = 27.73%
Zn-67: mass = 66.927 amu, abundance = 4.04%
Zn-68: mass = 67.925 amu, abundance = 18.45%
Zn-70: mass = 69.925 amu, abundance = 0.61%

Calculate the average atomic mass of zinc.`,
    answer: `average atomic mass = (63.929 x 0.4917) + (65.926 x 0.2773) + (66.927 x 0.0404) + (67.925 x 0.1845) + (69.925 x 0.0061)
= 31.436 + 18.284 + 2.704 + 12.532 + 0.427
= 65.38 amu` },
];

const reverse = [
  { title: 'Solving for Isotope Abundances of Lithium', content:
`Lithium has two naturally occurring isotopes: lithium-6 (mass = 6.015 amu) and lithium-7 (mass = 7.016 amu). The average atomic mass of lithium is 6.94 amu.

Calculate the percent abundance of each isotope.`,
    answer: `Let x = fractional abundance of Li-6, so (1 - x) = fractional abundance of Li-7.

6.94 = 6.015x + 7.016(1 - x)
6.94 = 7.016 - 1.001x
1.001x = 0.076
x = 0.0759

Li-6 = 7.59%, Li-7 = 92.41%

Check: (6.015 x 0.0759) + (7.016 x 0.9241) = 0.457 + 6.484 = 6.94 amu ✓` },

  { title: 'Finding the Missing Isotope Abundance of Argon', content:
`Argon has three naturally occurring isotopes:
Ar-36: mass = 35.968 amu, abundance = 0.334%
Ar-38: mass = 37.963 amu, abundance = 0.063%
Ar-40: mass = 39.962 amu, abundance = unknown

The average atomic mass of argon is 39.948 amu.

Find the percent abundance of Ar-40, and verify it is consistent with the given average atomic mass.`,
    answer: `Since the three abundances must add to 100%:
%Ar-40 = 100% - 0.334% - 0.063% = 99.603%

Check: (35.968 x 0.00334) + (37.963 x 0.00063) + (39.962 x 0.99603)
= 0.120 + 0.024 + 39.804
= 39.95 amu, which matches the given average atomic mass of 39.948 amu (small rounding).` },

  { title: 'Solving for an Unknown Isotope Mass of Indium', content:
`Indium has two naturally occurring isotopes: indium-113 (mass = 112.904 amu, abundance = 4.29%) and indium-115 (abundance = 95.71%). The average atomic mass of indium is 114.818 amu.

Calculate the mass of the indium-115 isotope.`,
    answer: `114.818 = (112.904 x 0.0429) + (mass2 x 0.9571)
114.818 = 4.844 + 0.9571(mass2)
109.974 = 0.9571(mass2)
mass2 = 114.90 amu` },

  { title: 'Solving for Isotope Abundances of Thallium', content:
`Thallium has two naturally occurring isotopes: thallium-203 (mass = 202.972 amu) and thallium-205 (mass = 204.974 amu). The average atomic mass of thallium is 204.38 amu.

Calculate the percent abundance of each isotope.`,
    answer: `Let x = fractional abundance of Tl-203, so (1 - x) = fractional abundance of Tl-205.

204.38 = 202.972x + 204.974(1 - x)
204.38 = 204.974 - 2.002x
2.002x = 0.594
x = 0.2967

Tl-203 = 29.67%, Tl-205 = 70.33%` },

  { title: 'Solving for Isotope Abundances of Antimony', content:
`Antimony has two naturally occurring isotopes: antimony-121 (mass = 120.904 amu) and antimony-123 (mass = 122.904 amu). The average atomic mass of antimony is 121.760 amu.

Calculate the percent abundance of each isotope.`,
    answer: `Let x = fractional abundance of Sb-121, so (1 - x) = fractional abundance of Sb-123.

121.760 = 120.904x + 122.904(1 - x)
121.760 = 122.904 - 2.000x
2.000x = 1.144
x = 0.572

Sb-121 = 57.2%, Sb-123 = 42.8%` },

  { title: 'Solving for an Unknown Isotope Mass of Bromine', content:
`Bromine has two naturally occurring isotopes: bromine-79 (mass = 78.918 amu, abundance = 50.69%) and bromine-81 (abundance = 49.31%). The average atomic mass of bromine is 79.904 amu.

Calculate the mass of the bromine-81 isotope.`,
    answer: `79.904 = (78.918 x 0.5069) + (mass2 x 0.4931)
79.904 = 40.004 + 0.4931(mass2)
39.900 = 0.4931(mass2)
mass2 = 80.92 amu` },

  { title: 'Finding the Missing Isotope Abundance of Neon', content:
`Neon has three naturally occurring isotopes:
Ne-20: mass = 19.992 amu, abundance = 90.48%
Ne-21: mass = 20.994 amu, abundance = unknown
Ne-22: mass = 21.991 amu, abundance = 9.25%

Find the percent abundance of Ne-21, then use all three isotopes to calculate the average atomic mass of neon.`,
    answer: `%Ne-21 = 100% - 90.48% - 9.25% = 0.27%

average atomic mass = (19.992 x 0.9048) + (20.994 x 0.0027) + (21.991 x 0.0925)
= 18.083 + 0.057 + 2.034
= 20.18 amu` },

  { title: 'Finding the Missing Isotope Abundance of Nickel (5 Isotopes)', content:
`Nickel has five naturally occurring isotopes:
Ni-58: mass = 57.935 amu, abundance = 68.077%
Ni-60: mass = 59.931 amu, abundance = 26.223%
Ni-61: mass = 60.931 amu, abundance = 1.140%
Ni-62: mass = 61.928 amu, abundance = 3.635%
Ni-64: mass = 63.928 amu, abundance = unknown

Find the percent abundance of Ni-64, then calculate the average atomic mass of nickel.`,
    answer: `%Ni-64 = 100% - 68.077% - 26.223% - 1.140% - 3.635% = 0.925%

average atomic mass = (57.935 x 0.68077) + (59.931 x 0.26223) + (60.931 x 0.01140) + (61.928 x 0.03635) + (63.928 x 0.00925)
= 39.44 + 15.72 + 0.69 + 2.25 + 0.59
= 58.69 amu` },

  { title: 'Finding the Missing Isotope Abundance of Germanium (5 Isotopes)', content:
`Germanium has five naturally occurring isotopes:
Ge-70: mass = 69.924 amu, abundance = 20.57%
Ge-72: mass = 71.922 amu, abundance = 27.45%
Ge-73: mass = 72.923 amu, abundance = 7.75%
Ge-74: mass = 73.921 amu, abundance = 36.50%
Ge-76: mass = 75.921 amu, abundance = unknown

Find the percent abundance of Ge-76, then calculate the average atomic mass of germanium.`,
    answer: `%Ge-76 = 100% - 20.57% - 27.45% - 7.75% - 36.50% = 7.73%

average atomic mass = (69.924 x 0.2057) + (71.922 x 0.2745) + (72.923 x 0.0775) + (73.921 x 0.3650) + (75.921 x 0.0773)
= 14.38 + 19.74 + 5.65 + 26.98 + 5.87
= 72.63 amu` },

  { title: 'Finding the Missing Isotope Abundance of Selenium (6 Isotopes)', content:
`Selenium has six naturally occurring isotopes:
Se-74: abundance = 0.86%
Se-76: abundance = 9.23%
Se-77: abundance = 7.60%
Se-78: abundance = 23.69%
Se-80: abundance = 49.80%
Se-82: abundance = unknown

Find the percent abundance of Se-82.`,
    answer: `%Se-82 = 100% - 0.86% - 9.23% - 7.60% - 23.69% - 49.80% = 8.82%` },
];

async function main() {
  let inserted = 0;

  const { data: existing21 } = await sb.from('questions').select('order_index').eq('topic_id', TOPIC_2_1).order('order_index', { ascending: false }).limit(1);
  let idx21 = (existing21[0]?.order_index ?? -1) + 1;
  for (const q of forward) {
    const { error } = await sb.from('questions').insert({
      title: `Q${idx21 + 1} — ${q.title}`, content: q.content, topic_id: TOPIC_2_1, order_index: idx21, answer_key: q.answer,
    });
    if (error) { console.error('FAILED', q.title, error); continue; }
    idx21++; inserted++;
    console.log('inserted (2.1):', q.title);
  }

  const { data: existing22 } = await sb.from('questions').select('order_index').eq('topic_id', TOPIC_2_2).order('order_index', { ascending: false }).limit(1);
  let idx22 = (existing22[0]?.order_index ?? -1) + 1;
  for (const q of reverse) {
    const { error } = await sb.from('questions').insert({
      title: `Q${idx22 + 1} — ${q.title}`, content: q.content, topic_id: TOPIC_2_2, order_index: idx22, answer_key: q.answer,
    });
    if (error) { console.error('FAILED', q.title, error); continue; }
    idx22++; inserted++;
    console.log('inserted (2.2):', q.title);
  }

  console.log(`\nDone. ${inserted}/20 inserted.`);
}

main();
