# 🤖 AI Caption Generation Setup Guide

Complete guide to use Claude AI for generating social media captions.

---

## 🔑 Get Your Anthropic API Key

### Step 1: Sign Up for Anthropic
1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to **API Keys** section
4. Click **Create Key**
5. Copy your API key (starts with `sk-ant-api03-...`)

### Step 2: Add to Your .env File

```bash
# Add this line to your .env file
ANTHROPIC_API_KEY=sk-ant-api03-your_actual_key_here
```

---

## 🚀 How to Use

### 1. Open the Dashboard
Go to http://localhost:3000

### 2. Click "✨ AI Generate Caption"
Located below the post textarea

### 3. Fill in the Form
- **Topic**: What you want to post about
  - Example: "Benefits of using automation tools"
- **Niche**: Select your business niche
  - Restaurant Tools
  - E-commerce
  - Content Creation
  - Cost-Saving
  - Real Estate
  - General
- **Platform**: Target platform
  - LinkedIn (Professional, thought-leadership)
  - Twitter/X (Casual, punchy)
  - Instagram (Trendy, emoji-heavy)

### 4. Generate Captions
Click "🚀 Generate Captions"

### 5. Choose Your Favorite
- Claude generates **3 unique variations**
- Each optimized for your selected platform
- Click any variation to use it
- Caption fills the textarea automatically!

---

## 💡 Features

### Platform-Specific Optimization

**LinkedIn Captions:**
- Professional tone
- 3-5 sentences
- Thought-leadership style
- 2-3 relevant hashtags
- Actionable insights

**Twitter/X Captions:**
- Casual and punchy
- Under 250 characters
- Engaging hook
- 2-3 hashtags
- Shareable content

**Instagram Captions:**
- Trendy and engaging
- Multiple paragraphs
- 3-5 emojis
- 10-15 hashtags
- Call-to-action

---

## 🎯 Example Workflow

### Example 1: Restaurant Tools
```
Topic: "AI menu optimization"
Niche: Restaurant Tools
Platform: LinkedIn

Result:
✅ 3 professional captions about AI in restaurants
✅ Each highlighting different benefits
✅ Ready to post immediately
```

### Example 2: E-commerce
```
Topic: "Abandoned cart recovery strategies"
Niche: E-commerce
Platform: Instagram

Result:
✅ 3 engaging Instagram captions
✅ Emoji-rich and trendy
✅ Perfect for e-commerce audience
```

---

## 💰 Pricing

### Anthropic API Costs:
- **Input**: ~$3 per million tokens
- **Output**: ~$15 per million tokens
- **Per caption generation**: ~$0.01 - 0.02
- **100 captions/day**: ~$1-2/day

### Free Tier:
- $5 free credits on signup
- ~250-500 caption generations free

---

## 🔧 Technical Details

### Model Used:
- **claude-sonnet-4-20250514**
- Latest Sonnet 4 model
- Best balance of speed and quality
- Released 2025

### Generation Process:
1. Takes your topic + niche + platform
2. Creates platform-specific prompt
3. Generates 3 unique variations
4. Each variation has different style/approach
5. Returns optimized captions

### Response Time:
- ~5-10 seconds per generation
- Generates 3 captions sequentially
- Shows loading animation

---

## 🎨 UI Features

### Modal Design:
- Dark theme matching your dashboard
- Clean, professional interface
- Easy-to-use form
- Loading animation during generation
- Beautiful caption cards

### Caption Cards Show:
- Variation number (1, 2, 3)
- Character count
- Full caption text
- "Use This Caption" button

### Smart Features:
- Auto-detects platform from checkboxes
- Purple highlight when caption is used
- Can generate new variations anytime
- Modal closes automatically on selection

---

## ⚠️ Error Handling

### Common Errors:

**"AI service not configured"**
- Missing ANTHROPIC_API_KEY in .env
- Solution: Add your API key to .env file

**"Invalid Anthropic API key"**
- Wrong or expired API key
- Solution: Get a new key from Anthropic console

**"Rate limit exceeded"**
- Too many requests
- Solution: Wait a moment and try again

**"Failed to generate captions"**
- Network issue or API error
- Solution: Check internet connection, try again

---

## 🎯 Pro Tips

### 1. Be Specific with Topics
**Good:**
- "5 ways to reduce restaurant food waste"
- "How to recover abandoned carts with email"

**Bad:**
- "Food"
- "E-commerce tips"

### 2. Match Platform to Audience
- LinkedIn: Business, professional audience
- Twitter: Quick insights, viral potential
- Instagram: Visual, engaging, community

### 3. Generate Multiple Times
- Try different topic phrasings
- Test different platform styles
- Mix and match the best parts

### 4. Customize After Generation
- Edit the caption to add personal touch
- Add your own hashtags
- Include your brand voice

---

## 📊 Use Cases

### For UGC Creators:
- Generate 100s of captions for different niches
- Maintain consistent posting
- Scale to multiple accounts

### For Agencies:
- Client-specific captions
- Multiple brand voices
- Fast turnaround

### For Entrepreneurs:
- Build in public content
- Product launch announcements
- Thought leadership posts

---

## 🚀 Next Steps

1. Get your Anthropic API key
2. Add to .env file
3. Restart server: `npm start`
4. Test with a caption generation
5. Start automating your content!

---

## 🔗 Resources

- [Anthropic Console](https://console.anthropic.com/)
- [Claude API Docs](https://docs.anthropic.com/)
- [API Pricing](https://www.anthropic.com/pricing)
- [Rate Limits](https://docs.anthropic.com/claude/reference/rate-limits)

---

**Built with Claude Sonnet 4** 🤖  
**For Y Combinator Application** 🚀  
**Author**: Aj (@ajay-automates)

