wait sendNotifications(summaryPath, config);
  } catch (error) {
    console.error('\n❌ Failed to send notifications:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
  sesRegion: process.env.SES_REGION || 'us-east-1'
    } : undefined,
    sns: process.env.SNS_TOPIC_ARN ? {
      topicArn: process.env.SNS_TOPIC_ARN
    } : undefined
  };
  
  // Check if any notification channel is configured
  if (!config.slack && !config.email && !config.sns) {
    console.log('⚠️  No notification channels configured. Skipping notifications.');
    console.log('   Configure SLACK_WEBHOOK_URL, EMAIL_RECIPIENTS, or SNS_TOPIC_ARN to enable notifications.');
    return;
  }
  
  try {
    a new Error(`Slack API error: ${response.statusText}`);
  }
}

async function main() {
  const summaryPath = process.argv[2] || './reports/rtm-summary.json';
  
  // Load notification config from environment or file
  const config: NotificationConfig = {
    slack: process.env.SLACK_WEBHOOK_URL ? {
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
      channel: process.env.SLACK_CHANNEL
    } : undefined,
    email: process.env.EMAIL_RECIPIENTS ? {
      recipients: process.env.EMAIL_RECIPIENTS.split(','),
    {
  const payload = {
    text: title,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: title
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message.replace(/\n/g, '\n')
        }
      }
    ]
  };
  
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    throw.accessibility.passed ? '✅ Passed' : '❌ Failed'} 
          (${summary.accessibility.violations} violations)
        </li>
      </ul>
    </div>
    
    <p style="margin-top: 30px; padding: 15px; background: ${statusColor}; color: white; text-align: center;">
      ${summary.passed ? '✅ Ready for deployment' : '❌ Deployment blocked due to quality gate failures'}
    </p>
  </div>
</body>
</html>
  `.trim();
}

async function sendSlackNotification(webhookUrl: string, title: string, message: string): Promise<void> uality Metrics</div>
      <ul>
        <li class="${summary.performance.passed ? 'pass' : 'fail'}">
          Performance: ${summary.performance.passed ? '✅ Passed' : '❌ Failed'}
        </li>
        <li class="${summary.security.passed ? 'pass' : 'fail'}">
          Security: ${summary.security.passed ? '✅ Passed' : '❌ Failed'} 
          (${summary.security.vulnerabilities} vulnerabilities)
        </li>
        <li class="${summary.accessibility.passed ? 'pass' : 'fail'}">
          Accessibility: ${summary     <tr><th>Status</th><th>Count</th></tr>
        <tr><td>Total Tests</td><td>${summary.tests.total}</td></tr>
        <tr><td class="pass">Passed</td><td>${summary.tests.passed}</td></tr>
        <tr><td class="fail">Failed</td><td>${summary.tests.failed}</td></tr>
        <tr><td>Skipped</td><td>${summary.tests.skipped}</td></tr>
        <tr><th>Success Rate</th><th>${summary.tests.successRate.toFixed(2)}%</th></tr>
      </table>
    </div>
    
    <div class="metric">
      <div class="metric-title">Q
        <tr><th>Overall</th><th>${summary.coverage.overall.toFixed(2)}%</th></tr>
      </table>
    </div>
    
    <div class="metric">
      <div class="metric-title">Requirements Traceability</div>
      <p>
        <strong>${summary.requirements.covered}</strong> of <strong>${summary.requirements.total}</strong> requirements covered
        (${summary.requirements.coverage.toFixed(2)}%)
      </p>
    </div>
    
    <div class="metric">
      <div class="metric-title">Test Execution</div>
      <table>
   <body>
  <div class="header">
    <h1>RTM Quality Gate: ${statusText}</h1>
  </div>
  
  <div class="content">
    <div class="metric">
      <div class="metric-title">Test Coverage</div>
      <table>
        <tr><th>Platform</th><th>Coverage</th></tr>
        <tr><td>Backend</td><td>${summary.coverage.backend.toFixed(2)}%</td></tr>
        <tr><td>Admin Portal</td><td>${summary.coverage.adminPortal.toFixed(2)}%</td></tr>
        <tr><td>Mobile App</td><td>${summary.coverage.mobileApp.toFixed(2)}%</td></tr>te; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .metric { margin: 15px 0; padding: 15px; background: #f8f9fa; border-left: 4px solid #007bff; }
    .metric-title { font-weight: bold; margin-bottom: 5px; }
    .pass { color: #28a745; }
    .fail { color: #dc3545; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f8f9fa; font-weight: bold; }
  </style>
</head>
(${summary.accessibility.violations} violations)

${summary.passed ? 'Ready for deployment.' : 'Deployment blocked due to quality gate failures.'}
`.trim();
}

