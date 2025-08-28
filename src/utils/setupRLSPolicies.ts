import { supabase } from "@/integrations/supabase/client";

export const setupRLSPolicies = async () => {
  console.log('🔒 Políticas RLS necessárias para submissões públicas:');

  const sqlCommands = [
    // Enable RLS on responses table  
    `ALTER TABLE responses ENABLE ROW LEVEL SECURITY;`,
    
    // Drop and create policy for public inserts on responses
    `DROP POLICY IF EXISTS "Allow public inserts on responses" ON responses;`,
    `CREATE POLICY "Allow public inserts on responses" ON responses FOR INSERT TO public WITH CHECK (true);`,
    
    // Drop and create policy for authenticated selects on responses
    `DROP POLICY IF EXISTS "Allow users to view responses" ON responses;`,
    `CREATE POLICY "Allow users to view responses" ON responses FOR SELECT TO authenticated USING (true);`,
    
    // Enable RLS on response_answers table
    `ALTER TABLE response_answers ENABLE ROW LEVEL SECURITY;`,
    
    // Drop and create policy for public inserts on response_answers
    `DROP POLICY IF EXISTS "Allow public inserts on response_answers" ON response_answers;`,
    `CREATE POLICY "Allow public inserts on response_answers" ON response_answers FOR INSERT TO public WITH CHECK (true);`,
    
    // Drop and create policy for authenticated selects on response_answers
    `DROP POLICY IF EXISTS "Allow users to view response_answers" ON response_answers;`,
    `CREATE POLICY "Allow users to view response_answers" ON response_answers FOR SELECT TO authenticated USING (true);`
  ];

  console.log('Execute estes comandos no Supabase SQL Editor:');
  sqlCommands.forEach(cmd => console.log(cmd));
  
  return sqlCommands;
};