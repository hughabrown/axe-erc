# HRDD Assessment Tool - Testing Guide

## Test Mode (No API Credits Used)

To test the HRDD UI without making real API calls and burning credits:

### Enable Test Mode

1. Make sure `.env.local` contains:
   ```bash
   NEXT_PUBLIC_HRDD_TEST_MODE=true
   ```

2. Restart the dev server:
   ```bash
   npm run dev
   ```

3. You'll see a yellow banner at the top: **⚠️ TEST MODE: Using mock data**

### What Test Mode Does

- **No Firecrawl API calls** - Skips web searches entirely
- **No OpenAI API calls** - Skips LLM analysis
- **Mock data** - Uses realistic sample data to simulate the workflow
- **Full UI testing** - All UI components work normally

### Test Mode Report

Test mode generates a complete mock HRDD report with:
- All required sections (Executive Summary, Dossier, Preliminary Screening, etc.)
- Simulated risk classifications (Low/Medium/High)
- Mock citations [1], [2], etc.
- Realistic timing (~5-7 seconds total vs 1 hour real assessment)

### When to Use Test Mode

✅ **Use test mode when:**
- Testing UI layout and styling
- Testing dossier form input
- Testing progress display animations
- Testing report display and formatting
- Testing copy-to-clipboard functionality
- Testing banner components (rejected/warning)
- Debugging frontend issues

❌ **Don't use test mode when:**
- Need to validate actual Firecrawl search results
- Testing LLM prompt templates
- Verifying risk classification logic against real data
- Need real citations and sources
- Final acceptance testing

---

## Production Mode (Real API Calls)

### Enable Production Mode

1. Update `.env.local`:
   ```bash
   NEXT_PUBLIC_HRDD_TEST_MODE=false
   # OR comment it out:
   # NEXT_PUBLIC_HRDD_TEST_MODE=true
   ```

2. Ensure API keys are configured:
   ```bash
   FIRECRAWL_API_KEY=your_key_here
   OPENAI_API_KEY=your_key_here
   ```

3. Restart dev server:
   ```bash
   npm run dev
   ```

### Production Mode Behavior

- **Real Firecrawl searches** - Site-specific searches to treasury.gov, un.org, freedomhouse.org, etc.
- **Real OpenAI analysis** - GPT-4o analyzes search results and generates reports
- **Up to 1 hour processing** - Real assessments take time (up to 60 minutes per spec)
- **API costs** - Each assessment costs $0.50-$2.00 depending on search results

### Production Mode Limitations

Some government websites may:
- Block automated scraping (403 errors)
- Timeout after 15 seconds
- Return no results

This is expected and handled gracefully - the system continues and flags missing sources.

---

## Cost Management Tips

1. **Start with test mode** - Validate UI works before making real API calls
2. **Use simple test cases** - Test with well-known companies/countries first (e.g., Google + United States)
3. **Avoid repeated tests** - Each assessment makes 15-25 API calls
4. **Check logs** - Watch terminal for `[HRDD]` logs showing which searches are completing

---

## Sample Test Dossiers

### Test Mode (Any dossier works):
- Customer: Acme Corp
- Use Case: AI chatbot for customer service
- Country: United States

### Production Mode (Recommended):

**Low Risk Expected:**
- Customer: Microsoft
- Use Case: Azure cloud services for data analytics
- Country: United States

**Medium Risk Expected:**
- Customer: Tech Startup XYZ
- Use Case: Facial recognition for retail analytics
- Country: Brazil

**High Risk Expected:**
- Customer: Unknown Company
- Use Case: Surveillance cameras with AI tracking
- Country: Myanmar

---

## Troubleshooting

### "Searches not resolving" or "Finding sources..." hangs

**Problem:** Site-specific government searches timing out

**Solutions:**
1. Enable test mode to bypass searches
2. Wait 60+ seconds - some searches are slow
3. Check terminal logs for `[HRDD]` messages showing which search is stuck
4. Try a simpler test case with a well-known company

### "Test mode banner not showing"

**Problem:** Environment variable not loaded

**Solutions:**
1. Check `.env.local` has `NEXT_PUBLIC_HRDD_TEST_MODE=true`
2. Restart dev server (kill and run `npm run dev` again)
3. Hard refresh browser (Cmd/Ctrl + Shift + R)

### "Stream slow to update" warnings

**Problem:** Normal for long-running assessments

**Solutions:**
- Ignore these warnings - they're informational only
- In test mode, assessment completes in ~5 seconds
- In production, expect delays while waiting for search results

---

## Quick Reference

| Mode | API Calls | Duration | Cost | Use For |
|------|-----------|----------|------|---------|
| **Test Mode** | None | ~5 sec | $0 | UI testing, debugging, development |
| **Production Mode** | 15-25 | 5-60 min | $0.50-$2 | Real assessments, acceptance testing |

**Toggle test mode in `.env.local`:**
```bash
# Test mode (default for development)
NEXT_PUBLIC_HRDD_TEST_MODE=true

# Production mode (for real assessments)
NEXT_PUBLIC_HRDD_TEST_MODE=false
```
