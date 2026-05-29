
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = lower('carpenter@suzywood.com');

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'carpenter@suzywood.com',
      crypt('Najar@1234', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Carpenter"}'::jsonb,
      now(), now(), '', '', '', ''
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'carpenter@suzywood.com'),
      'email',
      v_user_id::text,
      now(), now(), now()
    );
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'carpenter'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;
