import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seed Data Structure
 * 
 * Topic 1: TypeScript Fundamentals (3 subtopics, complexity 1-2)
 * Topic 2: Next.js Core Concepts (3 subtopics, complexity 2-3)
 * Topic 3: Advanced Patterns (3 subtopics, complexity 3-4)
 */

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface SubtopicContent {
  title: string;
  description: string;
  learningObjectives: string[];
  questions: Question[];
  deepDivePlaceholder: string;
}

async function main(): Promise<void> {
  console.log("🌱 Starting seed process...");

  // Clean up existing data
  await prisma.attempt.deleteMany();
  await prisma.userProgress.deleteMany();
  await prisma.subtopic.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.user.deleteMany();

  console.log("🗑️  Cleared existing data");

  // Create a demo user
  const user = await prisma.user.create({
    data: {
      email: "demo@gritflow.dev",
    },
  });
  console.log(`👤 Created user: ${user.email}`);

  // ===========================================
  // TOPIC 1: TypeScript Fundamentals
  // ===========================================
  const topic1 = await prisma.topic.create({
    data: {
      title: "TypeScript Fundamentals",
      description: "Master the core concepts of TypeScript including types, interfaces, and generics.",
      orderIndex: 1,
      status: "available",
    },
  });

  // Subtopic 1.1: Basic Types (Complexity 1)
  const subtopic1_1 = await prisma.subtopic.create({
    data: {
      topicId: topic1.id,
      title: "Basic Types",
      complexityScore: 1,
      estimatedMinutes: 30,
      status: "available",
      contentJson: JSON.stringify({
        title: "Basic Types",
        description: "Learn TypeScript's primitive and compound types.",
        learningObjectives: [
          "Understand primitive types: string, number, boolean",
          "Work with arrays and tuples",
          "Use enum and any types effectively",
        ],
        questions: [
          {
            id: "ts-basic-1",
            question: "What is the TypeScript type for a variable that can be either a string or number?",
            options: ["string | number", "string & number", "string + number", "any"],
            correctAnswer: 0,
            explanation: "Union types use the | operator to combine multiple types.",
          },
          {
            id: "ts-basic-2",
            question: "Which type represents an array where each element is a string?",
            options: ["string[]", "Array<string>", "Both A and B", "StringArray"],
            correctAnswer: 2,
            explanation: "TypeScript supports both string[] and Array<string> syntax for arrays.",
          },
          {
            id: "ts-basic-3",
            question: "What does the 'any' type do?",
            options: [
              "Makes a variable required",
              "Disables type checking entirely",
              "Creates a custom type",
              "Makes variable read-only",
            ],
            correctAnswer: 1,
            explanation: "The 'any' type opt-out of type checking, allowing any value.",
          },
          {
            id: "ts-basic-4",
            question: "What is a tuple in TypeScript?",
            options: [
              "A generic collection",
              "A fixed-length array with known types",
              "A type alias",
              "A union type",
            ],
            correctAnswer: 1,
            explanation: "Tuples represent fixed-length arrays where each position has a specific type.",
          },
          {
            id: "ts-basic-5",
            question: "Which keyword defines an enum?",
            options: ["enum", "type", "interface", "class"],
            correctAnswer: 0,
            explanation: "Enums are defined using the 'enum' keyword.",
          },
        ],
        deepDivePlaceholder: "Deep dive into advanced type system features coming soon...",
      } as SubtopicContent),
    },
  });

  // Subtopic 1.2: Interfaces & Types (Complexity 1)
  const subtopic1_2 = await prisma.subtopic.create({
    data: {
      topicId: topic1.id,
      title: "Interfaces & Types",
      complexityScore: 1,
      estimatedMinutes: 45,
      status: "locked",
      contentJson: JSON.stringify({
        title: "Interfaces & Types",
        description: "Define object shapes and type aliases.",
        learningObjectives: [
          "Create interfaces for object shapes",
          "Use type aliases effectively",
          "Extend and merge interfaces",
        ],
        questions: [
          {
            id: "ts-int-1",
            question: "What is the difference between interface and type?",
            options: [
              "No difference",
              "Interfaces can be extended, types cannot",
              "Types are more flexible for unions",
              "Interfaces are faster",
            ],
            correctAnswer: 2,
            explanation: "Types support union and intersection, interfaces support declaration merging.",
          },
          {
            id: "ts-int-2",
            question: "How do you extend an interface?",
            options: ["extends", "implements", "inherits", "super"],
            correctAnswer: 0,
            explanation: "Interfaces use 'extends' to inherit from other interfaces.",
          },
          {
            id: "ts-int-3",
            question: "What is optional property syntax?",
            options: ["property?: type", "property!: type", "property: type?", "property?: type?"],
            correctAnswer: 0,
            explanation: "The ? makes a property optional in the interface.",
          },
          {
            id: "ts-int-4",
            question: "How do you define a read-only property?",
            options: ["readonly property: type", "const property: type", "static property: type", "locked property: type"],
            correctAnswer: 0,
            explanation: "The 'readonly' modifier prevents property modification after initialization.",
          },
          {
            id: "ts-int-5",
            question: "What is interface declaration merging?",
            options: [
              "Combining two interfaces with same name",
              "Creating multiple instances",
              "Extending multiple interfaces",
              "Overriding interface methods",
            ],
            correctAnswer: 0,
            explanation: "TypeScript merges declarations with the same name into one interface.",
          },
        ],
        deepDivePlaceholder: "Deep dive into interface composition patterns coming soon...",
      } as SubtopicContent),
    },
  });

  // Subtopic 1.3: Generics (Complexity 2)
  const subtopic1_3 = await prisma.subtopic.create({
    data: {
      topicId: topic1.id,
      title: "Generics",
      complexityScore: 2,
      estimatedMinutes: 60,
      status: "locked",
      contentJson: JSON.stringify({
        title: "Generics",
        description: "Create reusable components with type parameters.",
        learningObjectives: [
          "Understand generic type parameters",
          "Create generic functions and classes",
          "Use constraints with generics",
        ],
        questions: [
          {
            id: "ts-gen-1",
            question: "What symbol denotes a generic type parameter?",
            options: ["<>", "[]", "()", "{}"],
            correctAnswer: 0,
            explanation: "Generics use angle brackets <> to define type parameters.",
          },
          {
            id: "ts-gen-2",
            question: "What is a generic constraint?",
            options: [
              "Limits what types can be used",
              "Makes generic required",
              "Defines default type",
              "Creates type alias",
            ],
            correctAnswer: 0,
            explanation: "Constraints restrict generic types using the 'extends' keyword.",
          },
          {
            id: "ts-gen-3",
            question: "What is the default type parameter syntax?",
            options: ["T = string", "T: string", "T default string", "default T = string"],
            correctAnswer: 0,
            explanation: "Default types are specified with = after the type parameter name.",
          },
          {
            id: "ts-gen-4",
            question: "What does 'keyof' operator return?",
            options: [
              "All values of a type",
              "Union of all property names",
              "Type of keys",
              "Number of properties",
            ],
            correctAnswer: 1,
            explanation: "keyof returns a union of all property name literal types.",
          },
          {
            id: "ts-gen-5",
            question: "What is a generic utility type?",
            options: [
              "Built-in generic types",
              "Custom type libraries",
              "Type aliases",
              "Global types",
            ],
            correctAnswer: 0,
            explanation: "Utility types like Partial<T> and Required<T> are built-in generics.",
          },
          {
            id: "ts-gen-6",
            question: "How do you infer return type in generics?",
            options: ["infer R", "return type R", "type R", "R: infer"],
            correctAnswer: 0,
            explanation: "The 'infer' keyword allows type inference within conditional types.",
          },
        ],
        deepDivePlaceholder: "Deep dive into advanced generic patterns coming soon...",
      } as SubtopicContent),
    },
  });

  console.log(`📚 Created Topic 1: ${topic1.title} with 3 subtopics`);

  // ===========================================
  // TOPIC 2: Next.js Core Concepts
  // ===========================================
  const topic2 = await prisma.topic.create({
    data: {
      title: "Next.js Core Concepts",
      description: "Build modern web applications with Next.js 14 App Router and server components.",
      orderIndex: 2,
      status: "locked",
    },
  });

  // Subtopic 2.1: App Router Fundamentals (Complexity 2)
  const subtopic2_1 = await prisma.subtopic.create({
    data: {
      topicId: topic2.id,
      title: "App Router Fundamentals",
      complexityScore: 2,
      estimatedMinutes: 45,
      status: "locked",
      contentJson: JSON.stringify({
        title: "App Router Fundamentals",
        description: "Understand the Next.js 14 App Router architecture.",
        learningObjectives: [
          "Understand folder-based routing",
          "Use layouts and templates",
          "Implement server and client components",
        ],
        questions: [
          {
            id: "next-1",
            question: "What file defines the root layout in Next.js 14?",
            options: ["layout.tsx", "page.tsx", "root.tsx", "app.tsx"],
            correctAnswer: 0,
            explanation: "layout.tsx in the app directory defines the root layout.",
          },
          {
            id: "next-2",
            question: "What is the default rendering in Next.js 14?",
            options: [
              "Client Component",
              "Server Component",
              "Static Site",
              "API Route",
            ],
            correctAnswer: 1,
            explanation: "Components in the app directory are Server Components by default.",
          },
          {
            id: "next-3",
            question: "How do you mark a component as client-side?",
            options: [
              "'use client' directive",
              "client: true prop",
              "export const client = true",
              "@client component",
            ],
            correctAnswer: 0,
            explanation: "The 'use client' directive marks a component for client-side rendering.",
          },
          {
            id: "next-4",
            question: "What is the purpose of a layout?",
            options: [
              "Define page styles",
              "Persist UI across page changes",
              "Handle API requests",
              "Manage state",
            ],
            correctAnswer: 1,
            explanation: "Layouts persist their state and don't re-render on navigation.",
          },
          {
            id: "next-5",
            question: "How do you create a dynamic route segment?",
            options: [
              "[folderName]",
              "{folderName}",
              "<folderName>",
              "route-folderName",
            ],
            correctAnswer: 0,
            explanation: "Square brackets [id] create dynamic route segments.",
          },
        ],
        deepDivePlaceholder: "Deep dive into App Router internals coming soon...",
      } as SubtopicContent),
    },
  });

  // Subtopic 2.2: Data Fetching (Complexity 2)
  const subtopic2_2 = await prisma.subtopic.create({
    data: {
      topicId: topic2.id,
      title: "Data Fetching",
      complexityScore: 2,
      estimatedMinutes: 50,
      status: "locked",
      contentJson: JSON.stringify({
        title: "Data Fetching",
        description: "Master data fetching patterns in Server Components.",
        learningObjectives: [
          "Use async/await in Server Components",
          "Implement caching strategies",
          "Handle loading and error states",
        ],
        questions: [
          {
            id: "next-df-1",
            question: "Which function enables request memoization?",
            options: ["fetch()", "useEffect()", "getServerSideProps", "static Get"],
            correctAnswer: 0,
            explanation: "fetch() with unique keys enables Next.js request memoization.",
          },
          {
            id: "next-df-2",
            question: "How do you create a loading UI?",
            options: [
              "loading.tsx file",
              "Loading component",
              "useLoading hook",
              "<Loading> element",
            ],
            correctAnswer: 0,
            explanation: "loading.tsx in the same folder shows during navigation suspense.",
          },
          {
            id: "next-df-3",
            question: "What does 'cache' function do?",
            options: [
              "Caches the fetch result",
              "Encrypts data",
              "Compresses response",
              "Validates input",
            ],
            correctAnswer: 0,
            explanation: "The cache function memoizes the fetch call result.",
          },
          {
            id: "next-df-4",
            question: "How do you handle errors in Server Components?",
            options: [
              "error.tsx",
              "try/catch",
              "ErrorBoundary",
              "catchError function",
            ],
            correctAnswer: 0,
            explanation: "error.tsx is a React Error Boundary for Server Components.",
          },
          {
            id: "next-df-5",
            question: "What is revalidation in data fetching?",
            options: [
              "Refetching stale data on demand",
              "Validating user input",
              "Checking permissions",
              "Error handling",
            ],
            correctAnswer: 0,
            explanation: "Revalidation refreshes cached data after a time or on demand.",
          },
        ],
        deepDivePlaceholder: "Deep dive into advanced caching strategies coming soon...",
      } as SubtopicContent),
    },
  });

  // Subtopic 2.3: Server Actions (Complexity 3)
  const subtopic2_3 = await prisma.subtopic.create({
    data: {
      topicId: topic2.id,
      title: "Server Actions",
      complexityScore: 3,
      estimatedMinutes: 55,
      status: "locked",
      contentJson: JSON.stringify({
        title: "Server Actions",
        description: "Handle form submissions and data mutations with Server Actions.",
        learningObjectives: [
          "Define and call Server Actions",
          "Handle form submissions",
          "Implement revalidation and redirects",
        ],
        questions: [
          {
            id: "next-sa-1",
            question: "How do you define a Server Action?",
            options: [
              "'use server' at function top",
              "export const action = ...",
              "server function()",
              "async function()",
            ],
            correctAnswer: 0,
            explanation: "'use server' marks a function as a Server Action.",
          },
          {
            id: "next-sa-2",
            question: "What triggers Server Action revalidation?",
            options: [
              "revalidatePath()",
              "refresh()",
              "reload()",
              "reset()",
            ],
            correctAnswer: 0,
            explanation: "revalidatePath() invalidates the cache for a route.",
          },
          {
            id: "next-sa-3",
            question: "How do you redirect after mutation?",
            options: [
              "redirect()",
              "router.push()",
              "navigate()",
              "window.location",
            ],
            correctAnswer: 0,
            explanation: "redirect() is a Server Action that navigates to a new route.",
          },
          {
            id: "next-sa-4",
            question: "What is useFormStatus hook for?",
            options: [
              "Track form submission state",
              "Validate form inputs",
              "Style form elements",
              "Create form schema",
            ],
            correctAnswer: 0,
            explanation: "useFormStatus provides pending state during form submission.",
          },
          {
            id: "next-sa-5",
            question: "Can Server Actions be used in Client Components?",
            options: [
              "Yes, by importing them",
              "No, only Server Components",
              "Only with prop drilling",
              "Only with context",
            ],
            correctAnswer: 0,
            explanation: "Server Actions can be imported and used in Client Components.",
          },
          {
            id: "next-sa-6",
            question: "What is useActionState hook for?",
            options: [
              "Handle action return values",
              "Create new actions",
              "Validate actions",
              "Cache actions",
            ],
            correctAnswer: 0,
            explanation: "useActionState provides state based on Server Action results.",
          },
        ],
        deepDivePlaceholder: "Deep dive into Server Action patterns coming soon...",
      } as SubtopicContent),
    },
  });

  console.log(`📚 Created Topic 2: ${topic2.title} with 3 subtopics`);

  // ===========================================
  // TOPIC 3: Advanced Patterns
  // ===========================================
  const topic3 = await prisma.topic.create({
    data: {
      title: "Advanced Patterns",
      description: "Master advanced TypeScript and React patterns for production applications.",
      orderIndex: 3,
      status: "locked",
    },
  });

  // Subtopic 3.1: TypeScript Advanced Types (Complexity 3)
  const subtopic3_1 = await prisma.subtopic.create({
    data: {
      topicId: topic3.id,
      title: "Advanced TypeScript",
      complexityScore: 3,
      estimatedMinutes: 60,
      status: "locked",
      contentJson: JSON.stringify({
        title: "Advanced TypeScript",
        description: "Master conditional types, mapped types, and template literals.",
        learningObjectives: [
          "Understand conditional types",
          "Create mapped types",
          "Use template literal types",
        ],
        questions: [
          {
            id: "ts-adv-1",
            question: "What is a conditional type?",
            options: [
              "Type with if-else logic",
              "Type that depends on another type",
              "Optional type",
              "Union type",
            ],
            correctAnswer: 1,
            explanation: "Conditional types select types based on other types using 'extends'.",
          },
          {
            id: "ts-adv-2",
            question: "What does 'infer' do in conditional types?",
            options: [
              "Infers type from expression",
              "Creates new type",
              "Validates type",
              "Merges types",
            ],
            correctAnswer: 0,
            explanation: "infer extracts and infers types within conditional type expressions.",
          },
          {
            id: "ts-adv-3",
            question: "What is a mapped type?",
            options: [
              "Transforms properties of a type",
              "Creates key-value pairs",
              "Maps external data",
              "Converts to object",
            ],
            correctAnswer: 0,
            explanation: "Mapped types transform existing types by iterating over keys.",
          },
          {
            id: "ts-adv-4",
            question: "What does the 'as' clause do in template literals?",
            options: [
              "Type assertion",
              "Type casting",
              "Type narrowing",
              "Type widening",
            ],
            correctAnswer: 0,
            explanation: "as const creates literal types from values.",
          },
          {
            id: "ts-adv-5",
            question: "What is the satisfies operator?",
            options: [
              "Validates type without widening",
              "Creates new type",
              "Extends interface",
              "Defines generic",
            ],
            correctAnswer: 0,
            explanation: "satisfies validates a value matches a type while preserving inference.",
          },
        ],
        deepDivePlaceholder: "Deep dive into type-level programming coming soon...",
      } as SubtopicContent),
    },
  });

  // Subtopic 3.2: tRPC & API Patterns (Complexity 3)
  const subtopic3_2 = await prisma.subtopic.create({
    data: {
      topicId: topic3.id,
      title: "tRPC & API Patterns",
      complexityScore: 3,
      estimatedMinutes: 60,
      status: "locked",
      contentJson: JSON.stringify({
        title: "tRPC & API Patterns",
        description: "Build type-safe APIs with tRPC.",
        learningObjectives: [
          "Define tRPC routers and procedures",
          "Implement input validation with Zod",
          "Handle authentication in procedures",
        ],
        questions: [
          {
            id: "trpc-1",
            question: "What is a tRPC router?",
            options: [
              "Collection of procedures",
              "API endpoint",
              "Database query",
              "UI component",
            ],
            correctAnswer: 0,
            explanation: "A router is a collection of related procedures in tRPC.",
          },
          {
            id: "trpc-2",
            question: "How do you define input validation in tRPC?",
            options: [
              "Zod schema",
              "TypeScript types",
              "JSON schema",
              "Express middleware",
            ],
            correctAnswer: 0,
            explanation: "Zod schemas validate inputs in tRPC procedures.",
          },
          {
            id: "trpc-3",
            question: "What is a tRPC procedure?",
            options: [
              "Single API endpoint",
              "Database model",
              "UI component",
              "Config file",
            ],
            correctAnswer: 0,
            explanation: "A procedure is a single API endpoint (query or mutation).",
          },
          {
            id: "trpc-4",
            question: "How do you protect a procedure?",
            options: [
              "Use protected procedure wrapper",
              "Add auth header",
              "Create middleware",
              "Use router middleware",
            ],
            correctAnswer: 0,
            explanation: "Protected procedures enforce authentication via middleware.",
          },
          {
            id: "trpc-5",
            question: "What does tRPC provide end-to-end?",
            options: [
              "Type safety",
              "Authentication",
              "Database",
              "UI components",
            ],
            correctAnswer: 0,
            explanation: "tRPC provides full-stack type safety from API to client.",
          },
        ],
        deepDivePlaceholder: "Deep dive into tRPC patterns coming soon...",
      } as SubtopicContent),
    },
  });

  // Subtopic 3.3: State Management (Complexity 4)
  const subtopic3_3 = await prisma.subtopic.create({
    data: {
      topicId: topic3.id,
      title: "Advanced State Management",
      complexityScore: 4,
      estimatedMinutes: 70,
      status: "locked",
      contentJson: JSON.stringify({
        title: "Advanced State Management",
        description: "Scale your application with advanced state patterns.",
        learningObjectives: [
          "Implement global state with Zustand",
          "Use optimistic updates",
          "Handle server state synchronization",
        ],
        questions: [
          {
            id: "state-1",
            question: "What is optimistic update?",
            options: [
              "Update UI before server confirms",
              "Predict user input",
              "Cache previous state",
              "Lazy load state",
            ],
            correctAnswer: 0,
            explanation: "Optimistic updates show expected result immediately for better UX.",
          },
          {
            id: "state-2",
            question: "What does Zustand use for state?",
            options: [
              "create function",
              "useState hook",
              "Context API",
              "Redux store",
            ],
            correctAnswer: 0,
            explanation: "Zustand's create function creates stores with simple hooks.",
          },
          {
            id: "state-3",
            question: "How do you persist Zustand state?",
            options: [
              "persist middleware",
              "localStorage directly",
              "Redux persist",
              "React persist",
            ],
            correctAnswer: 0,
            explanation: "The persist middleware saves state to storage automatically.",
          },
          {
            id: "state-4",
            question: "What is server state?",
            options: [
              "Data from server that needs syncing",
              "Static configuration",
              "User preferences",
              "Component state",
            ],
            correctAnswer: 0,
            explanation: "Server state is remote data managed by React Query/tanStack Query.",
          },
          {
            id: "state-5",
            question: "What is cache invalidation?",
            options: [
              "Marking cached data as stale",
              "Deleting cache",
              "Updating cache",
              "Creating cache",
            ],
            correctAnswer: 0,
            explanation: "Invalidation marks cached data for refetching.",
          },
          {
            id: "state-6",
            question: "What does refetchOnFocus do?",
            options: [
              "Refetch when window gains focus",
              "Focus element",
              "Cache element",
              "Load element",
            ],
            correctAnswer: 0,
            explanation: "refetchOnFocus triggers refetch when user returns to the app.",
          },
        ],
        deepDivePlaceholder: "Deep dive into state architecture coming soon...",
      } as SubtopicContent),
    },
  });

  console.log(`📚 Created Topic 3: ${topic3.title} with 3 subtopics`);

  // ===========================================
  // Create initial user progress for first subtopic
  // ===========================================
  await prisma.userProgress.create({
    data: {
      userId: user.id,
      subtopicId: subtopic1_1.id,
      status: "not_started",
      currentPhase: "content",
      coreMastery: 0.0,
    },
  });

  console.log("✅ Seed completed successfully!");
  console.log(`📊 Summary:`);
  console.log(`   - Users: 1`);
  console.log(`   - Topics: 3`);
  console.log(`   - Subtopics: 9`);
  console.log(`   - Questions: 52 total`);
}

main()
  .catch((error: Error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
