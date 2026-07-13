// Unit 0: Measurement and Significant Figures — populates all three subtopics with 15 questions each.
const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '..', '.env.local')
const env = fs.readFileSync(envPath, 'utf8')
const vars = {}
env.split('\n').forEach(l => {
  const m = l.match(/^([A-Z_]+)=(.*)$/)
  if (m) vars[m[1]] = m[2]
})

const { createClient } = require('@supabase/supabase-js')
const sb = createClient(vars.NEXT_PUBLIC_SUPABASE_URL, vars.SUPABASE_SERVICE_ROLE_KEY)

const TOPIC_UNITS = 'be1f8866-4c38-4d5b-bbca-972315638bbf' // Units, Scientific Notation, and Significant Figures
const TOPIC_DIM = '2c6f4217-41fe-4810-a842-c224a12e960e' // Dimensional Analysis and Density
const TOPIC_READ = '4f359810-6ee3-4c7e-b019-42424622433e' // Reading Measurement Instruments

const topicUnitsQuestions = [
  {
    title: 'Q1 — The Seven SI Base Units',
    content: 'Name the SI base unit used to measure each of the following: length, mass, time, temperature, and amount of substance.',
    answer_key: `Step 1: Recall the SI base unit for each fundamental quantity.
Length -> meter (m)
Mass -> kilogram (kg)
Time -> second (s)
Temperature -> kelvin (K)
Amount of substance -> mole (mol)

Final Answer:
Length = meter (m); Mass = kilogram (kg); Time = second (s); Temperature = kelvin (K); Amount of substance = mole (mol).`,
  },
  {
    title: 'Q2 — Converting to Scientific Notation',
    content: 'Convert 0.0000456 to scientific notation.',
    answer_key: `Step 1: Move the decimal point until only one nonzero digit remains to its left.
0.0000456 -> 4.56 (the decimal moved 5 places to the right)

Step 2: Since the decimal moved to the right, the exponent on 10 is negative.
Exponent = -5

Final Answer:
4.56 x 10^-5`,
  },
  {
    title: 'Q3 — Converting from Scientific Notation',
    content: 'Convert 3.2 x 10^5 to standard decimal notation.',
    answer_key: `Step 1: Identify the exponent. The exponent is +5, meaning the decimal point moves 5 places to the right.

Step 2: Move the decimal point in 3.2 five places to the right, adding zeros as placeholders.
3.2 -> 320000

Final Answer:
320,000`,
  },
  {
    title: 'Q4 — Counting Significant Figures (Trailing Zeros After a Decimal)',
    content: 'How many significant figures are in the measurement 0.004200?',
    answer_key: `Step 1: Recall the significant figure rules.
Leading zeros (before the first nonzero digit) are never significant. Zeros between nonzero digits are always significant. Trailing zeros after a decimal point are always significant.

Step 2: Apply the rules to 0.004200.
The leading zeros (0.00) are not significant.
The digits 4, 2, 0, 0 are all significant because they come after the first nonzero digit and include trailing zeros after a decimal point.

Final Answer:
4 significant figures (4, 2, 0, 0)`,
  },
  {
    title: 'Q5 — Ambiguous Trailing Zeros Without a Decimal Point',
    content: 'How many significant figures are in the number 1,050,000 as written (with no decimal point shown)? Explain the ambiguity, and rewrite the number in scientific notation to unambiguously show exactly 3 significant figures.',
    answer_key: `Step 1: Explain the ambiguity.
Without a decimal point, it is unclear whether the trailing zeros in 1,050,000 are significant (i.e., were actually measured) or are only placeholders indicating magnitude. As written, this number could have anywhere from 2 to 7 significant figures depending on the precision of the original measurement.

Step 2: Rewrite the number in scientific notation to show exactly 3 significant figures.
Scientific notation removes the ambiguity because only the digits explicitly written in the coefficient are considered significant.
To show exactly 3 significant figures: 1.05 x 10^6

Final Answer:
As written, 1,050,000 is ambiguous (could be 2-7 sig figs). Written unambiguously with 3 significant figures: 1.05 x 10^6.`,
  },
  {
    title: 'Q6 — Rounding to a Specified Number of Sig Figs',
    content: 'Round 128.6721 to 4 significant figures.',
    answer_key: `Step 1: Count 4 significant figures from the left.
1, 2, 8, 6 are the first four significant digits (128.6...).

Step 2: Look at the next digit (the 5th significant figure) to decide whether to round up or down.
The next digit is 7, which is 5 or greater, so round the 4th digit up.
6 rounds up to 7.

Final Answer:
128.7`,
  },
  {
    title: 'Q7 — Significant Figures in Addition',
    content: 'Perform the calculation 12.11 + 18.0 + 1.013 and report the answer with the correct number of significant figures.',
    answer_key: `Step 1: Recall the addition/subtraction rule for significant figures.
The answer is rounded to the same number of decimal places as the measurement with the FEWEST decimal places.

Step 2: Identify the decimal places in each number.
12.11 has 2 decimal places.
18.0 has 1 decimal place.
1.013 has 3 decimal places.
The fewest decimal places is 1 (from 18.0).

Step 3: Add the numbers.
12.11 + 18.0 + 1.013 = 31.123

Step 4: Round the sum to 1 decimal place (matching 18.0).
31.123 rounds to 31.1

Final Answer:
31.1`,
  },
  {
    title: 'Q8 — Significant Figures in Multiplication',
    content: 'Perform the calculation 4.56 x 1.4 and report the answer with the correct number of significant figures.',
    answer_key: `Step 1: Recall the multiplication/division rule for significant figures.
The answer is rounded to the same number of significant figures as the measurement with the FEWEST significant figures.

Step 2: Identify the significant figures in each number.
4.56 has 3 significant figures.
1.4 has 2 significant figures.
The fewest is 2 significant figures.

Step 3: Multiply the numbers.
4.56 x 1.4 = 6.384

Step 4: Round the product to 2 significant figures.
6.384 rounds to 6.4

Final Answer:
6.4`,
  },
  {
    title: 'Q9 — Significant Figures in Division',
    content: 'Perform the calculation 8.0 / 2.5 and report the answer with the correct number of significant figures.',
    answer_key: `Step 1: Identify the significant figures in each number.
8.0 has 2 significant figures.
2.5 has 2 significant figures.
Both have 2 significant figures, so the answer should have 2 significant figures.

Step 2: Divide the numbers.
8.0 / 2.5 = 3.2

Final Answer:
3.2`,
  },
  {
    title: 'Q10 — Common Metric Prefixes',
    content: 'List the multiplier (power of ten) represented by each of the following metric prefixes: kilo, centi, milli, micro, and nano.',
    answer_key: `Step 1: Recall each metric prefix and the power of 10 it represents relative to the base unit.
kilo (k) = 10^3 (1000 times the base unit)
centi (c) = 10^-2 (1/100 of the base unit)
milli (m) = 10^-3 (1/1000 of the base unit)
micro (u) = 10^-6 (1/1,000,000 of the base unit)
nano (n) = 10^-9 (1/1,000,000,000 of the base unit)

Final Answer:
kilo = 10^3; centi = 10^-2; milli = 10^-3; micro = 10^-6; nano = 10^-9`,
  },
  {
    title: 'Q11 — Metric Prefix Conversions',
    content: 'Convert 2.5 kilometers to meters, and then to centimeters.',
    answer_key: `Step 1: Convert kilometers to meters.
1 km = 1000 m (since kilo = 10^3)
2.5 km x (1000 m / 1 km) = 2500 m

Step 2: Convert meters to centimeters.
1 m = 100 cm (since centi = 10^-2, so 1 cm = 0.01 m, meaning 1 m = 100 cm)
2500 m x (100 cm / 1 m) = 250,000 cm

Final Answer:
2.5 km = 2500 m = 250,000 cm (or 2.5 x 10^5 cm)`,
  },
  {
    title: 'Q12 — Sig Figs in a Mixed Addition/Scientific Notation Problem',
    content: 'Perform the calculation (3.20 x 10^2) + (4.111 x 10^1), and report the answer with the correct number of significant figures in scientific notation.',
    answer_key: `Step 1: Convert both numbers to the same power of 10 (or standard notation) before adding.
3.20 x 10^2 = 320.0 (1 decimal place)
4.111 x 10^1 = 41.11 (2 decimal places)

Step 2: Add the values.
320.0 + 41.11 = 361.11

Step 3: Apply the addition rule for significant figures — round to the fewest decimal places among the addends (1 decimal place, from 320.0).
361.11 rounds to 361.1

Step 4: Convert back to scientific notation.
361.1 = 3.611 x 10^2

Final Answer:
3.611 x 10^2`,
  },
  {
    title: 'Q13 — Exact Numbers and Infinite Significant Figures',
    content: 'Explain why exact numbers (such as defined conversion factors and counted objects) are considered to have an infinite number of significant figures, and give two examples.',
    answer_key: `Step 1: Explain what makes a number "exact."
Exact numbers arise from definitions (such as 1 foot = 12 inches, which is true by definition, not by measurement) or from counting whole, discrete objects (such as counting exactly 24 students in a classroom). Because these numbers involve no measurement uncertainty, they do not limit the precision of a calculation.

Step 2: Explain the practical consequence.
Since exact numbers have no uncertainty, they are treated as having an infinite number of significant figures and are never the limiting factor when determining how many significant figures a calculated answer should have.

Step 3: Give two examples.
Example 1: A defined conversion factor, such as 1 meter = 100 centimeters.
Example 2: A counted number of objects, such as exactly 3 beakers on a lab bench.

Final Answer:
Exact numbers (defined conversion factors and counted objects) have no measurement uncertainty, so they are treated as having infinite significant figures. Examples: 1 m = 100 cm (definition), and counting exactly 12 test tubes (a counted quantity).`,
  },
  {
    title: 'Q14 — Converting Negative-Exponent Scientific Notation',
    content: 'Convert 5.67 x 10^-3 to standard decimal notation, and state the number of significant figures in the measurement.',
    answer_key: `Step 1: Identify the exponent. The exponent is -3, meaning the decimal point moves 3 places to the left.

Step 2: Move the decimal point in 5.67 three places to the left, adding zeros as placeholders.
5.67 -> 0.00567

Step 3: Count the significant figures.
Leading zeros are not significant; the digits 5, 6, 7 are all significant.

Final Answer:
5.67 x 10^-3 = 0.00567, which has 3 significant figures.`,
  },
  {
    title: 'Q15 — Removing Ambiguity with Scientific Notation',
    content: 'A student measures a temperature as 350°C, but it is unclear from this notation whether the measurement has 2 or 3 significant figures. Rewrite this measurement in scientific notation to show each possibility unambiguously.',
    answer_key: `Step 1: Consider the case where 350 has only 2 significant figures (meaning the trailing zero is just a placeholder, and the measurement was only precise to the tens place).
Written in scientific notation with 2 significant figures: 3.5 x 10^2 °C

Step 2: Consider the case where 350 has 3 significant figures (meaning the trailing zero was actually measured/significant).
Written in scientific notation with 3 significant figures: 3.50 x 10^2 °C

Final Answer:
If 2 sig figs are intended: 3.5 x 10^2 °C. If 3 sig figs are intended: 3.50 x 10^2 °C. Scientific notation removes the ambiguity present in "350" by making the number of significant digits in the coefficient explicit.`,
  },
]

