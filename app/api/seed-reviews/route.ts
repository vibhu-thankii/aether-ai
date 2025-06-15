import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin'; // Use the admin SDK for backend scripts
import { serverTimestamp } from 'firebase/firestore'; // Only import serverTimestamp if you need it for compatibility, otherwise remove

// --- Generated Reviews Data ---
const seedData = [
    // Girlfriend Agent Reviews
    { agentId: 'placeholder-1', rating: 5, text: "So sweet and always knows what to say. It really feels like talking to a friend.", authorName: "Rohan S." },
    { agentId: 'placeholder-1', rating: 4, text: "Pretty impressive! The conversations feel very natural.", authorName: "Priya K." },
    { agentId: 'placeholder-1', rating: 5, text: "A wonderful companion for lonely evenings. Highly recommend.", authorName: "Amit" },

    // Mindfulness Coach Reviews
    { agentId: 'oYxMlLkXbNtZDS3zCikc', rating: 5, text: "The 5-minute meditations are a lifesaver during a busy workday. So calming.", authorName: "Anjali" },
    { agentId: 'oYxMlLkXbNtZDS3zCikc', rating: 5, text: "I've genuinely felt less stressed since I started using this. The voice is very soothing.", authorName: "Vikram" },
    { agentId: 'oYxMlLkXbNtZDS3zCikc', rating: 4, text: "Good for beginners in mindfulness. The advice is simple and effective.", authorName: "Sunita" },

    // Sales Agent Reviews
    { agentId: 'L4mP6VOSm5qn61IW4Hml', rating: 5, text: "Practicing my pitch with this agent has boosted my confidence immensely. It's like having a sales coach on demand.", authorName: "Karan M." },
    { agentId: 'L4mP6VOSm5qn61IW4Hml', rating: 4, text: "Great for handling objections. The AI gives some really clever responses.", authorName: "Neha" },

    // Game Master Reviews
    { agentId: 'obmk35jYzsvmFDtgiIfk', rating: 5, text: "This is SO much fun! The adventures are always exciting and unpredictable. 10/10.", authorName: "Gamer_Adi" },
    { agentId: 'obmk35jYzsvmFDtgiIfk', rating: 5, text: "I can't believe how creative the stories are. My elf ranger is now on a quest to find a dragon's tear!", authorName: "Ishita" },

    // Story Teller Reviews
    { agentId: 'placeholder-2', rating: 5, text: "My kids love the bedtime stories. Every night is a new adventure.", authorName: "Aarav's Dad" },
    { agentId: 'placeholder-2', rating: 4, text: "A great way to spark creativity. The sci-fi stories are my favorite.", authorName: "Sonia" },
];

export async function GET(request: Request) {
  try {
    console.log("Starting to seed reviews...");
    const agentReviewsRef = db.collection('agent_reviews');
    
    // An object to hold the aggregated data before updating Firestore
    const agentMetaUpdates: {[key: string]: { totalRating: number, reviewCount: number }} = {};

    // First, add all the review documents
    for (const review of seedData) {
      await agentReviewsRef.add({
        ...review,
        createdAt: new Date(),
        // Adding a placeholder userId for the seed data
        userId: 'seed_user',
      });
      
      // Aggregate the data locally
      if (!agentMetaUpdates[review.agentId]) {
        agentMetaUpdates[review.agentId] = { totalRating: 0, reviewCount: 0 };
      }
      agentMetaUpdates[review.agentId].totalRating += review.rating;
      agentMetaUpdates[review.agentId].reviewCount += 1;
    }

    // Now, update the agent_meta collection in transactions
    for (const agentId in agentMetaUpdates) {
        const metaRef = db.collection('agent_meta').doc(agentId);
        const { totalRating, reviewCount } = agentMetaUpdates[agentId];

        await db.runTransaction(async (transaction) => {
            transaction.set(metaRef, {
                averageRating: totalRating / reviewCount,
                reviewCount: reviewCount,
            });
        });
    }

    console.log("Seeding complete!");
    return NextResponse.json({ message: "Successfully seeded reviews and updated agent metadata." });

  } catch (error: any) {
    console.error("Error seeding database:", error);
    return new NextResponse(`Seeding Error: ${error.message}`, { status: 500 });
  }
}
