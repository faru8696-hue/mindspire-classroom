'use client'

import { useState } from 'react'

// A curated starting point, not an exhaustive taxonomy — a teacher can
// always fall back to the free-text note for anything not covered here.
//
// Each entry has both a `label` (short, for the clickable pill — optimized
// for fast scanning) and a `clause` (a grammatically composable fragment —
// optimized for reading naturally once stitched together, see
// composeNote()). `kind` controls HOW it gets stitched in:
//   struggle       -> joined after "During this test, {name} ..."
//   topic          -> joined after "{name} could use more practice with ..."
//   recommendation -> its own full sentence, used as-is
//   positive       -> its own full sentence, {first} substituted with name
// This produces an actual paragraph instead of a bullet list — deterministic
// templating, no AI call involved.
type IssueKind = 'struggle' | 'topic' | 'recommendation' | 'positive'
interface Issue { label: string; clause: string; kind: IssueKind }

const ISSUE_GROUPS: { label: string; issues: Issue[] }[] = [
  {
    label: 'Process & Test-Taking',
    issues: [
      { kind: 'struggle', label: 'Struggled to show work clearly on free-response questions', clause: 'struggled to show their work clearly on the free-response questions' },
      { kind: 'struggle', label: 'Did not show any work', clause: 'did not show any work on the free-response questions' },
      { kind: 'struggle', label: 'Rushed through questions — answers seem incomplete', clause: 'seemed to rush through several questions, leaving some answers incomplete' },
      { kind: 'struggle', label: 'Left several questions unanswered (time management)', clause: 'left several questions unanswered, which may point to a time-management issue' },
      { kind: 'struggle', label: 'Correct final answers but reasoning/work not shown', clause: 'got the correct final answers on several questions but didn’t show the reasoning behind them' },
      { kind: 'struggle', label: 'Difficulty with multiple-choice reasoning / process of elimination', clause: 'had some difficulty reasoning through the multiple-choice questions' },
      { kind: 'struggle', label: 'Careless errors — understood the concept but made a calculation mistake', clause: 'understood the underlying concepts but made a few careless calculation errors' },
      { kind: 'struggle', label: 'Answer missing units', clause: 'left the units off of some numerical answers' },
      { kind: 'struggle', label: 'Struggled with units or significant figures', clause: 'struggled with units or significant figures in places' },
      { kind: 'struggle', label: 'Misread or misunderstood what the question was asking', clause: 'seems to have misread or misunderstood what a few questions were asking' },
      { kind: 'struggle', label: 'Confused similar concepts or formulas', clause: 'mixed up a few similar concepts or formulas' },
      { kind: 'struggle', label: 'Guessed on several multiple-choice questions rather than working through them', clause: 'appears to have guessed on a few multiple-choice questions rather than working through them' },
      { kind: 'recommendation', label: 'Would benefit from reviewing class notes/practice problems before the next test', clause: 'I’d recommend reviewing class notes and practice problems together before the next test.' },
      { kind: 'recommendation', label: 'Recommend a short one-on-one review session to go over missed topics', clause: 'I’d also recommend a short one-on-one review session to go over the topics missed.' },
      { kind: 'positive', label: 'Strong effort and consistent performance — keep it up', clause: 'Overall, {first} showed strong effort and consistent performance — keep it up!' },
    ],
  },
  {
    label: 'Chemistry Concept Gaps',
    issues: [
      { kind: 'topic', label: 'Mole concept / stoichiometry calculations', clause: 'the mole concept and stoichiometry calculations' },
      { kind: 'topic', label: 'Balancing chemical equations', clause: 'balancing chemical equations' },
      { kind: 'topic', label: 'Limiting reactant / percent yield problems', clause: 'limiting reactant and percent yield problems' },
      { kind: 'topic', label: 'Molarity and solution concentration calculations', clause: 'molarity and solution concentration calculations' },
      { kind: 'topic', label: 'Dimensional analysis / unit conversions', clause: 'dimensional analysis and unit conversions' },
      { kind: 'topic', label: 'Electron configuration and orbital notation', clause: 'electron configuration and orbital notation' },
      { kind: 'topic', label: 'Periodic trends (electronegativity, atomic radius, ionization energy)', clause: 'periodic trends like electronegativity, atomic radius, and ionization energy' },
      { kind: 'topic', label: 'Distinguishing ionic vs. covalent bonding', clause: 'distinguishing ionic from covalent bonding' },
      { kind: 'topic', label: 'Molecular geometry / VSEPR theory', clause: 'molecular geometry and VSEPR theory' },
      { kind: 'topic', label: 'Intermolecular forces (hydrogen bonding, dipole-dipole, London dispersion)', clause: 'intermolecular forces like hydrogen bonding, dipole-dipole interactions, and London dispersion forces' },
      { kind: 'topic', label: 'Gas laws (Boyle’s, Charles’s, ideal gas law)', clause: 'the gas laws — Boyle’s, Charles’s, and the ideal gas law' },
      { kind: 'topic', label: 'Reaction kinetics — rate laws and reaction order', clause: 'reaction kinetics, including rate laws and reaction order' },
      { kind: 'topic', label: 'Thermochemistry — enthalpy, calorimetry, heat calculations', clause: 'thermochemistry, including enthalpy, calorimetry, and heat calculations' },
      { kind: 'topic', label: 'Equilibrium concepts (Le Chatelier’s principle, Keq)', clause: 'equilibrium concepts like Le Chatelier’s principle and Keq' },
      { kind: 'topic', label: 'Acid-base chemistry / pH and pOH calculations', clause: 'acid-base chemistry and pH/pOH calculations' },
      { kind: 'topic', label: 'Titration calculations', clause: 'titration calculations' },
      { kind: 'topic', label: 'Oxidation-reduction (redox) reactions', clause: 'oxidation-reduction (redox) reactions' },
      { kind: 'topic', label: 'Thermodynamics — entropy and Gibbs free energy', clause: 'thermodynamics, including entropy and Gibbs free energy' },
      { kind: 'topic', label: 'Interpreting graphs, spectra, or experimental data', clause: 'interpreting graphs, spectra, and experimental data' },
    ],
  },
]

