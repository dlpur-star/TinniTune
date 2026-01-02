# Formsubmit.co Setup for TinniTune Feedback Form

The feedback form uses **Formsubmit.co** to send submissions directly to **derrick78@me.com**.

## ✨ Super Simple Setup (No Account Needed!)

### How It Works

1. The form is already configured to send to `derrick78@me.com`
2. On the **first submission**, Formsubmit will send a verification email to `derrick78@me.com`
3. Click the activation link in that email
4. That's it! The form will work from then on

### Setup Steps

1. **Deploy the site:**
   ```bash
   npm run build
   npm run deploy
   ```

2. **Test the form:**
   - Visit your deployed site on GitHub Pages
   - Fill out and submit the feedback form
   - This will trigger the verification email

3. **Check your email:**
   - Look for an email from Formsubmit.co in `derrick78@me.com`
   - Subject: "Activate Form Submission"
   - Click the activation link

4. **Done!**
   - All future submissions will go straight to `derrick78@me.com`
   - No further action needed

## Email Format

You'll receive emails with this format:

**Subject:** TinniTune Feedback Submission

**Body:**
```
Email: user@example.com (or empty if not provided)
Relief Rating: 8
Feature Used: notched-therapy
Feedback: [User's feedback text]
Improvements: [User's suggestions]
```

## Features Included

✅ **Spam Protection** - Honeypot field blocks bots
✅ **No CAPTCHA** - Disabled for better UX
✅ **Nice Formatting** - Uses "box" template for readable emails
✅ **Custom Subject** - All emails have "TinniTune Feedback Submission" subject
✅ **Free Forever** - No limits, no account needed

## Troubleshooting

### Not receiving emails?

1. Check spam/junk folder in `derrick78@me.com`
2. Make sure you clicked the activation link in the first email
3. Try submitting another test

### Form not submitting?

1. Check browser console for errors
2. Make sure all required fields are filled (*Relief Level, *Feature Used, *Feedback)
3. Verify the site is deployed to GitHub Pages (not running locally)

### Want to change the destination email?

Edit `src/components/FeedbackForm.jsx` line 12:
```javascript
action="https://formsubmit.co/YOUR_NEW_EMAIL@example.com"
```

Then rebuild and deploy. You'll need to activate the new email address.

## Advantages Over Other Solutions

- **EmailJS**: Required complex dashboard setup, templates, and API keys
- **Netlify Forms**: Only works on Netlify hosting (not GitHub Pages)
- **Formsubmit.co**: ✅ Works on GitHub Pages, zero config, just works!

## More Info

- Formsubmit Docs: https://formsubmit.co/
- Free tier: Unlimited submissions
- Privacy: Formsubmit doesn't store form data, just forwards to email
