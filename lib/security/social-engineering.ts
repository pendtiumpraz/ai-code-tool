// ============================================
// SOCIAL ENGINEERING SIMULATION MODULE
// For Authorized Security Awareness Training
// ============================================

export interface SECampaign {
  id: string;
  name: string;
  type: SEAttackType;
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'paused';
  targets: SETarget[];
  template: SETemplate;
  schedule: {
    startDate: Date;
    endDate: Date;
    sendTime?: string; // HH:mm format
    timezone: string;
  };
  tracking: SETracking;
  results: SEResults;
  createdAt: Date;
  updatedAt: Date;
}

export type SEAttackType = 
  | 'phishing'           // Email phishing
  | 'spear_phishing'     // Targeted phishing
  | 'whaling'            // Executive targeting
  | 'vishing'            // Voice phishing
  | 'smishing'           // SMS phishing
  | 'pretexting'         // Social manipulation
  | 'baiting'            // USB/download baiting
  | 'quid_pro_quo'       // Service offering
  | 'tailgating'         // Physical access
  | 'watering_hole'      // Compromised websites
  | 'business_email_compromise';

export interface SETarget {
  id: string;
  email: string;
  name: string;
  department?: string;
  role?: string;
  phone?: string;
  customFields?: Record<string, string>;
  status: 'pending' | 'sent' | 'opened' | 'clicked' | 'submitted' | 'reported';
  events: SEEvent[];
}

export interface SEEvent {
  type: 'sent' | 'delivered' | 'opened' | 'clicked' | 'submitted' | 'reported' | 'attachment_opened';
  timestamp: Date;
  metadata?: {
    ip?: string;
    userAgent?: string;
    location?: string;
    credentials?: boolean;
    data?: Record<string, any>;
  };
}

export interface SETemplate {
  id: string;
  name: string;
  type: SEAttackType;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  
  // Email templates
  subject?: string;
  senderName?: string;
  senderEmail?: string;
  htmlContent?: string;
  textContent?: string;
  
  // Landing page
  landingPage?: {
    url: string;
    html: string;
    captureFields: string[];
  };
  
  // Attachments
  attachments?: {
    name: string;
    type: string;
    trackingEnabled: boolean;
  }[];
  
  // SMS
  smsContent?: string;
  
  // Voice
  voiceScript?: string;
  
  // Pretexting/Social Engineering
  scenario?: string;
  script?: string;
  informationTargets?: string[];
  defenseStrategies?: string[];
  trainingObjectives?: string[];
  
  // Baiting
  usbLabels?: string[];
  trackingMethods?: string[];
  qrPlacements?: string[];
  
  // Indicators
  redFlags?: string[];
  educationalContent?: string;
}

export interface SETracking {
  emailOpens: boolean;
  linkClicks: boolean;
  credentialCapture: boolean;
  attachmentOpens: boolean;
  geoLocation: boolean;
  deviceInfo: boolean;
}

export interface SEResults {
  totalTargets: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  submitted: number;
  reported: number;
  
  // Rates
  openRate: number;
  clickRate: number;
  submitRate: number;
  reportRate: number;
  
  // Risk scores
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  departmentRisk: Record<string, number>;
  
  // Timeline
  timeline: {
    timestamp: Date;
    event: string;
    count: number;
  }[];
}

// ============================================
// PHISHING TEMPLATES
// ============================================

