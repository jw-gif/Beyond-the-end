-- Seed data for The Family Cabin prototype
-- Run after migration 001

-- Rates
insert into rates (tier, nightly_rate) values
  ('public', 250),
  ('friends', 150)
on conflict (tier) do update set nightly_rate = excluded.nightly_rate;

-- Inventory
insert into inventory (label, detail, icon) values
  ('Dish Soap & Sponges', 'Under the kitchen sink', '🧴'),
  ('Paper Towels (2 rolls)', 'Cabinet above the microwave', '🧻'),
  ('Trash Bags (large, 10ct)', 'Under kitchen sink', '🗑️'),
  ('Laundry Detergent', 'Mud room shelf', '🫧'),
  ('First Aid Kit', 'Master bathroom cabinet', '🩹'),
  ('Flashlights (2)', 'Drawer by the back door', '🔦'),
  ('Real Firewood', 'Stored on back porch', '🪵'),
  ('Fire Extinguisher', 'Kitchen wall mount — check annually', '🧯');

-- Guest Notes
insert into guest_notes (author_name, title, body, note_date) values
  ('Margaret S.', 'Propane is Low',
   'Just a heads-up for whoever is coming next — the propane for the outdoor grill is getting low. The tank is behind the shed. Probably has one or two good cookouts left in it.',
   '2024-10-10'),
  ('The Miller Family', 'Bear Activity Near Trail',
   'FYI we spotted a black bear and two cubs about a quarter mile up the east trail on Wednesday morning. Nothing aggressive, but wanted to give everyone a heads up. Keep food secured!',
   '2024-09-28');

-- Admin blocks
insert into admin_blocks (start_date, end_date, reason) values
  ('2024-11-20', '2024-11-30', 'Winterization Maintenance');

-- Co-op items
insert into coop_items (label, subtitle) values
  ('Food Provisions Bundle', 'Pantry staples & fresh produce for 4'),
  ('Propane Tank', 'Standard 20 lb exchange'),
  ('Fresh Firewood Bundle', 'At least 0.25 cord of seasoned oak'),
  ('Propane & Appliances', 'Check tank levels and test stove igniters');

-- Note: profiles, bookings, and memoirs must be seeded after auth users are created.
-- Use the Supabase dashboard to create demo users, then insert matching profile rows:
--
-- insert into profiles (id, name, email, tier, member_since, emergency_contact_name, emergency_contact_phone)
-- values
--   ('<julian-uuid>', 'Julian Thorne', 'julian.t@family', 'family', '2019-06-01', 'Clara Thorne', '+1 (415) 555-0192'),
--   ('<clara-uuid>',  'Aunt Clara',    'clara@family',   'family', '2019-06-01', null, null),
--   ('<david-uuid>',  'David Miller',  'david@friends',  'friends', '2022-03-15', null, null);
