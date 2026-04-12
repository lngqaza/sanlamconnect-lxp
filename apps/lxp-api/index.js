require("dotenv").config();
const fastify = require("fastify")({ logger: true });
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS skills (
      id            SERIAL PRIMARY KEY,
      name          VARCHAR(255) NOT NULL,
      category      VARCHAR(255) NOT NULL,
      target_level  INT NOT NULL DEFAULT 3,
      current_level INT,
      description   TEXT,
      tags          TEXT[]
    )
  `);
  fastify.log.info("Migration complete");

  const { rows } = await pool.query("SELECT COUNT(*) FROM skills");
  if (parseInt(rows[0].count) > 0) return;

  await pool.query(`
    INSERT INTO skills (name, category, target_level, current_level, description, tags) VALUES
    ('FAIS Compliance & Regulatory Knowledge', 'Compliance & Governance', 5, 3,
     'Understanding of the Financial Advisory and Intermediary Services Act, FSCA requirements, fit-and-proper criteria, and ongoing CPD obligations for licensed intermediaries.',
     ARRAY['FAIS','FSCA','compliance','regulatory','CPD']),

    ('FICA & Anti-Money Laundering', 'Compliance & Governance', 4, 2,
     'Application of the Financial Intelligence Centre Act, client due diligence, KYC processes, suspicious transaction reporting, and PEP screening for intermediary practices.',
     ARRAY['FICA','AML','KYC','due-diligence','FIC']),

    ('Life Insurance Product Knowledge', 'Product Knowledge', 5, 4,
     'In-depth knowledge of Sanlam life cover products including SLA, Indie, and MyCover — benefit structures, underwriting criteria, exclusions, and claims processes.',
     ARRAY['life-insurance','Sanlam','underwriting','claims','risk-cover']),

    ('Retirement Planning & Annuities', 'Financial Planning', 5, 3,
     'Advising clients on retirement funding vehicles including RAs, pension and provident funds, living annuities, and guaranteed annuities. Includes Section 37C and benefit nominations.',
     ARRAY['retirement','RA','living-annuity','pension','Section37C']),

    ('Investment Advisory & Portfolio Construction', 'Investments', 5, 3,
     'Selecting appropriate unit trusts, endowments, and discretionary investment products aligned to client risk profiles. Knowledge of Sanlam Investments and Satrix product ranges.',
     ARRAY['investments','unit-trusts','endowment','Satrix','risk-profile']),

    ('Estate Planning & Wills', 'Financial Planning', 4, 2,
     'Guiding clients on wills, testamentary trusts, liquidity planning at death, and estate duty implications. Coordinating with Sanlam Trust for fiduciary services.',
     ARRAY['estate-planning','wills','trust','estate-duty','fiduciary']),

    ('Short-Term Insurance Fundamentals', 'Product Knowledge', 3, 2,
     'Understanding of personal lines short-term insurance — household, vehicle, and liability cover. Awareness of MiWay and Santam product positioning within the Sanlam Group.',
     ARRAY['short-term','STI','personal-lines','MiWay','Santam']),

    ('Needs Analysis & Financial Needs Assessment', 'Client Engagement', 5, 4,
     'Conducting structured FNA interviews, identifying protection gaps, calculating replacement ratios, and producing compliant Record of Advice documentation.',
     ARRAY['FNA','needs-analysis','ROA','record-of-advice','gap-analysis']),

    ('Client Relationship Management', 'Client Engagement', 5, 4,
     'Building long-term client relationships through regular reviews, proactive communication, and lifecycle event planning. Using CRM tools to track client touchpoints and retention.',
     ARRAY['CRM','client-retention','reviews','relationship','servicing']),

    ('Risk Profiling & Suitability Assessment', 'Investments', 4, 3,
     'Assessing client risk tolerance, capacity for loss, and investment horizon to ensure suitable product recommendations in line with TCF and RDR principles.',
     ARRAY['risk-profiling','TCF','RDR','suitability','Reg28']),

    ('Tax Planning for Individuals', 'Financial Planning', 4, 2,
     'Practical application of individual income tax, capital gains tax, dividend withholding tax, and the use of tax-efficient wrappers such as TFSAs and RAs to reduce client tax burden.',
     ARRAY['tax','CGT','TFSA','income-tax','tax-planning']),

    ('Medical Aid & Gap Cover Advisory', 'Healthcare Benefits', 3, 1,
     'Understanding of Council for Medical Schemes regulations, open vs restricted medical schemes, and the role of gap cover and hospital cash plans in a comprehensive benefits solution.',
     ARRAY['medical-aid','gap-cover','CMS','healthcare','benefits']),

    ('Digital Tools & AdviceWorks Proficiency', 'Technology & Tools', 4, 2,
     'Proficient use of Sanlam AdviceWorks financial planning platform, Blue Pepper CRM, and digital onboarding tools to produce compliant financial plans and improve practice efficiency.',
     ARRAY['AdviceWorks','BluePepper','digital','fintech','e-onboarding']),

    ('Practice Management & Business Development', 'Business Skills', 4, 3,
     'Running a compliant intermediary practice — office systems, staff supervision, revenue management, prospecting strategies, and growing AUM through referral networks and COI relationships.',
     ARRAY['practice-management','business-development','AUM','COI','prospecting']),

    ('Employee Benefits & Group Schemes', 'Product Knowledge', 4, 2,
     'Advising employers on group life, disability income, funeral cover, and retirement fund solutions. Understanding trustee responsibilities, default regulations, and auto-enrolment.',
     ARRAY['employee-benefits','group-schemes','disability','funeral','trustees'])
  `);
  fastify.log.info("Seed data inserted — 15 Sanlam intermediary skills loaded");
}

fastify.get("/health", async () => ({ status: "ok" }));
fastify.get("/", async () => ({ service: "lxp-api", status: "running" }));

fastify.get("/skills", async (request, reply) => {
  try {
    const result = await pool.query("SELECT * FROM skills");
    return result.rows;
  } catch (err) {
    fastify.log.error(err);
    reply.status(500).send({ error: "Failed to fetch skills" });
  }
});

const port = Number(process.env.PORT || 3001);
fastify.listen({ port, host: "0.0.0.0" })
  .then(() => migrate())
  .then(() => fastify.log.info(`lxp-api listening on 0.0.0.0:${port}`))
  .catch(err => { fastify.log.error(err); process.exit(1); });

 
 


