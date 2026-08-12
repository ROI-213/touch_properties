const { Client } = require('pg');
const client = new Client('postgres://touch590:ia1MVU8W0kU1Q347NF6aDNkHy@168.119.64.101:5432/touch590');
const sql = `
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    image_url TEXT,
    is_read BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
`;
client.connect()
  .then(() => client.query(sql))
  .then(() => console.log('Table created successfully'))
  .catch(console.error)
  .finally(() => client.end());
