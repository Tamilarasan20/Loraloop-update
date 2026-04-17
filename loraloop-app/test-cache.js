const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://drnqqspylghahjriangs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRybnFxc3B5bGdoYWhqcmlhbmdzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI3NTEzNCwiZXhwIjoyMDkxODUxMTM0fQ.0BBq1u04deJtxsQEPEet-1Of7BemUShj4Uc0J50Ne28'
);
async function test() {
  const { data, error } = await supabase.from('businesses').select('*').limit(1);
  console.log("Error:", error);
  console.log("Data:", data);
}
test();
