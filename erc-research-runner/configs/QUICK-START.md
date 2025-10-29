# HRDD Config Quick Start Guide

**Goal:** Create a new HRDD configuration in under 5 minutes.

Steps: 
1. Receive the following information from the sales team: 
  - Company name
  - Deployment country 
  - Use case description 
2. Create new YML file based on the "hrdd-template.yml"
3. Replace variables with input provided by Sales 
4. Run "npm run research -- configs/{new YML file}"
  - Reads the manually defined search queries from a YAML config
  - Runs each query through Firecrawl search API
  - Stores all results locally in JSON
  - Generates a basic markdown report
5. Run "npm 
  - Loads saved research data
  - Loads a report template with placeholders
  - Fills in the template with research findings
  - Generates a formatted report

## Step 1: Copy Template (10 seconds)

```bash
cp configs/hrdd-template.yml configs/mycompany-myproject-hrdd.yml
```

## Step 2: Fill These 10 Essential Variables (3 minutes)

Open your new file and fill in the `variables` section:

```yaml
variables:
  # 1. Who is the customer?
  COMPANY_NAME: "Your Company Name"

  # 2. Where are they based?
  COUNTRY: "Country Name"

  # 3. What's the project?
  PROJECT_NAME: "Brief Project Description"

  # 4. What's the application?
  APPLICATION_TYPE: "what the product does"

  # 5. Today's date
  DATE: "2025-10-28"

```

## Step 3: Quick Review (1 minute)

Scan through the queries - they'll auto-populate with your variables. Most queries work as-is, but you can customize:

- Adjust `limit` values (5-20 is typical)
- Add industry-specific queries if needed
- Update `SPECIFIC_CONCERNS` and `REGULATORY_FRAMEWORK` variables for better targeting

## Step 4: Save & Run

That's it! Your config is ready to use.

---

## Real Example: Acme Corp Delivery Robots

```yaml
variables:
  COMPANY_NAME: "Acme Robotics GmbH"
  COUNTRY: "Germany"
  PROJECT_NAME: "Last-Mile Autonomous Delivery Robots"
  APPLICATION_TYPE: "sidewalk delivery robots with AI navigation"
  TECHNOLOGY: "Qualcomm QCS6490 with custom vision stack"
  DESIGN_PARTNER: "TechDesign Berlin"
  END_CUSTOMER: "Major European Logistics Companies"
  DATE: "2025-10-28"
  OPPORTUNITY_SIZE: "2,500 units in pilot, 25,000 if scaled"
  INDUSTRY_SECTOR: "robotics"
  SPECIFIC_CONCERNS: "pedestrian safety, sidewalk navigation, privacy"
  REGULATORY_FRAMEWORK: "European AI Act, German Road Traffic Act"
```

**Result:** All 30+ queries automatically become:
- "Acme Robotics GmbH Germany OFAC EU sanctions list robotics"
- "Germany robotics export regulations Acme Robotics GmbH compliance"
- etc.

---

## Tips

1. **Company Name:** Use the EXACT legal name (for sanctions screening)
2. **Country:** Use the official English name
3. **Be Specific:** "AI-powered surveillance drones" is better than "drones"
4. **End Customer:** Can be general ("European Defense Ministries") or specific ("German Federal Police")
5. **Industry Sector:** Choose: defense, automotive, healthcare, semiconductor, robotics, aerospace, etc.

---

## What If I Need Custom Queries?

You can add them! Just append to any section:

```yaml
sections:
  - name: "preliminary_screening"
    title: "Stage 1: Preliminary Screening"
    queries:
      # ... existing queries ...

      # Your custom query
      - id: "my_custom_check"
        query: "{{COMPANY_NAME}} specific concern I care about"
        limit: 10
        purpose: "Why I need this information"
```

---

## Common Mistakes to Avoid

❌ Leaving placeholder text: `"[e.g., SAAB AB]"`
✅ Replace with real values: `"Acme Corp"`

❌ Forgetting quotes around values
✅ Use quotes: `COMPANY_NAME: "Acme Corp"`

❌ Invalid YAML indentation
✅ Use consistent 2-space indentation

❌ Using `{{VARIABLES}}` in the variables section
✅ Only use `{{VARIABLES}}` in queries, not in the variables definition

---

## Need Help?

- See full README: `configs/README.md`
- See working example: `configs/saab-reconnaissance-drones-hrdd.yml`
- HRDD documentation: `docs/hrdd/`