function generateHtmlEmail(summary: any): string {
  const statusColor = summary.passed ? '#28a745' : '#dc3545';
  const statusText = summary.passed ? 'PASSED' : 'FAILED';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: ${statusColor}; color: whirements.covered} (${summary.requirements.coverage.toFixed(2)}%)

Tests:
- Total: ${summary.tests.total}
- Passed: ${summary.tests.passed}
- Failed: ${summary.tests.failed}
- Success Rate: ${summary.tests.successRate.toFixed(2)}%

Quality Metrics:
- Performance: ${summary.performance.passed ? '✅ Passed' : '❌ Failed'}
- Security: ${summary.security.passed ? '✅ Passed' : '❌ Failed'} (${summary.security.vulnerabilities} vulnerabilities)
- Accessibility: ${summary.accessibility.passed ? '✅ Passed' : '❌ Failed'} \n✅ Notifications sent successfully');
}

function generateNotificationMessage(summary: any): string {
  const status = summary.passed ? '✅ PASSED' : '❌ FAILED';
  
  return `
RTM Quality Gate: ${status}

Coverage:
- Backend: ${summary.coverage.backend.toFixed(2)}%
- Admin Portal: ${summary.coverage.adminPortal.toFixed(2)}%
- Mobile App: ${summary.coverage.mobileApp.toFixed(2)}%
- Overall: ${summary.coverage.overall.toFixed(2)}%

Requirements:
- Total: ${summary.requirements.total}
- Covered: ${summary.requi      });
      console.log('✅ SNS notification sent');
    } catch (error) {
      console.error('❌ Failed to send SNS notification:', error);
    }
  }
  
  console.log('recipients,
        subject,
        body: message,
        html: generateHtmlEmail(summary)
      });
      console.log(`✅ Email sent to ${config.email.recipients.length} recipient(s)`);
    } catch (error) {
      console.error('❌ Failed to send email:', error);
    }
  }
  
  // Send SNS notification
  if (config.sns?.topicArn) {
    console.log('Sending SNS notification...');
    try {
      await notificationService.publishToSNS({
        topicArn: config.sns.topicArn,
        subject,
        message
   console.log('Sending Slack notification...');
    try {
      await sendSlackNotification(config.slack.webhookUrl, subject, message);
      console.log('✅ Slack notification sent');
    } catch (error) {
      console.error('❌ Failed to send Slack notification:', error);
    }
  }
  
  // Send email notification
  if (config.email?.recipients && config.email.recipients.length > 0) {
    console.log('Sending email notifications...');
    try {
      await notificationService.sendEmail({
        to: config.email..exit(1);
  }
  
  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
  const notificationService = new NotificationService();
  
  console.log('📧 Sending RTM Notifications\n');
  
  // Prepare notification content
  const subject = summary.passed 
    ? '✅ RTM Quality Gate Passed'
    : '❌ RTM Quality Gate Failed';
  
  const message = generateNotificationMessage(summary);
  
  // Send Slack notification
  if (config.slack?.webhookUrl) {
 s/notification-service';
import * as fs from 'fs';
import * as path from 'path';

interface NotificationConfig {
  slack?: {
    webhookUrl: string;
    channel?: string;
  };
  email?: {
    recipients: string[];
    sesRegion: string;
  };
  sns?: {
    topicArn: string;
  };
}

async function sendNotifications(summaryPath: string, config: NotificationConfig): Promise<void> {
  // Load RTM summary
  if (!fs.existsSync(summaryPath)) {
    console.error(`❌ Summary file not found: ${summaryPath}`);
    process Send notifications about RTM results to configured channels
 */

import { NotificationService } from '../service#!/usr/bin/env ts-node
/**
 *