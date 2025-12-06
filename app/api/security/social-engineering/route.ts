import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  SECampaign, SETarget, SEAttackType,
  phishingTemplates, generateCampaign, generateTrainingReport
} from '@/lib/security/social-engineering';
import { nanoid } from 'nanoid';

// In-memory storage for demo (use database in production)
const campaigns: Map<string, SECampaign> = new Map();

// Create new campaign
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create_campaign':
        return createCampaign(body);
      
      case 'start_campaign':
        return startCampaign(body.campaignId);
      
      case 'pause_campaign':
        return pauseCampaign(body.campaignId);
      
      case 'record_event':
        return recordEvent(body);
      
      case 'generate_report':
        return generateReport(body.campaignId);
      
      case 'send_test':
        return sendTestEmail(body);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('SE API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// Get campaigns
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const campaignId = searchParams.get('id');
    const type = searchParams.get('type');

    if (campaignId) {
      const campaign = campaigns.get(campaignId);
      if (!campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }
      return NextResponse.json({ campaign });
    }

    // Return all campaigns (filtered by type if provided)
    let allCampaigns = Array.from(campaigns.values());
    if (type) {
      allCampaigns = allCampaigns.filter(c => c.type === type);
    }

    return NextResponse.json({ campaigns: allCampaigns });

  } catch (error) {
    console.error('SE API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ============================================
// CAMPAIGN HANDLERS
// ============================================

async function createCampaign(body: any) {
  const { name, type, templateId, targets, schedule, customizations } = body;

  // Validate template
  const template = phishingTemplates.find(t => t.id === templateId);
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 400 });
  }

  // Create targets
  const seTargets: SETarget[] = targets.map((t: any) => ({
    id: nanoid(),
    email: t.email,
    name: t.name,
    department: t.department,
    role: t.role,
    phone: t.phone,
    status: 'pending',
    events: [],
  }));

  // Generate campaign
  const campaign = generateCampaign(type, templateId, seTargets, customizations || {});
  campaign.name = name;
  
  if (schedule) {
    campaign.schedule = {
      startDate: new Date(schedule.startDate),
      endDate: new Date(schedule.endDate),
      sendTime: schedule.sendTime,
      timezone: schedule.timezone || 'UTC',
    };
  }

  // Save campaign
  campaigns.set(campaign.id, campaign);

  return NextResponse.json({
    success: true,
    campaign: {
      id: campaign.id,
      name: campaign.name,
      type: campaign.type,
      status: campaign.status,
      targetCount: campaign.targets.length,
    },
  });
}

async function startCampaign(campaignId: string) {
  const campaign = campaigns.get(campaignId);
  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  // Update status
  campaign.status = 'running';
  campaign.updatedAt = new Date();

  // Simulate sending emails
  for (const target of campaign.targets) {
    target.status = 'sent';
    target.events.push({
      type: 'sent',
      timestamp: new Date(),
    });
    campaign.results.sent++;
  }

  // Simulate some immediate deliveries
  setTimeout(() => {
    campaign.targets.forEach(target => {
      if (Math.random() > 0.02) { // 98% delivery rate
        target.events.push({
          type: 'delivered',
          timestamp: new Date(),
        });
        campaign.results.delivered++;
      }
    });
  }, 1000);

  campaigns.set(campaignId, campaign);

  return NextResponse.json({
    success: true,
    message: 'Campaign started',
    sent: campaign.results.sent,
  });
}

async function pauseCampaign(campaignId: string) {
  const campaign = campaigns.get(campaignId);
  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  campaign.status = 'paused';
  campaign.updatedAt = new Date();
  campaigns.set(campaignId, campaign);

  return NextResponse.json({
    success: true,
    message: 'Campaign paused',
  });
}

async function recordEvent(body: any) {
  const { campaignId, targetId, eventType, metadata } = body;

  const campaign = campaigns.get(campaignId);
  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  const target = campaign.targets.find(t => t.id === targetId);
  if (!target) {
    return NextResponse.json({ error: 'Target not found' }, { status: 404 });
  }

  // Record event
  target.events.push({
    type: eventType,
    timestamp: new Date(),
    metadata,
  });

  // Update target status and campaign results
  switch (eventType) {
    case 'opened':
      if (target.status === 'sent') {
        target.status = 'opened';
        campaign.results.opened++;
        campaign.results.openRate = (campaign.results.opened / campaign.results.sent) * 100;
      }
      break;
    
    case 'clicked':
      if (['sent', 'opened'].includes(target.status)) {
        target.status = 'clicked';
        campaign.results.clicked++;
        campaign.results.clickRate = (campaign.results.clicked / campaign.results.sent) * 100;
      }
      break;
    
    case 'submitted':
      target.status = 'submitted';
      campaign.results.submitted++;
      campaign.results.submitRate = (campaign.results.submitted / campaign.results.sent) * 100;
      break;
    
    case 'reported':
      target.status = 'reported';
      campaign.results.reported++;
      campaign.results.reportRate = (campaign.results.reported / campaign.results.sent) * 100;
      break;
  }

  // Update risk level
  if (campaign.results.submitRate > 10) {
    campaign.results.overallRisk = 'critical';
  } else if (campaign.results.clickRate > 25) {
    campaign.results.overallRisk = 'high';
  } else if (campaign.results.clickRate > 15) {
    campaign.results.overallRisk = 'medium';
  } else {
    campaign.results.overallRisk = 'low';
  }

  campaign.updatedAt = new Date();
  campaigns.set(campaignId, campaign);

  return NextResponse.json({
    success: true,
    event: eventType,
    results: campaign.results,
  });
}

async function generateReport(campaignId: string) {
  const campaign = campaigns.get(campaignId);
  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  const report = generateTrainingReport(campaign);

  return NextResponse.json({
    success: true,
    report,
    format: 'markdown',
  });
}

async function sendTestEmail(body: any) {
  const { templateId, testEmail, customizations } = body;

  const template = phishingTemplates.find(t => t.id === templateId);
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 400 });
  }

  // In production, actually send a test email
  // For now, simulate success

  return NextResponse.json({
    success: true,
    message: `Test email sent to ${testEmail}`,
    template: {
      subject: template.subject,
      sender: template.senderEmail,
    },
  });
}
