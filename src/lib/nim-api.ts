import { ParsedEvent, SuggestedSlot, CalendarEvent } from './types';

const NVIDIA_MODEL = 'meta/llama-3.1-70b-instruct';

// Helper to decide endpoint based on env
async function callNIM(messages: any[], maxTokens: number = 512, temperature: number = 0.1) {
  const apiKey = import.meta.env.VITE_NVIDIA_NIM_API_KEY;
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  // In production (non-localhost), or if no client-side API key is bundled, always route via our secure serverless backend proxy
  if (!isLocalhost || !apiKey) {
    try {
      const response = await fetch('/api/nim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: NVIDIA_MODEL,
          messages,
          max_tokens: maxTokens,
          temperature,
        }),
      });

      if (response.ok) {
        return await response.json();
      }
      
      // If serverless proxy returned an error (e.g. 404 on local dev), fall through to direct fallback if key is available
      if (!apiKey) {
        throw new Error(`Serverless proxy failed with status: ${response.status}`);
      }
    } catch (err) {
      console.warn('Serverless proxy (/api/nim) call failed, attempting direct fallback:', err);
      if (!apiKey) {
        throw err;
      }
    }
  }

  // Fallback / Dev Mode: Direct client-side call (only works if local browser security/CORS check is disabled or bypassed)
  console.log('Using direct client-side fallback to Nvidia NIM...');
  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: NVIDIA_MODEL,
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    throw new Error(`Nvidia direct API returned error status: ${response.status}`);
  }

  return response.json();
}

export async function parseEventFromNaturalLanguage(
  userInput: string,
  currentDate: Date
): Promise<ParsedEvent | null> {
  const systemPrompt = `You are a calendar scheduling assistant. 
Parse the user's natural language input and extract event details.
Current date and time: ${currentDate.toISOString()}
Current timezone: Asia/Seoul (KST, UTC+9)

Respond ONLY with a valid JSON object. No markdown, no explanation.
JSON format:
{
  "title": "이벤트 제목",
  "startDate": "YYYY-MM-DDTHH:mm:ss",
  "endDate": "YYYY-MM-DDTHH:mm:ss",
  "isAllDay": false,
  "recurrence": null | "daily" | "weekly" | "monthly" | "yearly",
  "recurrenceEndDate": null | "YYYY-MM-DD",
  "description": "선택적 설명",
  "color": "#cc785c"
}

If you cannot parse a valid event from the input, respond with: {"error": "파싱 불가"}`;

  const data = await callNIM([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userInput },
  ]);

  const text = data.choices[0]?.message?.content ?? '';
  
  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    if (parsed.error) return null;
    return parsed as ParsedEvent;
  } catch {
    return null;
  }
}

export async function findAndScheduleFreeSlot(
  userRequest: string,
  existingEvents: CalendarEvent[],
  searchRange: { start: Date; end: Date }
): Promise<SuggestedSlot[]> {
  const eventsContext = JSON.stringify(
    existingEvents
      .filter(e => {
        const d = new Date(e.startDate);
        return d >= searchRange.start && d <= searchRange.end;
      })
      .map(e => ({ title: e.title, start: e.startDate, end: e.endDate }))
  );

  const systemPrompt = `You are a smart scheduling assistant.
Current date: ${new Date().toISOString()}
Timezone: Asia/Seoul (KST, UTC+9)
Working hours assumption: 09:00–22:00 KST unless user specifies otherwise.

Existing events in the requested period:
${eventsContext}

Find the best available time slots for the user's request.
Respond ONLY with a JSON array. No explanation.
Format:
[
  {
    "startDate": "YYYY-MM-DDTHH:mm:ss",
    "endDate": "YYYY-MM-DDTHH:mm:ss",
    "title": "제안 이벤트 제목",
    "reason": "왜 이 시간이 좋은지 한 문장"
  }
]
Return 2–3 suggestions maximum.`;

  const data = await callNIM([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userRequest },
  ], 1024, 0.2);

  const text = data.choices[0]?.message?.content ?? '';
  
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return [];
  }
}
