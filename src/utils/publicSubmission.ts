import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xqafdrojfsrrnjyngenl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxYWZkcm9qZnNycm5qeW5nZW5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMjUwMzIsImV4cCI6MjA3MDYwMTAzMn0.FofMXNdtaz1-ssFHo0aAwZiILVZcYmDtr2cE-3WSio8";

// Create a client specifically for public submissions without session persistence
export const publicSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  }
});

export interface PublicFormSubmission {
  formId: string;
  answers: Record<string, string>;
}

export const submitPublicFormResponse = async ({ formId, answers }: PublicFormSubmission) => {
  console.log('🚀 Public submission starting:', { formId, answers });

  try {
    // Create response record
    const { data: responseData, error: responseError } = await publicSupabase
      .from('responses')
      .insert([{ form_id: formId }])
      .select()
      .single();

    if (responseError) {
      console.error('❌ Response creation error:', responseError);
      throw new Error(`Failed to create response: ${responseError.message}`);
    }

    console.log('✅ Response created:', responseData);

    // Prepare answer inserts
    const answerInserts = Object.entries(answers).map(([questionId, answer]) => ({
      response_id: responseData.id,
      question_id: questionId,
      resposta: answer
    }));

    // Insert answers
    const { data: answersData, error: answersError } = await publicSupabase
      .from('response_answers')
      .insert(answerInserts)
      .select();

    if (answersError) {
      console.error('❌ Answers insertion error:', answersError);
      throw new Error(`Failed to save answers: ${answersError.message}`);
    }

    console.log('✅ Answers saved:', answersData);
    return responseData.id;

  } catch (error) {
    console.error('💥 Public submission failed:', error);
    throw error;
  }
};