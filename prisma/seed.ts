import { PrismaClient, Plan, EmailProvider, AccountStatus, WarmupStatus, CampaignStatus, LeadStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding ColdMail.ru demo data...');

  // ── 1. Demo User ──
  const passwordHash = await bcrypt.hash('Demo2026!', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@coldmail.ru' },
    update: {
      first_name: 'Dmitriy',
      last_name: 'Ivanov',
      company_name: 'ColdMail Demo',
      plan: Plan.growth,
    },
    create: {
      email: 'demo@coldmail.ru',
      password_hash: passwordHash,
      first_name: 'Dmitriy',
      last_name: 'Ivanov',
      company_name: 'ColdMail Demo',
      plan: Plan.growth,
    },
  });

  console.log(`User: ${user.email} (${user.id})`);

  // ── 2. Email Accounts ──
  const account1 = await prisma.emailAccount.upsert({
    where: { id: '00000000-0000-0000-0000-000000000a01' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000a01',
      user_id: user.id,
      email: 'sender1@demo-company.ru',
      provider: EmailProvider.yandex,
      smtp_host: 'smtp.yandex.ru',
      smtp_port: 465,
      smtp_username: 'sender1@demo-company.ru',
      smtp_password: 'fake-password-yandex',
      imap_host: 'imap.yandex.ru',
      imap_port: 993,
      status: AccountStatus.connected,
      warmup_status: WarmupStatus.ready,
      warmup_started_at: new Date('2026-03-01'),
      health_score: 94,
      daily_send_limit: 50,
      sent_today: 12,
    },
  });

  const account2 = await prisma.emailAccount.upsert({
    where: { id: '00000000-0000-0000-0000-000000000a02' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000a02',
      user_id: user.id,
      email: 'sender2@demo-company.ru',
      provider: EmailProvider.mailru,
      smtp_host: 'smtp.mail.ru',
      smtp_port: 465,
      smtp_username: 'sender2@demo-company.ru',
      smtp_password: 'fake-password-mailru',
      imap_host: 'imap.mail.ru',
      imap_port: 993,
      status: AccountStatus.connected,
      warmup_status: WarmupStatus.ready,
      warmup_started_at: new Date('2026-03-05'),
      health_score: 87,
      daily_send_limit: 40,
      sent_today: 8,
    },
  });

  console.log(`Accounts: ${account1.email}, ${account2.email}`);

  // ══════════════════════════════════════════════════════════
  // ── Campaign 1: IT-outsourcing for startups (active) ──
  // ══════════════════════════════════════════════════════════
  const campaign1 = await prisma.campaign.upsert({
    where: { id: '00000000-0000-0000-0000-000000000c01' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000c01',
      user_id: user.id,
      name: 'IT-\u0430\u0443\u0442\u0441\u043e\u0440\u0441\u0438\u043d\u0433 \u0434\u043b\u044f \u0441\u0442\u0430\u0440\u0442\u0430\u043f\u043e\u0432',
      status: CampaignStatus.active,
      daily_limit: 50,
      total_leads: 15,
      sent_count: 32,
      opened_count: 14,
      replied_count: 4,
      bounced_count: 1,
      schedule: {
        days: ['mon', 'tue', 'wed', 'thu', 'fri'],
        start_hour: 9,
        end_hour: 18,
        timezone: 'Europe/Moscow',
      },
      started_at: new Date('2026-04-10'),
    },
  });

  // Link accounts to campaign 1
  await prisma.campaignAccount.upsert({
    where: { campaign_id_account_id: { campaign_id: campaign1.id, account_id: account1.id } },
    update: {},
    create: { campaign_id: campaign1.id, account_id: account1.id },
  });
  await prisma.campaignAccount.upsert({
    where: { campaign_id_account_id: { campaign_id: campaign1.id, account_id: account2.id } },
    update: {},
    create: { campaign_id: campaign1.id, account_id: account2.id },
  });

  // Sequence for campaign 1: 3 steps
  const seq1 = await prisma.sequence.upsert({
    where: { campaign_id: campaign1.id },
    update: {},
    create: { campaign_id: campaign1.id, id: '00000000-0000-0000-0000-0000000000a1' },
  });

  const c1Steps = [
    {
      id: '00000000-0000-0000-0000-000000000b11',
      sequence_id: seq1.id,
      order: 1,
      subject: '\u0420\u0430\u0437\u0440\u0430\u0431\u043e\u0442\u043a\u0430 \u043f\u043e\u0434 \u043a\u043b\u044e\u0447 \u0434\u043b\u044f {{company}}',
      body: '\u0417\u0434\u0440\u0430\u0432\u0441\u0442\u0432\u0443\u0439\u0442\u0435, {{first_name}}!\n\n\u041c\u0435\u043d\u044f \u0437\u043e\u0432\u0443\u0442 \u0414\u043c\u0438\u0442\u0440\u0438\u0439 \u0438\u0437 ColdMail Demo. \u041c\u044b \u043f\u043e\u043c\u043e\u0433\u0430\u0435\u043c \u0441\u0442\u0430\u0440\u0442\u0430\u043f\u0430\u043c \u0431\u044b\u0441\u0442\u0440\u043e \u0437\u0430\u043f\u0443\u0441\u043a\u0430\u0442\u044c \u043f\u0440\u043e\u0434\u0443\u043a\u0442\u044b, \u043f\u0440\u0435\u0434\u043e\u0441\u0442\u0430\u0432\u043b\u044f\u044f \u0432\u044b\u0434\u0435\u043b\u0435\u043d\u043d\u044b\u0435 \u043a\u043e\u043c\u0430\u043d\u0434\u044b \u0440\u0430\u0437\u0440\u0430\u0431\u043e\u0442\u0447\u0438\u043a\u043e\u0432.\n\n\u0411\u0443\u0434\u0435\u0442 \u043b\u0438 \u0432\u0430\u043c \u0438\u043d\u0442\u0435\u0440\u0435\u0441\u043d\u043e \u0443\u0437\u043d\u0430\u0442\u044c \u043f\u043e\u0434\u0440\u043e\u0431\u043d\u0435\u0435?\n\n\u0421 \u0443\u0432\u0430\u0436\u0435\u043d\u0438\u0435\u043c,\n\u0414\u043c\u0438\u0442\u0440\u0438\u0439 \u0418\u0432\u0430\u043d\u043e\u0432',
      delay_days: 0,
      ai_personalize: true,
    },
    {
      id: '00000000-0000-0000-0000-000000000b12',
      sequence_id: seq1.id,
      order: 2,
      subject: 'Re: \u0420\u0430\u0437\u0440\u0430\u0431\u043e\u0442\u043a\u0430 \u043f\u043e\u0434 \u043a\u043b\u044e\u0447 \u0434\u043b\u044f {{company}}',
      body: '{{first_name}}, \u0434\u043e\u0431\u0440\u044b\u0439 \u0434\u0435\u043d\u044c!\n\n\u041f\u0438\u0448\u0443 \u043f\u043e\u0432\u0442\u043e\u0440\u043d\u043e \u2014 \u0432\u043e\u0437\u043c\u043e\u0436\u043d\u043e, \u043f\u0440\u0435\u0434\u044b\u0434\u0443\u0449\u0435\u0435 \u043f\u0438\u0441\u044c\u043c\u043e \u0437\u0430\u0442\u0435\u0440\u044f\u043b\u043e\u0441\u044c.\n\n\u041d\u0430\u0448\u0438 \u043a\u043b\u0438\u0435\u043d\u0442\u044b \u0441\u043e\u043a\u0440\u0430\u0449\u0430\u044e\u0442 time-to-market \u043d\u0430 40%. \u0413\u043e\u0442\u043e\u0432 \u043f\u043e\u043a\u0430\u0437\u0430\u0442\u044c \u043a\u0435\u0439\u0441\u044b \u0437\u0430 15 \u043c\u0438\u043d\u0443\u0442.\n\n\u0414\u043c\u0438\u0442\u0440\u0438\u0439',
      delay_days: 3,
      ai_personalize: false,
    },
    {
      id: '00000000-0000-0000-0000-000000000b13',
      sequence_id: seq1.id,
      order: 3,
      subject: '\u041f\u043e\u0441\u043b\u0435\u0434\u043d\u0435\u0435 \u043f\u0438\u0441\u044c\u043c\u043e \u043f\u043e \u0442\u0435\u043c\u0435 \u0430\u0443\u0442\u0441\u043e\u0440\u0441\u0438\u043d\u0433\u0430',
      body: '{{first_name}}, \u043f\u043e\u043d\u0438\u043c\u0430\u044e, \u0447\u0442\u043e \u0441\u0435\u0439\u0447\u0430\u0441 \u043c\u043e\u0436\u0435\u0442 \u0431\u044b\u0442\u044c \u043d\u0435 \u0432\u0440\u0435\u043c\u044f.\n\n\u0415\u0441\u043b\u0438 \u0432 \u0431\u0443\u0434\u0443\u0449\u0435\u043c \u043f\u043e\u044f\u0432\u0438\u0442\u0441\u044f \u043f\u043e\u0442\u0440\u0435\u0431\u043d\u043e\u0441\u0442\u044c \u0432 \u0440\u0430\u0437\u0440\u0430\u0431\u043e\u0442\u0447\u0438\u043a\u0430\u0445 \u2014 \u043f\u0440\u043e\u0441\u0442\u043e \u043e\u0442\u0432\u0435\u0442\u044c\u0442\u0435 \u043d\u0430 \u044d\u0442\u043e \u043f\u0438\u0441\u044c\u043c\u043e.\n\n\u0423\u0441\u043f\u0435\u0445\u043e\u0432!\n\u0414\u043c\u0438\u0442\u0440\u0438\u0439',
      delay_days: 5,
      ai_personalize: false,
    },
  ];

  for (const step of c1Steps) {
    await prisma.sequenceStep.upsert({
      where: { id: step.id },
      update: {},
      create: step,
    });
  }

  // Leads for campaign 1 (15 leads)
  const c1Leads = [
    { fn: '\u0410\u043b\u0435\u043a\u0441\u0435\u0439', ln: '\u041f\u0435\u0442\u0440\u043e\u0432', company: '\u0422\u0435\u0445\u043d\u043e\u0421\u0442\u0430\u0440\u0442', title: 'CTO', industry: 'IT', email: 'a.petrov@tehnostart.fake', status: LeadStatus.contacted, step: 2 },
    { fn: '\u041c\u0430\u0440\u0438\u044f', ln: '\u0421\u0438\u0434\u043e\u0440\u043e\u0432\u0430', company: 'DataPro Solutions', title: 'CEO', industry: '\u0410\u043d\u0430\u043b\u0438\u0442\u0438\u043a\u0430', email: 'm.sidorova@datapro.fake', status: LeadStatus.replied, step: 2 },
    { fn: '\u0414\u043c\u0438\u0442\u0440\u0438\u0439', ln: '\u041a\u043e\u0437\u043b\u043e\u0432', company: 'CloudBase', title: 'CTO', industry: '\u041e\u0431\u043b\u0430\u0447\u043d\u044b\u0435 \u0441\u0435\u0440\u0432\u0438\u0441\u044b', email: 'd.kozlov@cloudbase.fake', status: LeadStatus.interested, step: 3 },
    { fn: '\u0415\u043b\u0435\u043d\u0430', ln: '\u041d\u0438\u043a\u043e\u043b\u0430\u0435\u0432\u0430', company: '\u0418\u043d\u043d\u043e\u0422\u0435\u0445', title: 'CEO', industry: 'IT', email: 'e.nikolaeva@innotech.fake', status: LeadStatus.contacted, step: 1 },
    { fn: '\u0421\u0435\u0440\u0433\u0435\u0439', ln: '\u0412\u043e\u043b\u043a\u043e\u0432', company: '\u0421\u043c\u0430\u0440\u0442\u041a\u043e\u0434', title: 'CTO', industry: '\u0420\u0430\u0437\u0440\u0430\u0431\u043e\u0442\u043a\u0430 \u041f\u041e', email: 's.volkov@smartcode.fake', status: LeadStatus.new, step: 0 },
    { fn: '\u0410\u043d\u043d\u0430', ln: '\u041c\u043e\u0440\u043e\u0437\u043e\u0432\u0430', company: 'BrightBit', title: 'Head of Engineering', industry: 'FinTech', email: 'a.morozova@brightbit.fake', status: LeadStatus.contacted, step: 1 },
    { fn: '\u041c\u0438\u0445\u0430\u0438\u043b', ln: '\u041b\u0435\u0431\u0435\u0434\u0435\u0432', company: '\u041a\u043e\u0434\u041b\u0430\u0431', title: 'CTO', industry: 'IT', email: 'm.lebedev@codelab.fake', status: LeadStatus.replied, step: 2 },
    { fn: '\u041e\u043b\u044c\u0433\u0430', ln: '\u041a\u0443\u0437\u043d\u0435\u0446\u043e\u0432\u0430', company: 'NextGen Software', title: 'CEO', industry: '\u0420\u0430\u0437\u0440\u0430\u0431\u043e\u0442\u043a\u0430 \u041f\u041e', email: 'o.kuznetsova@nextgen.fake', status: LeadStatus.new, step: 0 },
    { fn: '\u0410\u043d\u0434\u0440\u0435\u0439', ln: '\u0421\u043e\u043a\u043e\u043b\u043e\u0432', company: '\u0414\u0438\u0434\u0436\u0438\u0442\u0430\u043b\u041f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u0430', title: 'VP Engineering', industry: 'E-commerce', email: 'a.sokolov@digiplatforma.fake', status: LeadStatus.contacted, step: 1 },
    { fn: '\u041d\u0430\u0442\u0430\u043b\u044c\u044f', ln: '\u041f\u043e\u043f\u043e\u0432\u0430', company: 'AI Factory', title: 'CTO', industry: 'AI/ML', email: 'n.popova@aifactory.fake', status: LeadStatus.new, step: 0 },
    { fn: '\u0418\u0433\u043e\u0440\u044c', ln: '\u041d\u043e\u0432\u0438\u043a\u043e\u0432', company: 'WebStream', title: 'CEO', industry: 'SaaS', email: 'i.novikov@webstream.fake', status: LeadStatus.bounced, step: 1 },
    { fn: '\u0422\u0430\u0442\u044c\u044f\u043d\u0430', ln: '\u0424\u0435\u0434\u043e\u0440\u043e\u0432\u0430', company: '\u0421\u0435\u0440\u0432\u0435\u0440\u041f\u0440\u043e', title: 'CTO', industry: 'DevOps', email: 't.fedorova@serverpro.fake', status: LeadStatus.contacted, step: 2 },
    { fn: '\u0420\u043e\u043c\u0430\u043d', ln: '\u0413\u0440\u0438\u0433\u043e\u0440\u044c\u0435\u0432', company: 'AppStudio', title: 'CEO', industry: 'Mobile', email: 'r.grigoriev@appstudio.fake', status: LeadStatus.new, step: 0 },
    { fn: '\u041a\u0441\u0435\u043d\u0438\u044f', ln: '\u0411\u0435\u043b\u043e\u0432\u0430', company: 'CyberGuard', title: 'CTO', industry: '\u0418\u043d\u0444\u043e\u0440\u043c\u0430\u0446\u0438\u043e\u043d\u043d\u0430\u044f \u0431\u0435\u0437\u043e\u043f\u0430\u0441\u043d\u043e\u0441\u0442\u044c', email: 'k.belova@cyberguard.fake', status: LeadStatus.contacted, step: 1 },
    { fn: '\u0412\u043b\u0430\u0434\u0438\u043c\u0438\u0440', ln: '\u041e\u0440\u043b\u043e\u0432', company: '\u0414\u0430\u0442\u0430\u041c\u0430\u0439\u043d', title: 'Head of R&D', industry: 'Big Data', email: 'v.orlov@datamine.fake', status: LeadStatus.new, step: 0 },
  ];

  const c1LeadIds: string[] = [];
  for (let i = 0; i < c1Leads.length; i++) {
    const l = c1Leads[i];
    const leadId = `00000000-0000-0000-0001-00000000${String(i + 1).padStart(2, '0')}01`;
    const lead = await prisma.lead.upsert({
      where: { id: leadId },
      update: {},
      create: {
        id: leadId,
        user_id: user.id,
        campaign_id: campaign1.id,
        email: l.email,
        first_name: l.fn,
        last_name: l.ln,
        company: l.company,
        title: l.title,
        industry: l.industry,
        status: l.status,
        current_step: l.step,
      },
    });
    c1LeadIds.push(lead.id);
  }

  console.log(`Campaign 1: "${campaign1.name}" - ${c1Leads.length} leads`);

  // ══════════════════════════════════════════════════════════
  // ── Campaign 2: CRM for sales departments (active) ──
  // ══════════════════════════════════════════════════════════
  const campaign2 = await prisma.campaign.upsert({
    where: { id: '00000000-0000-0000-0000-000000000c02' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000c02',
      user_id: user.id,
      name: 'CRM \u0434\u043b\u044f \u043e\u0442\u0434\u0435\u043b\u043e\u0432 \u043f\u0440\u043e\u0434\u0430\u0436',
      status: CampaignStatus.active,
      daily_limit: 30,
      total_leads: 20,
      sent_count: 18,
      opened_count: 7,
      replied_count: 2,
      bounced_count: 0,
      schedule: {
        days: ['mon', 'tue', 'wed', 'thu', 'fri'],
        start_hour: 10,
        end_hour: 17,
        timezone: 'Europe/Moscow',
      },
      started_at: new Date('2026-04-15'),
    },
  });

  await prisma.campaignAccount.upsert({
    where: { campaign_id_account_id: { campaign_id: campaign2.id, account_id: account1.id } },
    update: {},
    create: { campaign_id: campaign2.id, account_id: account1.id },
  });

  // Sequence for campaign 2: 4 steps
  const seq2 = await prisma.sequence.upsert({
    where: { campaign_id: campaign2.id },
    update: {},
    create: { campaign_id: campaign2.id, id: '00000000-0000-0000-0000-0000000000a2' },
  });

  const c2Steps = [
    {
      id: '00000000-0000-0000-0000-000000000b21',
      sequence_id: seq2.id,
      order: 1,
      subject: '\u041f\u043e\u0432\u044b\u0441\u044c\u0442\u0435 \u043a\u043e\u043d\u0432\u0435\u0440\u0441\u0438\u044e \u043e\u0442\u0434\u0435\u043b\u0430 \u043f\u0440\u043e\u0434\u0430\u0436 {{company}}',
      body: '\u0417\u0434\u0440\u0430\u0432\u0441\u0442\u0432\u0443\u0439\u0442\u0435, {{first_name}}!\n\n\u041c\u044b \u0440\u0430\u0437\u0440\u0430\u0431\u043e\u0442\u0430\u043b\u0438 CRM-\u0441\u0438\u0441\u0442\u0435\u043c\u0443, \u043a\u043e\u0442\u043e\u0440\u0430\u044f \u043f\u043e\u043c\u043e\u0433\u0430\u0435\u0442 \u043e\u0442\u0434\u0435\u043b\u0430\u043c \u043f\u0440\u043e\u0434\u0430\u0436 \u0443\u0432\u0435\u043b\u0438\u0447\u0438\u0442\u044c \u043a\u043e\u043d\u0432\u0435\u0440\u0441\u0438\u044e \u043d\u0430 25-40%.\n\n\u041c\u043e\u0433\u0443 \u043f\u043e\u043a\u0430\u0437\u0430\u0442\u044c \u0434\u0435\u043c\u043e \u0437\u0430 15 \u043c\u0438\u043d\u0443\u0442?\n\n\u0414\u043c\u0438\u0442\u0440\u0438\u0439 \u0418\u0432\u0430\u043d\u043e\u0432\nColdMail Demo',
      delay_days: 0,
      ai_personalize: true,
    },
    {
      id: '00000000-0000-0000-0000-000000000b22',
      sequence_id: seq2.id,
      order: 2,
      subject: 'Re: \u041f\u043e\u0432\u044b\u0441\u044c\u0442\u0435 \u043a\u043e\u043d\u0432\u0435\u0440\u0441\u0438\u044e \u043e\u0442\u0434\u0435\u043b\u0430 \u043f\u0440\u043e\u0434\u0430\u0436 {{company}}',
      body: '{{first_name}}, \u0434\u043e\u0431\u0440\u044b\u0439 \u0434\u0435\u043d\u044c!\n\n\u041f\u0440\u043e\u0441\u0442\u043e \u0445\u043e\u0442\u0435\u043b \u0443\u0442\u043e\u0447\u043d\u0438\u0442\u044c \u2014 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043b\u0438 \u043f\u043e\u0441\u043c\u043e\u0442\u0440\u0435\u0442\u044c \u043c\u043e\u0451 \u043f\u0440\u0435\u0434\u043b\u043e\u0436\u0435\u043d\u0438\u0435?\n\n\u041d\u0430\u0448 \u043a\u043b\u0438\u0435\u043d\u0442 \u0438\u0437 \u0440\u0438\u0442\u0435\u0439\u043b\u0430 \u0443\u0432\u0435\u043b\u0438\u0447\u0438\u043b \u043f\u0440\u043e\u0434\u0430\u0436\u0438 \u043d\u0430 35% \u0437\u0430 3 \u043c\u0435\u0441\u044f\u0446\u0430.\n\n\u0414\u043c\u0438\u0442\u0440\u0438\u0439',
      delay_days: 2,
      ai_personalize: false,
    },
    {
      id: '00000000-0000-0000-0000-000000000b23',
      sequence_id: seq2.id,
      order: 3,
      subject: '\u041a\u0435\u0439\u0441: +35% \u043f\u0440\u043e\u0434\u0430\u0436 \u0432 \u0440\u0438\u0442\u0435\u0439\u043b\u0435',
      body: '{{first_name}}, \u043f\u0440\u0438\u043a\u043b\u0430\u0434\u044b\u0432\u0430\u044e \u043a\u0435\u0439\u0441 \u043d\u0430\u0448\u0435\u0433\u043e \u043a\u043b\u0438\u0435\u043d\u0442\u0430 \u0438\u0437 \u043e\u0442\u0440\u0430\u0441\u043b\u0438 {{industry}}.\n\n\u041e\u0441\u043d\u043e\u0432\u043d\u044b\u0435 \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u044b:\n- \u041a\u043e\u043d\u0432\u0435\u0440\u0441\u0438\u044f \u043b\u0438\u0434\u043e\u0432: +35%\n- \u0421\u043a\u043e\u0440\u043e\u0441\u0442\u044c \u043e\u0431\u0440\u0430\u0431\u043e\u0442\u043a\u0438: -50%\n- ROI: 280%\n\n\u0413\u043e\u0442\u043e\u0432 \u043e\u0431\u0441\u0443\u0434\u0438\u0442\u044c \u043f\u043e\u0434\u0440\u043e\u0431\u043d\u0435\u0435?\n\n\u0414\u043c\u0438\u0442\u0440\u0438\u0439',
      delay_days: 4,
      ai_personalize: false,
    },
    {
      id: '00000000-0000-0000-0000-000000000b24',
      sequence_id: seq2.id,
      order: 4,
      subject: '\u041f\u043e\u0441\u043b\u0435\u0434\u043d\u0435\u0435 \u043f\u0440\u0435\u0434\u043b\u043e\u0436\u0435\u043d\u0438\u0435 \u043f\u043e CRM',
      body: '{{first_name}}, \u043f\u043e\u043d\u0438\u043c\u0430\u044e, \u0447\u0442\u043e \u0432\u044b \u0437\u0430\u043d\u044f\u0442\u044b.\n\n\u0415\u0441\u043b\u0438 \u0432\u043e\u043f\u0440\u043e\u0441 CRM \u0441\u0442\u0430\u043d\u0435\u0442 \u0430\u043a\u0442\u0443\u0430\u043b\u044c\u043d\u044b\u043c \u2014 \u043f\u0440\u043e\u0441\u0442\u043e \u043e\u0442\u0432\u0435\u0442\u044c\u0442\u0435 \u043d\u0430 \u044d\u0442\u043e \u043f\u0438\u0441\u044c\u043c\u043e. \u0411\u0443\u0434\u0443 \u0440\u0430\u0434 \u043f\u043e\u043c\u043e\u0447\u044c.\n\n\u0423\u0441\u043f\u0435\u0445\u043e\u0432!\n\u0414\u043c\u0438\u0442\u0440\u0438\u0439',
      delay_days: 5,
      ai_personalize: false,
    },
  ];

  for (const step of c2Steps) {
    await prisma.sequenceStep.upsert({
      where: { id: step.id },
      update: {},
      create: step,
    });
  }

  // Leads for campaign 2 (20 leads)
  const c2Leads = [
    { fn: '\u0418\u0432\u0430\u043d', ln: '\u0421\u043c\u0438\u0440\u043d\u043e\u0432', company: '\u0420\u043e\u0433\u0430 \u0438 \u041a\u043e\u043f\u044b\u0442\u0430', title: '\u0414\u0438\u0440\u0435\u043a\u0442\u043e\u0440 \u043f\u043e \u043f\u0440\u043e\u0434\u0430\u0436\u0430\u043c', industry: '\u0420\u0438\u0442\u0435\u0439\u043b', email: 'i.smirnov@rogaikopyta.fake', status: LeadStatus.contacted, step: 1 },
    { fn: '\u041f\u0435\u0442\u0440', ln: '\u0412\u0430\u0441\u0438\u043b\u044c\u0435\u0432', company: '\u0422\u043e\u0440\u0433\u041f\u043b\u044e\u0441', title: '\u041a\u043e\u043c\u043c\u0435\u0440\u0447\u0435\u0441\u043a\u0438\u0439 \u0434\u0438\u0440\u0435\u043a\u0442\u043e\u0440', industry: '\u041e\u043f\u0442\u043e\u0432\u0430\u044f \u0442\u043e\u0440\u0433\u043e\u0432\u043b\u044f', email: 'p.vasiliev@torgplus.fake', status: LeadStatus.new, step: 0 },
    { fn: '\u0415\u043a\u0430\u0442\u0435\u0440\u0438\u043d\u0430', ln: '\u0410\u043b\u0435\u043a\u0441\u0435\u0435\u0432\u0430', company: '\u041c\u0435\u0433\u0430\u0421\u0442\u0440\u043e\u0439', title: '\u0420\u0443\u043a\u043e\u0432\u043e\u0434\u0438\u0442\u0435\u043b\u044c \u043e\u0442\u0434\u0435\u043b\u0430 \u043f\u0440\u043e\u0434\u0430\u0436', industry: '\u0421\u0442\u0440\u043e\u0438\u0442\u0435\u043b\u044c\u0441\u0442\u0432\u043e', email: 'e.alekseeva@megastroy.fake', status: LeadStatus.contacted, step: 1 },
    { fn: '\u0412\u0438\u043a\u0442\u043e\u0440', ln: '\u041a\u0443\u0437\u044c\u043c\u0438\u043d', company: '\u0410\u0432\u0442\u043e\u041c\u0438\u0440', title: '\u0414\u0438\u0440\u0435\u043a\u0442\u043e\u0440 \u043f\u043e \u043f\u0440\u043e\u0434\u0430\u0436\u0430\u043c', industry: '\u0410\u0432\u0442\u043e\u043c\u043e\u0431\u0438\u043b\u0438', email: 'v.kuzmin@avtomir.fake', status: LeadStatus.new, step: 0 },
    { fn: '\u041b\u044e\u0434\u043c\u0438\u043b\u0430', ln: '\u0417\u0430\u0439\u0446\u0435\u0432\u0430', company: '\u0424\u0430\u0440\u043c\u0430\u041f\u0440\u043e', title: '\u0420\u0443\u043a\u043e\u0432\u043e\u0434\u0438\u0442\u0435\u043b\u044c \u043e\u0442\u0434\u0435\u043b\u0430 \u043f\u0440\u043e\u0434\u0430\u0436', industry: '\u0424\u0430\u0440\u043c\u0430\u0446\u0435\u0432\u0442\u0438\u043a\u0430', email: 'l.zaitseva@farmapro.fake', status: LeadStatus.replied, step: 2 },
    { fn: '\u041d\u0438\u043a\u043e\u043b\u0430\u0439', ln: '\u0411\u043e\u0433\u0434\u0430\u043d\u043e\u0432', company: '\u041f\u0440\u043e\u043c\u0422\u0435\u0445', title: '\u041a\u043e\u043c\u043c\u0435\u0440\u0447\u0435\u0441\u043a\u0438\u0439 \u0434\u0438\u0440\u0435\u043a\u0442\u043e\u0440', industry: '\u041f\u0440\u043e\u043c\u044b\u0448\u043b\u0435\u043d\u043d\u043e\u0441\u0442\u044c', email: 'n.bogdanov@promtech.fake', status: LeadStatus.new, step: 0 },
    { fn: '\u0421\u0432\u0435\u0442\u043b\u0430\u043d\u0430', ln: '\u041c\u0430\u043a\u0430\u0440\u043e\u0432\u0430', company: '\u0421\u0442\u0438\u043b\u044c\u041c\u043e\u0434\u0430', title: '\u0414\u0438\u0440\u0435\u043a\u0442\u043e\u0440 \u043f\u043e \u043f\u0440\u043e\u0434\u0430\u0436\u0430\u043c', industry: '\u041c\u043e\u0434\u0430 \u0438 \u043e\u0434\u0435\u0436\u0434\u0430', email: 's.makarova@stilmoda.fake', status: LeadStatus.contacted, step: 1 },
    { fn: '\u0412\u0430\u043b\u0435\u0440\u0438\u0439', ln: '\u0415\u0444\u0438\u043c\u043e\u0432', company: '\u041b\u043e\u0433\u0438\u0441\u0442\u0438\u043a\u0420\u0443', title: '\u041a\u043e\u043c\u043c\u0435\u0440\u0447\u0435\u0441\u043a\u0438\u0439 \u0434\u0438\u0440\u0435\u043a\u0442\u043e\u0440', industry: '\u041b\u043e\u0433\u0438\u0441\u0442\u0438\u043a\u0430', email: 'v.efimov@logistikru.fake', status: LeadStatus.new, step: 0 },
    { fn: '\u0422\u0430\u043c\u0430\u0440\u0430', ln: '\u0421\u0442\u0435\u043f\u0430\u043d\u043e\u0432\u0430', company: '\u041e\u0444\u0438\u0441\u041a\u043e\u043c\u043f\u043b\u0435\u043a\u0442', title: '\u0420\u0443\u043a\u043e\u0432\u043e\u0434\u0438\u0442\u0435\u043b\u044c \u043e\u0442\u0434\u0435\u043b\u0430 \u043f\u0440\u043e\u0434\u0430\u0436', industry: 'B2B \u0443\u0441\u043b\u0443\u0433\u0438', email: 't.stepanova@ofiskomplekt.fake', status: LeadStatus.contacted, step: 1 },
    { fn: '\u041a\u0438\u0440\u0438\u043b\u043b', ln: '\u0413\u0443\u0441\u0435\u0432', company: '\u0422\u0435\u043f\u043b\u043e\u041c\u0430\u0441\u0442\u0435\u0440', title: '\u0414\u0438\u0440\u0435\u043a\u0442\u043e\u0440 \u043f\u043e \u043f\u0440\u043e\u0434\u0430\u0436\u0430\u043c', industry: '\u041e\u0442\u043e\u043f\u043b\u0435\u043d\u0438\u0435 \u0438 \u0432\u0435\u043d\u0442\u0438\u043b\u044f\u0446\u0438\u044f', email: 'k.gusev@teplomaster.fake', status: LeadStatus.new, step: 0 },
    { fn: '\u041e\u043a\u0441\u0430\u043d\u0430', ln: '\u0414\u0430\u0432\u044b\u0434\u043e\u0432\u0430', company: '\u0420\u0435\u043a\u043b\u0430\u043c\u0430\u041f\u043b\u044e\u0441', title: '\u041a\u043e\u043c\u043c\u0435\u0440\u0447\u0435\u0441\u043a\u0438\u0439 \u0434\u0438\u0440\u0435\u043a\u0442\u043e\u0440', industry: '\u0420\u0435\u043a\u043b\u0430\u043c\u0430', email: 'o.davydova@reklamaplus.fake', status: LeadStatus.new, step: 0 },
    { fn: '\u0413\u0435\u043d\u043d\u0430\u0434\u0438\u0439', ln: '\u0424\u0438\u043b\u0438\u043f\u043f\u043e\u0432', company: '\u0421\u0442\u0440\u043e\u0439\u0421\u043d\u0430\u0431', title: '\u0414\u0438\u0440\u0435\u043a\u0442\u043e\u0440 \u043f\u043e \u043f\u0440\u043e\u0434\u0430\u0436\u0430\u043c', industry: '\u0421\u0442\u0440\u043e\u0439\u043c\u0430\u0442\u0435\u0440\u0438\u0430\u043b\u044b', email: 'g.filippov@stroysnab.fake', status: LeadStatus.contacted, step: 1 },
    { fn: '\u041b\u0430\u0440\u0438\u0441\u0430', ln: '\u041a\u043e\u0440\u043d\u0435\u0435\u0432\u0430', company: '\u041f\u0438\u0449\u0435\u041f\u0440\u043e\u043c', title: '\u0420\u0443\u043a\u043e\u0432\u043e\u0434\u0438\u0442\u0435\u043b\u044c \u043e\u0442\u0434\u0435\u043b\u0430 \u043f\u0440\u043e\u0434\u0430\u0436', industry: '\u041f\u0438\u0449\u0435\u0432\u0430\u044f \u043f\u0440\u043e\u043c\u044b\u0448\u043b\u0435\u043d\u043d\u043e\u0441\u0442\u044c', email: 'l.korneeva@pischeprom.fake', status: LeadStatus.new, step: 0 },
    { fn: '\u0410\u0440\u0442\u0451\u043c', ln: '\u0421\u0435\u043c\u0451\u043d\u043e\u0432', company: '\u042d\u043b\u0435\u043a\u0442\u0440\u043e\u0421\u043d\u0430\u0431', title: '\u041a\u043e\u043c\u043c\u0435\u0440\u0447\u0435\u0441\u043a\u0438\u0439 \u0434\u0438\u0440\u0435\u043a\u0442\u043e\u0440', industry: '\u042d\u043b\u0435\u043a\u0442\u0440\u043e\u0442\u0435\u0445\u043d\u0438\u043a\u0430', email: 'a.semyonov@elektrosnab.fake', status: LeadStatus.new, step: 0 },
    { fn: '\u0412\u0435\u0440\u043e\u043d\u0438\u043a\u0430', ln: '\u0418\u0441\u0430\u0435\u0432\u0430', company: '\u041c\u0435\u0434\u0422\u0435\u0445\u041f\u0440\u043e', title: '\u0414\u0438\u0440\u0435\u043a\u0442\u043e\u0440 \u043f\u043e \u043f\u0440\u043e\u0434\u0430\u0436\u0430\u043c', industry: '\u041c\u0435\u0434\u0438\u0446\u0438\u043d\u0441\u043a\u043e\u0435 \u043e\u0431\u043e\u0440\u0443\u0434\u043e\u0432\u0430\u043d\u0438\u0435', email: 'v.isaeva@medtechpro.fake', status: LeadStatus.contacted, step: 1 },
    { fn: '\u0412\u043b\u0430\u0434\u0438\u0441\u043b\u0430\u0432', ln: '\u0422\u043a\u0430\u0447\u0451\u0432', company: '\u0410\u0433\u0440\u043e\u041a\u043e\u043c\u043f\u043b\u0435\u043a\u0441', title: '\u041a\u043e\u043c\u043c\u0435\u0440\u0447\u0435\u0441\u043a\u0438\u0439 \u0434\u0438\u0440\u0435\u043a\u0442\u043e\u0440', industry: '\u0421\u0435\u043b\u044c\u0441\u043a\u043e\u0435 \u0445\u043e\u0437\u044f\u0439\u0441\u0442\u0432\u043e', email: 'v.tkachev@agrokomplex.fake', status: LeadStatus.new, step: 0 },
    { fn: '\u041c\u0430\u0440\u0438\u043d\u0430', ln: '\u041a\u043e\u043d\u0434\u0440\u0430\u0442\u044c\u0435\u0432\u0430', company: '\u0422\u0443\u0440\u0418\u043d\u0444\u043e', title: '\u0420\u0443\u043a\u043e\u0432\u043e\u0434\u0438\u0442\u0435\u043b\u044c \u043e\u0442\u0434\u0435\u043b\u0430 \u043f\u0440\u043e\u0434\u0430\u0436', industry: '\u0422\u0443\u0440\u0438\u0437\u043c', email: 'm.kondratyeva@turinfo.fake', status: LeadStatus.new, step: 0 },
    { fn: '\u0412\u044f\u0447\u0435\u0441\u043b\u0430\u0432', ln: '\u041e\u0440\u0435\u0445\u043e\u0432', company: '\u041c\u0435\u0442\u0430\u043b\u043b\u0422\u0440\u0435\u0439\u0434', title: '\u0414\u0438\u0440\u0435\u043a\u0442\u043e\u0440 \u043f\u043e \u043f\u0440\u043e\u0434\u0430\u0436\u0430\u043c', industry: '\u041c\u0435\u0442\u0430\u043b\u043b\u043e\u043f\u0440\u043e\u043a\u0430\u0442', email: 'v.orekhov@metalltrade.fake', status: LeadStatus.new, step: 0 },
    { fn: '\u0410\u043b\u0438\u043d\u0430', ln: '\u042f\u043a\u043e\u0432\u043b\u0435\u0432\u0430', company: '\u0411\u044e\u0440\u043e\u0422\u0435\u0445', title: '\u0420\u0443\u043a\u043e\u0432\u043e\u0434\u0438\u0442\u0435\u043b\u044c \u043e\u0442\u0434\u0435\u043b\u0430 \u043f\u0440\u043e\u0434\u0430\u0436', industry: '\u041e\u0440\u0433\u0442\u0435\u0445\u043d\u0438\u043a\u0430', email: 'a.yakovleva@byurotech.fake', status: LeadStatus.interested, step: 2 },
    { fn: '\u042d\u0434\u0443\u0430\u0440\u0434', ln: '\u0413\u0440\u043e\u043c\u043e\u0432', company: '\u0421\u0435\u043a\u044e\u0440\u0438\u0442\u0438\u041f\u0440\u043e', title: '\u041a\u043e\u043c\u043c\u0435\u0440\u0447\u0435\u0441\u043a\u0438\u0439 \u0434\u0438\u0440\u0435\u043a\u0442\u043e\u0440', industry: '\u041e\u0445\u0440\u0430\u043d\u043d\u044b\u0435 \u0441\u0438\u0441\u0442\u0435\u043c\u044b', email: 'e.gromov@securitypro.fake', status: LeadStatus.contacted, step: 1 },
  ];

  for (let i = 0; i < c2Leads.length; i++) {
    const l = c2Leads[i];
    const leadId = `00000000-0000-0000-0002-00000000${String(i + 1).padStart(2, '0')}02`;
    await prisma.lead.upsert({
      where: { id: leadId },
      update: {},
      create: {
        id: leadId,
        user_id: user.id,
        campaign_id: campaign2.id,
        email: l.email,
        first_name: l.fn,
        last_name: l.ln,
        company: l.company,
        title: l.title,
        industry: l.industry,
        status: l.status,
        current_step: l.step,
      },
    });
  }

  console.log(`Campaign 2: "${campaign2.name}" - ${c2Leads.length} leads`);

  // ══════════════════════════════════════════════════════════
  // ── Campaign 3: AI automation (draft) ──
  // ══════════════════════════════════════════════════════════
  const campaign3 = await prisma.campaign.upsert({
    where: { id: '00000000-0000-0000-0000-000000000c03' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000c03',
      user_id: user.id,
      name: 'AI-\u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0437\u0430\u0446\u0438\u044f \u0431\u0438\u0437\u043d\u0435\u0441-\u043f\u0440\u043e\u0446\u0435\u0441\u0441\u043e\u0432',
      status: CampaignStatus.draft,
      daily_limit: 40,
      total_leads: 10,
      sent_count: 0,
      opened_count: 0,
      replied_count: 0,
      bounced_count: 0,
      schedule: {
        days: ['mon', 'tue', 'wed', 'thu', 'fri'],
        start_hour: 9,
        end_hour: 17,
        timezone: 'Europe/Moscow',
      },
    },
  });

  // No sequence for campaign 3 (draft)

  const c3Leads = [
    { fn: '\u0410\u043d\u0434\u0440\u0435\u0439', ln: '\u0427\u0435\u0440\u043d\u043e\u0432', company: '\u0411\u0438\u0437\u043d\u0435\u0441\u0410\u0432\u0442\u043e', title: 'COO', industry: '\u0410\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0437\u0430\u0446\u0438\u044f', email: 'a.chernov@biznesavto.fake' },
    { fn: '\u0415\u043b\u0435\u043d\u0430', ln: '\u041a\u0440\u0430\u0441\u043d\u043e\u0432\u0430', company: '\u041f\u0440\u043e\u0446\u0435\u0441\u0441\u041f\u0440\u043e', title: '\u041e\u043f\u0435\u0440\u0430\u0446\u0438\u043e\u043d\u043d\u044b\u0439 \u0434\u0438\u0440\u0435\u043a\u0442\u043e\u0440', industry: '\u041a\u043e\u043d\u0441\u0430\u043b\u0442\u0438\u043d\u0433', email: 'e.krasnova@processpro.fake' },
    { fn: '\u0412\u0438\u043a\u0442\u043e\u0440', ln: '\u0411\u0435\u043b\u044f\u0435\u0432', company: '\u0421\u043c\u0430\u0440\u0442\u041e\u0444\u0438\u0441', title: 'COO', industry: '\u0423\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u0435', email: 'v.belyaev@smartofis.fake' },
    { fn: '\u041c\u0430\u0440\u0438\u043d\u0430', ln: '\u0412\u043e\u0440\u043e\u043d\u043e\u0432\u0430', company: '\u0424\u0438\u043d\u0422\u0435\u0445\u0420\u0443', title: '\u041e\u043f\u0435\u0440\u0430\u0446\u0438\u043e\u043d\u043d\u044b\u0439 \u0434\u0438\u0440\u0435\u043a\u0442\u043e\u0440', industry: 'FinTech', email: 'm.voronova@fintechru.fake' },
    { fn: '\u041e\u043b\u0435\u0433', ln: '\u041f\u0430\u043d\u043e\u0432', company: '\u041b\u043e\u0433\u0438\u0441\u0442\u0438\u043a\u041f\u0440\u043e', title: 'COO', industry: '\u041b\u043e\u0433\u0438\u0441\u0442\u0438\u043a\u0430', email: 'o.panov@logistikpro.fake' },
    { fn: '\u0421\u0432\u0435\u0442\u043b\u0430\u043d\u0430', ln: '\u0420\u044b\u0436\u043e\u0432\u0430', company: '\u041c\u0430\u043d\u0443\u0444\u0430\u043a\u0442\u0443\u0440\u0430\u041f\u043b\u044e\u0441', title: '\u041e\u043f\u0435\u0440\u0430\u0446\u0438\u043e\u043d\u043d\u044b\u0439 \u043c\u0435\u043d\u0435\u0434\u0436\u0435\u0440', industry: '\u041f\u0440\u043e\u0438\u0437\u0432\u043e\u0434\u0441\u0442\u0432\u043e', email: 's.ryzhova@manufakturaplus.fake' },
    { fn: '\u0413\u0435\u043e\u0440\u0433\u0438\u0439', ln: '\u0421\u0430\u0432\u0438\u043d', company: '\u0420\u0438\u0442\u0435\u0439\u043b\u0411\u043e\u043a\u0441', title: 'COO', industry: '\u0420\u0438\u0442\u0435\u0439\u043b', email: 'g.savin@retailbox.fake' },
    { fn: '\u041d\u0430\u0434\u0435\u0436\u0434\u0430', ln: '\u041f\u0430\u0432\u043b\u043e\u0432\u0430', company: '\u042d\u043d\u0435\u0440\u0433\u043e\u041f\u0440\u043e', title: '\u041e\u043f\u0435\u0440\u0430\u0446\u0438\u043e\u043d\u043d\u044b\u0439 \u0434\u0438\u0440\u0435\u043a\u0442\u043e\u0440', industry: '\u042d\u043d\u0435\u0440\u0433\u0435\u0442\u0438\u043a\u0430', email: 'n.pavlova@energopro.fake' },
    { fn: '\u0410\u043d\u0442\u043e\u043d', ln: '\u041c\u0438\u0445\u0430\u0439\u043b\u043e\u0432', company: '\u0422\u0440\u0430\u043d\u0441\u041b\u043e\u0433\u0438\u043a', title: 'COO', industry: '\u0422\u0440\u0430\u043d\u0441\u043f\u043e\u0440\u0442', email: 'a.mikhailov@translogik.fake' },
    { fn: '\u042e\u043b\u0438\u044f', ln: '\u041a\u043e\u043c\u0430\u0440\u043e\u0432\u0430', company: '\u0425\u043e\u0440\u0435\u043a\u0430\u041f\u0440\u043e', title: '\u041e\u043f\u0435\u0440\u0430\u0446\u0438\u043e\u043d\u043d\u044b\u0439 \u043c\u0435\u043d\u0435\u0434\u0436\u0435\u0440', industry: 'HoReCa', email: 'y.komarova@horekapro.fake' },
  ];

  for (let i = 0; i < c3Leads.length; i++) {
    const l = c3Leads[i];
    const leadId = `00000000-0000-0000-0003-00000000${String(i + 1).padStart(2, '0')}03`;
    await prisma.lead.upsert({
      where: { id: leadId },
      update: {},
      create: {
        id: leadId,
        user_id: user.id,
        campaign_id: campaign3.id,
        email: l.email,
        first_name: l.fn,
        last_name: l.ln,
        company: l.company,
        title: l.title,
        industry: l.industry,
        status: LeadStatus.new,
        current_step: 0,
      },
    });
  }

  console.log(`Campaign 3: "${campaign3.name}" - ${c3Leads.length} leads`);

  // ══════════════════════════════════════════════════════════
  // ── Campaign 4: Partner program (paused) ──
  // ══════════════════════════════════════════════════════════
  const campaign4 = await prisma.campaign.upsert({
    where: { id: '00000000-0000-0000-0000-000000000c04' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000c04',
      user_id: user.id,
      name: '\u041f\u0430\u0440\u0442\u043d\u0451\u0440\u0441\u043a\u0430\u044f \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0430 \u0434\u043b\u044f \u0430\u0433\u0435\u043d\u0442\u0441\u0442\u0432',
      status: CampaignStatus.paused,
      daily_limit: 25,
      total_leads: 8,
      sent_count: 45,
      opened_count: 18,
      replied_count: 6,
      bounced_count: 0,
      schedule: {
        days: ['mon', 'tue', 'wed', 'thu', 'fri'],
        start_hour: 10,
        end_hour: 18,
        timezone: 'Europe/Moscow',
      },
      started_at: new Date('2026-03-20'),
    },
  });

  await prisma.campaignAccount.upsert({
    where: { campaign_id_account_id: { campaign_id: campaign4.id, account_id: account2.id } },
    update: {},
    create: { campaign_id: campaign4.id, account_id: account2.id },
  });

  // Sequence for campaign 4: 2 steps
  const seq4 = await prisma.sequence.upsert({
    where: { campaign_id: campaign4.id },
    update: {},
    create: { campaign_id: campaign4.id, id: '00000000-0000-0000-0000-0000000000a4' },
  });

  const c4Steps = [
    {
      id: '00000000-0000-0000-0000-000000000b41',
      sequence_id: seq4.id,
      order: 1,
      subject: '\u041f\u0430\u0440\u0442\u043d\u0451\u0440\u0441\u0442\u0432\u043e \u0441 ColdMail \u0434\u043b\u044f {{company}}',
      body: '\u0417\u0434\u0440\u0430\u0432\u0441\u0442\u0432\u0443\u0439\u0442\u0435, {{first_name}}!\n\n\u041c\u044b \u0437\u0430\u043f\u0443\u0441\u043a\u0430\u0435\u043c \u043f\u0430\u0440\u0442\u043d\u0451\u0440\u0441\u043a\u0443\u044e \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0443 \u0434\u043b\u044f \u043c\u0430\u0440\u043a\u0435\u0442\u0438\u043d\u0433\u043e\u0432\u044b\u0445 \u0430\u0433\u0435\u043d\u0442\u0441\u0442\u0432. \u041a\u043e\u043c\u0438\u0441\u0441\u0438\u044f 30% \u043e\u0442 \u043a\u0430\u0436\u0434\u043e\u0433\u043e \u043a\u043b\u0438\u0435\u043d\u0442\u0430 + \u0432\u044b\u0434\u0435\u043b\u0435\u043d\u043d\u044b\u0439 \u0430\u043a\u043a\u0430\u0443\u043d\u0442-\u043c\u0435\u043d\u0435\u0434\u0436\u0435\u0440.\n\n\u0418\u043d\u0442\u0435\u0440\u0435\u0441\u043d\u043e \u043e\u0431\u0441\u0443\u0434\u0438\u0442\u044c?\n\n\u0414\u043c\u0438\u0442\u0440\u0438\u0439 \u0418\u0432\u0430\u043d\u043e\u0432\nColdMail Demo',
      delay_days: 0,
      ai_personalize: true,
    },
    {
      id: '00000000-0000-0000-0000-000000000b42',
      sequence_id: seq4.id,
      order: 2,
      subject: 'Re: \u041f\u0430\u0440\u0442\u043d\u0451\u0440\u0441\u0442\u0432\u043e \u0441 ColdMail \u0434\u043b\u044f {{company}}',
      body: '{{first_name}}, \u0434\u043e\u0431\u0440\u044b\u0439 \u0434\u0435\u043d\u044c!\n\n\u0423\u0436\u0435 5 \u0430\u0433\u0435\u043d\u0442\u0441\u0442\u0432 \u043f\u0440\u0438\u0441\u043e\u0435\u0434\u0438\u043d\u0438\u043b\u0438\u0441\u044c \u043a \u043d\u0430\u0448\u0435\u0439 \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0435. \u0421\u0440\u0435\u0434\u043d\u0438\u0439 \u0434\u043e\u0445\u043e\u0434 \u043f\u0430\u0440\u0442\u043d\u0451\u0440\u0430 \u2014 150 000 \u20bd/\u043c\u0435\u0441.\n\n\u0413\u043e\u0442\u043e\u0432 \u0440\u0430\u0441\u0441\u043a\u0430\u0437\u0430\u0442\u044c \u043f\u043e\u0434\u0440\u043e\u0431\u043d\u043e\u0441\u0442\u0438 \u0437\u0430 15 \u043c\u0438\u043d\u0443\u0442.\n\n\u0414\u043c\u0438\u0442\u0440\u0438\u0439',
      delay_days: 3,
      ai_personalize: false,
    },
  ];

  for (const step of c4Steps) {
    await prisma.sequenceStep.upsert({
      where: { id: step.id },
      update: {},
      create: step,
    });
  }

  // Leads for campaign 4 (8 leads)
  const c4Leads = [
    { fn: '\u0410\u043b\u0435\u043a\u0441\u0430\u043d\u0434\u0440', ln: '\u0422\u0438\u0445\u043e\u043d\u043e\u0432', company: 'Digital Agency PRO', title: '\u0414\u0438\u0440\u0435\u043a\u0442\u043e\u0440', industry: 'Digital-\u0430\u0433\u0435\u043d\u0442\u0441\u0442\u0432\u043e', email: 'a.tikhonov@digagency.fake', status: LeadStatus.interested, step: 2 },
    { fn: '\u041a\u0440\u0438\u0441\u0442\u0438\u043d\u0430', ln: '\u0411\u0435\u043b\u043e\u0443\u0441\u043e\u0432\u0430', company: '\u041c\u0430\u0440\u043a\u0435\u0442\u0418\u043c\u043f\u0430\u043a\u0442', title: 'CEO', industry: '\u041c\u0430\u0440\u043a\u0435\u0442\u0438\u043d\u0433', email: 'k.belousova@marketimpact.fake', status: LeadStatus.meeting_booked, step: 2 },
    { fn: '\u0415\u0432\u0433\u0435\u043d\u0438\u0439', ln: '\u041d\u0435\u0441\u0442\u0435\u0440\u043e\u0432', company: 'LeadGen Studio', title: '\u0414\u0438\u0440\u0435\u043a\u0442\u043e\u0440', industry: '\u041b\u0438\u0434\u043e\u0433\u0435\u043d\u0435\u0440\u0430\u0446\u0438\u044f', email: 'e.nesterov@leadgenstudio.fake', status: LeadStatus.interested, step: 2 },
    { fn: '\u041f\u043e\u043b\u0438\u043d\u0430', ln: '\u041e\u0441\u0438\u043f\u043e\u0432\u0430', company: '\u0421\u041c\u041c\u041b\u0430\u0431', title: 'CEO', industry: 'SMM', email: 'p.osipova@smmlab.fake', status: LeadStatus.replied, step: 2 },
    { fn: '\u0414\u0435\u043d\u0438\u0441', ln: '\u041a\u0443\u0434\u0440\u044f\u0432\u0446\u0435\u0432', company: '\u0421\u0435\u043e\u041c\u0430\u0441\u0442\u0435\u0440', title: '\u0414\u0438\u0440\u0435\u043a\u0442\u043e\u0440', industry: 'SEO', email: 'd.kudryavtsev@seomaster.fake', status: LeadStatus.contacted, step: 1 },
    { fn: '\u0418\u0440\u0438\u043d\u0430', ln: '\u0417\u0443\u0431\u043a\u043e\u0432\u0430', company: '\u041a\u043e\u043d\u0442\u0435\u043d\u0442\u041f\u0440\u043e', title: 'CEO', industry: '\u041a\u043e\u043d\u0442\u0435\u043d\u0442-\u043c\u0430\u0440\u043a\u0435\u0442\u0438\u043d\u0433', email: 'i.zubkova@contentpro.fake', status: LeadStatus.meeting_booked, step: 2 },
    { fn: '\u0420\u0443\u0441\u043b\u0430\u043d', ln: '\u041c\u0443\u0445\u0430\u043c\u0435\u0434\u043e\u0432', company: 'PerformAds', title: '\u0414\u0438\u0440\u0435\u043a\u0442\u043e\u0440', industry: 'Performance-\u043c\u0430\u0440\u043a\u0435\u0442\u0438\u043d\u0433', email: 'r.mukhamedov@performads.fake', status: LeadStatus.interested, step: 2 },
    { fn: '\u041b\u044e\u0431\u043e\u0432\u044c', ln: '\u0413\u0430\u043b\u043a\u0438\u043d\u0430', company: 'PR-\u0410\u0433\u0435\u043d\u0442\u0441\u0442\u0432\u043e \u0413\u043e\u043b\u043e\u0441', title: 'CEO', industry: 'PR', email: 'l.galkina@golospr.fake', status: LeadStatus.contacted, step: 1 },
  ];

  const c4LeadIds: string[] = [];
  for (let i = 0; i < c4Leads.length; i++) {
    const l = c4Leads[i];
    const leadId = `00000000-0000-0000-0004-00000000${String(i + 1).padStart(2, '0')}04`;
    const lead = await prisma.lead.upsert({
      where: { id: leadId },
      update: {},
      create: {
        id: leadId,
        user_id: user.id,
        campaign_id: campaign4.id,
        email: l.email,
        first_name: l.fn,
        last_name: l.ln,
        company: l.company,
        title: l.title,
        industry: l.industry,
        status: l.status,
        current_step: l.step,
      },
    });
    c4LeadIds.push(lead.id);
  }

  console.log(`Campaign 4: "${campaign4.name}" - ${c4Leads.length} leads`);

  // ══════════════════════════════════════════════════════════
  // ── UniboxMessage records (campaigns 1 and 4) ──
  // ══════════════════════════════════════════════════════════

  // Campaign 1 replies
  const uniboxMessages = [
    {
      id: '00000000-0000-0000-0000-000000000d01',
      user_id: user.id,
      lead_id: c1LeadIds[1], // Maria Sidorova (replied)
      campaign_id: campaign1.id,
      account_id: account1.id,
      from_email: 'm.sidorova@datapro.fake',
      subject: 'Re: \u0420\u0430\u0437\u0440\u0430\u0431\u043e\u0442\u043a\u0430 \u043f\u043e\u0434 \u043a\u043b\u044e\u0447 \u0434\u043b\u044f DataPro Solutions',
      body: '\u0414\u043c\u0438\u0442\u0440\u0438\u0439, \u0434\u043e\u0431\u0440\u044b\u0439 \u0434\u0435\u043d\u044c!\n\n\u0421\u043f\u0430\u0441\u0438\u0431\u043e \u0437\u0430 \u043f\u0438\u0441\u044c\u043c\u043e. \u041c\u044b \u043a\u0430\u043a \u0440\u0430\u0437 \u0438\u0449\u0435\u043c \u043a\u043e\u043c\u0430\u043d\u0434\u0443 \u0434\u043b\u044f \u043d\u043e\u0432\u043e\u0433\u043e \u043f\u0440\u043e\u0435\u043a\u0442\u0430. \u041c\u043e\u0436\u0435\u0442\u0435 \u043f\u0440\u0438\u0441\u043b\u0430\u0442\u044c \u043f\u043e\u0440\u0442\u0444\u043e\u043b\u0438\u043e \u0438 \u0440\u0435\u0439\u0442\u044b?\n\n\u041c\u0430\u0440\u0438\u044f \u0421\u0438\u0434\u043e\u0440\u043e\u0432\u0430\nCEO, DataPro Solutions',
      read: false,
      status: 'new',
      received_at: new Date('2026-04-22T14:35:00Z'),
    },
    {
      id: '00000000-0000-0000-0000-000000000d02',
      user_id: user.id,
      lead_id: c1LeadIds[2], // Dmitriy Kozlov (interested)
      campaign_id: campaign1.id,
      account_id: account1.id,
      from_email: 'd.kozlov@cloudbase.fake',
      subject: 'Re: \u041f\u043e\u0441\u043b\u0435\u0434\u043d\u0435\u0435 \u043f\u0438\u0441\u044c\u043c\u043e \u043f\u043e \u0442\u0435\u043c\u0435 \u0430\u0443\u0442\u0441\u043e\u0440\u0441\u0438\u043d\u0433\u0430',
      body: '\u0414\u043c\u0438\u0442\u0440\u0438\u0439, \u0437\u0434\u0440\u0430\u0432\u0441\u0442\u0432\u0443\u0439\u0442\u0435!\n\n\u0418\u043d\u0442\u0435\u0440\u0435\u0441\u043d\u043e\u0435 \u043f\u0440\u0435\u0434\u043b\u043e\u0436\u0435\u043d\u0438\u0435. \u0414\u0430\u0432\u0430\u0439\u0442\u0435 \u0441\u043e\u0437\u0432\u043e\u043d\u0438\u043c\u0441\u044f \u043d\u0430 \u0441\u043b\u0435\u0434\u0443\u044e\u0449\u0435\u0439 \u043d\u0435\u0434\u0435\u043b\u0435. \u041a\u0430\u043a \u043d\u0430\u0441\u0447\u0451\u0442 \u0441\u0440\u0435\u0434\u044b \u0432 11:00?\n\n\u0414\u043c\u0438\u0442\u0440\u0438\u0439 \u041a\u043e\u0437\u043b\u043e\u0432\nCTO, CloudBase',
      read: true,
      status: 'replied',
      received_at: new Date('2026-04-25T10:12:00Z'),
    },
    {
      id: '00000000-0000-0000-0000-000000000d03',
      user_id: user.id,
      lead_id: c1LeadIds[6], // Mikhail Lebedev (replied)
      campaign_id: campaign1.id,
      account_id: account2.id,
      from_email: 'm.lebedev@codelab.fake',
      subject: 'Re: \u0420\u0430\u0437\u0440\u0430\u0431\u043e\u0442\u043a\u0430 \u043f\u043e\u0434 \u043a\u043b\u044e\u0447 \u0434\u043b\u044f \u041a\u043e\u0434\u041b\u0430\u0431',
      body: '\u041f\u0440\u0438\u0432\u0435\u0442, \u0414\u043c\u0438\u0442\u0440\u0438\u0439!\n\n\u0421\u0435\u0439\u0447\u0430\u0441 \u0443 \u043d\u0430\u0441 \u0432\u0441\u0451 \u0437\u0430\u043a\u0440\u044b\u0442\u043e, \u043d\u043e \u0432 Q3 \u043f\u043b\u0430\u043d\u0438\u0440\u0443\u0435\u043c \u043d\u043e\u0432\u044b\u0439 \u043f\u0440\u043e\u0435\u043a\u0442. \u041c\u043e\u0436\u043d\u043e \u0432\u0435\u0440\u043d\u0443\u0442\u044c\u0441\u044f \u043a \u0440\u0430\u0437\u0433\u043e\u0432\u043e\u0440\u0443 \u0432 \u0438\u044e\u043d\u0435?\n\n\u041c\u0438\u0445\u0430\u0438\u043b',
      read: false,
      status: 'new',
      received_at: new Date('2026-04-27T16:45:00Z'),
    },
    // Campaign 4 replies
    {
      id: '00000000-0000-0000-0000-000000000d04',
      user_id: user.id,
      lead_id: c4LeadIds[1], // Kristina Belousova (meeting_booked)
      campaign_id: campaign4.id,
      account_id: account2.id,
      from_email: 'k.belousova@marketimpact.fake',
      subject: 'Re: \u041f\u0430\u0440\u0442\u043d\u0451\u0440\u0441\u0442\u0432\u043e \u0441 ColdMail \u0434\u043b\u044f \u041c\u0430\u0440\u043a\u0435\u0442\u0418\u043c\u043f\u0430\u043a\u0442',
      body: '\u0414\u043c\u0438\u0442\u0440\u0438\u0439, \u0437\u0434\u0440\u0430\u0432\u0441\u0442\u0432\u0443\u0439\u0442\u0435!\n\n\u041e\u0447\u0435\u043d\u044c \u0438\u043d\u0442\u0435\u0440\u0435\u0441\u043d\u043e! \u041c\u044b \u0434\u0430\u0432\u043d\u043e \u0438\u0449\u0435\u043c \u0438\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442 \u0434\u043b\u044f \u0445\u043e\u043b\u043e\u0434\u043d\u044b\u0445 \u0440\u0430\u0441\u0441\u044b\u043b\u043e\u043a. \u0414\u0430\u0432\u0430\u0439\u0442\u0435 \u0441\u043e\u0437\u0432\u043e\u043d\u0438\u043c\u0441\u044f \u0432 \u043f\u044f\u0442\u043d\u0438\u0446\u0443 \u0432 14:00.\n\n\u041a\u0440\u0438\u0441\u0442\u0438\u043d\u0430 \u0411\u0435\u043b\u043e\u0443\u0441\u043e\u0432\u0430\nCEO, \u041c\u0430\u0440\u043a\u0435\u0442\u0418\u043c\u043f\u0430\u043a\u0442',
      read: true,
      status: 'replied',
      received_at: new Date('2026-04-18T11:20:00Z'),
    },
    {
      id: '00000000-0000-0000-0000-000000000d05',
      user_id: user.id,
      lead_id: c4LeadIds[5], // Irina Zubkova (meeting_booked)
      campaign_id: campaign4.id,
      account_id: account2.id,
      from_email: 'i.zubkova@contentpro.fake',
      subject: 'Re: \u041f\u0430\u0440\u0442\u043d\u0451\u0440\u0441\u0442\u0432\u043e \u0441 ColdMail \u0434\u043b\u044f \u041a\u043e\u043d\u0442\u0435\u043d\u0442\u041f\u0440\u043e',
      body: '\u0414\u043e\u0431\u0440\u044b\u0439 \u0434\u0435\u043d\u044c, \u0414\u043c\u0438\u0442\u0440\u0438\u0439!\n\n\u041c\u044b \u043a\u0430\u043a \u0440\u0430\u0437 \u0440\u0430\u0441\u0448\u0438\u0440\u044f\u0435\u043c \u043b\u0438\u043d\u0435\u0439\u043a\u0443 \u0443\u0441\u043b\u0443\u0433 \u0438 \u0445\u043e\u0442\u0438\u043c \u0434\u043e\u0431\u0430\u0432\u0438\u0442\u044c email-\u043c\u0430\u0440\u043a\u0435\u0442\u0438\u043d\u0433. \u0414\u0430\u0432\u0430\u0439\u0442\u0435 \u043e\u0431\u0441\u0443\u0434\u0438\u043c \u0443\u0441\u043b\u043e\u0432\u0438\u044f \u043f\u0430\u0440\u0442\u043d\u0451\u0440\u0441\u0442\u0432\u0430.\n\n\u041c\u043e\u0436\u0435\u043c \u0441\u043e\u0437\u0432\u043e\u043d\u0438\u0442\u044c\u0441\u044f \u0432\u043e \u0432\u0442\u043e\u0440\u043d\u0438\u043a \u0432 16:00?\n\n\u0418\u0440\u0438\u043d\u0430 \u0417\u0443\u0431\u043a\u043e\u0432\u0430\nCEO, \u041a\u043e\u043d\u0442\u0435\u043d\u0442\u041f\u0440\u043e',
      read: false,
      status: 'new',
      received_at: new Date('2026-04-20T09:30:00Z'),
    },
    {
      id: '00000000-0000-0000-0000-000000000d06',
      user_id: user.id,
      lead_id: c4LeadIds[3], // Polina Osipova (replied)
      campaign_id: campaign4.id,
      account_id: account2.id,
      from_email: 'p.osipova@smmlab.fake',
      subject: 'Re: \u041f\u0430\u0440\u0442\u043d\u0451\u0440\u0441\u0442\u0432\u043e \u0441 ColdMail \u0434\u043b\u044f \u0421\u041c\u041c\u041b\u0430\u0431',
      body: '\u0414\u043c\u0438\u0442\u0440\u0438\u0439,\n\n\u0421\u043f\u0430\u0441\u0438\u0431\u043e \u0437\u0430 \u043f\u0440\u0435\u0434\u043b\u043e\u0436\u0435\u043d\u0438\u0435. \u041f\u043e\u043a\u0430 \u043d\u0435 \u0433\u043e\u0442\u043e\u0432\u044b, \u043d\u043e \u0432\u0435\u0440\u043d\u0451\u043c\u0441\u044f \u043a \u044d\u0442\u043e\u043c\u0443 \u0432 \u0441\u043b\u0435\u0434\u0443\u044e\u0449\u0435\u043c \u043a\u0432\u0430\u0440\u0442\u0430\u043b\u0435.\n\n\u041f\u043e\u043b\u0438\u043d\u0430',
      read: true,
      status: 'read',
      received_at: new Date('2026-04-15T13:10:00Z'),
    },
  ];

  for (const msg of uniboxMessages) {
    await prisma.uniboxMessage.upsert({
      where: { id: msg.id },
      update: {},
      create: msg,
    });
  }

  console.log(`UniboxMessages: ${uniboxMessages.length} replies created`);

  console.log('\nSeed completed successfully!');
  console.log('Login: demo@coldmail.ru / Demo2026!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
