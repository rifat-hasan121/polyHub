import nextEnv from "@next/env";
import { PrismaClient } from "@prisma/client";

nextEnv.loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

const opportunities = [
  {
    id: "demo-opportunity-attachment-cst",
    title: "Software Development Industrial Attachment",
    companyName: "Demo: Dhaka Digital Labs",
    location: "Dhaka",
    type: "INDUSTRIAL_ATTACHMENT",
    description:
      "Demo listing — not a real vacancy. Final-semester students will shadow the software team and practice web development, testing, and version control.",
    applyUrl: "https://example.com/polyhub-demo/attachment-cst",
    department: ["CST"],
    deadlineDays: 30,
  },
  {
    id: "demo-opportunity-attachment-civil",
    title: "Site Engineering Industrial Attachment",
    companyName: "Demo: Delta Structures",
    location: "Chattogram",
    type: "INDUSTRIAL_ATTACHMENT",
    description:
      "Demo listing — not a real vacancy. Attachment students will observe site coordination, construction quality checks, and basic project documentation.",
    applyUrl: "https://example.com/polyhub-demo/attachment-civil",
    department: ["CE"],
    deadlineDays: 25,
  },
  {
    id: "demo-opportunity-attachment-electrical",
    title: "Electrical Maintenance Industrial Attachment",
    companyName: "Demo: Bay Power Services",
    location: "Mymensingh",
    type: "INDUSTRIAL_ATTACHMENT",
    description:
      "Demo listing — not a real vacancy. Students will learn under supervision about preventive maintenance, electrical safety, and equipment inspection.",
    applyUrl: "https://example.com/polyhub-demo/attachment-electrical",
    department: ["EEE", "POWER"],
    deadlineDays: 22,
  },
  {
    id: "demo-opportunity-attachment-mechanical",
    title: "Workshop Production Industrial Attachment",
    companyName: "Demo: Northstar Engineering Works",
    location: "Rajshahi",
    type: "INDUSTRIAL_ATTACHMENT",
    description:
      "Demo listing — not a real vacancy. The placement introduces students to workshop safety, production planning, and mechanical maintenance routines.",
    applyUrl: "https://example.com/polyhub-demo/attachment-mechanical",
    department: ["ME"],
    deadlineDays: 28,
  },
  {
    id: "demo-opportunity-attachment-electronics",
    title: "Electronics & IoT Industrial Attachment",
    companyName: "Demo: CircuitCraft Studio",
    location: "Remote",
    type: "INDUSTRIAL_ATTACHMENT",
    description:
      "Demo listing — not a real vacancy. Students will explore basic embedded systems, circuit prototyping, and documentation with a remote mentor.",
    applyUrl: "https://example.com/polyhub-demo/attachment-electronics",
    department: ["ET", "CST"],
    deadlineDays: 35,
  },
  {
    id: "demo-opportunity-job-cst",
    title: "Junior Frontend Engineer",
    companyName: "Demo: PixelRoute Technologies",
    location: "Dhaka",
    type: "FULL_TIME",
    description:
      "Demo listing — not a real vacancy. Entry-level role for a graduate interested in accessible web interfaces, JavaScript, and collaborative product work.",
    applyUrl: "https://example.com/polyhub-demo/job-frontend",
    department: ["CST"],
    deadlineDays: 40,
  },
  {
    id: "demo-opportunity-job-civil",
    title: "Graduate Assistant Site Engineer",
    companyName: "Demo: Greenline Build Co.",
    location: "Khulna",
    type: "FULL_TIME",
    description:
      "Demo listing — not a real vacancy. Support the site team with measurements, daily progress records, drawing coordination, and safety practices.",
    applyUrl: "https://example.com/polyhub-demo/job-site-engineer",
    department: ["CE"],
    deadlineDays: 32,
  },
  {
    id: "demo-opportunity-job-electrical",
    title: "Assistant Electrical Engineer",
    companyName: "Demo: SunGrid Energy",
    location: "Sylhet",
    type: "FULL_TIME",
    description:
      "Demo listing — not a real vacancy. Help with supervised installation checks, maintenance records, and renewable-energy system documentation.",
    applyUrl: "https://example.com/polyhub-demo/job-electrical",
    department: ["EEE", "POWER"],
    deadlineDays: 36,
  },
  {
    id: "demo-opportunity-job-mechanical",
    title: "Junior Mechanical Technician",
    companyName: "Demo: Riverbend Manufacturing",
    location: "Chattogram",
    type: "FULL_TIME",
    description:
      "Demo listing — not a real vacancy. Assist experienced engineers with equipment inspections, maintenance schedules, and production-floor reporting.",
    applyUrl: "https://example.com/polyhub-demo/job-mechanical",
    department: ["ME", "RAC"],
    deadlineDays: 27,
  },
  {
    id: "demo-opportunity-job-part-time",
    title: "Part-Time IT Support Assistant",
    companyName: "Demo: CampusCloud Support",
    location: "Remote",
    type: "PART_TIME",
    description:
      "Demo listing — not a real vacancy. Flexible part-time role helping document support requests, troubleshoot common issues, and assist with basic network checks.",
    applyUrl: "https://example.com/polyhub-demo/job-it-support",
    department: ["CST", "ET"],
    deadlineDays: 20,
  },
];

async function main() {
  for (const { deadlineDays, ...opportunity } of opportunities) {
    await prisma.opportunity.upsert({
      where: { id: opportunity.id },
      update: {
        ...opportunity,
        deadline: new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000),
      },
      create: {
        ...opportunity,
        deadline: new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log(`Seeded ${opportunities.length} demo opportunities.`);
}

main()
  .catch((error) => {
    console.error("Failed to seed demo opportunities:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
