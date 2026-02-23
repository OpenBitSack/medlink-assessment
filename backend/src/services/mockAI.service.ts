const INTERVIEW_QUESTIONS: { question: string; follow_up?: string }[] = [
  {
    question:
      "Hello, I'm glad you're here today. Before we begin, I want you to know that this is a safe space, and everything you share stays confidential. How are you feeling right now, in this moment?",
    follow_up: "Thank you for sharing that. It's okay to feel however you're feeling.",
  },
  {
    question:
      "Can you tell me a little about what brought you here today? What's been on your mind lately?",
  },
  {
    question:
      "How have you been sleeping recently? Have there been any changes in your sleep patterns over the past few weeks?",
  },
  {
    question:
      "I'd like to understand your daily routine a bit. How has your energy level been? Are you finding it easy or difficult to get through the day?",
  },
  {
    question:
      "Have you noticed any changes in your appetite or eating habits recently?",
  },
  {
    question:
      "How would you describe your mood over the past two weeks? Has it been mostly up, down, or fluctuating?",
  },
  {
    question:
      "Are there things you used to enjoy that you've lost interest in? Can you tell me about those?",
  },
  {
    question:
      "How are your relationships going — with family, friends, or anyone close to you? Do you feel supported?",
  },
  {
    question:
      "Have you been experiencing any feelings of anxiety or worry? If so, can you describe what triggers those feelings?",
  },
  {
    question:
      "Sometimes when people are going through a difficult time, they may have thoughts of hurting themselves. Have you had any thoughts like that?",
    follow_up:
      "Thank you for being honest with me. That takes courage. I want to make sure you have support.",
  },
  {
    question:
      "Are you currently taking any medications, supplements, or substances? This includes anything prescribed or over-the-counter.",
  },
  {
    question:
      "Have you ever spoken with a mental health professional before? If so, can you tell me a bit about that experience?",
  },
  {
    question:
      "What does a good day look like for you? What would need to change for you to have more good days?",
  },
  {
    question:
      "Is there anything else you'd like to share with me today? Anything we haven't covered that feels important to you?",
  },
  {
    question:
      "Thank you so much for sharing all of this with me. You've been very open, and I appreciate your trust. A licensed clinician will review our conversation and follow up with you. Is there anything you'd like to ask before we wrap up?",
  },
];

export function getQuestion(index: number): { question: string; follow_up?: string } | null {
  if (index < 0 || index >= INTERVIEW_QUESTIONS.length) {
    return null;
  }
  return INTERVIEW_QUESTIONS[index];
}

export function getTotalQuestions(): number {
  return INTERVIEW_QUESTIONS.length;
}

export function generateThinkingDelay(): number {
  return Math.floor(Math.random() * 1700) + 800;
}

export function generateEmpathyResponse(patientMessage: string): string | null {
  const lowerMsg = patientMessage.toLowerCase();

  const crisisKeywords = [
    "don't want to be alive",
    "kill myself",
    "end it all",
    "suicide",
    "not worth living",
    "better off dead",
    "want to die",
  ];

  if (crisisKeywords.some((kw) => lowerMsg.includes(kw))) {
    return "I hear you, and I'm really glad you told me that. What you're feeling matters, and you deserve support right now. I want to make sure you're safe. If you're in immediate danger, please call 988 — that's the Suicide and Crisis Lifeline — or text HOME to 741741 to reach a crisis counselor. You're not alone in this.";
  }

  const distressKeywords = [
    "hopeless",
    "can't take it",
    "overwhelmed",
    "breaking down",
    "falling apart",
    "no point",
    "exhausted",
    "numb",
  ];

  if (distressKeywords.some((kw) => lowerMsg.includes(kw))) {
    return "I can hear that you're going through something really difficult right now. Thank you for trusting me with that. Take all the time you need.";
  }

  return null;
}

export function getComfortMessage(): string {
  const messages = [
    "Take your time. There's no rush here.",
    "I'm here with you. Whenever you're ready.",
    "It's okay to pause. This is your space.",
    "I'm listening whenever you'd like to continue.",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}
