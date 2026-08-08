import { createAdminClient } from './supabase/server'

export interface LeadContact {
  studentName: string
  studentEmail: string
  parentName: string
  parentEmail: string
  parentPhone: string
}

// diagnostic_leads freezes contact info at the moment a test is taken —
// right for an anonymous public lead (there's no other source of truth to
// drift from), wrong for an enrolled student (student_id set): if a teacher
// later fixes a typo'd parent email via the student profile editor, every
// attempt taken before that fix would otherwise keep emailing the old
// address forever. Prefer the live profile for anything tied to a real
// student; fall back to the lead's own snapshot otherwise.
export async function resolveLeadContact(admin: Awaited<ReturnType<typeof createAdminClient>>, leadId: string): Promise<LeadContact | null> {
  const { data: lead } = await admin
    .from('diagnostic_leads')
    .select('student_id, student_name, student_email, parent_name, parent_email, parent_phone')
    .eq('id', leadId)
    .maybeSingle()
  if (!lead) return null

  if (lead.student_id) {
    const { data: profile } = await admin
      .from('profiles')
      .select('full_name, email, parent_name, parent_email, parent_phone')
      .eq('id', lead.student_id)
      .maybeSingle()
    if (profile) {
      return {
        studentName: profile.full_name || lead.student_name,
        studentEmail: profile.email || lead.student_email,
        parentName: profile.parent_name || lead.parent_name,
        parentEmail: profile.parent_email || lead.parent_email,
        parentPhone: profile.parent_phone || lead.parent_phone,
      }
    }
  }

  return {
    studentName: lead.student_name,
    studentEmail: lead.student_email,
    parentName: lead.parent_name,
    parentEmail: lead.parent_email,
    parentPhone: lead.parent_phone,
  }
}
