"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardFooter,
  cn,
} from "@repo/ui";
import { createBrowserClient } from "@/lib/supabase/client";
import { Check, Plus, Trash2 } from "lucide-react";

// --- Types ---

interface TodoStep {
  id: string;
  content: string;
}

interface SurveyQuestion {
  id: string;
  question: string;
  type: "text" | "radio" | "checkbox";
  options: string[]; // used for radio/checkbox
}

interface FormData {
  // Step 1
  title: string;
  estimatedDuration: string;
  preparations: string[];
  todos: TodoStep[];
  productUrl: string;
  // Step 2
  personaAgeMin: string;
  personaAgeMax: string;
  personaGender: string;
  personaOccupation: string;
  personaDetails: string;
  preSurveyQuestions: SurveyQuestion[];
  // Step 3
  feedbackQuestions: SurveyQuestion[];
  // Step 4
  rewardPerUser: string;
  totalBudgetCap: string;
}

const STEPS = [
  { label: "Interview Settings", description: "Duration, preparation, and tasks" },
  { label: "Persona & Survey", description: "Target users and pre-survey" },
  { label: "Feedback Questions", description: "Post-task interview questions" },
  { label: "Deposit Settings", description: "Reward and budget" },
];

// --- Helpers ---

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

const textareaClass =
  "flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

// --- Step Progress Bar ---

function StepBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center flex-1">
          <div className="flex items-center gap-2 flex-1">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0",
                i < current
                  ? "bg-primary text-primary-foreground"
                  : i === current
                    ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {i < current ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            {i < total - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1",
                  i < current ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Survey Question Editor (shared by Step 2 and 3) ---

function SurveyQuestionEditor({
  questions,
  onChange,
  label,
}: {
  questions: SurveyQuestion[];
  onChange: (questions: SurveyQuestion[]) => void;
  label: string;
}) {
  function addQuestion() {
    onChange([
      ...questions,
      { id: generateId(), question: "", type: "text", options: [] },
    ]);
  }

  function removeQuestion(id: string) {
    onChange(questions.filter((q) => q.id !== id));
  }

  function updateQuestion(id: string, updates: Partial<SurveyQuestion>) {
    onChange(
      questions.map((q) => {
        if (q.id !== id) return q;
        const updated = { ...q, ...updates };
        // Reset options when switching to text
        if (updates.type === "text") updated.options = [];
        // Add default option when switching to radio/checkbox
        if (
          (updates.type === "radio" || updates.type === "checkbox") &&
          q.type === "text"
        )
          updated.options = [""];
        return updated;
      })
    );
  }

  function addOption(questionId: string) {
    onChange(
      questions.map((q) =>
        q.id === questionId ? { ...q, options: [...q.options, ""] } : q
      )
    );
  }

  function updateOption(questionId: string, optIndex: number, value: string) {
    onChange(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((o, i) => (i === optIndex ? value : o)),
            }
          : q
      )
    );
  }

  function removeOption(questionId: string, optIndex: number) {
    onChange(
      questions.map((q) =>
        q.id === questionId
          ? { ...q, options: q.options.filter((_, i) => i !== optIndex) }
          : q
      )
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">{label}</Label>
        <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
          <Plus className="h-4 w-4 mr-1" />
          Add Question
        </Button>
      </div>
      {questions.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No questions added yet. Click &quot;Add Question&quot; to create one.
        </p>
      )}
      {questions.map((q, idx) => (
        <div
          key={q.id}
          className="border rounded-lg p-4 space-y-3 bg-muted/30"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Question {idx + 1}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeQuestion(q.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          <Input
            placeholder="Enter your question"
            value={q.question}
            onChange={(e) =>
              updateQuestion(q.id, { question: e.target.value })
            }
          />
          <div className="flex items-center gap-4">
            <Label className="text-sm">Answer Format:</Label>
            <select
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              value={q.type}
              onChange={(e) =>
                updateQuestion(q.id, {
                  type: e.target.value as SurveyQuestion["type"],
                })
              }
            >
              <option value="text">Free Text</option>
              <option value="radio">Single Select (Radio)</option>
              <option value="checkbox">Multi Select (Checkbox)</option>
            </select>
          </div>
          {(q.type === "radio" || q.type === "checkbox") && (
            <div className="space-y-2 pl-4">
              <Label className="text-sm">Options:</Label>
              {q.options.map((opt, optIdx) => (
                <div key={optIdx} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4">
                    {optIdx + 1}.
                  </span>
                  <Input
                    className="flex-1"
                    placeholder={`Option ${optIdx + 1}`}
                    value={opt}
                    onChange={(e) =>
                      updateOption(q.id, optIdx, e.target.value)
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(q.id, optIdx)}
                    disabled={q.options.length <= 1}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => addOption(q.id)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Option
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// --- Main Page ---

export default function NewHearingPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    estimatedDuration: "",
    preparations: [""],
    todos: [{ id: generateId(), content: "" }],
    productUrl: "",
    personaAgeMin: "",
    personaAgeMax: "",
    personaGender: "",
    personaOccupation: "",
    personaDetails: "",
    preSurveyQuestions: [],
    feedbackQuestions: [],
    rewardPerUser: "",
    totalBudgetCap: "",
  });

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  // --- Preparations ---
  function addPreparation() {
    updateField("preparations", [...formData.preparations, ""]);
  }
  function updatePreparation(index: number, value: string) {
    updateField(
      "preparations",
      formData.preparations.map((p, i) => (i === index ? value : p))
    );
  }
  function removePreparation(index: number) {
    updateField(
      "preparations",
      formData.preparations.filter((_, i) => i !== index)
    );
  }

  // --- Todos ---
  function addTodo() {
    updateField("todos", [
      ...formData.todos,
      { id: generateId(), content: "" },
    ]);
  }
  function updateTodo(id: string, content: string) {
    updateField(
      "todos",
      formData.todos.map((t) => (t.id === id ? { ...t, content } : t))
    );
  }
  function removeTodo(id: string) {
    updateField(
      "todos",
      formData.todos.filter((t) => t.id !== id)
    );
  }

  // --- Navigation ---
  function goNext() {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
      setError(null);
    }
  }
  function goBack() {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
      setError(null);
    }
  }

  // --- Submit ---
  async function handleSubmit() {
    setLoading(true);
    setError(null);

    const supabase = createBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Login required");
      setLoading(false);
      return;
    }

    const { data: companyMemberData } = await (
      supabase.from("company_members") as ReturnType<typeof supabase.from>
    )
      .select("company_id")
      .eq("user_id", user.id)
      .single();

    const companyMember = companyMemberData as { company_id: string } | null;
    if (!companyMember) {
      setError("Company information not found");
      setLoading(false);
      return;
    }

    try {
      // 1. Create hearing_request
      const { data: hearingData, error: insertError } = await (
        supabase.from("hearing_requests") as ReturnType<typeof supabase.from>
      )
        .insert({
          company_id: companyMember.company_id,
          project_id: projectId,
          title: formData.title || `Interview - ${new Date().toLocaleDateString()}`,
          target_url: formData.productUrl,
          estimated_duration: Number(formData.estimatedDuration) || null,
          reward_per_user: Number(formData.rewardPerUser) || 0,
          total_budget_cap: Number(formData.totalBudgetCap) || 0,
          status: "draft",
        } as never)
        .select("id")
        .single();

      if (insertError) throw insertError;
      const hearing = hearingData as { id: string };
      const hearingId = hearing.id;

      // 2. Insert preparations
      const preps = formData.preparations.filter(Boolean);
      if (preps.length > 0) {
        const { error: prepError } = await (
          supabase.from("interview_preparations") as ReturnType<typeof supabase.from>
        ).insert(
          preps.map((content, i) => ({
            hearing_request_id: hearingId,
            sort_order: i,
            content,
          })) as never
        );
        if (prepError) throw prepError;
      }

      // 3. Insert todos
      const todos = formData.todos.filter((t) => t.content);
      if (todos.length > 0) {
        const { error: todoError } = await (
          supabase.from("interview_todos") as ReturnType<typeof supabase.from>
        ).insert(
          todos.map((t, i) => ({
            hearing_request_id: hearingId,
            sort_order: i,
            content: t.content,
          })) as never
        );
        if (todoError) throw todoError;
      }

      // 4. Insert persona
      if (
        formData.personaAgeMin ||
        formData.personaAgeMax ||
        formData.personaGender ||
        formData.personaOccupation ||
        formData.personaDetails
      ) {
        const { error: personaError } = await (
          supabase.from("interview_personas") as ReturnType<typeof supabase.from>
        ).insert({
          hearing_request_id: hearingId,
          age_min: Number(formData.personaAgeMin) || null,
          age_max: Number(formData.personaAgeMax) || null,
          gender: formData.personaGender || null,
          occupation: formData.personaOccupation || null,
          details: formData.personaDetails || null,
        } as never);
        if (personaError) throw personaError;
      }

      // 5. Insert survey questions (pre-survey + feedback)
      const allQuestions = [
        ...formData.preSurveyQuestions.map((q, i) => ({
          ...q,
          phase: "pre_survey" as const,
          sort_order: i,
        })),
        ...formData.feedbackQuestions.map((q, i) => ({
          ...q,
          phase: "feedback" as const,
          sort_order: i,
        })),
      ].filter((q) => q.question);

      for (const q of allQuestions) {
        const { data: questionData, error: qError } = await (
          supabase.from("survey_questions") as ReturnType<typeof supabase.from>
        )
          .insert({
            hearing_request_id: hearingId,
            phase: q.phase,
            sort_order: q.sort_order,
            question: q.question,
            question_type: q.type,
          } as never)
          .select("id")
          .single();

        if (qError) throw qError;
        const savedQuestion = questionData as { id: string };

        // Insert options for radio/checkbox
        if (
          (q.type === "radio" || q.type === "checkbox") &&
          q.options.length > 0
        ) {
          const opts = q.options.filter(Boolean);
          if (opts.length > 0) {
            const { error: optError } = await (
              supabase.from("survey_question_options") as ReturnType<typeof supabase.from>
            ).insert(
              opts.map((label, i) => ({
                question_id: savedQuestion.id,
                sort_order: i,
                label,
              })) as never
            );
            if (optError) throw optError;
          }
        }
      }

      router.push(`/projects/${projectId}/hearings`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setLoading(false);
    }
  }

  // --- Fee calculation ---
  const rewardNum = Number(formData.rewardPerUser) || 0;
  const totalCapNum = Number(formData.totalBudgetCap) || 0;
  const feeRate = 0.25;
  const feePerUser = Math.ceil(rewardNum * feeRate);
  const costPerUser = rewardNum + feePerUser;
  const maxUsers = totalCapNum > 0 ? Math.floor(totalCapNum / costPerUser) || 0 : 0;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Step labels (mobile-friendly) */}
      <div className="mb-2">
        <h2 className="text-lg font-semibold">{STEPS[currentStep]!.label}</h2>
        <p className="text-sm text-muted-foreground">
          {STEPS[currentStep]!.description}
        </p>
      </div>

      <StepBar current={currentStep} total={STEPS.length} />

      <Card>
        <CardContent className="pt-6 space-y-6">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          {/* ===== STEP 1: Interview Settings ===== */}
          {currentStep === 0 && (
            <>
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Interview Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., New Feature Usability Test"
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  required
                />
              </div>

              {/* Estimated Duration */}
              <div className="space-y-2">
                <Label htmlFor="estimatedDuration">Estimated Duration (minutes)</Label>
                <Input
                  id="estimatedDuration"
                  type="number"
                  min="1"
                  placeholder="e.g., 30"
                  value={formData.estimatedDuration}
                  onChange={(e) =>
                    updateField("estimatedDuration", e.target.value)
                  }
                />
              </div>

              {/* Product URL */}
              <div className="space-y-2">
                <Label htmlFor="productUrl">Product URL</Label>
                <Input
                  id="productUrl"
                  type="url"
                  placeholder="https://your-product.com"
                  value={formData.productUrl}
                  onChange={(e) => updateField("productUrl", e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  URL of the product users will test
                </p>
              </div>

              {/* Preparations */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">
                    Preparation for Users
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPreparation}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Things users should do before the interview (e.g., create an
                  account, complete onboarding)
                </p>
                {formData.preparations.map((prep, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-4">
                      {i + 1}.
                    </span>
                    <Input
                      className="flex-1"
                      placeholder={`Preparation step ${i + 1}`}
                      value={prep}
                      onChange={(e) => updatePreparation(i, e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePreparation(i)}
                      disabled={formData.preparations.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* To-Do Steps */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">
                    User To-Do (Tasks)
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTodo}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Step
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Tasks you want users to perform during the test, in order
                </p>
                {formData.todos.map((todo, i) => (
                  <div key={todo.id} className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground w-12">
                      Step {i + 1}
                    </span>
                    <Input
                      className="flex-1"
                      placeholder={`e.g., Create a new project and add a member`}
                      value={todo.content}
                      onChange={(e) => updateTodo(todo.id, e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTodo(todo.id)}
                      disabled={formData.todos.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ===== STEP 2: Persona & Pre-Survey ===== */}
          {currentStep === 1 && (
            <>
              <div className="space-y-4">
                <Label className="text-base font-semibold">Persona Settings</Label>
                <p className="text-sm text-muted-foreground">
                  Define the target user profile for this interview
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="personaAgeMin">Age (Min)</Label>
                    <Input
                      id="personaAgeMin"
                      type="number"
                      min="0"
                      placeholder="e.g., 20"
                      value={formData.personaAgeMin}
                      onChange={(e) =>
                        updateField("personaAgeMin", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="personaAgeMax">Age (Max)</Label>
                    <Input
                      id="personaAgeMax"
                      type="number"
                      min="0"
                      placeholder="e.g., 40"
                      value={formData.personaAgeMax}
                      onChange={(e) =>
                        updateField("personaAgeMax", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="personaGender">Gender</Label>
                    <select
                      id="personaGender"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={formData.personaGender}
                      onChange={(e) =>
                        updateField("personaGender", e.target.value)
                      }
                    >
                      <option value="">No preference</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="personaOccupation">Occupation</Label>
                    <Input
                      id="personaOccupation"
                      placeholder="e.g., Engineer, Designer"
                      value={formData.personaOccupation}
                      onChange={(e) =>
                        updateField("personaOccupation", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="personaDetails">Additional Details</Label>
                  <textarea
                    id="personaDetails"
                    className={textareaClass}
                    placeholder="Any other persona details (e.g., experience level, industry, usage habits)"
                    value={formData.personaDetails}
                    onChange={(e) =>
                      updateField("personaDetails", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <SurveyQuestionEditor
                  label="Pre-Interview Survey (Optional)"
                  questions={formData.preSurveyQuestions}
                  onChange={(q) => updateField("preSurveyQuestions", q)}
                />
              </div>
            </>
          )}

          {/* ===== STEP 3: Feedback Questions ===== */}
          {currentStep === 2 && (
            <>
              <p className="text-sm text-muted-foreground">
                These questions will be shown to users after they complete the
                tasks. Use them to gather feedback about the product experience.
              </p>
              <SurveyQuestionEditor
                label="Feedback Questions"
                questions={formData.feedbackQuestions}
                onChange={(q) => updateField("feedbackQuestions", q)}
              />
            </>
          )}

          {/* ===== STEP 4: Deposit Settings ===== */}
          {currentStep === 3 && (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rewardPerUser">Reward per User (JPY)</Label>
                  <Input
                    id="rewardPerUser"
                    type="number"
                    min="0"
                    placeholder="e.g., 3000"
                    value={formData.rewardPerUser}
                    onChange={(e) =>
                      updateField("rewardPerUser", e.target.value)
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    Amount paid to each user who completes the interview
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalBudgetCap">
                    Total Budget Cap (JPY)
                  </Label>
                  <Input
                    id="totalBudgetCap"
                    type="number"
                    min="0"
                    placeholder="e.g., 100000"
                    value={formData.totalBudgetCap}
                    onChange={(e) =>
                      updateField("totalBudgetCap", e.target.value)
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    Maximum total amount you are willing to spend
                  </p>
                </div>
              </div>

              {/* Cost Breakdown */}
              {rewardNum > 0 && (
                <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
                  <h4 className="font-semibold text-sm">Cost Breakdown</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-muted-foreground">
                      Reward per user
                    </span>
                    <span className="text-right">
                      {rewardNum.toLocaleString()} JPY
                    </span>

                    <span className="text-muted-foreground">
                      Service fee (25%)
                    </span>
                    <span className="text-right">
                      {feePerUser.toLocaleString()} JPY
                    </span>

                    <span className="font-medium border-t pt-1">
                      Cost per user
                    </span>
                    <span className="text-right font-medium border-t pt-1">
                      {costPerUser.toLocaleString()} JPY
                    </span>

                    {totalCapNum > 0 && (
                      <>
                        <span className="text-muted-foreground">
                          Total budget cap
                        </span>
                        <span className="text-right">
                          {totalCapNum.toLocaleString()} JPY
                        </span>

                        <span className="text-muted-foreground">
                          Estimated max users
                        </span>
                        <span className="text-right font-medium">
                          {maxUsers} users
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>

        <CardFooter className="flex justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 0 ? () => router.back() : goBack}
          >
            {currentStep === 0 ? "Cancel" : "Back"}
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button type="button" onClick={goNext}>
              Next
            </Button>
          ) : (
            <Button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? "Creating..." : "Create Interview"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
