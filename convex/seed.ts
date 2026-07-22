import { mutation } from "./_generated/server";

export const seedMockUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("users").collect();
    const mockCount = existing.filter(u => u.email.endsWith("@mock.com")).length;
    
    // Seed only if mock users are not already present
    if (mockCount >= 5) return;

    const mockProfiles = [
      { name: "Tars Assistant", email: "assistant@mock.com", imageUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=tars" },
      { name: "Alice Smith (Mock)", email: "alice@mock.com", imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice" },
      { name: "Bob Johnson (Mock)", email: "bob@mock.com", imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob" },
      { name: "Charlie Green (Mock)", email: "charlie@mock.com", imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=charlie" },
      { name: "Diana Prince (Mock)", email: "diana@mock.com", imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=diana" },
    ];

    for (let i = mockCount; i < mockProfiles.length; i++) {
      const p = mockProfiles[i];
      await ctx.db.insert("users", {
        name: p.name,
        email: p.email,
        imageUrl: p.imageUrl,
        clerkId: `mock_${p.email.split("@")[0]}`
      });
    }
  }
});
