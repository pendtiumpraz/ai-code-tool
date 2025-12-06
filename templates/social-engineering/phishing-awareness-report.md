# 📧 Phishing Simulation Report

## Campaign Overview

| Property | Value |
|----------|-------|
| **Campaign Name** | {{campaign_name}} |
| **Type** | {{campaign_type}} |
| **Duration** | {{start_date}} - {{end_date}} |
| **Total Targets** | {{total_targets}} |
| **Template Used** | {{template_name}} |

---

## 📊 Executive Summary

### Key Metrics

| Metric | Count | Rate | Benchmark |
|--------|-------|------|-----------|
| Emails Sent | {{sent}} | 100% | - |
| Emails Delivered | {{delivered}} | {{delivery_rate}}% | >95% |
| Emails Opened | {{opened}} | {{open_rate}}% | Industry: 30% |
| Links Clicked | {{clicked}} | {{click_rate}}% | Target: <10% |
| Data Submitted | {{submitted}} | {{submit_rate}}% | Target: <5% |
| Reported as Phishing | {{reported}} | {{report_rate}}% | Target: >30% |

### Risk Assessment

```
Overall Risk Level: {{risk_level}}

Risk Score Breakdown:
├── Click Rate Risk:    {{click_risk}} ({{click_rate}}% clicked)
├── Submit Rate Risk:   {{submit_risk}} ({{submit_rate}}% submitted credentials)
├── Report Rate:        {{report_risk}} ({{report_rate}}% reported - {{report_assessment}})
└── Time to Click:      {{time_risk}} (Avg: {{avg_time_to_click}} minutes)
```

---

## 📈 Detailed Results

### Engagement Timeline

```
Hour 0-1:   ████████████░░░░░░░░ 45% of clicks
Hour 1-2:   ██████░░░░░░░░░░░░░░ 25% of clicks
Hour 2-4:   ████░░░░░░░░░░░░░░░░ 15% of clicks
Hour 4-8:   ██░░░░░░░░░░░░░░░░░░ 10% of clicks
Hour 8+:    █░░░░░░░░░░░░░░░░░░░ 5% of clicks
```

**Key Finding:** {{early_click_finding}}

### Department Breakdown

| Department | Targets | Clicked | Click Rate | Risk Level |
|------------|---------|---------|------------|------------|
{{#departments}}
| {{name}} | {{targets}} | {{clicked}} | {{click_rate}}% | {{risk_level}} |
{{/departments}}

### High-Risk Users

The following users submitted credentials and require immediate follow-up:

{{#high_risk_users}}
| {{name}} | {{email}} | {{department}} | Action Required |
{{/high_risk_users}}

---

## 🚩 Red Flags in This Campaign

Users should have identified these warning signs:

{{#red_flags}}
1. **{{title}}**: {{description}}
{{/red_flags}}

### Visual Red Flag Analysis

```
Email Header:
┌─────────────────────────────────────────────────────────────┐
│ From: {{sender_name}} <{{sender_email}}>                    │
│       ⚠️ Domain is "{{fake_domain}}" not "{{real_domain}}" │
├─────────────────────────────────────────────────────────────┤
│ Subject: {{subject}}                                        │
│          ⚠️ Creates urgency with "{{urgency_word}}"        │
└─────────────────────────────────────────────────────────────┘

Link Analysis:
┌─────────────────────────────────────────────────────────────┐
│ Display: "{{display_link}}"                                 │
│ Actual:  "{{actual_link}}"                                  │
│          ⚠️ URL mismatch - phishing indicator!             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📚 Educational Content

### How to Identify Phishing Emails

#### 1. Check the Sender
- Hover over the sender's name to see the actual email address
- Look for misspellings: `micros0ft.com`, `arnazon.com`, `paypa1.com`
- Be suspicious of public email domains for business communications

#### 2. Analyze the Content
- **Urgency**: "Act now!", "Immediate action required"
- **Fear**: "Your account will be suspended"
- **Greed**: "You've won!", "Claim your prize"
- **Authority**: Impersonating executives or IT

#### 3. Inspect Links Before Clicking
- Hover over links to see the actual URL
- Look for HTTPS and correct domain spelling
- When in doubt, go directly to the website

#### 4. Verify Requests
- Don't provide sensitive info via email
- Call the sender using a known number
- Use official company channels

### What to Do If You Click a Phishing Link

1. **Don't panic** - quick action can minimize damage
2. **Disconnect** from the network if you downloaded anything
3. **Change passwords** immediately, especially if you entered credentials
4. **Report** to IT Security immediately
5. **Monitor** accounts for suspicious activity

---

## ✅ Recommendations

### Immediate Actions (24-48 hours)

1. **Password Reset Required**
   - All users who submitted credentials must reset passwords
   - Enable MFA if not already active
   
2. **Targeted Training**
   - Schedule 1:1 training for users who submitted data
   - Department-wide training for groups with >25% click rate

### Short-term (1-2 weeks)

3. **Security Awareness Session**
   - Conduct live training reviewing this campaign
   - Share anonymized results with all employees
   
4. **Policy Review**
   - Review email security policies
   - Update reporting procedures if needed

### Long-term (1-3 months)

5. **Follow-up Simulation**
   - Schedule another phishing test in 30 days
   - Use different template/technique
   
6. **Technical Controls**
   - Review email filtering rules
   - Consider additional security tools

---

## 📋 Action Items

| Priority | Action | Owner | Due Date | Status |
|----------|--------|-------|----------|--------|
| P1 | Reset passwords for compromised users | IT Security | {{today}} | ⬜ |
| P1 | Notify high-risk users of simulation | HR/Security | {{today}} | ⬜ |
| P2 | Schedule targeted training | Training Team | {{week_1}} | ⬜ |
| P2 | Review email filtering rules | IT | {{week_1}} | ⬜ |
| P3 | Plan follow-up simulation | Security | {{month_1}} | ⬜ |
| P3 | Update security awareness materials | Training | {{month_1}} | ⬜ |

---

## 📎 Appendix

### A. Campaign Configuration

```json
{
  "campaign_id": "{{campaign_id}}",
  "template": "{{template_id}}",
  "tracking": {
    "email_opens": true,
    "link_clicks": true,
    "credential_capture": true,
    "geo_location": false
  },
  "landing_page": "{{landing_page_url}}",
  "capture_fields": ["email", "password"]
}
```

### B. Sample Phishing Email

```
From: {{sender_name}} <{{sender_email}}>
To: [Target]
Subject: {{subject}}

{{email_preview}}
```

### C. Comparison with Previous Campaigns

| Campaign | Date | Click Rate | Submit Rate | Report Rate |
|----------|------|------------|-------------|-------------|
{{#previous_campaigns}}
| {{name}} | {{date}} | {{click_rate}}% | {{submit_rate}}% | {{report_rate}}% |
{{/previous_campaigns}}

### D. Industry Benchmarks

| Metric | Our Org | Industry Average | Best in Class |
|--------|---------|------------------|---------------|
| Click Rate | {{click_rate}}% | 18% | <5% |
| Submit Rate | {{submit_rate}}% | 8% | <2% |
| Report Rate | {{report_rate}}% | 15% | >50% |

---

*Report generated by AI Code Studio Security Training Platform*
*Classification: Internal Use Only*
*Generated: {{generation_date}}*
