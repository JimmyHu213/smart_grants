import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DIRECT_URL or DATABASE_URL environment variable is required for seeding");
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.document.deleteMany();
  await prisma.grantApplication.deleteMany();
  await prisma.grantChecklistItem.deleteMany();
  await prisma.grantProcessStep.deleteMany();
  await prisma.grant.deleteMany();

  // ─── Federal Grants (5) ─────────────────────────��──────

  const grant1 = await prisma.grant.create({
    data: {
      name: "IBA Business Loan Package (incl. 30% Non-Repayable Grant)",
      jurisdiction: "FEDERAL",
      administeringBody: "Indigenous Business Australia (IBA)",
      amount: "Up to $5,000,000",
      status: "OPEN",
      deadline: "Ongoing",
      externalLink: "iba.gov.au/business/finance",
      relevanceRating: 5,
      description:
        "IBA provides tailored business finance for Aboriginal and Torres Strait Islander entrepreneurs. The package includes a concessional business loan with up to 30% as a non-repayable grant component. This is the single most impactful funding instrument for Indigenous tourism businesses, combining significant capital with grant support. Suitable for vessel acquisition, infrastructure, and major business expansion.",
      eligibilityCriteria:
        "Must be an Aboriginal or Torres Strait Islander person or entity. Must demonstrate viable business proposition with a comprehensive business plan. Applicant must contribute equity where possible. Business must be registered and operating in Australia.",
      checklistItems: {
        create: [
          { label: "Comprehensive Business Plan", sortOrder: 1 },
          { label: "Certificate of Aboriginality", sortOrder: 2 },
          { label: "Financial statements (2 years if trading)", sortOrder: 3 },
          { label: "Asset and liability statement", sortOrder: 4 },
          { label: "Quotes for proposed expenditure", sortOrder: 5 },
        ],
      },
      processSteps: {
        create: [
          { label: "Contact IBA to discuss your business needs", sortOrder: 1 },
          { label: "Complete IBA finance application form", sortOrder: 2 },
          { label: "Prepare and submit business plan with financials", sortOrder: 3 },
          { label: "IBA conducts feasibility and due diligence assessment", sortOrder: 4 },
          { label: "Loan and grant approval and settlement", sortOrder: 5 },
        ],
      },
    },
  });

  const grant2 = await prisma.grant.create({
    data: {
      name: "IBA Start-Up Finance Package",
      jurisdiction: "FEDERAL",
      administeringBody: "Indigenous Business Australia (IBA)",
      amount: "Up to $100,000",
      status: "OPEN",
      deadline: "Ongoing (under 12 months trading)",
      externalLink: "iba.gov.au/business",
      relevanceRating: 4,
      description:
        "Start-up finance for Indigenous businesses trading for less than 12 months. Provides concessional finance up to $100,000 including potential grant component. Designed for new ventures that need initial capital to establish operations, purchase equipment, or fund working capital requirements during the start-up phase.",
      eligibilityCriteria:
        "Must be Aboriginal or Torres Strait Islander. Business must have been trading for less than 12 months. Must have a viable business concept and plan. Located in Australia.",
      checklistItems: {
        create: [
          { label: "Business Plan (start-up focused)", sortOrder: 1 },
          { label: "Certificate of Aboriginality", sortOrder: 2 },
          { label: "Personal identification documents", sortOrder: 3 },
          { label: "Quotes for equipment/assets", sortOrder: 4 },
        ],
      },
      processSteps: {
        create: [
          { label: "Register interest with IBA", sortOrder: 1 },
          { label: "Attend IBA business workshop (if available)", sortOrder: 2 },
          { label: "Develop start-up business plan with IBA support", sortOrder: 3 },
          { label: "Submit application with supporting documents", sortOrder: 4 },
          { label: "Assessment and approval", sortOrder: 5 },
        ],
      },
    },
  });

  const grant3 = await prisma.grant.create({
    data: {
      name: "NIAA First Nations Tourism Grants + Free Mentoring Program",
      jurisdiction: "FEDERAL",
      administeringBody: "National Indigenous Australians Agency (NIAA)",
      amount: "Up to $50,000",
      status: "MONITORING",
      deadline: "Monitor GrantConnect for next round",
      externalLink: "niaa.gov.au",
      relevanceRating: 5,
      description:
        "NIAA periodically opens funding rounds specifically targeting First Nations tourism businesses. Grants up to $50,000 support business development, marketing, and operational improvements. The programme also includes access to free mentoring from tourism industry professionals. Critical to monitor GrantConnect for upcoming rounds as they are competitive and time-limited.",
      eligibilityCriteria:
        "Must be an Indigenous-owned tourism business or enterprise. Must be registered on the Australian Business Register. Must demonstrate capacity to deliver tourism products or services. Priority given to regional and remote communities.",
      checklistItems: {
        create: [
          { label: "Business Plan or activity proposal", sortOrder: 1 },
          { label: "ABN and business registration", sortOrder: 2 },
          { label: "Evidence of Indigenous ownership", sortOrder: 3 },
          { label: "Budget for proposed activities", sortOrder: 4 },
          { label: "Letters of support (if applicable)", sortOrder: 5 },
        ],
      },
      processSteps: {
        create: [
          { label: "Register on GrantConnect and set up alerts", sortOrder: 1 },
          { label: "Monitor for next funding round announcement", sortOrder: 2 },
          { label: "Prepare application materials in advance", sortOrder: 3 },
          { label: "Submit application within funding round window", sortOrder: 4 },
          { label: "Engage with mentoring programme if offered", sortOrder: 5 },
        ],
      },
    },
  });

  const grant4 = await prisma.grant.create({
    data: {
      name: "Export Market Development Grant (EMDG)",
      jurisdiction: "FEDERAL",
      administeringBody: "Austrade",
      amount: "Up to $770,000 (over multiple years)",
      status: "OPEN",
      deadline: "Annual rounds, next round mid-2026",
      externalLink: "austrade.gov.au/emdg",
      relevanceRating: 4,
      description:
        "EMDG reimburses up to 50% of eligible export marketing and promotion expenses. Designed for SMEs looking to develop export markets, including international tourism promotion. Covers expenses such as overseas marketing, trade shows, international branding, and market research. Relevant for tourism operators targeting international visitor markets.",
      eligibilityCriteria:
        "Australian business with annual income under $20 million. Must have an ABN and be GST-registered. Must be promoting the export of eligible goods, services, or tourism. Must have spent at least $15,000 on eligible export marketing activities.",
      checklistItems: {
        create: [
          { label: "Evidence of export marketing expenditure", sortOrder: 1 },
          { label: "Financial statements", sortOrder: 2 },
          { label: "ABN and GST registration", sortOrder: 3 },
          { label: "Export marketing plan", sortOrder: 4 },
        ],
      },
      processSteps: {
        create: [
          { label: "Register with Austrade and create EMDG account", sortOrder: 1 },
          { label: "Incur eligible export promotion expenses", sortOrder: 2 },
          { label: "Collate receipts and evidence of expenditure", sortOrder: 3 },
          { label: "Submit EMDG application during open round", sortOrder: 4 },
          { label: "Austrade assessment and reimbursement", sortOrder: 5 },
        ],
      },
    },
  });

  const grant5 = await prisma.grant.create({
    data: {
      name: "Supply Nation Registration + Indigenous Procurement Policy (IPP)",
      jurisdiction: "FEDERAL",
      administeringBody: "Department of Finance + Supply Nation",
      amount: "Government contract revenue (no cap)",
      status: "OPEN",
      deadline: "Ongoing",
      externalLink: "supplynation.org.au",
      relevanceRating: 5,
      description:
        "Supply Nation certification opens access to government procurement opportunities under the Indigenous Procurement Policy (IPP). The Australian Government targets 3% of total contract value to Indigenous businesses. Registration enables your business to be found by government buyers and corporate procurement teams seeking Indigenous suppliers. Essential strategic registration for any Indigenous business.",
      eligibilityCriteria:
        "Must be at least 50% owned by Aboriginal and/or Torres Strait Islander people. Must be a registered Australian business with an ABN. Business must be operating and generating revenue. Key management positions must be held by Indigenous Australians.",
      checklistItems: {
        create: [
          { label: "Supply Nation registration application", sortOrder: 1 },
          { label: "Certificate of Aboriginality for owners", sortOrder: 2 },
          { label: "ABN and business registration evidence", sortOrder: 3 },
          { label: "Company structure and ownership documentation", sortOrder: 4 },
        ],
      },
      processSteps: {
        create: [
          { label: "Visit supplynation.org.au and begin registration", sortOrder: 1 },
          { label: "Prepare ownership and identity documentation", sortOrder: 2 },
          { label: "Complete Supply Nation verification process", sortOrder: 3 },
          { label: "Register on AusTender for government opportunities", sortOrder: 4 },
          { label: "Respond to relevant procurement tenders", sortOrder: 5 },
        ],
      },
    },
  });

  // ─── WA Grants (2) ─────────────────────────────────────

  const grant6 = await prisma.grant.create({
    data: {
      name: "Tourism WA — Aboriginal Tourism Development Program",
      jurisdiction: "WA",
      administeringBody: "Tourism WA",
      amount: "Varies by round",
      status: "OPEN",
      deadline: "Rolling — check Tourism WA website",
      externalLink: "tourism.wa.gov.au",
      relevanceRating: 5,
      description:
        "Tourism WA provides targeted support for Aboriginal tourism businesses in Western Australia. The programme offers funding for product development, marketing, business mentoring, and industry networking. Covers assistance with digital presence, tour packaging, and connection to distribution channels. Tourism WA actively seeks to grow the Aboriginal tourism sector in WA.",
      eligibilityCriteria:
        "Must be an Aboriginal-owned or Aboriginal-led tourism business. Must be based in or operating in Western Australia. Must have a viable tourism product or clear development plan. Preference for businesses that enhance visitor experiences in regional WA.",
      checklistItems: {
        create: [
          { label: "Tourism business plan or concept", sortOrder: 1 },
          { label: "Evidence of Aboriginal ownership/leadership", sortOrder: 2 },
          { label: "WA business registration", sortOrder: 3 },
        ],
      },
      processSteps: {
        create: [
          { label: "Contact Tourism WA Aboriginal Tourism team", sortOrder: 1 },
          { label: "Discuss your tourism product and development needs", sortOrder: 2 },
          { label: "Apply when funding round opens", sortOrder: 3 },
          { label: "Participate in development programme activities", sortOrder: 4 },
        ],
      },
    },
  });

  const grant7 = await prisma.grant.create({
    data: {
      name: "ILSC — Our Country Our Future (WA Sea Country)",
      jurisdiction: "WA",
      administeringBody: "Indigenous Land and Sea Corporation (ILSC)",
      amount: "Land and sea asset support (varies)",
      status: "OPEN",
      deadline: "Ongoing",
      externalLink: "ilsc.gov.au",
      relevanceRating: 3,
      description:
        "The ILSC assists Indigenous Australians to acquire and manage land and sea assets. The Our Country Our Future programme supports sustainable economic development on Indigenous land and sea country, particularly in WA. Relevant for tourism operators seeking to leverage sea country assets, establish land-based tourism infrastructure, or develop cultural tourism linked to Country.",
      eligibilityCriteria:
        "Must be an Aboriginal or Torres Strait Islander entity or organisation. Must demonstrate connection to and benefit for Indigenous land or sea country. Proposals must align with ILSC strategic priorities. Preference for sustainable and economically viable projects.",
      checklistItems: {
        create: [
          { label: "Project proposal aligned to ILSC priorities", sortOrder: 1 },
          { label: "Evidence of Indigenous ownership and governance", sortOrder: 2 },
          { label: "Connection to country documentation", sortOrder: 3 },
        ],
      },
      processSteps: {
        create: [
          { label: "Review ILSC National Indigenous Land and Sea Strategy", sortOrder: 1 },
          { label: "Contact ILSC regional office to discuss concept", sortOrder: 2 },
          { label: "Submit formal project proposal", sortOrder: 3 },
          { label: "ILSC assessment and due diligence", sortOrder: 4 },
        ],
      },
    },
  });

  // ─── NT Grants (6) ─────────────────────────────────────

  const grant8 = await prisma.grant.create({
    data: {
      name: "Aboriginal Tourism Grant Program — Round 9",
      jurisdiction: "NT",
      administeringBody: "NT Department of Territory Families, Housing and Communities (DTH)",
      amount: "Significant per application",
      status: "OPEN",
      deadline: "Check dth.nt.gov.au for current round",
      externalLink: "dth.nt.gov.au",
      relevanceRating: 5,
      description:
        "The NT Government's flagship Aboriginal tourism grant programme supporting the development and growth of Aboriginal tourism enterprises in the Northern Territory. Provides significant funding for tourism product development, infrastructure, marketing, and business capacity building. Round 9 is the latest iteration with substantial per-applicant funding available.",
      eligibilityCriteria:
        "Must be an Aboriginal-owned tourism business or organisation in the NT. Must have a viable tourism concept or existing operation. Must demonstrate capacity to deliver outcomes. ABN and NT business registration required.",
      checklistItems: {
        create: [
          { label: "Detailed project plan and budget", sortOrder: 1 },
          { label: "Evidence of Aboriginal ownership", sortOrder: 2 },
          { label: "ABN and business registration", sortOrder: 3 },
          { label: "Quotes for proposed expenditure", sortOrder: 4 },
          { label: "Letters of support from stakeholders", sortOrder: 5 },
        ],
      },
      processSteps: {
        create: [
          { label: "Check DTH website for current round status", sortOrder: 1 },
          { label: "Contact DTH grant team for pre-application discussion", sortOrder: 2 },
          { label: "Prepare detailed project plan and budget", sortOrder: 3 },
          { label: "Submit application with all supporting documents", sortOrder: 4 },
          { label: "DTH assessment and funding decision", sortOrder: 5 },
        ],
      },
    },
  });

  const grant9 = await prisma.grant.create({
    data: {
      name: "Aboriginal Tourism Development Support Grant — Round 4",
      jurisdiction: "NT",
      administeringBody: "NT Department of Territory Families, Housing and Communities (DTH)",
      amount: "Professional services funding",
      status: "OPEN",
      deadline: "Apply at dth.nt.gov.au",
      externalLink: "dth.nt.gov.au",
      relevanceRating: 4,
      description:
        "Funding for professional services to support Aboriginal tourism business development in the NT. Covers costs for business planning, feasibility studies, marketing strategy, legal advice, and other professional consultancy services needed to advance Aboriginal tourism enterprises. Round 4 continues the NT Government's investment in building Aboriginal tourism capacity.",
      eligibilityCriteria:
        "Must be an Aboriginal-owned tourism business or organisation in the NT. Must identify specific professional services needed. Must demonstrate how the services will advance the business. ABN required.",
      checklistItems: {
        create: [
          { label: "Description of professional services required", sortOrder: 1 },
          { label: "Quotes from service providers", sortOrder: 2 },
          { label: "Evidence of Aboriginal ownership", sortOrder: 3 },
          { label: "ABN registration", sortOrder: 4 },
        ],
      },
      processSteps: {
        create: [
          { label: "Identify professional services needed for business development", sortOrder: 1 },
          { label: "Obtain quotes from qualified service providers", sortOrder: 2 },
          { label: "Submit application to DTH", sortOrder: 3 },
          { label: "DTH review and approval", sortOrder: 4 },
          { label: "Engage service provider and report outcomes", sortOrder: 5 },
        ],
      },
    },
  });

  const grant10 = await prisma.grant.create({
    data: {
      name: "Aboriginal Tourism Product Distribution Grant Program",
      jurisdiction: "NT",
      administeringBody: "NT Department of Territory Families, Housing and Communities (DTH)",
      amount: "Distribution funding",
      status: "OPEN",
      deadline: "30 April 2026",
      externalLink: "fundsforcompanies.fundsforngos.org",
      relevanceRating: 5,
      description:
        "Specific funding to help Aboriginal tourism businesses in the NT get their products to market through distribution channels. Covers costs associated with listing on booking platforms, working with inbound tour operators, developing distribution partnerships, and connecting with travel trade networks. Critical for tourism businesses ready to scale their market reach.",
      eligibilityCriteria:
        "Must be an Aboriginal-owned tourism business in the NT. Must have an established tourism product ready for distribution. Must demonstrate a distribution strategy or identified channels. ABN required.",
      checklistItems: {
        create: [
          { label: "Distribution strategy or plan", sortOrder: 1 },
          { label: "Evidence of market-ready tourism product", sortOrder: 2 },
          { label: "Evidence of Aboriginal ownership", sortOrder: 3 },
          { label: "ABN registration", sortOrder: 4 },
          { label: "Budget for distribution activities", sortOrder: 5 },
        ],
      },
      processSteps: {
        create: [
          { label: "Identify target distribution channels", sortOrder: 1 },
          { label: "Develop distribution strategy and budget", sortOrder: 2 },
          { label: "Submit application before 30 April 2026 deadline", sortOrder: 3 },
          { label: "Implement distribution activities upon approval", sortOrder: 4 },
        ],
      },
    },
  });

  const grant11 = await prisma.grant.create({
    data: {
      name: "Unlocking Aboriginal Tourism Development Funding",
      jurisdiction: "NT",
      administeringBody: "NT Government",
      amount: "Consultancy services funding",
      status: "OPEN",
      deadline: "Closes when fully subscribed",
      externalLink: "business.gov.au",
      relevanceRating: 4,
      description:
        "NT Government initiative to unlock Aboriginal tourism development through funded consultancy services. Provides access to expert consultants who can help Aboriginal tourism businesses develop their concepts, business plans, and operational readiness. The programme closes when all available consultancy places are filled, making early application essential.",
      eligibilityCriteria:
        "Must be an Aboriginal person or entity in the NT with a tourism business concept or existing operation. Must be willing to engage with assigned consultants. ABN preferred but not always required for early-stage concepts.",
      checklistItems: {
        create: [
          { label: "Expression of interest form", sortOrder: 1 },
          { label: "Tourism business concept outline", sortOrder: 2 },
          { label: "Evidence of Indigenous identity", sortOrder: 3 },
        ],
      },
      processSteps: {
        create: [
          { label: "Submit expression of interest as soon as possible", sortOrder: 1 },
          { label: "NT Government matches you with a consultant", sortOrder: 2 },
          { label: "Work with consultant on business development", sortOrder: 3 },
          { label: "Receive consultancy report and recommendations", sortOrder: 4 },
        ],
      },
    },
  });

  const grant12 = await prisma.grant.create({
    data: {
      name: "NT Aboriginal Tourism Accelerator Program 2026",
      jurisdiction: "NT",
      administeringBody: "IBA + Tourism NT",
      amount: "Structured programme support",
      status: "MONITORING",
      deadline: "February–June 2026",
      externalLink: "iba.gov.au",
      relevanceRating: 4,
      description:
        "A joint IBA and Tourism NT accelerator programme providing structured support for Aboriginal tourism businesses in the Northern Territory. The programme runs from February to June 2026 and includes business mentoring, industry connections, marketing support, and potential funding. Designed for tourism businesses ready to accelerate their growth and market presence.",
      eligibilityCriteria:
        "Must be an Aboriginal-owned tourism business in the NT. Must have an existing tourism product or near-ready concept. Must be available to participate in the full programme duration (Feb-Jun 2026). Must demonstrate growth potential.",
      checklistItems: {
        create: [
          { label: "Accelerator programme application", sortOrder: 1 },
          { label: "Current business overview and tourism product details", sortOrder: 2 },
          { label: "Evidence of Aboriginal ownership", sortOrder: 3 },
          { label: "Statement of growth objectives", sortOrder: 4 },
        ],
      },
      processSteps: {
        create: [
          { label: "Monitor IBA and Tourism NT for programme announcements", sortOrder: 1 },
          { label: "Submit accelerator application when round opens", sortOrder: 2 },
          { label: "Selection and onboarding to programme", sortOrder: 3 },
          { label: "Participate in full accelerator programme (Feb-Jun 2026)", sortOrder: 4 },
          { label: "Implement growth plan post-programme", sortOrder: 5 },
        ],
      },
    },
  });

  const grant13 = await prisma.grant.create({
    data: {
      name: "Northern Land Council — Arnhem Land Entry Permits",
      jurisdiction: "NT",
      administeringBody: "Northern Land Council (NLC)",
      amount: "Permit + partnership value",
      status: "OPEN",
      deadline: "Apply immediately",
      externalLink: "nlc.org.au",
      relevanceRating: 5,
      description:
        "The Northern Land Council administers entry permits for Arnhem Land, which is Aboriginal freehold land. Securing entry permits is essential for any tourism operation in Arnhem Land. The NLC can also facilitate partnerships with Traditional Owners, enabling tourism businesses to operate on country with proper authority and cultural guidance. This is not a cash grant but represents significant strategic and commercial value.",
      eligibilityCriteria:
        "Must demonstrate a legitimate tourism purpose for entry to Arnhem Land. Must engage with Traditional Owner groups through the NLC. Must agree to conditions set by Traditional Owners. Must have appropriate insurance and safety plans for tourism operations.",
      checklistItems: {
        create: [
          { label: "Permit application form", sortOrder: 1 },
          { label: "Tourism operation proposal for Arnhem Land", sortOrder: 2 },
          { label: "Insurance certificates", sortOrder: 3 },
          { label: "Safety management plan", sortOrder: 4 },
        ],
      },
      processSteps: {
        create: [
          { label: "Contact NLC to discuss tourism permit requirements", sortOrder: 1 },
          { label: "Submit permit application with tourism proposal", sortOrder: 2 },
          { label: "NLC consults with relevant Traditional Owner groups", sortOrder: 3 },
          { label: "Negotiate terms and conditions with Traditional Owners", sortOrder: 4 },
          { label: "Receive permit and begin operations on country", sortOrder: 5 },
        ],
      },
    },
  });

  // ─── QLD Grants (7) ────────────────────────────────────

  const grant14 = await prisma.grant.create({
    data: {
      name: "Strategic Indigenous Tourism Projects (SITP)",
      jurisdiction: "QLD",
      administeringBody: "Tourism and Events Queensland (TEQ) + NIAA",
      amount: "$6,000,000 total fund",
      status: "OPEN",
      deadline: "Engage TEQ now — competitive",
      externalLink: "detsi.qld.gov.au",
      relevanceRating: 5,
      description:
        "A major $6 million joint initiative between TEQ and NIAA to develop strategic Indigenous tourism projects in Queensland. Supports significant tourism developments that will create lasting economic and cultural outcomes for Indigenous communities. This is one of the largest dedicated Indigenous tourism funds in Australia. Early engagement with TEQ is critical as the programme is highly competitive.",
      eligibilityCriteria:
        "Must be an Indigenous-owned or Indigenous-led tourism project in QLD. Must demonstrate significant tourism and economic impact. Must have a clear development plan and timeline. Must align with QLD Indigenous tourism strategy priorities.",
      checklistItems: {
        create: [
          { label: "Comprehensive project proposal", sortOrder: 1 },
          { label: "Detailed budget and financial projections", sortOrder: 2 },
          { label: "Evidence of Indigenous ownership and community support", sortOrder: 3 },
          { label: "Site plans or development approvals (if applicable)", sortOrder: 4 },
          { label: "Letters of support from TEQ and stakeholders", sortOrder: 5 },
        ],
      },
      processSteps: {
        create: [
          { label: "Contact TEQ Indigenous Tourism team immediately", sortOrder: 1 },
          { label: "Discuss project concept and alignment with SITP objectives", sortOrder: 2 },
          { label: "Develop comprehensive project proposal with TEQ guidance", sortOrder: 3 },
          { label: "Submit formal application", sortOrder: 4 },
          { label: "Assessment panel review and funding decision", sortOrder: 5 },
        ],
      },
    },
  });

  const grant15 = await prisma.grant.create({
    data: {
      name: "Growing Indigenous Tourism in Queensland Fund",
      jurisdiction: "QLD",
      administeringBody: "QLD Department of Tourism, Innovation and Sport (DTIS)",
      amount: "$7,000,000 total fund",
      status: "MONITORING",
      deadline: "Monitor for upcoming rounds",
      externalLink: "detsi.qld.gov.au",
      relevanceRating: 5,
      description:
        "A $7 million Queensland Government fund dedicated to growing the Indigenous tourism sector across the state. Supports a range of projects from product development to marketing and business capability building. Funding is released in competitive rounds. This is a cornerstone of Queensland's Indigenous tourism development strategy and one of the largest state-level Indigenous tourism funds.",
      eligibilityCriteria:
        "Must be an Indigenous-owned tourism business or organisation in QLD. Must contribute to growing Indigenous tourism in Queensland. Must demonstrate viable project outcomes. Must be registered with an ABN.",
      checklistItems: {
        create: [
          { label: "Project proposal and budget", sortOrder: 1 },
          { label: "ABN and business registration", sortOrder: 2 },
          { label: "Evidence of Indigenous ownership", sortOrder: 3 },
          { label: "Previous funding acquittal (if applicable)", sortOrder: 4 },
        ],
      },
      processSteps: {
        create: [
          { label: "Monitor DTIS and TEQ for funding round announcements", sortOrder: 1 },
          { label: "Prepare application materials in advance", sortOrder: 2 },
          { label: "Submit application during open round", sortOrder: 3 },
          { label: "Assessment and funding decision", sortOrder: 4 },
        ],
      },
    },
  });

  const grant16 = await prisma.grant.create({
    data: {
      name: "First Nations Innovation Acceleration Program QLD",
      jurisdiction: "QLD",
      administeringBody: "First Australians Capital (FAC) + Advance QLD",
      amount: "Up to $100,000",
      status: "OPEN",
      deadline: "Closes 4 February 2027",
      externalLink: "advance.qld.gov.au",
      relevanceRating: 5,
      description:
        "An innovation acceleration programme supporting First Nations businesses in Queensland with grants up to $100,000. Jointly delivered by First Australians Capital and Advance QLD, the programme focuses on innovative business concepts that can scale. Suitable for tourism businesses with technology-enabled or innovative service delivery models. The programme also provides mentoring and business development support.",
      eligibilityCriteria:
        "Must be a First Nations-owned business in QLD. Must demonstrate an innovative business concept or product. Must show potential for growth and scalability. Must be registered with an ABN.",
      checklistItems: {
        create: [
          { label: "Innovation proposal and business model", sortOrder: 1 },
          { label: "Evidence of First Nations ownership", sortOrder: 2 },
          { label: "ABN and QLD business registration", sortOrder: 3 },
          { label: "Financial projections and budget", sortOrder: 4 },
          { label: "Growth and scalability plan", sortOrder: 5 },
        ],
      },
      processSteps: {
        create: [
          { label: "Review programme guidelines on Advance QLD website", sortOrder: 1 },
          { label: "Develop innovation proposal and business model", sortOrder: 2 },
          { label: "Submit application before 4 February 2027 deadline", sortOrder: 3 },
          { label: "Selection and programme onboarding", sortOrder: 4 },
          { label: "Participate in acceleration programme and receive funding", sortOrder: 5 },
        ],
      },
    },
  });

  const grant17 = await prisma.grant.create({
    data: {
      name: "Queensland Destination Events Program (QDEP)",
      jurisdiction: "QLD",
      administeringBody: "Tourism and Events Queensland (TEQ)",
      amount: "Up to 25% of event budget",
      status: "MONITORING",
      deadline: "Monitor TEQ for round dates",
      externalLink: "teq.queensland.com",
      relevanceRating: 3,
      description:
        "TEQ's destination events programme funds events that drive visitation to Queensland destinations. Funding covers up to 25% of the total event budget. Relevant for tourism operators who run or are involved in cultural events, festivals, or experiences that attract visitors. Indigenous cultural events and festivals may be eligible if they demonstrate tourism impact.",
      eligibilityCriteria:
        "Event must be held in Queensland. Must demonstrate visitor attraction and economic impact. Must have a viable event plan and budget. Preference for events that showcase Queensland's unique offerings.",
      checklistItems: {
        create: [
          { label: "Event plan and programme", sortOrder: 1 },
          { label: "Detailed event budget", sortOrder: 2 },
          { label: "Projected visitor numbers and economic impact", sortOrder: 3 },
          { label: "Marketing and promotion plan", sortOrder: 4 },
        ],
      },
      processSteps: {
        create: [
          { label: "Monitor TEQ for QDEP round announcements", sortOrder: 1 },
          { label: "Develop event concept and tourism impact case", sortOrder: 2 },
          { label: "Submit QDEP application during open round", sortOrder: 3 },
          { label: "TEQ assessment and funding decision", sortOrder: 4 },
        ],
      },
    },
  });

  const grant18 = await prisma.grant.create({
    data: {
      name: "Cultural Tourism Fund — Arts Queensland",
      jurisdiction: "QLD",
      administeringBody: "Arts Queensland",
      amount: "Up to $160,000 over 2 years",
      status: "MONITORING",
      deadline: "Next round TBA",
      externalLink: "arts.qld.gov.au",
      relevanceRating: 3,
      description:
        "Arts Queensland's Cultural Tourism Fund supports projects at the intersection of arts, culture, and tourism. Funding up to $160,000 over two years for projects that create compelling cultural tourism experiences. Relevant for Indigenous tourism operators developing cultural performances, art trails, cultural centres, or interpretive experiences that enhance visitor engagement with Indigenous culture.",
      eligibilityCriteria:
        "Must be a QLD-based arts or cultural organisation. Project must demonstrate clear tourism outcomes. Must have a two-year delivery plan. Must show community benefit and cultural significance.",
      checklistItems: {
        create: [
          { label: "Cultural tourism project proposal", sortOrder: 1 },
          { label: "Two-year budget and delivery plan", sortOrder: 2 },
          { label: "Evidence of cultural and community support", sortOrder: 3 },
          { label: "Tourism impact assessment", sortOrder: 4 },
        ],
      },
      processSteps: {
        create: [
          { label: "Monitor Arts Queensland for round announcements", sortOrder: 1 },
          { label: "Develop cultural tourism project concept", sortOrder: 2 },
          { label: "Prepare two-year delivery plan and budget", sortOrder: 3 },
          { label: "Submit application during open round", sortOrder: 4 },
        ],
      },
    },
  });

  const grant19 = await prisma.grant.create({
    data: {
      name: "QIBN + Black Business Finder (BBF)",
      jurisdiction: "QLD",
      administeringBody: "QIBN + BBF + QLD Government",
      amount: "Procurement access (no direct grant)",
      status: "OPEN",
      deadline: "Register now",
      externalLink: "business.qld.gov.au",
      relevanceRating: 4,
      description:
        "The Queensland Indigenous Business Network (QIBN) and Black Business Finder (BBF) provide procurement pathways for Indigenous businesses in Queensland. Registration on these platforms gives visibility to government and corporate buyers seeking Indigenous suppliers. Combined with QLD Government procurement policies favouring Indigenous businesses, registration can unlock significant contract opportunities. Not a direct grant but provides substantial commercial value.",
      eligibilityCriteria:
        "Must be an Indigenous-owned business in QLD. Must be registered with an ABN. Must be able to supply goods or services to government or corporate clients. Ownership verification required.",
      checklistItems: {
        create: [
          { label: "QIBN registration form", sortOrder: 1 },
          { label: "BBF registration form", sortOrder: 2 },
          { label: "ABN and business registration", sortOrder: 3 },
          { label: "Evidence of Indigenous ownership", sortOrder: 4 },
        ],
      },
      processSteps: {
        create: [
          { label: "Register with QIBN at qibn.com.au", sortOrder: 1 },
          { label: "Register with Black Business Finder", sortOrder: 2 },
          { label: "Complete verification process for both platforms", sortOrder: 3 },
          { label: "Maintain active profiles and respond to opportunities", sortOrder: 4 },
        ],
      },
    },
  });

  const grant20 = await prisma.grant.create({
    data: {
      name: "Brisbane 2032 — First Nations Tourism Strategic Opportunity",
      jurisdiction: "QLD",
      administeringBody: "TEQ + Brisbane 2032",
      amount: "Multiple funding rounds TBA",
      status: "MONITORING",
      deadline: "Position now — funding rounds expected",
      externalLink: "teq.queensland.com",
      relevanceRating: 5,
      description:
        "The Brisbane 2032 Olympic and Paralympic Games represent a once-in-a-generation opportunity for First Nations tourism in Queensland. TEQ and the Brisbane 2032 organising committee are expected to release multiple funding rounds supporting First Nations cultural tourism experiences as part of the Games' cultural programme. Early positioning and relationship building with TEQ is essential to be ready when funding becomes available.",
      eligibilityCriteria:
        "Must be a First Nations tourism business or cultural organisation in QLD. Must be positioned to deliver cultural tourism experiences aligned with Brisbane 2032 objectives. Must demonstrate capacity for international-quality delivery. Must engage proactively with TEQ.",
      checklistItems: {
        create: [
          { label: "Tourism product overview and capability statement", sortOrder: 1 },
          { label: "Expression of interest for Brisbane 2032 cultural programme", sortOrder: 2 },
          { label: "Evidence of First Nations ownership and cultural authority", sortOrder: 3 },
          { label: "International readiness assessment", sortOrder: 4 },
        ],
      },
      processSteps: {
        create: [
          { label: "Contact TEQ to register interest in Brisbane 2032 programme", sortOrder: 1 },
          { label: "Develop capability statement and product overview", sortOrder: 2 },
          { label: "Attend TEQ industry events and networking opportunities", sortOrder: 3 },
          { label: "Monitor for formal funding round announcements", sortOrder: 4 },
          { label: "Submit applications as rounds open", sortOrder: 5 },
        ],
      },
    },
  });

  console.log(`Seeded ${20} grants successfully`);
  console.log("  - Federal: 5 grants");
  console.log("  - WA: 2 grants");
  console.log("  - NT: 6 grants");
  console.log("  - QLD: 7 grants");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
