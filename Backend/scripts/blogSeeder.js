import mongoose from "mongoose";
import "dotenv/config";
import BlogCategory from "../models/BlogCategory.js";
import Blog from "../models/Blog.js";
import { generateUniqueSlug, calculateReadTime } from "../services/blogService.js";

const categoriesData = [
  { name: "Technology", description: "All things tech, coding, gadgets, and software development." },
  { name: "Travel", description: "Discover new places, travel guides, tips, and world trends." },
  { name: "Design", description: "Graphic design, branding, templates, UI/UX, and creative tips." },
  { name: "Business", description: "Startup ideas, financial tips, market analysis, and growth hacks." },
  { name: "Management", description: "Leadership insights, productivity tools, and organizational efficiency." },
  { name: "Trends", description: "Stay ahead with the latest modern lifestyle and technical shifts." },
  { name: "Startups", description: "Inspirational stories, fundings, and models from new ventures." },
  { name: "News", description: "Global summaries, reports, and breaking digital info." },
];

const blogsData = [
  {
    title: "How Tech Shapes the Future of Work in 2024",
    excerpt: "In today's ever-evolving world, storytelling has become a powerful tool for connection. Revision provides a unique platform for individuals to...",
    content: "Technology is redefining work environments. Remote collaboration, digital whiteboards, and instant messaging systems have created an asynchronous work model that allows global teams to build products together in real time. We explore the tools that are driving this transition and how companies are adapting to keep team alignment high.",
    categoryName: "Business",
    tags: ["Technology", "Work", "Future"],
    author: "Ethan Caldwell",
    status: "published",
    isFeatured: true,
    isTrending: true,
    views: 1240,
    publishedAt: new Date("2024-10-16"),
  },
  {
    title: "The Future of Work: Tech and Remote Trends",
    excerpt: "Find out why 2024 is predicted to be a pivotal year for sports technology and its impact on the industry.",
    content: "The intersection of work and tech continues to evolve rapidly. From AI-driven schedules to immersive remote environments, the modern workforce expects flexible arrangements powered by robust cloud tools. In this article, we outline what leaders need to consider for budgeting and infrastructure in 2024.",
    categoryName: "Design",
    tags: ["Work", "Trends", "Remote"],
    author: "Ethan Caldwell",
    status: "published",
    isFeatured: false,
    isTrending: true,
    views: 890,
    publishedAt: new Date("2024-09-29"),
  },
  {
    title: "Remote Work Trends in the Digital Age",
    excerpt: "Discover the cutting-edge tech gadgets making travel smarter and more convenient in 2024.",
    content: "As digital nomads expand, travel gear has shifted to focus on high portability and connectivity. Dual screen laptops, powerbanks with high wattage charging, and localized eSIMs have simplified the life of people working from coffee shops in Bali or co-working spaces in Berlin.",
    categoryName: "News",
    tags: ["Remote", "Digital", "Gadgets"],
    author: "Ethan Caldwell",
    status: "published",
    isFeatured: true,
    isTrending: false,
    views: 654,
    publishedAt: new Date("2024-09-22"),
  },
  {
    title: "Business Travel Tools for the Digital Age",
    excerpt: "Learn how startups are leveraging data to fuel growth and scale in today's competitive landscape.",
    content: "Startups are scaling faster than ever by automating their customer support and lead generation pipelines. By using pre-trained large language models, lean teams are able to support thousands of active users without scaling their support staff count linearly.",
    categoryName: "Business",
    tags: ["Business", "Travel", "Nomad"],
    author: "Ethan Caldwell",
    status: "published",
    isFeatured: false,
    isTrending: false,
    views: 432,
    publishedAt: new Date("2024-09-20"),
  },
  {
    title: "Key Sports Trends for 2024: From AI to Virtual Reality",
    excerpt: "Dive into the key sports trends like AI and virtual reality set to redefine the sports industry in 2024.",
    content: "Virtual reality is stepping out of the gaming den and onto the athletic field. Professional athletes now use high-fidelity VR simulators to run plays, analyze strategies, and experience visual gameplay without physical strain, reducing injury rates while keeping cognitive skills sharp.",
    categoryName: "Design",
    tags: ["Sports", "AI", "VR"],
    author: "Ethan Caldwell",
    status: "published",
    isFeatured: false,
    isTrending: true,
    views: 780,
    publishedAt: new Date("2024-09-18"),
  },
  {
    title: "The Impact of Automation on Business Management Efficiency",
    excerpt: "Learn how automation is boosting business management efficiency and driving growth in various sectors.",
    content: "Process automation has transitioned from a nice-to-have to a critical pillar of corporate longevity. Automating payroll, invoicing, and contract review saves thousands of operational hours annually, allowing managers to redirect resources to strategic partnerships and customer success.",
    categoryName: "Technology",
    tags: ["Automation", "Management", "Efficiency"],
    author: "Ethan Caldwell",
    status: "published",
    isFeatured: false,
    isTrending: false,
    views: 512,
    publishedAt: new Date("2024-09-15"),
  },
  {
    title: "Startups Disrupting the Sports Industry with Innovative Tech",
    excerpt: "Discover how startups are leveraging technology to disrupt and innovate within the sports industry.",
    content: "Wearable sensors are providing coach-level telemetry to amateur athletes. Startups are building devices that attach to rackets, bats, and shoes, providing high-precision data on posture, speed, and force directly to mobile apps for real-time adjustments.",
    categoryName: "Design",
    tags: ["Startups", "Sports", "Innovation"],
    author: "Ethan Caldwell",
    status: "published",
    isFeatured: false,
    isTrending: false,
    views: 310,
    publishedAt: new Date("2024-09-10"),
  },
  {
    title: "Travel Trends in 2024: Virtual Tours and Immersive Experiences",
    excerpt: "Explore the rise of virtual tours and immersive experiences shaping the future of travel in 2024.",
    content: "Travelers are previewing destinations in 3D before booking flights. Immersive hotel previews, street-level walking tours, and virtual museum visits are helping tourists budget and plan itinerary details with high confidence, leading to improved satisfaction.",
    categoryName: "News",
    tags: ["Travel", "Virtual", "Tours"],
    author: "Ethan Caldwell",
    status: "published",
    isFeatured: false,
    isTrending: false,
    views: 290,
    publishedAt: new Date("2024-09-08"),
  },
  {
    title: "Why Data Security is a Priority for Business Management in 2024",
    excerpt: "Understand why data security is a growing concern for business management in today's digital world.",
    content: "With cyberattacks becoming more sophisticated, companies are adopting zero-trust architectures. Verifying every user access token, enforcing multi-factor verification, and encrypting database layers are standard practices that protect valuable IP and retain customer trust.",
    categoryName: "Trends",
    tags: ["Security", "Data", "Business"],
    author: "Ethan Caldwell",
    status: "published",
    isFeatured: false,
    isTrending: false,
    views: 450,
    publishedAt: new Date("2024-09-05"),
  },
  {
    title: "Startups and AI: How Artificial Intelligence Drives Innovation",
    excerpt: "See how startups are harnessing the power of AI to foster innovation and reshape industries.",
    content: "AI is leveling the playing field for small businesses. By automating code creation, marketing copy drafts, and legal templates, early-stage startups can validate hypotheses and achieve product-market fit with minimal seed capital compared to previous decades.",
    categoryName: "Startups",
    tags: ["Startups", "AI", "Innovation"],
    author: "Ethan Caldwell",
    status: "published",
    isFeatured: false,
    isTrending: true,
    views: 950,
    publishedAt: new Date("2024-08-10"),
  },
];

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/imagica";
    console.log("Connecting to Database:", mongoUri);
    await mongoose.connect(mongoUri);
    console.log("Database connected. Clearing old blog collections...");

    await BlogCategory.deleteMany({});
    await Blog.deleteMany({});
    console.log("Cleared existing collections.");

    // Seed Categories
    const categoriesMap = {};
    for (const cat of categoriesData) {
      const slug = cat.name.toLowerCase();
      const savedCat = await BlogCategory.create({
        name: cat.name,
        slug,
        description: cat.description,
        image: `https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop` // Default placeholder image
      });
      categoriesMap[cat.name] = savedCat._id;
    }
    console.log(`Seeded ${Object.keys(categoriesMap).length} categories.`);

    // Seed Blogs
    let blogCount = 0;
    for (const blog of blogsData) {
      const categoryId = categoriesMap[blog.categoryName];
      if (!categoryId) {
        console.warn(`Category ${blog.categoryName} not found, skipping blog post.`);
        continue;
      }

      const slug = await generateUniqueSlug(blog.title, Blog);
      const readTime = calculateReadTime(blog.content);

      // Using beautiful placeholder images from Unsplash to match premium aesthetic of mockup
      const imageUrls = [
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop", // Tech 1
        "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&auto=format&fit=crop", // Tech 2
        "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&auto=format&fit=crop", // Tech 3
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop", // Tech 4
      ];
      const randomImage = imageUrls[blogCount % imageUrls.length];

      await Blog.create({
        title: blog.title,
        slug,
        excerpt: blog.excerpt,
        content: blog.content,
        featuredImage: randomImage,
        category: categoryId,
        tags: blog.tags,
        author: blog.author,
        status: blog.status,
        isFeatured: blog.isFeatured,
        isTrending: blog.isTrending,
        seoTitle: blog.title,
        seoDescription: blog.excerpt,
        seoKeywords: blog.tags,
        readTime,
        views: 0,
        publishedAt: blog.publishedAt,
      });
      blogCount++;
    }
    
    console.log(`Seeded ${blogCount} blog posts successfully.`);
    mongoose.disconnect();
    console.log("Disconnected from database.");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDB();
