import prisma from '../src/prisma/prisma.client';
import { languages } from './seed-data/language';
import { technicalLabel } from './seed-data/technicalLabel';
import { domainLabel } from './seed-data/domainLabel';
import { roles } from './seed-data/role';
import { mockProjects } from './seed-data/mockProject';

async function main() {
  // Seed languages
  await Promise.all(
    languages.map(async (language) => {
      await prisma.language.upsert({
        where: { code: language.code },
        update: {},
        create: {
          code: language.code,
          name: language.name,
        },
      });
    }),
  );

  // Seed technical labels
  console.log('Seeding technical labels...');
  await Promise.all(
    technicalLabel.map(async (label) => {
      console.log(`Creating technical label: ${label.name}`);
      await prisma.technicalLabel.upsert({
        where: { name: label.name },
        update: {},
        create: {
          name: label.name,
        },
      });
    }),
  );

  // Seed domain labels
  console.log('Seeding domain labels...');
  await Promise.all(
    domainLabel.map(async (label) => {
      console.log(`Creating domain label: ${label.name}`);
      await prisma.domainLabel.upsert({
        where: { name: label.name },
        update: {},
        create: {
          name: label.name,
        },
      });
    }),
  );

  // Seed roles
  await Promise.all(
    roles.map(async (role) => {
      await prisma.role.upsert({
        where: { name: role.name },
        update: {},
        create: { name: role.name },
      });
    }),
  );

  // Seed mock projects in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log('Seeding mock projects for development environment...');

    // Create a mock founder user if it doesn't exist
    const mockFounder = await prisma.user.upsert({
      where: { email: 'mock.founder@example.com' },
      update: {},
      create: {
        email: 'mock.founder@example.com',
        username: 'mockfounder',
        password: 'mockpassword',
        passwordSalt: 'mocksalt',
        fullName: 'Mock Founder',
      },
    });

    // Seed each mock project
    for (const project of mockProjects) {
      console.log(`\nCreating project: ${project.title}`);
      console.log('Domain labels:', project.domainLabels);
      console.log('Technical labels:', project.technicalLabels);

      const createdProject = await prisma.project.create({
        data: {
          title: project.title,
          description: project.description,
          goal: project.goal,
          status: project.status,
          languageCode: project.languageCode,
          milestone: project.milestone,
          founderId: mockFounder.id,
          domainLabels: {
            create: project.domainLabels.map((labelName) => ({
              label: {
                connect: { name: labelName },
              },
            })),
          },
          technicalLabels: {
            create: project.technicalLabels.map((labelName) => ({
              label: {
                connect: { name: labelName },
              },
            })),
          },
        },
      });
      console.log(`Successfully created project: ${createdProject.title}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
