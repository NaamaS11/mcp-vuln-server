import Groq from "groq-sdk";
import "dotenv/config";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

async function test() {
  try {
    const res = await groq.chat.completions.create({
      messages: [{ role: "user", content: "Say hello in one short sentence" }],
      model: "llama-3.1-8b-instant",
    });

    console.log("✅ SUCCESS:");
    console.log(res.choices[0]?.message?.content);
  } catch (err) {
    console.error("❌ ERROR:");

    if (err instanceof Error) {
      console.error(err.message);
      console.error(err.stack);
    } else {
      console.error(err);
    }
  }
}

test();