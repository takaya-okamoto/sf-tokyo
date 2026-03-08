-- Demo seed data for Interview - 2026/3/8
-- Hearing ID: 2bacf2c4-46fc-4335-a314-bb863f08618d

-- 1. Create demo users in auth.users
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role, raw_app_meta_data, raw_user_meta_data, confirmation_token)
VALUES
  ('a1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'tanaka.yuki@example.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', ''),
  ('a1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'suzuki.hana@example.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', ''),
  ('a1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'yamamoto.ken@example.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', ''),
  ('a1000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'sato.mika@example.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', ''),
  ('a1000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'watanabe.ryo@example.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', '')
ON CONFLICT (id) DO NOTHING;

-- 2. Create profiles
INSERT INTO profiles (id, email, display_name, role) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'tanaka.yuki@example.com', 'Tanaka Yuki', 'user'),
  ('a1000000-0000-0000-0000-000000000002', 'suzuki.hana@example.com', 'Suzuki Hana', 'user'),
  ('a1000000-0000-0000-0000-000000000003', 'yamamoto.ken@example.com', 'Yamamoto Ken', 'user'),
  ('a1000000-0000-0000-0000-000000000004', 'sato.mika@example.com', 'Sato Mika', 'user'),
  ('a1000000-0000-0000-0000-000000000005', 'watanabe.ryo@example.com', 'Watanabe Ryo', 'user')
ON CONFLICT (id) DO NOTHING;

-- 3. Create interview sessions
-- User 1: completed
INSERT INTO interview_sessions (id, hearing_request_id, user_id, status, started_at, completed_at, created_at) VALUES
  ('b1000000-0000-0000-0000-000000000001', '2bacf2c4-46fc-4335-a314-bb863f08618d', 'a1000000-0000-0000-0000-000000000001', 'completed', '2026-03-08 10:00:00+09', '2026-03-08 10:28:00+09', '2026-03-08 09:55:00+09');
-- User 2: completed
INSERT INTO interview_sessions (id, hearing_request_id, user_id, status, started_at, completed_at, created_at) VALUES
  ('b1000000-0000-0000-0000-000000000002', '2bacf2c4-46fc-4335-a314-bb863f08618d', 'a1000000-0000-0000-0000-000000000002', 'completed', '2026-03-08 11:00:00+09', '2026-03-08 11:35:00+09', '2026-03-08 10:55:00+09');
-- User 3: completed
INSERT INTO interview_sessions (id, hearing_request_id, user_id, status, started_at, completed_at, created_at) VALUES
  ('b1000000-0000-0000-0000-000000000003', '2bacf2c4-46fc-4335-a314-bb863f08618d', 'a1000000-0000-0000-0000-000000000003', 'completed', '2026-03-08 13:00:00+09', '2026-03-08 13:22:00+09', '2026-03-08 12:55:00+09');
-- User 4: interview (in progress)
INSERT INTO interview_sessions (id, hearing_request_id, user_id, status, started_at, created_at) VALUES
  ('b1000000-0000-0000-0000-000000000004', '2bacf2c4-46fc-4335-a314-bb863f08618d', 'a1000000-0000-0000-0000-000000000004', 'interview', '2026-03-08 14:00:00+09', '2026-03-08 13:55:00+09');
-- User 5: pending
INSERT INTO interview_sessions (id, hearing_request_id, user_id, status, created_at) VALUES
  ('b1000000-0000-0000-0000-000000000005', '2bacf2c4-46fc-4335-a314-bb863f08618d', 'a1000000-0000-0000-0000-000000000005', 'pending', '2026-03-08 14:30:00+09');

-- 4. AI interview messages for completed users

-- User 1 messages
INSERT INTO ai_interview_messages (session_id, role, content, created_at) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'assistant', 'Thank you for completing the tasks! How was your overall experience using the product?', '2026-03-08 10:20:00+09'),
  ('b1000000-0000-0000-0000-000000000001', 'user', 'Overall it was pretty intuitive. I was able to create a project and add members without much difficulty. The UI is clean and easy to navigate.', '2026-03-08 10:21:00+09'),
  ('b1000000-0000-0000-0000-000000000001', 'assistant', 'That''s great to hear. Was there anything that confused you or felt difficult?', '2026-03-08 10:21:30+09'),
  ('b1000000-0000-0000-0000-000000000001', 'user', 'The settings page was a bit hard to find. I expected it in the top navigation but it was in the sidebar. Also, the invite member flow could use a confirmation step.', '2026-03-08 10:22:30+09'),
  ('b1000000-0000-0000-0000-000000000001', 'assistant', 'I see. How would you rate the speed and performance of the application?', '2026-03-08 10:23:00+09'),
  ('b1000000-0000-0000-0000-000000000001', 'user', 'Very fast. Pages loaded quickly and there was no noticeable lag. I was impressed with how responsive it felt.', '2026-03-08 10:24:00+09'),
  ('b1000000-0000-0000-0000-000000000001', 'assistant', 'Would you recommend this product to a colleague?', '2026-03-08 10:24:30+09'),
  ('b1000000-0000-0000-0000-000000000001', 'user', 'Yes, definitely. It solves a real problem and the experience is smooth enough that I''d feel comfortable recommending it.', '2026-03-08 10:25:30+09');

-- User 2 messages
INSERT INTO ai_interview_messages (session_id, role, content, created_at) VALUES
  ('b1000000-0000-0000-0000-000000000002', 'assistant', 'Thank you for trying the product! Could you tell me about your experience?', '2026-03-08 11:25:00+09'),
  ('b1000000-0000-0000-0000-000000000002', 'user', 'It was okay but I struggled with a few things. The onboarding was a bit confusing - I wasn''t sure what to do first.', '2026-03-08 11:26:00+09'),
  ('b1000000-0000-0000-0000-000000000002', 'assistant', 'Could you elaborate on what was confusing about the onboarding?', '2026-03-08 11:26:30+09'),
  ('b1000000-0000-0000-0000-000000000002', 'user', 'There were too many options presented at once. I think a step-by-step wizard would be much better. Also, some labels were unclear - like "hearing request" doesn''t mean anything to me as a user.', '2026-03-08 11:28:00+09'),
  ('b1000000-0000-0000-0000-000000000002', 'assistant', 'That''s very helpful feedback. How about the core functionality - were you able to complete the tasks?', '2026-03-08 11:28:30+09'),
  ('b1000000-0000-0000-0000-000000000002', 'user', 'Yes, eventually. The task creation itself was straightforward once I understood the flow. But I had trouble finding where to view results.', '2026-03-08 11:30:00+09');

-- User 3 messages
INSERT INTO ai_interview_messages (session_id, role, content, created_at) VALUES
  ('b1000000-0000-0000-0000-000000000003', 'assistant', 'Thanks for participating! How did you find the product?', '2026-03-08 13:15:00+09'),
  ('b1000000-0000-0000-0000-000000000003', 'user', 'Really great actually. I''m a developer so I appreciated the clean architecture. The SDK integration page was especially well done.', '2026-03-08 13:16:00+09'),
  ('b1000000-0000-0000-0000-000000000003', 'assistant', 'Glad to hear that. Were there any features you wished existed?', '2026-03-08 13:16:30+09'),
  ('b1000000-0000-0000-0000-000000000003', 'user', 'I''d love to see real-time collaboration features, like being able to see who else is viewing the same project. Also, a dark mode would be nice.', '2026-03-08 13:17:30+09'),
  ('b1000000-0000-0000-0000-000000000003', 'assistant', 'What about the mobile experience?', '2026-03-08 13:18:00+09'),
  ('b1000000-0000-0000-0000-000000000003', 'user', 'I only used it on desktop, but the layout looks responsive. I''d probably use it on mobile occasionally to check results.', '2026-03-08 13:19:00+09');

-- 5. AI summaries for completed users
INSERT INTO ai_interview_summaries (session_id, summary, key_insights) VALUES
  ('b1000000-0000-0000-0000-000000000001',
   'The user had a positive overall experience. They found the UI clean and intuitive, with good performance. Key pain points were the settings page discoverability and the lack of a confirmation step in the invite flow.',
   '["Settings page location is not intuitive - expected in top nav", "Invite member flow needs confirmation step", "Performance was rated highly", "Would recommend to colleagues"]'::jsonb),
  ('b1000000-0000-0000-0000-000000000002',
   'The user struggled with onboarding and found the initial experience overwhelming. Terminology like "hearing request" was confusing. Once past onboarding, core functionality worked well but result viewing was hard to find.',
   '["Onboarding needs a step-by-step wizard approach", "Terminology needs to be more user-friendly", "Too many options presented at once initially", "Core task creation flow is straightforward"]'::jsonb),
  ('b1000000-0000-0000-0000-000000000003',
   'Technical user who appreciated the architecture and SDK integration. Wants real-time collaboration and dark mode. Positive experience overall with responsive design noted.',
   '["SDK integration page is well designed", "Requests real-time collaboration features", "Dark mode requested", "Layout appears responsive but only tested on desktop"]'::jsonb);

-- 6. Add survey questions to this hearing
INSERT INTO survey_questions (id, hearing_request_id, phase, sort_order, question, question_type) VALUES
  ('c1000000-0000-0000-0000-000000000001', '2bacf2c4-46fc-4335-a314-bb863f08618d', 'pre_survey', 0, 'What is your role?', 'radio'),
  ('c1000000-0000-0000-0000-000000000002', '2bacf2c4-46fc-4335-a314-bb863f08618d', 'pre_survey', 1, 'How often do you use similar tools?', 'radio'),
  ('c1000000-0000-0000-0000-000000000003', '2bacf2c4-46fc-4335-a314-bb863f08618d', 'feedback', 0, 'How would you rate the overall experience?', 'radio'),
  ('c1000000-0000-0000-0000-000000000004', '2bacf2c4-46fc-4335-a314-bb863f08618d', 'feedback', 1, 'What features did you find most useful?', 'checkbox'),
  ('c1000000-0000-0000-0000-000000000005', '2bacf2c4-46fc-4335-a314-bb863f08618d', 'feedback', 2, 'Any additional comments?', 'text');

-- Survey question options
INSERT INTO survey_question_options (id, question_id, sort_order, label) VALUES
  -- Role options
  ('d1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 0, 'Engineer'),
  ('d1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 1, 'Designer'),
  ('d1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 2, 'PM'),
  ('d1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001', 3, 'Other'),
  -- Frequency options
  ('d1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000002', 0, 'Daily'),
  ('d1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000002', 1, 'Weekly'),
  ('d1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000002', 2, 'Monthly'),
  ('d1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000002', 3, 'Rarely'),
  -- Rating options
  ('d1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000003', 0, 'Excellent'),
  ('d1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000003', 1, 'Good'),
  ('d1000000-0000-0000-0000-000000000011', 'c1000000-0000-0000-0000-000000000003', 2, 'Fair'),
  ('d1000000-0000-0000-0000-000000000012', 'c1000000-0000-0000-0000-000000000003', 3, 'Poor'),
  -- Useful features options
  ('d1000000-0000-0000-0000-000000000013', 'c1000000-0000-0000-0000-000000000004', 0, 'Project Management'),
  ('d1000000-0000-0000-0000-000000000014', 'c1000000-0000-0000-0000-000000000004', 1, 'Team Collaboration'),
  ('d1000000-0000-0000-0000-000000000015', 'c1000000-0000-0000-0000-000000000004', 2, 'SDK Integration'),
  ('d1000000-0000-0000-0000-000000000016', 'c1000000-0000-0000-0000-000000000004', 3, 'Dashboard Analytics');

-- 7. Survey responses for completed users

-- User 1 responses
INSERT INTO survey_responses (id, session_id, question_id, text_value) VALUES
  ('e1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', NULL),
  ('e1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', NULL),
  ('e1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000003', NULL),
  ('e1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000004', NULL),
  ('e1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000005', 'The settings page was hard to find. Would love to see it in the main navigation.');

INSERT INTO survey_response_selections (response_id, option_id) VALUES
  ('e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000002'), -- Designer
  ('e1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000006'), -- Weekly
  ('e1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000010'), -- Good
  ('e1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000013'), -- Project Management
  ('e1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000014'); -- Team Collaboration

-- User 2 responses
INSERT INTO survey_responses (id, session_id, question_id, text_value) VALUES
  ('e1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', NULL),
  ('e1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', NULL),
  ('e1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000003', NULL),
  ('e1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000004', NULL),
  ('e1000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000005', 'Onboarding was confusing. Terminology needs improvement. "Hearing request" is not a term I understand.');

INSERT INTO survey_response_selections (response_id, option_id) VALUES
  ('e1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000003'), -- PM
  ('e1000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000008'), -- Rarely
  ('e1000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000011'), -- Fair
  ('e1000000-0000-0000-0000-000000000009', 'd1000000-0000-0000-0000-000000000013'); -- Project Management

-- User 3 responses
INSERT INTO survey_responses (id, session_id, question_id, text_value) VALUES
  ('e1000000-0000-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', NULL),
  ('e1000000-0000-0000-0000-000000000012', 'b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002', NULL),
  ('e1000000-0000-0000-0000-000000000013', 'b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003', NULL),
  ('e1000000-0000-0000-0000-000000000014', 'b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000004', NULL),
  ('e1000000-0000-0000-0000-000000000015', 'b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000005', 'Excellent product. Would love dark mode and real-time collaboration features.');

INSERT INTO survey_response_selections (response_id, option_id) VALUES
  ('e1000000-0000-0000-0000-000000000011', 'd1000000-0000-0000-0000-000000000001'), -- Engineer
  ('e1000000-0000-0000-0000-000000000012', 'd1000000-0000-0000-0000-000000000005'), -- Daily
  ('e1000000-0000-0000-0000-000000000013', 'd1000000-0000-0000-0000-000000000009'), -- Excellent
  ('e1000000-0000-0000-0000-000000000014', 'd1000000-0000-0000-0000-000000000015'), -- SDK Integration
  ('e1000000-0000-0000-0000-000000000014', 'd1000000-0000-0000-0000-000000000016'); -- Dashboard Analytics

-- Update hearing status to active
UPDATE hearing_requests SET status = 'active' WHERE id = '2bacf2c4-46fc-4335-a314-bb863f08618d';