// Joins a list into natural English: "a", "a and b", "a, b, and c".
function joinNaturally(items: string[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

// Deterministic sentence composer — no AI call. Groups selected issues by
// kind and stitches each group into one natural sentence, so five clicked
// pills read as a real paragraph instead of a bulleted list.
function composeNote(selected: Issue[], customNote: string, studentName: string): string {
  const firstName = studentName.trim().split(/\s+/)[0] || studentName
  const struggles = selected.filter(i => i.kind === 'struggle').map(i => i.clause)
  const topics = selected.filter(i => i.kind === 'topic').map(i => i.clause)
  const standalone = selected
    .filter(i => i.kind === 'recommendation' || i.kind === 'positive')
    .map(i => i.clause.replace('{first}', firstName))

  const sentences: string[] = []
  if (struggles.length > 0) sentences.push(`During this test, ${firstName} ${joinNaturally(struggles)}.`)
  if (topics.length > 0) sentences.push(`${firstName} could use more practice with ${joinNaturally(topics)}.`)
  sentences.push(...standalone)

  return [sentences.join(' '), customNote.trim()].filter(Boolean).join('\n\n')
}

export default function EmailResultButton({
  attemptId, studentEmail, parentEmail, studentName, weakTopics, hasFrq, tabSwitchCount,
}: {
  attemptId: string
  studentEmail: string
  parentEmail: string
  studentName: string
  // Topic titles from the attempt's non-mastered advice list, worst-first —
  // turned into one extra clickable option per topic so the teacher isn't
  // stuck re-typing "needs more practice with X" from scratch.
  weakTopics: string[]
  // Whether this attempt has any FRQ questions at all — the MCQ/FRQ scope
  // picker only makes sense to show when there's actually a choice.
  hasFrq: boolean
  // Only worth asking about sharing the integrity note when there's
  // actually something to report — 0 means the student never left the tab.
  tabSwitchCount: number
}) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [customNote, setCustomNote] = useState('')
  const [includeMcq, setIncludeMcq] = useState(true)
  const [includeFrq, setIncludeFrq] = useState(true)
  // Defaults to shared (matches prior behavior) — the teacher can opt out
  // per-send for a case they'd rather not raise with this parent, e.g. a
  // single brief, clearly-innocent trip away from the tab.
  const [includeIntegrityNote, setIncludeIntegrityNote] = useState(true)
  const [sending, setSending] = useState<'preview' | 'direct' | null>(null)
  const [sent, setSent] = useState<'preview' | 'direct' | null>(null)
  const [error, setError] = useState('')

  // weakTopics turned into Issues the same shape as the static ones — label
  // for the pill, clause (just the bare topic name) for the composer, kind
  // 'topic' so it joins into the "could use more practice with ..." sentence.
  const topicIssues: Issue[] = weakTopics.map(t => ({ kind: 'topic', label: `Needs more practice with ${t}`, clause: t }))
  const issueGroups = topicIssues.length > 0
    ? [...ISSUE_GROUPS, { label: 'This Attempt’s Weak Topics', issues: topicIssues }]
    : ISSUE_GROUPS
  // Keyed by label (stable and unique) rather than object identity — the
  // weakTopics-derived Issues above are recreated fresh every render, so
  // using them directly as Set/Map keys would silently break equality
  // checks across re-renders.
  const issuesByLabel = new Map(issueGroups.flatMap(g => g.issues).map(i => [i.label, i]))

  function toggle(label: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  const composedNote = composeNote(
    [...selected].map(label => issuesByLabel.get(label)).filter((i): i is Issue => !!i),
    customNote,
    studentName,
  )

  async function send(mode: 'preview' | 'direct') {
    if (!includeMcq && !includeFrq) { setError('Include at least Multiple Choice or Free Response.'); return }
    setError('')
    setSending(mode)
    try {
      const res = await fetch(mode === 'preview' ? '/api/diagnostic/admin/email-result' : '/api/diagnostic/admin/email-result-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          teacherNote: composedNote || null,
          includeMcq,
          includeFrq: hasFrq ? includeFrq : false,
          includeIntegrityNote: tabSwitchCount > 0 ? includeIntegrityNote : false,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong.'); setSending(null); return }
      setSent(mode)
      setOpen(false)
      setTimeout(() => setSent(null), 8000)
    } catch {
      setError('Connection error.')
    } finally {
      setSending(null)
    }
  }

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        className={`text-sm font-semibold px-4 py-2 rounded-xl transition ${
          sent ? 'bg-green-100 text-green-700' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
        }`}
      >
        {sent === 'preview' ? '✓ Sent to your email for review' : sent === 'direct' ? '✓ Sent to Parent' : '✉️ Email Results to Student & Parent'}
      </button>
      {sent === 'preview' && <p className="text-xs text-gray-500 mt-1">Nothing has gone to the parent yet — check your email and confirm from there.</p>}
      {sent === 'direct' && <p className="text-xs text-gray-500 mt-1">Delivered to {studentEmail} and {parentEmail}.</p>}
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}

      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => !sending && setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-5 space-y-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div>
              <h3 className="font-bold text-gray-800">Compose Result Email</h3>
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 mt-2">
                <p className="text-xs text-indigo-900"><span className="font-semibold">Parent:</span> {parentEmail}</p>
                <p className="text-xs text-indigo-900"><span className="font-semibold">Student:</span> {studentEmail}</p>
              </div>
            </div>

            {hasFrq && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">What to share</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIncludeMcq(v => !v)}
                    className={`flex-1 text-xs px-3 py-2 rounded-lg border font-semibold transition-colors ${
                      includeMcq ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300'
                    }`}
                  >
                    {includeMcq ? '✓ ' : ''}Multiple Choice score
                  </button>
                  <button
                    type="button"
                    onClick={() => setIncludeFrq(v => !v)}
                    className={`flex-1 text-xs px-3 py-2 rounded-lg border font-semibold transition-colors ${
                      includeFrq ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-gray-200 text-gray-500 hover:border-purple-300'
                    }`}
                  >
                    {includeFrq ? '✓ ' : ''}Free Response score
                  </button>
                </div>
                {!(includeMcq && includeFrq) && (
                  <p className="text-xs text-amber-600 mt-1.5">
                    Partial send — only the selected score{includeMcq || includeFrq ? '' : 's'} will be shared, and the full in-app results page will stay hidden until you send both (or release it separately).
                  </p>
                )}
              </div>
            )}

            {tabSwitchCount > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Test Integrity Note</p>
                <label className="flex items-start gap-2 text-xs text-gray-600 bg-amber-50 border border-amber-100 rounded-lg p-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeIntegrityNote}
                    onChange={e => setIncludeIntegrityNote(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    Share that {studentName} left the test window {tabSwitchCount} time{tabSwitchCount === 1 ? '' : 's'} while testing, including any grade deduction and the possible-cheating note.
                  </span>
                </label>
              </div>
            )}

            {issueGroups.map(group => (
              <div key={group.label}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {group.label} <span className="normal-case font-normal text-gray-400">— click any that apply, optional</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.issues.map(issue => (
                    <button
                      key={issue.label}
                      type="button"
                      onClick={() => toggle(issue.label)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors text-left ${
                        selected.has(issue.label)
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
                      }`}
                    >
                      {issue.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Additional note (optional)</p>
              <textarea
                value={customNote}
                onChange={e => setCustomNote(e.target.value)}
                rows={3}
                placeholder={`Any other context for ${studentName}'s parent...`}
                className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            {composedNote && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Preview — note included in the email</p>
                <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 text-xs text-purple-900 whitespace-pre-wrap">{composedNote}</div>
              </div>
            )}

            <div className="pt-2 border-t border-gray-100 space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => send('preview')}
                  disabled={sending !== null || (!includeMcq && !includeFrq)}
                  className="flex-1 bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-50 text-sm font-semibold px-4 py-2.5 rounded-xl disabled:opacity-50"
                >
                  {sending === 'preview' ? 'Sending…' : 'Send Preview to Me'}
                </button>
                <button
                  onClick={() => send('direct')}
                  disabled={sending !== null || (!includeMcq && !includeFrq)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl disabled:opacity-50"
                >
                  {sending === 'direct' ? 'Sending…' : `Send to Parent (${parentEmail})`}
                </button>
              </div>
              <button
                onClick={() => setOpen(false)}
                disabled={sending !== null}
                className="w-full px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
