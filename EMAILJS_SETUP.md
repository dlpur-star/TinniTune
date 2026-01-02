# EmailJS Setup Instructions for TinniTune Feedback Form

The feedback form now uses EmailJS to send submissions directly to **derrick78@me.com**.

## Setup Steps

### 1. Create EmailJS Account

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Click "Sign Up" and create a free account
3. Verify your email address

### 2. Add Email Service

1. In the EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose **Gmail** (recommended) or your preferred email provider
4. Follow the authorization steps to connect your email
5. Note the **Service ID** (e.g., `service_tinnitune`)

### 3. Create Email Template

1. Go to **Email Templates**
2. Click **Create New Template**
3. Set the **Template Name**: `TinniTune Feedback`
4. Note the **Template ID** (e.g., `template_feedback`)

#### Template Content:

**Subject:**
```
TinniTune Feedback - {{feature_used}} - Rating: {{relief_rating}}/10
```

**Body:**
```
New TinniTune Feedback Submission
=====================================

📅 Submitted: {{submission_date}}
📧 User Email: {{from_email}}

⭐ Relief Rating: {{relief_rating}}/10
🎯 Feature Used: {{feature_used}}

💬 User Feedback:
{{feedback}}

💡 Suggested Improvements:
{{improvements}}

=====================================
Sent via TinniTune Feedback Form
```

**To Email:**
```
{{to_email}}
```

5. Click **Save**

### 4. Get Your Public Key

1. Go to **Account** → **General**
2. Find your **Public Key** (looks like: `xYz123aBc456dEf`)
3. Copy this key

### 5. Update the Code

Edit `/src/components/FeedbackForm.jsx` and replace the configuration:

```javascript
const EMAILJS_CONFIG = {
  serviceId: 'YOUR_SERVICE_ID',      // From step 2
  templateId: 'YOUR_TEMPLATE_ID',    // From step 3
  publicKey: 'YOUR_PUBLIC_KEY'       // From step 4
};
```

### 6. Build and Deploy

```bash
npm run build
npm run deploy
```

## Testing

1. Visit your deployed site
2. Open the feedback form
3. Fill in all required fields
4. Submit the form
5. Check **derrick78@me.com** for the email

## Free Tier Limits

EmailJS free tier includes:
- ✅ 200 emails/month
- ✅ Unlimited templates
- ✅ Basic email services
- ✅ No credit card required

## Troubleshooting

### No emails received?

1. Check EmailJS dashboard → **Email Log** for delivery status
2. Check spam folder in derrick78@me.com
3. Verify the template variables match the code
4. Check browser console for errors

### "Failed to send" error?

1. Verify all three config values are correct
2. Check that the Public Key is from the **Account** page (not API key)
3. Make sure the service is connected and active
4. Check EmailJS account is verified

### Template variables not showing?

Make sure the template uses these exact variable names:
- `{{to_email}}`
- `{{from_email}}`
- `{{relief_rating}}`
- `{{feature_used}}`
- `{{feedback}}`
- `{{improvements}}`
- `{{submission_date}}`

## Support

- EmailJS Docs: https://www.emailjs.com/docs/
- EmailJS Support: https://www.emailjs.com/support/
