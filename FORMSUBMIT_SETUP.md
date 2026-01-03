# Jotform Setup for TinniTune Feedback Form

The feedback form uses **Jotform** to collect user feedback with reliable email notifications and data storage.

## ✅ Current Setup

**Form URL:** https://form.jotform.com/260024569118051
**Email Notifications:** derrick78@me.com
**Status:** Active and working

## How It Works

1. User clicks "Feedback" button in TinniTune
2. Modal opens explaining the feedback process
3. User clicks "Open Feedback Form"
4. Jotform opens in a new tab
5. User completes and submits the form
6. Submission is:
   - Stored in Jotform dashboard
   - Emailed to derrick78@me.com
   - Available for export (CSV, Excel, PDF)

## Form Fields

The form collects:
- **Email** (optional) - For follow-up
- **Relief Level** (required) - 1-10 scale rating
- **Primary Feature Used** (required) - Which feature they used
- **Your Experience** (required) - Open-ended feedback
- **Suggested Improvements** (optional) - Feature requests

## Accessing Submissions

### Via Email
- All submissions are sent to **derrick78@me.com**
- Instant delivery (no delays like Formsubmit)

### Via Jotform Dashboard
1. Log in to Jotform.com
2. Go to "My Forms"
3. Click on "TinniTune Feedback Form"
4. View submissions with analytics:
   - Response rates
   - Completion times
   - Drop-off analysis
   - Charts and graphs

### Export Data
- CSV for spreadsheets
- Excel for advanced analysis
- PDF for reports
- Google Sheets integration available

## Advantages Over Previous Solutions

**vs. Formsubmit.co:**
- ✅ **Reliable delivery** - Enterprise-grade (Formsubmit was not delivering emails)
- ✅ **Data storage** - Keep all submissions in one place
- ✅ **Analytics** - See trends and insights
- ✅ **Better UX** - Professional, mobile-optimized form

**vs. EmailJS:**
- ✅ **Simpler setup** - No API keys or templates needed
- ✅ **Better data management** - Built-in dashboard

**vs. Netlify Forms:**
- ✅ **Works on GitHub Pages** - Not locked to Netlify hosting

## Updating the Form

To modify the form fields or settings:

1. Log in to Jotform.com
2. Go to "My Forms" → "TinniTune Feedback Form"
3. Click "Edit Form"
4. Make changes in the visual editor
5. Click "Publish"
6. No code changes needed! The URL stays the same

## Changing the Form URL

If you create a new form or want to use a different one:

Edit `src/components/FeedbackForm.jsx` line 11:
```javascript
window.open('https://form.jotform.com/YOUR_NEW_FORM_ID', '_blank');
```

## Free Tier Limits

- **100 submissions/month** - More than enough for focus group
- **5 forms** - Can create additional forms if needed
- **100MB storage** - Plenty for text responses
- Upgrade available if you need more

## Privacy & Security

- Jotform is GDPR/HIPAA compliant
- SSL encrypted submissions
- Data hosted securely
- Can delete submissions anytime
- Export and delete account if needed

## Troubleshooting

### Form not opening?
1. Check browser console for errors
2. Verify popup blocker isn't blocking new tab
3. Test the URL directly: https://form.jotform.com/260024569118051

### Not receiving email notifications?
1. Check spam folder in derrick78@me.com
2. Verify email settings in Jotform dashboard
3. Submissions are still saved in Jotform even if email fails

### Want to test the form?
Just click the feedback button in the app or visit:
https://form.jotform.com/260024569118051

## More Info

- Jotform Docs: https://www.jotform.com/help/
- Free tier: 100 submissions/month
- Support: Available via Jotform dashboard
