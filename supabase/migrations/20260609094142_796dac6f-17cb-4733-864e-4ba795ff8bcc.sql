ALTER TABLE measurement_bookings ENABLE ROW LEVEL SECURITY;

-- Drop the old restrictive INSERT policy that causes booking failures
DROP POLICY IF EXISTS "Anyone can create measurement booking" ON measurement_bookings;

-- Drop any previously created policies by the names we use below
DROP POLICY IF EXISTS "Anyone can create a booking" ON measurement_bookings;
DROP POLICY IF EXISTS "Admin can read all bookings" ON measurement_bookings;
DROP POLICY IF EXISTS "Admin can update bookings" ON measurement_bookings;

-- Allow anyone (anon + authenticated) to INSERT new bookings without restrictive checks
CREATE POLICY "Anyone can create a booking" ON measurement_bookings FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Allow admin to SELECT all bookings
CREATE POLICY "Admin can read all bookings" ON measurement_bookings FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Allow customers to SELECT their own bookings using auth.uid() = user_id
CREATE POLICY "Customer can read own bookings" ON measurement_bookings FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Allow only admin to UPDATE booking status
CREATE POLICY "Admin can update bookings" ON measurement_bookings FOR UPDATE USING (has_role(auth.uid(), 'admin'));