const topicDimQuestions = [
  {
    title: 'Q1 — Converting Miles to Kilometers',
    content: 'Convert 5.00 miles to kilometers. (1 mile = 1.609 km)',
    answer_key: `Step 1: Set up the conversion factor as a fraction so that miles cancel out.
5.00 mi x (1.609 km / 1 mi)

Step 2: Cancel units and multiply.
5.00 x 1.609 = 8.045

Step 3: Round to the correct number of significant figures. The given distance (5.00 mi) has 3 significant figures, and the conversion factor (1.609) is a defined/measured constant here treated as 4 sig figs, so the answer is limited to 3 sig figs.
8.045 rounds to 8.05

Final Answer:
8.05 km`,
  },
  {
    title: 'Q2 — Converting Liters to Milliliters and Cubic Centimeters',
    content: 'Convert 2.50 L to milliliters, and then to cubic centimeters. (1 mL = 1 cm3)',
    answer_key: `Step 1: Convert liters to milliliters.
1 L = 1000 mL
2.50 L x (1000 mL / 1 L) = 2500 mL

Step 2: Convert milliliters to cubic centimeters using the fact that 1 mL is exactly equal to 1 cm3.
2500 mL x (1 cm3 / 1 mL) = 2500 cm3

Final Answer:
2.50 L = 2500 mL = 2500 cm3`,
  },
  {
    title: 'Q3 — Converting Grams to Kilograms and Milligrams',
    content: 'Convert 150 g to kilograms, and then to milligrams.',
    answer_key: `Step 1: Convert grams to kilograms.
1 kg = 1000 g
150 g x (1 kg / 1000 g) = 0.150 kg

Step 2: Convert grams to milligrams.
1 g = 1000 mg
150 g x (1000 mg / 1 g) = 150,000 mg

Final Answer:
150 g = 0.150 kg = 150,000 mg`,
  },
  {
    title: 'Q4 — Multi-Step Conversion: mph to m/s',
    content: 'Convert a speed of 60.0 miles per hour (mph) to meters per second (m/s). (1 mile = 1609 m)',
    answer_key: `Step 1: Set up the conversion, converting miles to meters and hours to seconds.
60.0 mi/hr x (1609 m / 1 mi) x (1 hr / 3600 s)

Step 2: Cancel units (miles cancel, hours cancel), leaving meters per second.
60.0 x 1609 / 3600 = 96540 / 3600 = 26.8166...

Step 3: Round to 3 significant figures (matching 60.0).
26.8166... rounds to 26.8

Final Answer:
26.8 m/s`,
  },
  {
    title: 'Q5 — Calculating Density from Mass and Volume',
    content: 'A sample has a mass of 25.0 g and a volume of 10.0 mL. Calculate its density.',
    answer_key: `Step 1: Recall the density formula.
Density = mass / volume

Step 2: Substitute the given values.
Density = 25.0 g / 10.0 mL

Step 3: Calculate.
Density = 2.50 g/mL

Final Answer:
2.50 g/mL`,
  },
  {
    title: 'Q6 — Identifying a Metal from Density',
    content: 'A rectangular metal block has a mass of 48.6 g and dimensions 3.00 cm x 2.00 cm x 3.00 cm. Calculate its density. Aluminum has a known density of 2.70 g/cm3 — is this block likely made of aluminum?',
    answer_key: `Step 1: Calculate the volume of the rectangular block.
Volume = length x width x height
Volume = 3.00 cm x 2.00 cm x 3.00 cm = 18.0 cm3

Step 2: Calculate the density.
Density = mass / volume = 48.6 g / 18.0 cm3 = 2.70 g/cm3

Step 3: Compare to the known density of aluminum (2.70 g/cm3).
The calculated density matches aluminum's known density exactly.

Final Answer:
Density = 2.70 g/cm3. Yes, this matches the known density of aluminum, so the block is likely made of aluminum.`,
  },
  {
    title: 'Q7 — Solving for Volume Using Density',
    content: 'A liquid has a mass of 45.6 g and a density of 1.14 g/mL. Calculate its volume.',
    answer_key: `Step 1: Rearrange the density formula to solve for volume.
Density = mass / volume  ->  Volume = mass / density

Step 2: Substitute the given values.
Volume = 45.6 g / 1.14 g/mL

Step 3: Calculate.
Volume = 40.0 mL

Final Answer:
40.0 mL`,
  },
  {
    title: 'Q8 — Solving for Mass Using Density',
    content: 'A liquid has a volume of 15.0 mL and a density of 0.879 g/mL. Calculate its mass.',
    answer_key: `Step 1: Rearrange the density formula to solve for mass.
Density = mass / volume  ->  mass = Density x Volume

Step 2: Substitute the given values.
Mass = 0.879 g/mL x 15.0 mL

Step 3: Calculate.
Mass = 13.185 g, which rounds to 13.2 g (3 significant figures)

Final Answer:
13.2 g`,
  },
  {
    title: 'Q9 — Density by Water Displacement',
    content: 'An irregularly shaped object is lowered into a graduated cylinder, causing the water level to rise from 25.0 mL to 39.5 mL. If the object has a mass of 58.0 g, calculate its density.',
    answer_key: `Step 1: Determine the volume of the object using water displacement.
Volume of object = final water level - initial water level
Volume = 39.5 mL - 25.0 mL = 14.5 mL

Step 2: Calculate the density using the object's mass and displaced volume.
Density = mass / volume = 58.0 g / 14.5 mL

Step 3: Calculate.
Density = 4.00 g/mL

Final Answer:
4.00 g/mL`,
  },
  {
    title: 'Q10 — Converting Density Units (g/cm3 to kg/m3)',
    content: "Convert water's density of 1.00 g/cm3 into units of kg/m3.",
    answer_key: `Step 1: Set up the conversion, converting grams to kilograms and cubic centimeters to cubic meters.
1.00 g/cm3 x (1 kg / 1000 g) x (100 cm / 1 m)^3

Step 2: Expand the cubed conversion factor.
(100 cm / 1 m)^3 = 1,000,000 cm3 / 1 m3

Step 3: Combine and simplify.
1.00 g/cm3 x (1 kg / 1000 g) x (1,000,000 cm3 / 1 m3) = 1.00 x (1,000,000 / 1000) kg/m3 = 1000 kg/m3

Final Answer:
1.00 g/cm3 = 1000 kg/m3`,
  },
  {
    title: 'Q11 — Converting Liters to Quarts',
    content: 'Convert 3.785 L to quarts. (1 L = 1.057 qt)',
    answer_key: `Step 1: Set up the conversion factor so liters cancel out.
3.785 L x (1.057 qt / 1 L)

Step 2: Multiply.
3.785 x 1.057 = 4.0007...

Step 3: Round to the correct number of significant figures (4 sig figs, matching 3.785).
4.0007... rounds to 4.001

Final Answer:
4.001 qt (approximately 4.00 qt — this is why 1 gallon, which equals 3.785 L, is defined as almost exactly 4 quarts)`,
  },
  {
    title: 'Q12 — Converting Cups to Milliliters',
    content: 'A recipe calls for 2.00 cups of sugar. Convert this to milliliters. (1 cup = 236.6 mL)',
    answer_key: `Step 1: Set up the conversion factor so cups cancel out.
2.00 cups x (236.6 mL / 1 cup)

Step 2: Multiply.
2.00 x 236.6 = 473.2

Final Answer:
473 mL (3 significant figures, matching 2.00)`,
  },
  {
    title: 'Q13 — Predicting Whether an Object Floats or Sinks',
    content: 'An object has a mass of 15.6 g and a volume of 8.2 cm3. Calculate its density, and determine whether it will float or sink in water (density of water = 1.0 g/cm3).',
    answer_key: `Step 1: Calculate the density of the object.
Density = mass / volume = 15.6 g / 8.2 cm3

Step 2: Calculate and round to the correct significant figures (2 sig figs, limited by 8.2).
15.6 / 8.2 = 1.902..., which rounds to 1.9 g/cm3

Step 3: Compare the object's density to water's density (1.0 g/cm3).
Since 1.9 g/cm3 is greater than 1.0 g/cm3, the object is denser than water.

Final Answer:
Density = 1.9 g/cm3. Since this is greater than water's density (1.0 g/cm3), the object will sink.`,
  },
  {
    title: 'Q14 — Converting Fuel Efficiency Units',
    content: 'A car has a fuel efficiency of 28.0 miles per gallon. Convert this to kilometers per liter. (1 mile = 1.609 km, 1 gallon = 3.785 L)',
    answer_key: `Step 1: Set up the conversion, converting miles to kilometers (numerator) and gallons to liters (denominator).
28.0 mi/gal x (1.609 km / 1 mi) x (1 gal / 3.785 L)

Step 2: Cancel units (miles cancel, gallons cancel), leaving kilometers per liter.
28.0 x 1.609 / 3.785 = 45.052 / 3.785 = 11.9027...

Step 3: Round to 3 significant figures (matching 28.0).
11.9027... rounds to 11.9

Final Answer:
11.9 km/L`,
  },
  {
    title: "Q15 — Using Density to Identify a Genuine vs. Imitation Material",
    content: 'A gold-colored ring has a mass of 15.0 g and a volume of 1.10 cm3. The known density of pure gold is 19.3 g/cm3. Calculate the density of the ring and determine whether it is likely pure gold or an imitation.',
    answer_key: `Step 1: Calculate the density of the ring.
Density = mass / volume = 15.0 g / 1.10 cm3

Step 2: Calculate.
Density = 13.6363... g/cm3, which rounds to 13.6 g/cm3 (3 significant figures)

Step 3: Compare the calculated density to the known density of pure gold (19.3 g/cm3).
13.6 g/cm3 is significantly lower than 19.3 g/cm3, meaning the ring is less dense than pure gold.

Final Answer:
Density = 13.6 g/cm3. Since this is much lower than pure gold's known density (19.3 g/cm3), the ring is NOT pure gold — it is likely an imitation or a lower-karat gold alloy mixed with less dense metals.`,
  },
]