export const phishingTemplates: SETemplate[] = [
  // ─────────────────────────────────────────
  // CREDENTIAL HARVESTING
  // ─────────────────────────────────────────
  {
    id: 'cred-microsoft-365',
    name: 'Microsoft 365 Password Expiry',
    type: 'phishing',
    category: 'Credential Harvesting',
    difficulty: 'easy',
    subject: 'Action Required: Your password expires in 24 hours',
    senderName: 'Microsoft 365 Admin',
    senderEmail: 'admin@m1crosoft-365.com',
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0078d4; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; background: #f5f5f5; }
    .button { background: #0078d4; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
    .footer { padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://img.icons8.com/color/96/000000/microsoft.png" alt="Microsoft">
      <h2>Microsoft 365</h2>
    </div>
    <div class="content">
      <p>Dear {{name}},</p>
      <p>Your Microsoft 365 password will expire in <strong>24 hours</strong>.</p>
      <p>To avoid any disruption to your services, please update your password immediately.</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{phishing_url}}" class="button">Update Password Now</a>
      </p>
      <p>If you did not request this change, please contact IT support immediately.</p>
      <p>Thank you,<br>Microsoft 365 Team</p>
    </div>
    <div class="footer">
      <p>This is an automated message from Microsoft 365.</p>
      <p>© 2024 Microsoft Corporation. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
    landingPage: {
      url: '/m365-login',
      html: 'microsoft-login-clone.html',
      captureFields: ['email', 'password'],
    },
    redFlags: [
      'Suspicious sender domain (m1crosoft-365.com instead of microsoft.com)',
      'Urgent language creating pressure',
      'Generic greeting instead of actual name',
      'Hover over link shows non-Microsoft URL',
    ],
    educationalContent: `
## What to Look For

1. **Check the sender's email address** - Official Microsoft emails come from @microsoft.com
2. **Hover over links before clicking** - The URL should go to microsoft.com
3. **Microsoft never asks for passwords via email**
4. **Look for spelling/grammar errors**
5. **When in doubt, go directly to office.com to manage your account**
    `,
  },

  {
    id: 'cred-google-security',
    name: 'Google Security Alert',
    type: 'phishing',
    category: 'Credential Harvesting',
    difficulty: 'medium',
    subject: 'Security alert: New sign-in on Windows',
    senderName: 'Google',
    senderEmail: 'no-reply@accounts.google-security.com',
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Google Sans', Roboto, Arial, sans-serif; background: #f1f3f4; }
    .container { max-width: 500px; margin: 40px auto; background: white; border-radius: 8px; }
    .header { padding: 40px; text-align: center; border-bottom: 1px solid #eee; }
    .content { padding: 40px; }
    .alert-box { background: #fce8e6; border-left: 4px solid #d93025; padding: 16px; margin: 20px 0; }
    .button { background: #1a73e8; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; }
    .device-info { background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_74x24dp.png" alt="Google">
    </div>
    <div class="content">
      <div class="alert-box">
        <strong>⚠️ Someone may have accessed your account</strong>
      </div>
      <p>Hi {{name}},</p>
      <p>We detected a new sign-in to your Google Account on a Windows device. If this was you, you don't need to do anything.</p>
      <div class="device-info">
        <p><strong>New sign-in</strong></p>
        <p>Windows • Chrome browser</p>
        <p>Location: {{fake_location}}</p>
        <p>Time: {{current_time}}</p>
      </div>
      <p>If you didn't sign in, someone else might have access to your account.</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{phishing_url}}" class="button">Check activity</a>
      </p>
    </div>
  </div>
</body>
</html>
    `,
    redFlags: [
      'Domain is google-security.com not google.com',
      'Creates fear and urgency',
      'Link doesn\'t go to accounts.google.com',
      'Generic device information',
    ],
    educationalContent: `
## Real vs Fake Google Alerts

**Real Google Security Emails:**
- Come from @google.com or @accounts.google.com
- Link to accounts.google.com
- Include specific device details
- Never ask for password directly

**Always verify by:**
1. Going directly to myaccount.google.com
2. Checking "Security" > "Recent security activity"
    `,
  },

  // ─────────────────────────────────────────
  // BUSINESS EMAIL COMPROMISE (BEC)
  // ─────────────────────────────────────────
  {
    id: 'bec-ceo-wire',
    name: 'CEO Wire Transfer Request',
    type: 'business_email_compromise',
    category: 'BEC / Wire Fraud',
    difficulty: 'hard',
    subject: 'Urgent: Confidential wire transfer needed',
    senderName: '{{ceo_name}}',
    senderEmail: '{{ceo_name_lowercase}}@{{company_lookalike}}',
    htmlContent: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif;">
  <p>Hi {{name}},</p>
  
  <p>I need you to process an urgent wire transfer today. This is for a confidential acquisition we're finalizing.</p>
  
  <p><strong>Amount:</strong> $47,500.00<br>
  <strong>Bank:</strong> First National Bank<br>
  <strong>Account:</strong> 8847291034<br>
  <strong>Routing:</strong> 021000089</p>
  
  <p>Please process this immediately and confirm when done. Don't mention this to anyone else as we're still in negotiations.</p>
  
  <p>I'm in meetings all day so just reply to this email.</p>
  
  <p>Thanks,<br>
  {{ceo_name}}<br>
  <em>Sent from my iPhone</em></p>
</body>
</html>
    `,
    redFlags: [
      'Unusual request from executive',
      'Urgency and secrecy demanded',
      'Request to bypass normal procedures',
      'Sender email domain slightly different',
      '"Sent from iPhone" to explain lack of signature',
    ],
    educationalContent: `
## Business Email Compromise (BEC)

BEC attacks impersonate executives to trick employees into:
- Wire transfers
- Gift card purchases
- Sensitive data disclosure

**Red Flags:**
1. Unusual requests from executives
2. Urgency and confidentiality
3. Requests to bypass normal approval process
4. Slightly misspelled domain names

**Always:**
- Verify via phone call to known number
- Follow established financial procedures
- Check email headers for true sender
    `,
  },

  // ─────────────────────────────────────────
  // INVOICE/PAYMENT FRAUD
  // ─────────────────────────────────────────
  {
    id: 'invoice-fraud',
    name: 'Vendor Invoice Payment Update',
    type: 'phishing',
    category: 'Invoice Fraud',
    difficulty: 'hard',
    subject: 'RE: Updated Banking Information - Invoice #INV-2024-3847',
    senderName: 'Accounts Payable - {{vendor_name}}',
    senderEmail: 'ap@{{vendor_lookalike}}',
    htmlContent: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif;">
  <p>Dear {{name}},</p>
  
  <p>I hope this email finds you well.</p>
  
  <p>We are writing to inform you that our company has recently changed banks. Please update your records with our new banking details for all future payments:</p>
  
  <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-left: 4px solid #0066cc;">
    <p><strong>New Banking Details:</strong></p>
    <p>Bank Name: Chase Bank<br>
    Account Name: {{vendor_name}} LLC<br>
    Account Number: 4829173650<br>
    Routing Number: 021000021<br>
    SWIFT: CHASUS33</p>
  </div>
  
  <p>Please use these details for the outstanding invoice #INV-2024-3847 ($23,450.00) and all future payments.</p>
  
  <p>Attached is our official bank change notification letter for your records.</p>
  
  <p>Thank you for your continued partnership.</p>
  
  <p>Best regards,<br>
  Sarah Johnson<br>
  Accounts Receivable Manager<br>
  {{vendor_name}}</p>
</body>
</html>
    `,
    attachments: [
      {
        name: 'Bank_Change_Notification.pdf',
        type: 'application/pdf',
        trackingEnabled: true,
      }
    ],
    redFlags: [
      'Request to change bank details',
      'Urgent payment request',
      'Email domain slightly different from real vendor',
      'Unsolicited banking change notification',
    ],
    educationalContent: `
## Vendor Invoice Fraud

Attackers impersonate vendors to redirect payments.

**Verification Steps:**
1. Call vendor using phone number from your records (not the email)
2. Verify bank changes through multiple channels
3. Check email domain carefully
4. Follow your payment change procedures

**Never:**
- Update bank details based on email alone
- Rush payment changes without verification
    `,
  },
];

// ============================================
// VISHING (VOICE PHISHING) SCRIPTS
// ============================================

export const vishingScripts: SETemplate[] = [
  {
    id: 'vishing-it-support',
    name: 'IT Support Password Reset',
    type: 'vishing' as SEAttackType,
    category: 'IT Impersonation',
    difficulty: 'medium' as const,
    
    scenario: `
Caller pretends to be from IT Support, claiming there's an urgent security issue
with the target's account that requires immediate password verification.
    `,
    
    voiceScript: `
[INTRODUCTION]
"Hi, this is [Fake Name] from the IT Help Desk. Am I speaking with [Target Name]?"

[ESTABLISH URGENCY]
"Great. I'm calling because our security monitoring system flagged some unusual 
activity on your account about 30 minutes ago. It looks like someone may have 
tried to access your account from an overseas IP address."

[BUILD TRUST]
"I can see here you're in the [Department] department, is that correct? 
And your employee ID ends in [last 2 digits if known]?"

[SOCIAL PRESSURE]
"We're calling all affected users directly because this is time-sensitive. 
If we don't verify and secure your account in the next few minutes, 
we'll have to temporarily disable it as a precaution."

[CREDENTIAL REQUEST]
"What I need to do is verify your identity so we can reset your password 
and lock out the attacker. Can you confirm your current password for me 
so I can make sure it matches what we have on file?"

[IF HESITANT]
"I completely understand your caution - that's actually good security awareness! 
Let me give you our ticket number: [fake number]. You can call the help desk 
back to verify this is legitimate. But just so you know, we need to resolve 
this in the next 10 minutes or the system will auto-lock your account."

[ALTERNATIVE APPROACH]
"If you're not comfortable with that, I can send you a password reset link. 
Can you confirm your email address? And when you get it, just let me know 
the temporary code so I can verify the reset went through."
    `,
    
    redFlags: [
      'IT never asks for your password over the phone',
      'Creating artificial urgency',
      'Claiming account will be disabled',
      'Asking you to share verification codes',
      'Offering to "verify" by calling back a number they provide',
    ],
    
    educationalContent: `
## Vishing Defense

**Real IT Support will NEVER:**
- Ask for your password
- Ask for MFA codes
- Create urgent pressure
- Threaten account lockout

**If you receive suspicious calls:**
1. Hang up
2. Call IT using the official number from the company directory
3. Report the call to security
    `,

    trainingObjectives: [
      'Recognize urgency tactics',
      'Never share passwords verbally',
      'Verify caller identity through official channels',
      'Report suspicious calls',
    ],
  },

  {
    id: 'vishing-bank-fraud',
    name: 'Bank Fraud Department',
    type: 'vishing' as SEAttackType,
    category: 'Financial Fraud',
    difficulty: 'hard' as const,
    
    voiceScript: `
[CALLER ID SPOOFED TO SHOW BANK NUMBER]

"Hello, this is [Name] from [Bank Name] Fraud Prevention Department. 
We've detected potentially fraudulent activity on your account ending in [XXXX].

We noticed an attempted purchase of $1,247.89 at an electronics store 
in [Different City]. Did you authorize this transaction?

[Target says No]

I'm glad you reported this. We've blocked the transaction, but I need 
to verify your identity to secure your account. Can you confirm:
- Your full card number
- The expiration date
- The 3-digit security code on the back

This is just to verify you're the account holder so we can issue 
you a new card and reverse any fraudulent charges."
    `,
    
    redFlags: [
      'Banks never ask for full card number - they have it',
      'Never ask for CVV over phone',
      'Caller ID can be spoofed',
      'Real fraud calls don\'t need you to verify - they verify to you',
    ],
    
    educationalContent: `
## Bank Call Verification

**Banks will NEVER ask for:**
- Full card number (they have it)
- CVV/security code
- PIN number
- Online banking password

**If suspicious:**
1. Hang up
2. Call number on back of your card
3. Never use callback number provided by caller
    `,
  },
];

// ============================================
// SMISHING (SMS PHISHING) TEMPLATES
// ============================================

export const smishingTemplates: SETemplate[] = [
  {
    id: 'smish-delivery',
    name: 'Package Delivery Notification',
    type: 'smishing' as SEAttackType,
    category: 'Delivery Scam',
    difficulty: 'easy' as const,
    
    smsContent: `
USPS: Your package could not be delivered due to incomplete address. 
Update delivery info: https://usps-redelivery.info/track/{{tracking_id}}
Reply STOP to opt out
    `,
    
    redFlags: [
      'Suspicious shortened URL',
      'Domain is not usps.com',
      'Generic message without specific details',
      'Unexpected delivery notification',
    ],
    educationalContent: 'Always verify delivery notifications directly with the carrier website. Never click links in SMS messages.',
  },

  {
    id: 'smish-bank-alert',
    name: 'Bank Security Alert SMS',
    type: 'smishing' as SEAttackType,
    category: 'Banking Fraud',
    difficulty: 'medium' as const,
    
    smsContent: `
[{{bank_name}}] ALERT: Unusual activity detected on your account. 
If this wasn't you, secure your account immediately: 
https://{{bank_name_lowercase}}-secure.com/verify
    `,
    
    redFlags: [
      'URL is not the official bank domain',
      'Creates urgency and fear',
      'Banks send alerts but don\'t include links',
      'Generic "unusual activity" without details',
    ],
    educationalContent: 'Banks never send links in security alerts. Always log in directly to your banking app or website.',
  },

  {
    id: 'smish-mfa-code',
    name: 'MFA Code Request',
    type: 'smishing' as SEAttackType,
    category: 'Account Takeover',
    difficulty: 'hard' as const,
    
    smsContent: `
Your {{service}} verification code is: 847291
If you didn't request this, someone may be trying to access your account. 
Reply STOP if this wasn't you.
    `,
    
    redFlags: [
      'You didn\'t request a code',
      'Asking you to reply or take action',
      'May be real code from attacker triggering reset',
      'Never share codes with anyone',
    ],
    
    educationalContent: `
## MFA Code Security

If you receive a code you didn't request:
1. DON'T reply or click any links
2. DON'T share the code with anyone
3. Someone may be trying to access your account
4. Change your password immediately
5. Check for unauthorized access
    `,
  },
];

// ============================================
// PRETEXTING SCENARIOS
// ============================================

export const pretextingScenarios: SETemplate[] = [
  {
    id: 'pretext-new-employee',
    name: 'New Employee Assistance',
    type: 'pretexting' as SEAttackType,
    category: 'Information Gathering',
    difficulty: 'medium' as const,
    redFlags: [
      'Unverified new employee',
      'Asking for sensitive information',
      'Urgency in requests',
      'No proper identification',
    ],
    educationalContent: 'Always verify new employees through HR before sharing any information.',
    
    scenario: `
Attacker poses as a new employee who is confused and needs help. 
They use this to gather information about systems, processes, and people.
    `,
    
    script: `
[IN PERSON OR PHONE]

"Hi! I'm so sorry to bother you - I just started in [Department] last week 
and I'm still trying to figure everything out. 

My manager [made up name] is out today and I can't log into [System Name]. 
Do you know who I should contact for password resets?

Also, do you happen to know - is there a shared drive where the team 
keeps the project files? I was supposed to review some documents but 
I can't find where anything is stored.

Oh, and one more thing - do you know [Real Employee Name]? I was 
supposed to meet with them but I don't know what they look like or 
where their desk is."
    `,
    
    informationTargets: [
      'IT support contact information',
      'Password reset procedures',
      'File storage locations',
      'Employee information and locations',
      'System names and access methods',
    ],
    
    defenseStrategies: [
      'Verify new employee through HR',
      'Direct to official onboarding resources',
      'Don\'t share sensitive procedures with unverified people',
      'Report suspicious inquiries',
    ],
  },

  {
    id: 'pretext-vendor-survey',
    name: 'Vendor Satisfaction Survey',
    type: 'pretexting' as SEAttackType,
    category: 'Information Gathering',
    difficulty: 'easy' as const,
    redFlags: [
      'Unsolicited survey call',
      'Asking for system details',
      'Offering gift cards for information',
      'Unverified caller identity',
    ],
    educationalContent: 'Always verify vendor calls through official contacts. Never share system details with unverified callers.',
    
    scenario: `
Attacker poses as a vendor conducting a "satisfaction survey" to gather 
information about systems, contacts, and processes.
    `,
    
    script: `
[PHONE CALL]

"Hello, this is [Name] from [Known Vendor] customer success team. 
We're conducting our quarterly satisfaction survey and your organization 
is one of our valued clients.

Do you have about 5 minutes to answer a few questions?

Great! First, can you confirm which version of our software you're 
currently running?

And how many users do you have on the platform?

Who is your primary administrator for the system?

Have you integrated our solution with any other tools like [list common tools]?

Are there any specific features you'd like to see in future updates?

Perfect, thank you! As a thank you, I'll send you a $25 Amazon gift card. 
Can I confirm your email address?"
    `,
    
    defenseStrategies: [
      'Verify caller through official vendor contact',
      'Don\'t share system details with unverified callers',
      'Be cautious of unsolicited surveys',
      'Check with your account manager before participating',
    ],
  },
];

// ============================================
// USB DROP / BAITING SIMULATION
// ============================================

export const baitingScenarios: SETemplate[] = [
  {
    id: 'bait-usb-parking',
    name: 'USB Drop - Parking Lot',
    type: 'baiting' as SEAttackType,
    category: 'Physical Security',
    difficulty: 'easy' as const,
    redFlags: [
      'Unknown USB device found',
      'Enticing labels on device',
      'Found in public areas',
      'No known owner',
    ],
    educationalContent: 'Never plug in unknown USB devices. Turn them in to IT/Security.',
    
    scenario: `
Labeled USB drives are "dropped" in parking lots, break rooms, or common areas.
Drives contain tracking files that report when opened.
    `,
    
    usbLabels: [
      'Q4 Layoff List - CONFIDENTIAL',
      'Salary Information 2024',
      'Executive Bonuses',
      'HR - Terminations',
      'Building Security Codes',
      'Password List - DO NOT LOSE',
    ],
    
    trackingMethods: [
      'HTML file with tracking pixel',
      'Word doc with remote template',
      'Executable disguised as PDF',
      'AutoRun script (older systems)',
    ],
  },

  {
    id: 'bait-qr-code',
    name: 'Malicious QR Code',
    type: 'baiting' as SEAttackType,
    category: 'Physical Security',
    difficulty: 'medium' as const,
    redFlags: [
      'QR code in unusual location',
      'No verification of destination',
      'Sticker placed over original code',
      'Suspicious or shortened URL',
    ],
    
    scenario: `
QR codes placed in common areas that link to phishing sites or 
malware downloads when scanned.
    `,
    
    qrPlacements: [
      'Parking payment machines',
      'Conference room booking instructions',
      'WiFi connection instructions',
      'Event registration posters',
      'Restaurant menus',
    ],
    
    educationalContent: `
## QR Code Security

**Before scanning unknown QR codes:**
1. Consider the source - is it official?
2. Use a QR scanner that shows URL preview
3. Check if the URL looks legitimate
4. Be suspicious of QR codes that seem out of place
5. When in doubt, type the URL manually
    `,
  },
];

// ============================================
// CAMPAIGN GENERATOR
// ============================================

export function generateCampaign(
  type: SEAttackType,
  templateId: string,
  targets: SETarget[],
  customizations: Partial<SETemplate>
): SECampaign {
  const template = phishingTemplates.find(t => t.id === templateId);
  if (!template) throw new Error('Template not found');

  return {
    id: `campaign-${Date.now()}`,
    name: `${template.name} Campaign`,
    type,
    status: 'draft',
    targets,
    template: { ...template, ...customizations },
    schedule: {
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      timezone: 'UTC',
    },
    tracking: {
      emailOpens: true,
      linkClicks: true,
      credentialCapture: true,
      attachmentOpens: true,
      geoLocation: false,
      deviceInfo: true,
    },
    results: {
      totalTargets: targets.length,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      submitted: 0,
      reported: 0,
      openRate: 0,
      clickRate: 0,
      submitRate: 0,
      reportRate: 0,
      overallRisk: 'low',
      departmentRisk: {},
      timeline: [],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ============================================
// TRAINING REPORT GENERATOR
// ============================================

export function generateTrainingReport(campaign: SECampaign): string {
  return `
# 🎯 Social Engineering Simulation Report

## Campaign Overview

| Property | Value |
|----------|-------|
| **Campaign Name** | ${campaign.name} |
| **Type** | ${campaign.type} |
| **Duration** | ${campaign.schedule.startDate.toLocaleDateString()} - ${campaign.schedule.endDate.toLocaleDateString()} |
| **Total Targets** | ${campaign.results.totalTargets} |

## Results Summary

### Engagement Metrics

| Metric | Count | Rate |
|--------|-------|------|
| Emails Sent | ${campaign.results.sent} | 100% |
| Emails Opened | ${campaign.results.opened} | ${campaign.results.openRate.toFixed(1)}% |
| Links Clicked | ${campaign.results.clicked} | ${campaign.results.clickRate.toFixed(1)}% |
| Data Submitted | ${campaign.results.submitted} | ${campaign.results.submitRate.toFixed(1)}% |
| Reported as Phishing | ${campaign.results.reported} | ${campaign.results.reportRate.toFixed(1)}% |

### Risk Assessment

**Overall Risk Level: ${campaign.results.overallRisk.toUpperCase()}**

### Key Findings

${campaign.results.clickRate > 20 ? '⚠️ **HIGH CLICK RATE** - Additional training recommended' : ''}
${campaign.results.submitRate > 10 ? '🚨 **CREDENTIAL SUBMISSION** - Urgent remediation needed' : ''}
${campaign.results.reportRate < 10 ? '📢 **LOW REPORT RATE** - Improve reporting awareness' : ''}

## Red Flags in This Campaign

${campaign.template.redFlags?.map(flag => `- ${flag}`).join('\n')}

## Educational Content

${campaign.template.educationalContent}

## Recommendations

1. **Immediate Actions:**
   - Reset credentials for users who submitted data
   - Provide targeted training for high-risk users

2. **Short-term (30 days):**
   - Security awareness training session
   - Phishing simulation follow-up

3. **Long-term:**
   - Implement advanced email filtering
   - Regular phishing simulations
   - Reward reporting behavior

---
*Report generated by AI Code Studio Security Training Platform*
`;
}
