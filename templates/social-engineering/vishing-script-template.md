# 📞 Vishing Simulation Script

## Scenario: {{scenario_name}}

**Type:** Voice Phishing (Vishing)
**Difficulty:** {{difficulty}}
**Objective:** {{objective}}

---

## 🎯 Target Information

| Field | Value |
|-------|-------|
| Target Name | {{target_name}} |
| Department | {{department}} |
| Role | {{role}} |
| Phone | {{phone}} |

---

## 📜 Call Script

### Phase 1: Introduction

```
[CALLER ID SPOOFED TO: {{spoofed_number}}]

Operator: "Hello, this is {{fake_name}} from {{impersonated_dept}}. 
          Am I speaking with {{target_name}}?"

[WAIT FOR CONFIRMATION]

"Great! I'm calling because {{initial_pretext}}."
```

### Phase 2: Build Trust

```
Operator: "I can see here that you're in the {{department}} department, 
          is that correct?"

[USE OSINT INFORMATION TO BUILD CREDIBILITY]

"And you've been with the company since {{start_year}}, right? 
I just want to make sure I'm speaking with the right person."
```

### Phase 3: Create Urgency

```
Operator: "The reason I'm calling is {{urgency_reason}}.

We need to resolve this within the next {{time_pressure}} or 
{{consequence}}.

I know this is unexpected, but {{justification}}."
```

### Phase 4: Information Request

```
Operator: "To proceed, I'll need to verify your identity. 
          Can you confirm {{requested_info}}?"

[IF TARGET HESITATES]

"I completely understand your caution - that's actually exactly 
what we train people to do! Let me give you our ticket number: 
{{fake_ticket}}. 

You can call us back at {{callback_number}} to verify this is 
legitimate. But just so you know, we need to resolve this by 
{{deadline}} or {{consequence}}."
```

### Phase 5: Alternative Approaches

```
[IF DIRECT REQUEST FAILS, TRY ALTERNATIVE]

Option A - Email Verification:
"If you're more comfortable, I can send you a verification email. 
Can you confirm your email address so I can send the secure link?"

Option B - Manager Escalation:
"I understand. Would you like me to have your manager {{manager_name}} 
verify this request? Though that might delay the resolution..."

Option C - Partial Information:
"Okay, I don't need your full password. Just to verify, 
can you tell me the first and last characters? That's enough 
for our system to confirm."
```

### Phase 6: Call Conclusion

```
[IF SUCCESSFUL]
Operator: "Thank you for your cooperation. I've updated your 
          account and you should be all set. Is there anything 
          else I can help you with today?"

[IF UNSUCCESSFUL - TARGET REFUSES]
Operator: "I understand your concern. That's actually good security 
          awareness! You can resolve this by {{legitimate_action}}. 
          Have a great day."

[SIMULATION REVEAL - IF REQUIRED]
Operator: "{{target_name}}, I need to let you know this was actually 
          a security awareness test conducted by {{company}} IT Security. 
          {{reveal_script}}"
```

---

## 🚩 Red Flags (For Training)

Trainees should identify these warning signs:

### Trust Indicators to Question
- [ ] Caller claims to be from internal IT/HR/Security
- [ ] Caller has some accurate information (could be from OSINT)
- [ ] Professional tone and demeanor
- [ ] Provides ticket number or reference ID

### Urgency Tactics Used
- [ ] Time pressure ("within the next 30 minutes")
- [ ] Threat of consequence ("account will be locked")
- [ ] Appeal to authority ("your manager requested this")
- [ ] Creating fear ("security breach detected")

### Information Requests to Refuse
- [ ] Password or PIN
- [ ] MFA/2FA codes
- [ ] Account numbers
- [ ] Personal identifying information
- [ ] Internal system details

---

## ✅ Correct Response

What the target SHOULD do:

1. **Do NOT provide any sensitive information**
2. **Ask for caller's name and department**
3. **Hang up and call back using official IT number**
4. **Report the call to security team**
5. **Do not use any callback number provided by caller**

### Correct Response Script

```
Target: "I appreciate you calling, but for security reasons, 
        I can't verify any information over the phone. 
        
        Can you give me your name and extension? I'll call 
        the IT help desk directly to verify this request.
        
        What's the ticket number so I can reference it when I call back?"

[HANG UP AND CALL OFFICIAL NUMBER]
```

---

## 📊 Scoring Criteria

| Behavior | Points | Result |
|----------|--------|--------|
| Refused to provide password | +20 | ✅ Pass |
| Asked for caller verification | +15 | ✅ Pass |
| Hung up and called official number | +20 | ✅ Pass |
| Reported to security | +15 | ✅ Pass |
| Provided partial information | -10 | ⚠️ Partial Fail |
| Provided full credentials | -30 | ❌ Fail |
| Provided MFA code | -30 | ❌ Critical Fail |

**Passing Score:** 50+ points

---

## 📚 Training Content

### Why Vishing Works

1. **Voice creates trust** - Harder to be skeptical verbally
2. **Real-time pressure** - No time to think or verify
3. **Authority exploitation** - Impersonating IT, executives
4. **Information availability** - OSINT makes pretexting easier

### Defense Strategies

1. **Verify independently** - Always call back using known numbers
2. **Never share credentials** - IT will never ask for passwords
3. **Take your time** - Legitimate requests can wait
4. **Report suspicious calls** - Even if you're unsure
5. **Trust your instincts** - If it feels wrong, it probably is

### What Attackers Know About You

From public sources, attackers can often find:
- Your name and job title (LinkedIn)
- Your department and manager (Company website)
- Your email format (Hunter.io)
- Your interests and activities (Social media)
- Company events and news (Press releases)

---

## 📋 Post-Call Actions

### If Target Passed
- [ ] Commend security awareness
- [ ] Share best practices reinforcement
- [ ] Record as positive result

### If Target Failed
- [ ] Immediate password reset required
- [ ] MFA reset if code was shared
- [ ] Schedule targeted training within 48 hours
- [ ] Manager notification
- [ ] Document in security awareness metrics

---

*Template generated by AI Code Studio Security Training Platform*
*For authorized security awareness training only*
