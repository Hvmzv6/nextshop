import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/client";

const prisma = new PrismaClient();

type SeedPasswordName =
  | "SEED_ADMIN_PASSWORD"
  | "SEED_MODERATOR_PASSWORD"
  | "SEED_CLIENT_PASSWORD";

function getSeedPassword(name: SeedPasswordName) {
  const password = process.env[name];

  if (!password || password.length < 8) {
    throw new Error(`${name} must be set and contain at least 8 characters.`);
  }

  return password;
}

const categories = [
  {
    name: "Electronics",
    slug: "electronics",
    description: "Devices and accessories for work and play.",
  },
  {
    name: "Home & Living",
    slug: "home-living",
    description: "Useful and stylish products for your home.",
  },
  {
    name: "Outdoor",
    slug: "outdoor",
    description: "Gear for travel, exercise, and time outside.",
  },
] as const;

const products = [
  ["wireless-headphones", "Wireless Headphones", "Noise-isolating headphones with all-day battery life.", 12999, 24, "electronics"],
  ["mechanical-keyboard", "Mechanical Keyboard", "A compact mechanical keyboard with tactile switches.", 8999, 18, "electronics"],
  ["usb-c-hub", "USB-C Hub", "A six-port hub for modern laptops and tablets.", 4499, 32, "electronics"],
  ["smart-led-lamp", "Smart LED Lamp", "A dimmable desk lamp with adjustable color temperature.", 5999, 15, "electronics"],
  ["ceramic-mug", "Ceramic Mug", "A durable matte-finish mug for coffee or tea.", 1899, 40, "home-living"],
  ["linen-throw", "Linen Throw", "A lightweight woven throw for sofas and reading nooks.", 7499, 12, "home-living"],
  ["desk-organizer", "Desk Organizer", "A modular organizer for a tidy workspace.", 2999, 22, "home-living"],
  ["insulated-bottle", "Insulated Bottle", "A stainless-steel bottle that keeps drinks cold for hours.", 2499, 35, "outdoor"],
  ["daypack", "Everyday Daypack", "A water-resistant daypack with a padded laptop sleeve.", 6999, 14, "outdoor"],
  ["camping-lantern", "Camping Lantern", "A rechargeable lantern with three brightness modes.", 3299, 20, "outdoor"],
  ["folding-chair", "Folding Chair", "A lightweight chair for camping and outdoor events.", 5499, 10, "outdoor"],
  ["travel-towel", "Travel Towel", "A quick-drying microfiber towel for active trips.", 2199, 28, "outdoor"],
] as const;

function getCategoryId(categoryIds: Map<string, string>, slug: string) {
  const categoryId = categoryIds.get(slug);

  if (!categoryId) {
    throw new Error(`Seed category was not created: ${slug}`);
  }

  return categoryId;
}

async function main() {
  const passwords = {
    admin: await bcrypt.hash(getSeedPassword("SEED_ADMIN_PASSWORD"), 12),
    moderator: await bcrypt.hash(getSeedPassword("SEED_MODERATOR_PASSWORD"), 12),
    client: await bcrypt.hash(getSeedPassword("SEED_CLIENT_PASSWORD"), 12),
  };

  await prisma.user.upsert({
    where: { email: "admin@nextshop.local" },
    update: { name: "NextShop Admin", passwordHash: passwords.admin, role: "ADMIN", isActive: true },
    create: {
      name: "NextShop Admin",
      email: "admin@nextshop.local",
      passwordHash: passwords.admin,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "moderator@nextshop.local" },
    update: { name: "NextShop Moderator", passwordHash: passwords.moderator, role: "MODERATOR", isActive: true },
    create: {
      name: "NextShop Moderator",
      email: "moderator@nextshop.local",
      passwordHash: passwords.moderator,
      role: "MODERATOR",
    },
  });

  await prisma.user.upsert({
    where: { email: "client@nextshop.local" },
    update: { name: "NextShop Client", passwordHash: passwords.client, role: "CLIENT", isActive: true },
    create: {
      name: "NextShop Client",
      email: "client@nextshop.local",
      passwordHash: passwords.client,
      role: "CLIENT",
    },
  });

  const categoryIds = new Map<string, string>();

  for (const category of categories) {
    const savedCategory = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, description: category.description },
      create: category,
    });
    categoryIds.set(category.slug, savedCategory.id);
  }

  for (const [slug, name, description, priceCents, stock, categorySlug] of products) {
    await prisma.product.upsert({
      where: { slug },
      update: {
        name,
        description,
        priceCents,
        stock,
        categoryId: getCategoryId(categoryIds, categorySlug),
        isPublished: true,
      },
      create: {
        slug,
        name,
        description,
        priceCents,
        stock,
        categoryId: getCategoryId(categoryIds, categorySlug),
      },
    });
  }
}

main()
  .catch((error) => {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
