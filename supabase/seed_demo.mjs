const BASE = "http://127.0.0.1:54321";
const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const HEARING_ID = "2bacf2c4-46fc-4335-a314-bb863f08618d";

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=minimal",
};

async function post(table, data) {
  const r = await fetch(`${BASE}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=minimal,resolution=ignore-duplicates" },
    body: JSON.stringify(data),
  });
  if (!r.ok) {
    const body = await r.text();
    console.error(`ERROR ${table}:`, r.status, body);
  } else {
    console.log(`OK ${table}`);
  }
}

async function patch(table, match, data) {
  const params = new URLSearchParams(match).toString();
  const r = await fetch(`${BASE}/rest/v1/${table}?${params}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  });
  if (!r.ok) {
    const body = await r.text();
    console.error(`ERROR PATCH ${table}:`, r.status, body);
  } else {
    console.log(`OK PATCH ${table}`);
  }
}

async function main() {
  // 1. Create demo users via admin API
  const users = [
    { id: "a1000000-0000-0000-0000-000000000001", email: "tanaka.yuki@example.com", name: "Tanaka Yuki" },
    { id: "a1000000-0000-0000-0000-000000000002", email: "suzuki.hana@example.com", name: "Suzuki Hana" },
    { id: "a1000000-0000-0000-0000-000000000003", email: "yamamoto.ken@example.com", name: "Yamamoto Ken" },
    { id: "a1000000-0000-0000-0000-000000000004", email: "sato.mika@example.com", name: "Sato Mika" },
    { id: "a1000000-0000-0000-0000-000000000005", email: "watanabe.ryo@example.com", name: "Watanabe Ryo" },
  ];

  for (const u of users) {
    const r = await fetch(`${BASE}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: u.id,
        email: u.email,
        password: "password123",
        email_confirm: true,
        user_metadata: { display_name: u.name },
      }),
    });
    const body = await r.text();
    if (r.ok || body.includes("already")) {
      console.log(`OK user ${u.name}`);
    } else {
      console.error(`ERROR user ${u.name}:`, r.status, body);
    }
  }

  // 2. Profiles
  await post("profiles", users.map((u) => ({
    id: u.id,
    email: u.email,
    display_name: u.name,
    role: "user",
  })));

  // 3. Interview sessions (insert one by one to avoid "all keys must match" error)
  const sessionRows = [
    { id: "b1000000-0000-0000-0000-000000000001", hearing_request_id: HEARING_ID, user_id: users[0].id, status: "completed", started_at: "2026-03-08T01:00:00Z", completed_at: "2026-03-08T01:28:00Z", created_at: "2026-03-08T00:55:00Z" },
    { id: "b1000000-0000-0000-0000-000000000002", hearing_request_id: HEARING_ID, user_id: users[1].id, status: "completed", started_at: "2026-03-08T02:00:00Z", completed_at: "2026-03-08T02:35:00Z", created_at: "2026-03-08T01:55:00Z" },
    { id: "b1000000-0000-0000-0000-000000000003", hearing_request_id: HEARING_ID, user_id: users[2].id, status: "completed", started_at: "2026-03-08T04:00:00Z", completed_at: "2026-03-08T04:22:00Z", created_at: "2026-03-08T03:55:00Z" },
    { id: "b1000000-0000-0000-0000-000000000004", hearing_request_id: HEARING_ID, user_id: users[3].id, status: "interview", started_at: "2026-03-08T05:00:00Z", completed_at: null, created_at: "2026-03-08T04:55:00Z" },
    { id: "b1000000-0000-0000-0000-000000000005", hearing_request_id: HEARING_ID, user_id: users[4].id, status: "pending", started_at: null, completed_at: null, created_at: "2026-03-08T05:30:00Z" },
  ];
  for (const row of sessionRows) {
    await post("interview_sessions", [row]);
  }

  // 4. AI messages
  const msgs = [
    // User 1
    { session_id: "b1000000-0000-0000-0000-000000000001", role: "assistant", content: "Thank you for completing the tasks! How was your overall experience using the product?", created_at: "2026-03-08T01:20:00Z" },
    { session_id: "b1000000-0000-0000-0000-000000000001", role: "user", content: "Overall it was pretty intuitive. I was able to create a project and add members without much difficulty. The UI is clean and easy to navigate.", created_at: "2026-03-08T01:21:00Z" },
    { session_id: "b1000000-0000-0000-0000-000000000001", role: "assistant", content: "That's great to hear. Was there anything that confused you or felt difficult?", created_at: "2026-03-08T01:21:30Z" },
    { session_id: "b1000000-0000-0000-0000-000000000001", role: "user", content: "The settings page was a bit hard to find. I expected it in the top navigation but it was in the sidebar. Also, the invite member flow could use a confirmation step.", created_at: "2026-03-08T01:22:30Z" },
    { session_id: "b1000000-0000-0000-0000-000000000001", role: "assistant", content: "I see. How would you rate the speed and performance of the application?", created_at: "2026-03-08T01:23:00Z" },
    { session_id: "b1000000-0000-0000-0000-000000000001", role: "user", content: "Very fast. Pages loaded quickly and there was no noticeable lag. I was impressed with how responsive it felt.", created_at: "2026-03-08T01:24:00Z" },
    { session_id: "b1000000-0000-0000-0000-000000000001", role: "assistant", content: "Would you recommend this product to a colleague?", created_at: "2026-03-08T01:24:30Z" },
    { session_id: "b1000000-0000-0000-0000-000000000001", role: "user", content: "Yes, definitely. It solves a real problem and the experience is smooth enough that I'd feel comfortable recommending it.", created_at: "2026-03-08T01:25:30Z" },
    // User 2
    { session_id: "b1000000-0000-0000-0000-000000000002", role: "assistant", content: "Thank you for trying the product! Could you tell me about your experience?", created_at: "2026-03-08T02:25:00Z" },
    { session_id: "b1000000-0000-0000-0000-000000000002", role: "user", content: "It was okay but I struggled with a few things. The onboarding was a bit confusing - I wasn't sure what to do first.", created_at: "2026-03-08T02:26:00Z" },
    { session_id: "b1000000-0000-0000-0000-000000000002", role: "assistant", content: "Could you elaborate on what was confusing about the onboarding?", created_at: "2026-03-08T02:26:30Z" },
    { session_id: "b1000000-0000-0000-0000-000000000002", role: "user", content: "There were too many options presented at once. I think a step-by-step wizard would be much better. Also, some labels were unclear.", created_at: "2026-03-08T02:28:00Z" },
    { session_id: "b1000000-0000-0000-0000-000000000002", role: "assistant", content: "That's very helpful feedback. How about the core functionality - were you able to complete the tasks?", created_at: "2026-03-08T02:28:30Z" },
    { session_id: "b1000000-0000-0000-0000-000000000002", role: "user", content: "Yes, eventually. The task creation itself was straightforward once I understood the flow. But I had trouble finding where to view results.", created_at: "2026-03-08T02:30:00Z" },
    // User 3
    { session_id: "b1000000-0000-0000-0000-000000000003", role: "assistant", content: "Thanks for participating! How did you find the product?", created_at: "2026-03-08T04:15:00Z" },
    { session_id: "b1000000-0000-0000-0000-000000000003", role: "user", content: "Really great actually. I'm a developer so I appreciated the clean architecture. The SDK integration page was especially well done.", created_at: "2026-03-08T04:16:00Z" },
    { session_id: "b1000000-0000-0000-0000-000000000003", role: "assistant", content: "Glad to hear that. Were there any features you wished existed?", created_at: "2026-03-08T04:16:30Z" },
    { session_id: "b1000000-0000-0000-0000-000000000003", role: "user", content: "I'd love to see real-time collaboration features, like being able to see who else is viewing the same project. Also, a dark mode would be nice.", created_at: "2026-03-08T04:17:30Z" },
    { session_id: "b1000000-0000-0000-0000-000000000003", role: "assistant", content: "What about the mobile experience?", created_at: "2026-03-08T04:18:00Z" },
    { session_id: "b1000000-0000-0000-0000-000000000003", role: "user", content: "I only used it on desktop, but the layout looks responsive. I'd probably use it on mobile occasionally to check results.", created_at: "2026-03-08T04:19:00Z" },
  ];
  await post("ai_interview_messages", msgs);

  // 5. AI summaries
  await post("ai_interview_summaries", [
    { session_id: "b1000000-0000-0000-0000-000000000001", summary: "The user had a positive overall experience. They found the UI clean and intuitive, with good performance. Key pain points were the settings page discoverability and the lack of a confirmation step in the invite flow.", key_insights: ["Settings page location is not intuitive - expected in top nav", "Invite member flow needs confirmation step", "Performance was rated highly", "Would recommend to colleagues"] },
    { session_id: "b1000000-0000-0000-0000-000000000002", summary: "The user struggled with onboarding and found the initial experience overwhelming. Terminology was confusing. Once past onboarding, core functionality worked well but result viewing was hard to find.", key_insights: ["Onboarding needs a step-by-step wizard approach", "Terminology needs to be more user-friendly", "Too many options presented at once initially", "Core task creation flow is straightforward"] },
    { session_id: "b1000000-0000-0000-0000-000000000003", summary: "Technical user who appreciated the architecture and SDK integration. Wants real-time collaboration and dark mode. Positive experience overall with responsive design noted.", key_insights: ["SDK integration page is well designed", "Requests real-time collaboration features", "Dark mode requested", "Layout appears responsive but only tested on desktop"] },
  ]);

  // 6. Survey questions
  await post("survey_questions", [
    { id: "c1000000-0000-0000-0000-000000000001", hearing_request_id: HEARING_ID, phase: "pre_survey", sort_order: 0, question: "What is your role?", question_type: "radio" },
    { id: "c1000000-0000-0000-0000-000000000002", hearing_request_id: HEARING_ID, phase: "pre_survey", sort_order: 1, question: "How often do you use similar tools?", question_type: "radio" },
    { id: "c1000000-0000-0000-0000-000000000003", hearing_request_id: HEARING_ID, phase: "feedback", sort_order: 0, question: "How would you rate the overall experience?", question_type: "radio" },
    { id: "c1000000-0000-0000-0000-000000000004", hearing_request_id: HEARING_ID, phase: "feedback", sort_order: 1, question: "What features did you find most useful?", question_type: "checkbox" },
    { id: "c1000000-0000-0000-0000-000000000005", hearing_request_id: HEARING_ID, phase: "feedback", sort_order: 2, question: "Any additional comments?", question_type: "text" },
  ]);

  // 7. Survey options
  await post("survey_question_options", [
    { id: "d1000000-0000-0000-0000-000000000001", question_id: "c1000000-0000-0000-0000-000000000001", sort_order: 0, label: "Engineer" },
    { id: "d1000000-0000-0000-0000-000000000002", question_id: "c1000000-0000-0000-0000-000000000001", sort_order: 1, label: "Designer" },
    { id: "d1000000-0000-0000-0000-000000000003", question_id: "c1000000-0000-0000-0000-000000000001", sort_order: 2, label: "PM" },
    { id: "d1000000-0000-0000-0000-000000000004", question_id: "c1000000-0000-0000-0000-000000000001", sort_order: 3, label: "Other" },
    { id: "d1000000-0000-0000-0000-000000000005", question_id: "c1000000-0000-0000-0000-000000000002", sort_order: 0, label: "Daily" },
    { id: "d1000000-0000-0000-0000-000000000006", question_id: "c1000000-0000-0000-0000-000000000002", sort_order: 1, label: "Weekly" },
    { id: "d1000000-0000-0000-0000-000000000007", question_id: "c1000000-0000-0000-0000-000000000002", sort_order: 2, label: "Monthly" },
    { id: "d1000000-0000-0000-0000-000000000008", question_id: "c1000000-0000-0000-0000-000000000002", sort_order: 3, label: "Rarely" },
    { id: "d1000000-0000-0000-0000-000000000009", question_id: "c1000000-0000-0000-0000-000000000003", sort_order: 0, label: "Excellent" },
    { id: "d1000000-0000-0000-0000-000000000010", question_id: "c1000000-0000-0000-0000-000000000003", sort_order: 1, label: "Good" },
    { id: "d1000000-0000-0000-0000-000000000011", question_id: "c1000000-0000-0000-0000-000000000003", sort_order: 2, label: "Fair" },
    { id: "d1000000-0000-0000-0000-000000000012", question_id: "c1000000-0000-0000-0000-000000000003", sort_order: 3, label: "Poor" },
    { id: "d1000000-0000-0000-0000-000000000013", question_id: "c1000000-0000-0000-0000-000000000004", sort_order: 0, label: "Project Management" },
    { id: "d1000000-0000-0000-0000-000000000014", question_id: "c1000000-0000-0000-0000-000000000004", sort_order: 1, label: "Team Collaboration" },
    { id: "d1000000-0000-0000-0000-000000000015", question_id: "c1000000-0000-0000-0000-000000000004", sort_order: 2, label: "SDK Integration" },
    { id: "d1000000-0000-0000-0000-000000000016", question_id: "c1000000-0000-0000-0000-000000000004", sort_order: 3, label: "Dashboard Analytics" },
  ]);

  // 8. Survey responses
  await post("survey_responses", [
    // User 1
    { id: "e1000000-0000-0000-0000-000000000001", session_id: "b1000000-0000-0000-0000-000000000001", question_id: "c1000000-0000-0000-0000-000000000001", text_value: null },
    { id: "e1000000-0000-0000-0000-000000000002", session_id: "b1000000-0000-0000-0000-000000000001", question_id: "c1000000-0000-0000-0000-000000000002", text_value: null },
    { id: "e1000000-0000-0000-0000-000000000003", session_id: "b1000000-0000-0000-0000-000000000001", question_id: "c1000000-0000-0000-0000-000000000003", text_value: null },
    { id: "e1000000-0000-0000-0000-000000000004", session_id: "b1000000-0000-0000-0000-000000000001", question_id: "c1000000-0000-0000-0000-000000000004", text_value: null },
    { id: "e1000000-0000-0000-0000-000000000005", session_id: "b1000000-0000-0000-0000-000000000001", question_id: "c1000000-0000-0000-0000-000000000005", text_value: "The settings page was hard to find. Would love to see it in the main navigation." },
    // User 2
    { id: "e1000000-0000-0000-0000-000000000006", session_id: "b1000000-0000-0000-0000-000000000002", question_id: "c1000000-0000-0000-0000-000000000001", text_value: null },
    { id: "e1000000-0000-0000-0000-000000000007", session_id: "b1000000-0000-0000-0000-000000000002", question_id: "c1000000-0000-0000-0000-000000000002", text_value: null },
    { id: "e1000000-0000-0000-0000-000000000008", session_id: "b1000000-0000-0000-0000-000000000002", question_id: "c1000000-0000-0000-0000-000000000003", text_value: null },
    { id: "e1000000-0000-0000-0000-000000000009", session_id: "b1000000-0000-0000-0000-000000000002", question_id: "c1000000-0000-0000-0000-000000000004", text_value: null },
    { id: "e1000000-0000-0000-0000-000000000010", session_id: "b1000000-0000-0000-0000-000000000002", question_id: "c1000000-0000-0000-0000-000000000005", text_value: "Onboarding was confusing. Terminology needs improvement." },
    // User 3
    { id: "e1000000-0000-0000-0000-000000000011", session_id: "b1000000-0000-0000-0000-000000000003", question_id: "c1000000-0000-0000-0000-000000000001", text_value: null },
    { id: "e1000000-0000-0000-0000-000000000012", session_id: "b1000000-0000-0000-0000-000000000003", question_id: "c1000000-0000-0000-0000-000000000002", text_value: null },
    { id: "e1000000-0000-0000-0000-000000000013", session_id: "b1000000-0000-0000-0000-000000000003", question_id: "c1000000-0000-0000-0000-000000000003", text_value: null },
    { id: "e1000000-0000-0000-0000-000000000014", session_id: "b1000000-0000-0000-0000-000000000003", question_id: "c1000000-0000-0000-0000-000000000004", text_value: null },
    { id: "e1000000-0000-0000-0000-000000000015", session_id: "b1000000-0000-0000-0000-000000000003", question_id: "c1000000-0000-0000-0000-000000000005", text_value: "Excellent product. Would love dark mode and real-time collaboration features." },
  ]);

  // 9. Survey selections
  await post("survey_response_selections", [
    // User 1: Designer, Weekly, Good, Project Management + Team Collaboration
    { response_id: "e1000000-0000-0000-0000-000000000001", option_id: "d1000000-0000-0000-0000-000000000002" },
    { response_id: "e1000000-0000-0000-0000-000000000002", option_id: "d1000000-0000-0000-0000-000000000006" },
    { response_id: "e1000000-0000-0000-0000-000000000003", option_id: "d1000000-0000-0000-0000-000000000010" },
    { response_id: "e1000000-0000-0000-0000-000000000004", option_id: "d1000000-0000-0000-0000-000000000013" },
    { response_id: "e1000000-0000-0000-0000-000000000004", option_id: "d1000000-0000-0000-0000-000000000014" },
    // User 2: PM, Rarely, Fair, Project Management
    { response_id: "e1000000-0000-0000-0000-000000000006", option_id: "d1000000-0000-0000-0000-000000000003" },
    { response_id: "e1000000-0000-0000-0000-000000000007", option_id: "d1000000-0000-0000-0000-000000000008" },
    { response_id: "e1000000-0000-0000-0000-000000000008", option_id: "d1000000-0000-0000-0000-000000000011" },
    { response_id: "e1000000-0000-0000-0000-000000000009", option_id: "d1000000-0000-0000-0000-000000000013" },
    // User 3: Engineer, Daily, Excellent, SDK Integration + Dashboard Analytics
    { response_id: "e1000000-0000-0000-0000-000000000011", option_id: "d1000000-0000-0000-0000-000000000001" },
    { response_id: "e1000000-0000-0000-0000-000000000012", option_id: "d1000000-0000-0000-0000-000000000005" },
    { response_id: "e1000000-0000-0000-0000-000000000013", option_id: "d1000000-0000-0000-0000-000000000009" },
    { response_id: "e1000000-0000-0000-0000-000000000014", option_id: "d1000000-0000-0000-0000-000000000015" },
    { response_id: "e1000000-0000-0000-0000-000000000014", option_id: "d1000000-0000-0000-0000-000000000016" },
  ]);

  // 10. Update hearing to active
  await patch("hearing_requests", { id: `eq.${HEARING_ID}` }, { status: "active" });

  console.log("\nDone! Demo data seeded.");
}

main().catch(console.error);
