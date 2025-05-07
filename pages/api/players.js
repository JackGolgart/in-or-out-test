export default async function handler(req, res) {
  const { search } = req.query;

  if (!search) {
    return res.status(400).json({ error: 'Missing search term' });
  }

  const { data, error } = await supabase
    .from('players')
    .select('*')
    .ilike('last_name', `%${search}%`);

  if (error) return res.status(500).json({ error: error.message });

  res.status(200).json({ data });
}