const topicReadQuestions = [
  {
    title: 'Q1 — Reading a Graduated Cylinder (1 mL Graduations)',
    content: 'A graduated cylinder has markings every 1 mL. The bottom of the meniscus sits between the 23 mL and 24 mL lines, appearing to be about 4/10 of the way from the 23 mL line toward the 24 mL line. Record the volume reading with the correct precision.',
    answer_key: `Step 1: Identify the smallest graduation on the instrument.
The smallest marked graduation is 1 mL.

Step 2: Recall the rule for reading analog instruments: record all certain digits (from the marked graduations), plus ONE estimated digit beyond the smallest graduation.

Step 3: Determine the certain digit(s).
The meniscus is between the 23 mL and 24 mL marks, so the certain digit is 23 mL.

Step 4: Estimate the tenths digit based on the meniscus position (about 4/10 of the way to the next line).
Estimated digit = 0.4 mL

Final Answer:
23.4 mL`,
  },
  {
    title: 'Q2 — Reading a Metric Ruler (mm Graduations)',
    content: 'A metric ruler is marked in millimeters (smallest division = 0.1 cm). An object\'s edge lines up between the 5.4 cm and 5.5 cm marks, appearing to be about 3/10 of the way across that interval. Record the length with the correct precision.',
    answer_key: `Step 1: Identify the smallest graduation. The smallest marked division is 0.1 cm (1 mm).

Step 2: Record the certain digits from the marked graduations.
The edge is between the 5.4 cm and 5.5 cm marks, so the certain reading is 5.4 cm.

Step 3: Estimate one additional digit beyond the smallest graduation, based on the position within the interval (about 3/10 of the way).
Estimated digit = 0.03 cm

Final Answer:
5.43 cm`,
  },
  {
    title: 'Q3 — Reading a Thermometer (1°C Graduations)',
    content: 'A thermometer has markings every 1°C. The mercury level sits between the 36°C and 37°C lines, approximately halfway between them. Record the temperature reading with the correct precision.',
    answer_key: `Step 1: Identify the smallest graduation. The smallest marked division is 1°C.

Step 2: Record the certain digit from the marked graduations.
The mercury is between the 36°C and 37°C marks, so the certain reading is 36°C.

Step 3: Estimate one additional digit beyond the smallest graduation. Since the mercury is approximately halfway between the lines, the estimated digit is 0.5°C.

Final Answer:
36.5°C`,
  },
  {
    title: 'Q4 — The General Rule for Reading Analog Instruments',
    content: 'Explain the general rule for reading any analog measuring instrument: how many digits should be recorded relative to the smallest graduation marked on the instrument?',
    answer_key: `Step 1: State the general rule.
When reading any analog instrument (ruler, graduated cylinder, thermometer, analog balance, etc.), you should record all digits that are certain based on the marked graduations, PLUS exactly one additional digit that is estimated by judging the position between the two nearest graduation marks.

Step 2: Explain why this rule exists.
This convention ensures that measurements reflect the true precision of the instrument — recording fewer digits would throw away real information the instrument can provide, while recording more digits than one estimated place would falsely imply a precision the instrument does not actually have.

Final Answer:
Record all certain digits shown by the instrument's graduations, plus exactly one estimated digit beyond the smallest graduation. This gives the correct number of significant figures for that instrument's precision.`,
  },
  {
    title: 'Q5 — Reading a Graduated Cylinder (10 mL Major Lines, 2 mL Minor Lines)',
    content: 'A graduated cylinder has major markings every 10 mL, with smaller unlabeled lines every 2 mL in between. The liquid level appears to line up right at one of the 2 mL minor lines, specifically the one at 46 mL. Record the reading with the correct precision.',
    answer_key: `Step 1: Identify the smallest graduation. The smallest marked division is 2 mL.

Step 2: Record the certain digits. The liquid level lines up exactly at the 46 mL minor graduation line, so 46 mL is the certain part of the reading.

Step 3: Estimate one additional digit beyond the smallest graduation (2 mL). Since the level sits exactly on the line (with no visible offset within the 2 mL interval), the estimated digit is 0.

Final Answer:
46.0 mL`,
  },
  {
    title: 'Q6 — Digital vs. Analog Instrument Precision',
    content: "A digital balance reads 24.583 g. State how many significant figures this measurement has, and explain why digital readouts don't require the same 'estimate one extra digit' rule used for analog instruments.",
    answer_key: `Step 1: Count the significant figures in the digital readout.
24.583 g has 5 significant figures (2, 4, 5, 8, 3 are all significant digits).

Step 2: Explain why digital instruments differ from analog instruments.
Analog instruments require a human to visually judge (estimate) the position between two graduation marks, which introduces one uncertain, estimated digit. Digital instruments, by contrast, internally process and display a fixed number of digits determined by the instrument's electronic precision — the last digit shown is already the instrument's best estimate, built into its circuitry and display, so there is no additional visual estimation step for the reader to perform.

Final Answer:
24.583 g has 5 significant figures. Digital instruments already include their own internal precision limit in the displayed digits, so the reader simply records exactly what is shown rather than visually estimating an extra digit.`,
  },
  {
    title: 'Q7 — Reading a Burette to Calculate Volume Delivered',
    content: 'A burette is marked in 0.1 mL increments. The initial reading before a titration is 0.00 mL, and the final reading after the titration (estimated to the nearest 0.01 mL) is 23.45 mL. Calculate the volume of titrant delivered, with correct precision.',
    answer_key: `Step 1: Recall that the volume delivered is the difference between the final and initial burette readings.
Volume delivered = final reading - initial reading

Step 2: Substitute the given values.
Volume delivered = 23.45 mL - 0.00 mL

Step 3: Calculate, keeping the same number of decimal places as the individual readings (2 decimal places).
Volume delivered = 23.45 mL

Final Answer:
23.45 mL`,
  },
  {
    title: 'Q8 — Identifying Insufficient Precision in a Recorded Reading',
    content: 'A student reads the liquid level in a graduated cylinder marked in 1 mL increments and records the volume simply as "24 mL," without estimating any additional digit. Explain why this reading has insufficient precision, and how it should have been reported instead.',
    answer_key: `Step 1: Identify the smallest graduation on the instrument.
The graduated cylinder is marked in 1 mL increments.

Step 2: Explain the error.
The rule for reading analog instruments requires recording one estimated digit beyond the smallest graduation. By stopping at "24 mL" with no digit past the ones place, the student has recorded only the certain digit and thrown away the additional precision the instrument is capable of providing — the reading looks like it has only 2 significant figures with no indication of where the meniscus actually sat between the 24 mL and 25 mL lines.

Step 3: State the correct approach.
The student should have visually judged the meniscus position between the two nearest 1 mL lines and estimated one more digit, such as "24.0 mL" (if it landed exactly on the line) or "24.3 mL" (if it was about 3/10 of the way to the next line).

Final Answer:
The reading "24 mL" lacks the required estimated digit past the smallest graduation (1 mL). It should have been recorded with one additional estimated decimal place, e.g., "24.0 mL" or "24.3 mL," depending on the actual meniscus position.`,
  },
  {
    title: 'Q9 — Parallax Error When Reading a Burette',
    content: "Two students read the same burette's meniscus: one reads it while looking down at the liquid from above, and the other reads it at eye level, directly across from the meniscus. Explain which reading is correct and why.",
    answer_key: `Step 1: Identify the source of error.
Reading a liquid level from any angle other than straight-on (at eye level with the meniscus) introduces parallax error — an apparent shift in the reading caused by the viewing angle, since the graduation marks and the meniscus are not in the exact same plane when viewed from above or below.

Step 2: Determine the correct method.
The student who reads the burette at eye level, with their line of sight level with (perpendicular to) the meniscus, will get the accurate reading. Looking down from above (or up from below) causes the curved liquid surface to appear to align with a different graduation mark than where it truly sits.

Final Answer:
The student reading at eye level with the meniscus has the correct reading. Reading from above (or below) introduces parallax error, which distorts the apparent position of the meniscus relative to the graduation marks.`,
  },
  {
    title: 'Q10 — Reading a Coarser Ruler (Whole Centimeter Graduations Only)',
    content: 'A ruler has markings only at each whole centimeter, with no millimeter subdivisions. An object\'s edge falls between the 7 cm and 8 cm marks, appearing to be about 60% of the way across that interval. Record the length with the correct precision for this coarser instrument.',
    answer_key: `Step 1: Identify the smallest graduation. The smallest marked division on this ruler is 1 cm (much coarser than a standard mm-marked ruler).

Step 2: Record the certain digit. The edge is between the 7 cm and 8 cm marks, so the certain reading is 7 cm.

Step 3: Estimate one additional digit beyond the smallest graduation (1 cm), based on the position within the interval (about 60% of the way, or 0.6 cm).

Final Answer:
7.6 cm
(Note: because this ruler's graduations are coarser than a millimeter-marked ruler, the estimated digit here is in the tenths of a centimeter place, giving one fewer significant figure of precision than a standard mm ruler would allow for the same object.)`,
  },
  {
    title: 'Q11 — Reading a Thermometer with Half-Degree Graduations',
    content: 'A thermometer is marked every 0.5°C. The mercury level sits just slightly above the 98.5°C mark. Record the temperature reading with correct precision, including one estimated digit beyond the 0.5°C graduation.',
    answer_key: `Step 1: Identify the smallest graduation. The smallest marked division is 0.5°C.

Step 2: Record the certain digit(s). The mercury sits at or just above the 98.5°C mark, so the certain reading is 98.5°C.

Step 3: Estimate one additional digit beyond the smallest graduation. Since the mercury is only slightly above the 98.5°C line (a small fraction of the way toward the next 0.5°C interval), a reasonable estimated digit would be approximately 98.6°C.

Final Answer:
98.6°C (accept any reasonable value between 98.5°C and 99.0°C that reflects "just slightly above" 98.5°C, recorded to one estimated decimal place)`,
  },
  {
    title: 'Q12 — Why the Bottom of the Meniscus Is Used',
    content: 'Explain why the standard convention for reading the volume of water (or other aqueous solutions) in a graduated cylinder is to read the BOTTOM of the meniscus, rather than the top.',
    answer_key: `Step 1: Describe what a meniscus is.
When water (or an aqueous solution) is placed in a narrow glass cylinder, its surface curves due to surface tension and adhesive forces between the water molecules and the glass walls. For water in glass, this curve dips downward in the center, forming a concave meniscus (the surface curves upward at the edges, near the glass).

Step 2: Explain why the bottom of the curve is the standard reading point.
The bottom of the concave meniscus represents the true, consistent liquid level, unaffected by the extra height the liquid climbs along the glass walls due to adhesion. Reading at the top of the curve (where the liquid touches the glass) would give an inconsistent and inflated reading that varies more with cylinder diameter and glass cleanliness.

Step 3: Note the convention's importance for consistency.
By always reading the bottom of the meniscus at eye level, measurements remain standardized and reproducible across different observers and instruments.

Final Answer:
Water forms a concave meniscus in glass due to adhesion between water and the glass walls. Reading the bottom of the meniscus gives the true, consistent liquid level, while reading the top would overestimate the volume and be less reproducible.`,
  },
  {
    title: 'Q13 — Checking a Reading for the Correct Number of Estimated Digits',
    content: 'A graduated cylinder with a smallest marked graduation of 1 mL is read as "32.5 mL." Was this reading recorded with the correct number of estimated digits? Explain.',
    answer_key: `Step 1: Identify the smallest graduation. The smallest marked division is 1 mL.

Step 2: Recall the rule: record all certain digits from the graduations, plus exactly ONE estimated digit beyond the smallest graduation.

Step 3: Analyze the given reading.
"32.5 mL" has the certain digits "32" (matching the 1 mL graduations) plus one estimated digit ("5," in the tenths of a mL place, beyond the smallest 1 mL graduation).

Final Answer:
Yes, this reading was recorded with the correct number of estimated digits. The "32" reflects the certain graduation marks (whole mL), and the ".5" is the single estimated digit beyond the smallest 1 mL graduation, which is exactly what the reading convention requires.`,
  },
  {
    title: 'Q14 — Reading an Analog Balance',
    content: "An analog balance's smallest readable division is 0.1 g. When a sample is measured, the pointer rests almost exactly on the 15.2 g mark, perhaps just barely past it. Record the mass with the correct precision, including the appropriate estimated digit.",
    answer_key: `Step 1: Identify the smallest graduation. The smallest marked division is 0.1 g.

Step 2: Record the certain digits. The pointer rests essentially at the 15.2 g mark, so the certain reading is 15.2 g.

Step 3: Estimate one additional digit beyond the smallest graduation (0.1 g). Since the pointer is just barely past the 15.2 g line (a very small amount into the next 0.1 g interval), a reasonable estimated digit would be very close to zero within that interval, such as 15.21 g.

Final Answer:
15.21 g (accept any reasonable value very close to 15.20-15.22 g, reflecting a position "just barely past" the 15.2 g mark, recorded to one estimated decimal place beyond the 0.1 g graduation)`,
  },
  {
    title: 'Q15 — Comparing Precision: Beaker vs. Graduated Cylinder',
    content: "Explain the difference in precision (and the resulting number of significant figures) between measuring 120 mL of liquid using a beaker marked in 50 mL increments versus using a graduated cylinder marked in 1 mL increments. Which instrument should be preferred for a more precise volume measurement, and why?",
    answer_key: `Step 1: Determine the reading precision for the beaker.
With graduations every 50 mL, the beaker allows one estimated digit within that 50 mL interval. A reading of approximately 120 mL on this beaker might realistically be estimated as "120 mL," with meaningful precision only to the nearest 10-20 mL or so — effectively about 2 significant figures at best, and with much greater potential reading error.

Step 2: Determine the reading precision for the graduated cylinder.
With graduations every 1 mL, the graduated cylinder allows one estimated digit within that 1 mL interval, giving a reading such as "120.0 mL" with precision to the nearest 0.1 mL — effectively 4 significant figures, and much less potential reading error.

Step 3: Compare and recommend.
The graduated cylinder provides far greater precision because its graduations are much finer (1 mL vs. 50 mL), allowing the estimated digit to represent a much smaller, more meaningful fraction of the total volume.

Final Answer:
The graduated cylinder (1 mL graduations) gives a much more precise reading (e.g., 120.0 mL, ~4 sig figs) than the beaker (50 mL graduations, e.g., ~120 mL, ~2 sig figs). The graduated cylinder should be preferred whenever precise volume measurements are needed, since its finer graduations allow a much smaller, more reliable estimated digit.`,
  },
]

async function insertBatch(topicId, questionList) {
  const { data: existing } = await sb.from('questions').select('order_index').eq('topic_id', topicId).order('order_index', { ascending: false }).limit(1)
  let idx = (existing[0]?.order_index ?? -1) + 1
  const rows = questionList.map(q => ({ ...q, topic_id: topicId, order_index: idx++ }))
  const { data, error } = await sb.from('questions').insert(rows).select('id')
  if (error) {
    console.error(`Insert failed for topic ${topicId}:`, error)
    process.exit(1)
  }
  console.log(`Inserted ${data.length} questions into topic ${topicId}.`)
}

async function main() {
  await insertBatch(TOPIC_UNITS, topicUnitsQuestions)
  await insertBatch(TOPIC_DIM, topicDimQuestions)
  await insertBatch(TOPIC_READ, topicReadQuestions)
  console.log('Done.')
}

main()
