import youngAfricanBootcamp from "@assets/young_african_bootcamp.jpeg";
import piocUnilag from "@assets/pioc_unilag.jpeg";
import nigcomsat2026 from "@assets/nigcomsat_2026.jpeg";

export interface Achievement {
  slug: string;
  title: string;
  excerpt: string;
  content: string[];
  category: string;
  date: string;
  image: string;
}

export const achievements: Achievement[] = [
  {
    slug: "undp-incubation-2025",
    title: "AgroGuard Selected Among Top 30 Innovators for the UNDP Incubation Programme 2025",
    excerpt: "AgroGuard emerged among the Top 30 innovators selected from over 200 applicants during the Young African Bootcamp Programme, earning a place in the prestigious UNDP Incubation Programme 2025...",
    category: "AgroGuard Achievement",
    date: "October, 2025",
    image: youngAfricanBootcamp,
    content: [
      "AgroGuard achieved a remarkable milestone by securing a position among the Top 30 innovators selected from over 200 applicants who participated in the Young African Bootcamp Programme 2024. The highly competitive programme brought together talented entrepreneurs and innovators from across Africa to develop scalable solutions addressing critical social, environmental, and economic challenges.",
      "After a rigorous selection and evaluation process, AgroGuard successfully advanced to participate in the prestigious United Nations Development Programme (UNDP) Incubation Programme 2025. This opportunity provided access to mentorship, business development support, innovation workshops, strategic networking opportunities, and capacity-building sessions.",
      "During the incubation programme, AgroGuard further refined its climate-smart agricultural solutions, strengthened its business model, enhanced its technology roadmap, and expanded its vision of helping farmers adapt to climate change through intelligent risk assessment and early warning systems.",
      "This achievement represents a significant milestone in AgroGuard's journey toward building sustainable agricultural ecosystems and improving food security resilience across Africa."
    ]
  },
  {
    slug: "pioc-unilag-2025",
    title: "AgroGuard Ranked Among Top 10 Teams at the Professor Ogundipe Innovation Challenge 2025",
    excerpt: "AgroGuard was recognized among the Top 10 innovative teams and invited to the University of Lagos to present its climate-smart agricultural solution...",
    category: "AgroGuard Achievement",
    date: "December, 2025",
    image: piocUnilag,
    content: [
      "AgroGuard was honored to be selected among the Top 10 innovative teams during the Professor Ogundipe Innovation Challenge (PIOC) 2025. The competition attracted outstanding innovators, researchers, and entrepreneurs who presented transformative solutions capable of creating meaningful social and economic impact.",
      "As part of the competition, the AgroGuard team traveled to the University of Lagos to pitch its climate-smart agricultural solution before a distinguished panel of judges, academic leaders, investors, and innovation ecosystem stakeholders.",
      "The presentation focused on AgroGuard's use of climate intelligence, weather forecasting, risk assessment technologies, and agricultural advisory systems designed to empower farmers and improve agricultural resilience in the face of climate change.",
      "Being recognized among the top participants further validated AgroGuard's mission of leveraging innovative technologies to address agricultural and climate-related challenges affecting communities across Africa.",
      "The experience provided valuable exposure, strategic feedback, and networking opportunities that continue to strengthen AgroGuard's growth journey."
    ]
  },
  {
    slug: "nigcomsat-2026",
    title: "AgroGuard Selected Among Top 10 Startups to Pitch at NIGCOMSAT Satellite Week Abuja 2026",
    excerpt: "AgroGuard was selected among the Top 10 startups invited to pitch at the prestigious NIGCOMSAT Satellite Week held in Abuja, Nigeria...",
    category: "AgroGuard Achievement",
    date: "March, 2026",
    image: nigcomsat2026,
    content: [
      "AgroGuard reached another important milestone after being selected among the Top 10 startups invited to participate and pitch during the NIGCOMSAT Satellite Week 2026 held in Abuja, Nigeria.",
      "The event brought together leading startups, researchers, investors, policymakers, and technology experts from across the country to showcase innovative solutions utilizing satellite, geospatial, and climate technologies.",
      "During the event, AgroGuard presented its climate intelligence and agricultural risk assessment platform, demonstrating how climate data analytics, weather forecasting, and satellite-enabled technologies can support farmers in making informed decisions and mitigating climate-related risks.",
      "Participation in NIGCOMSAT Satellite Week provided AgroGuard with valuable exposure, opportunities for strategic partnerships, mentorship, and increased visibility within Nigeria's innovation and climate technology ecosystem.",
      "This achievement further reinforces AgroGuard's commitment to building innovative climate-smart agricultural solutions that improve resilience, sustainability, and food security across Africa."
    ]
  }
];
