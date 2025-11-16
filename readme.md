# 🦵 **Kneez App – Functional Specification (MVP)**

## 📌 Purpose
Kneez is a mobile app that provides **immediate pain relief for knee pain** using **voice/text interaction, anatomical diagrams, and personalized movement correction tips**. It uses conversational AI and NLP to triage symptoms and deliver biomechanical interventions.

---

## 1. 🧭 **Core User Flow**

### 1.1 Initial Interaction
- App opens with prompt: “Hi, what’s bothering you?”
- Users long-press **voice button** or toggle to **text input** to describe:
  - Symptom
  - Pain trigger (e.g., squatting, stairs)
  - Additional context (optional)

### 1.2 Pain Location Selection
- User interacts with **3D knee diagram**:
  - Two knees shown (left + right), clearly labeled
  - Users **rotate** the model freely (pan/drag)
  - Users can **tap one area per knee**, maximum 2 total
- App asks for **confirmation** of tapped area using **layman terms**
  - e.g., “You tapped the inside of your right knee, slightly below the kneecap. Is this where you feel your pain?”

### 1.3 Movement Tip Delivery
- If sufficient info is available:
  - App delivers a **captioned video** + **audio instructions** (unless muted)
  - Tips are selected via semantic matching: `pain location` + `activity trigger`
- If info is **insufficient**:
  - App dynamically asks for missing fields (pain type, duration, etc.)
- After tip is shown:
  - User is polled: “How do your knees feel now?”
  - Options: 😁 / 🙂 / 😐 / 🙁 / 😢 (smiley face feedback scale)

### 1.4 Iteration & Escalation
- If 😁 or 🙂:
  - Show success message and advice on how to integrate the tip in daily movement
  - Inform the user that **strengthening/stretching features** are coming soon
- If 😐, 🙁, or 😢:
  - Offer a second tip or ask for more symptom data
  - After 3 failed attempts:
    - App apologizes
    - Collects a full case (all fields)
    - Tells user a human review will occur

---

## 2. 🧠 NLP & Data Extraction Pipeline

### 2.1 Required Fields (every case)
- **Pain Location** (via tap + text)
- **Triggering Activity** (e.g., squatting)
- **Laterality** (left, right, both)

### 2.2 Optional Fields (asked when needed)
- Pain type (sharp, dull, burning…)
- Pain severity (inferred from emoji feedback or asked directly)
- Duration
- Context (e.g., “after tennis”)

App will prompt user for more details if confidence is low or no tip match is found.

---

## 3. 🎯 Movement Tip Matching

### Matching Logic:
- **Exact Match Priority:** Pain location + activity trigger
- **Fallback:** Closest match (based on similarity scores)
- **Last resort:** General tip for that activity

### Always followed by:
- Poll asking: Did this help? (emoji rating)
- Results used to train feedback model (build success rate data)

---

## 4. 🗂️ Case Management

### Each session is stored as a **structured case**:
```json
{
  "case_id": "CASE00123",
  "user_id": "USER048",
  "input_symptoms": "My knee hurts when I walk downstairs",
  "pain_location": "inferior patella",
  "trigger": "stairs down",
  "laterality": "right",
  "movement_tips_shown": [
    {
      "tip_id": "TIP0012",
      "user_feedback": "neutral"
    }
  ],
  "status": "resolved",
  "timestamp": "2025-04-28T18:00:00Z"
}
```

### Features:
- Stored under user profile
- Viewable in **read-only session history**
- Sharable via link (read-only web view; future version only)

---

## 5. 🧩 Movement Tip Schema

Each tip includes:
```json
{
  "id": "TIP0012",
  "anatomical_targets": ["patellar tendon"],
  "triggering_activities": ["squatting"],
  "tip_content": {
    "video_url": "...",
    "caption_text": "...",
    "audio_script": "..."
  },
  "contraindications": ["Not for meniscal tears"],
  "feedback_log": [
    {
      "case_id": "CASE034",
      "outcome": "positive",
      "user_rating": ":)"
    }
  ]
}
```

---

## 6. 📲 User Interface

### Home Screen
- Heading: “Hi, what’s bothering you?”
- Voice button (long-press to record)
- Keyboard toggle (doubles as mute button)
- 3D Knee model (rotate + tap)

### Tip Display
- Video with captions
- Audio instruction unless muted
- Emoji-based feedback poll

### History Screen
- List of past cases (summary view)
- Tap to view full case (read-only)

---

## 7. 🔐 Data Handling & Learning
- User data is stored securely (e.g., Firebase, Supabase)
- Emoji feedback & tip outcomes are stored to train future tip rankings
- NLP fields stored as structured JSON per case
- User data anonymized for research/model improvement

---

## 8. ❌ Out-of-Scope (MVP)
- Strengthening/stretching programs (planned for later)
- PDF reports / live dashboards for doctors
- User-generated notes or journaling
- Multi-language support

---
