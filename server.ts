import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

// Ensure process environment variable is available
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// Persistent History Setup
const HISTORY_FILE = path.join(process.cwd(), "history.json");

interface Sticker {
  prompt: string;
  concept: string;
  stickerText: string;
  description: string;
  characterType: string;
}

interface Pack {
  id: string;
  timestamp: string;
  category: string;
  stickers: Sticker[];
}

interface HistoryData {
  generated_concepts: string[];
  generated_prompts: string[];
  packs: Pack[];
}

function loadHistory(): HistoryData {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const data = fs.readFileSync(HISTORY_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading history file:", error);
  }
  return {
    generated_concepts: [],
    generated_prompts: [],
    packs: []
  };
}

function saveHistory(data: HistoryData) {
  try {
    // Keep list sizes reasonable (e.g. max 500 saved concepts for optimization, but enough for blacklist)
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing history file:", error);
  }
}

// Lazy load Google GenAI SDK to handle missing key gracefully
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please manage it in Settings -> Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

// API Routes

// 1. Get history logs & database status
app.get("/api/history", (req, res) => {
  try {
    const history = loadHistory();
    res.json({
      success: true,
      conceptsCount: history.generated_concepts.length,
      promptsCount: history.generated_prompts.length,
      packsCount: history.packs.length,
      concepts: history.generated_concepts,
      packs: history.packs
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Clear history database
app.post("/api/history/clear", (req, res) => {
  try {
    const emptyHistory: HistoryData = {
      generated_concepts: [],
      generated_prompts: [],
      packs: []
    };
    saveHistory(emptyHistory);
    res.json({ success: true, message: "Concept memory database successfully cleared!" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fisher-Yates Shuffle helper to guarantee randomized, zero-repetition pools
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

// String hashing helper to ensure consistent but unpredictable variety
function getStringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Helper to map sandbox quotes to highly relevant and aligned visual vectors dynamically
function getSandboxVibeForQuote(quote: string, index: number, category: string, seed: number = 0): { adj: string, mascot: string, action: string, situation: string } {
  // Delegate directly to our gorgeous new 40-style non-repeating semantic system
  return getNewSandboxVibeForQuote(quote, index, category, seed);
  
  const norm = quote.toLowerCase();
  const isKawaii = category === "Kawaii ADHD" || category.toLowerCase().includes("kawaii");
  const randomizerIndex = getStringHash(quote) + index + seed;
  
  // Layer 1: High-fidelity exact matches and semantic keywords first
  
  // 1. Copy-paste, templates, shortcuts
  if (norm.includes("copy-paste") || norm.includes("copy") || norm.includes("paste")) {
    if (isKawaii) {
      const mascots = ["Corgi Mascot", "Panda Mascot", "Chubby Canary", "Pastel Teacup"];
      return {
        adj: "proud",
        mascot: mascots[index % mascots.length],
        action: "proudly hugging two giant matching keyboard keycaps labeled 'Ctrl+C' and 'Ctrl+V', with sweet pastel stars floating around",
        situation: "treating copied files and templates as their ultimate executive control superpower"
      };
    } else {
      const mascots = ["Tech Developer Girl", "Cute Gamer Boy", "Speeding Brain Mascot", "Blinking Laptop Screen"];
      return {
        adj: "efficient",
        mascot: mascots[index % mascots.length],
        action: "happily typing on a dual split mechanical keyboard next to cute retro code cursors",
        situation: "conquering computer work and digital formatting shortcuts effortlessly"
      };
    }
  }

  // 2. Wired and tired, caffeine overload
  if (norm.includes("wired & tired") || norm.includes("wired and tired") || norm.includes("wired uniques") || norm.includes("wired uniquely")) {
    if (isKawaii) {
      const mascots = ["Sloth Mascot", "Axolotl Mascot", "Lavender Cup", "Sleepy Baby Owl"];
      return {
        adj: "wired but tired",
        mascot: mascots[index % mascots.length],
        action: "holding open its sleepy eyes with tiny yellow toothpicks while clinging tightly to a steaming espresso cup in its paws",
        situation: "surviving on high volumes of warm caffeine while desperately wanting to take a nap"
      };
    } else {
      const mascots = ["Overworked Tech Girl", "Tired Student Boy", "Fidgety Brain Mascot", "Active Alarm Clock"];
      return {
        adj: "exhausted but hyper active",
        mascot: mascots[index % mascots.length],
        action: "slouched over a cluttered computer deck covered in mug doodles, wearing an oversized hoodie and glasses",
        situation: "living on double-shot coffee cups to keep the mental engine running"
      };
    }
  }

  // 3. Beep boop, computer, brain reboot, compilation, compiler
  if (norm.includes("beep boop") || norm.includes("beep") || norm.includes("boop") || norm.includes("robot") || norm.includes("compiler")) {
    if (isKawaii) {
      const mascots = ["Robo-Bunny", "Coffee Mug Mascot", "Strawberry Waffle", "Chubby Canary"];
      return {
        adj: "futuristic",
        mascot: mascots[index % mascots.length],
        action: "wearing a glowing mint-green computer motherboard hat with antennas sending off pink and cyan heart-shaped sparks",
        situation: "rebooting its mental operational files when executive focus is completely gone"
      };
    } else {
      const mascots = ["Coding Gamer Boy", "Tech Developer Girl", "Fidgety Cartoon Brain", "Blinking Laptop Screen"];
      return {
        adj: "rebooting",
        mascot: mascots[index % mascots.length],
        action: "staring with funny loading grids and green 'BEEP BOOP' terminal text symbols flying around",
        situation: "processing a complete mental system restart after intense study"
      };
    }
  }

  // 4. Spicy thoughts, spicy brain, spicy meatball, chili pepper
  if (norm.includes("spicy thoughts") || norm.includes("spicy brain") || norm.includes("spicy neurotype") || norm.includes("spicy meatball") || norm.includes("spicy") || norm.includes("🌶️")) {
    if (isKawaii) {
      const mascots = ["Red Panda Mascot", "Kitten Mascot", "Sweet Donut Mascot", "Chubby Baby Owl"];
      return {
        adj: "spicy",
        mascot: mascots[index % mascots.length],
        action: "fanning its tongue frantically with a miniature paper fan after eating a tiny cute red chili pepper with cartoon eyes, with funny steam curls venting from its ears",
        situation: "navigating an extremely hyperactive, high-velocity spicy brain"
      };
    } else {
      const mascots = ["Spicy Cartoon Brain", "Energetic Gamer Girl", "Excited Boy Illustration", "Cute Lightbulb Mascot"];
      return {
        adj: "hyperactive",
        mascot: mascots[index % mascots.length],
        action: "releasing bright neon electric sparks and mini cartoon rocket drawings from its ears like a fun creative explosion",
        situation: "managing an absolute tornado of spicy ideas"
      };
    }
  }

  // 5. Social battery, low battery, percent
  if (norm.includes("social battery") || norm.includes("battery") || norm.includes("charge") || norm.includes("charging")) {
    if (isKawaii) {
      const mascots = ["Pastel Panda", "Lavender Cup", "Sleepy Kitten", "Sweet Fluffy Cupcake"];
      return {
        adj: "exhausted",
        mascot: mascots[index % mascots.length],
        action: "curled up snugly inside an upside-down pastel coffee cup decorated with a battery icon showing a single blinking red bar",
        situation: "running completely out of social energy in the middle of a major team conversation"
      };
    } else {
      const mascots = ["Exhausted Study Girl", "Tired Gamer Boy", "Drain-out Brain Mascot", "Battery Charger Mascot"];
      return {
        adj: "depleted",
        mascot: mascots[index % mascots.length],
        action: "slumped in a giant soft beanbag with a cartoon battery outline above showing a zero percent warning light",
        situation: "resting completely offline to recharge their social energy reserves"
      };
    }
  }

  // 6. Marshmallow brain, mushy, soft
  if (norm.includes("marshmallow") || norm.includes("soft") || norm.includes("fluffy")) {
    if (isKawaii) {
      const mascots = ["Axolotl Mascot", "Sweet Fluffy Cupcake", "Chubby Canary", "Pastel Boba Cup"];
      return {
        adj: "squishy",
        mascot: mascots[index % mascots.length],
        action: "floating happily on its back inside a cup of hot cocoa filled with tiny smiling marshmallow cubes wearing miniature smiles",
        situation: "letting their brain turn into beautiful soft marshmallow mush to fully recover focus"
      };
    } else {
      const mascots = ["Cozy Knitwear Girl", "Chill Teenager Boy", "Soft Pink Cartoon Brain", "Cute Lightbulb Mascot"];
      return {
        adj: "completely relaxed",
        mascot: mascots[index % mascots.length],
        action: "melting happily like warm pastel butter while hugging a huge puffy clouds illustration with big star pins",
        situation: "letting all stress drift away into soft creative space"
      };
    }
  }

  // 7. Focus is gone, focusing 1%
  if (norm.includes("focus is gone") || norm.includes("focusing...") || norm.includes("focusing... 1%") || norm.includes("0%")) {
    if (isKawaii) {
      const mascots = ["Dinosaur Mascot", "Lavender Cup", "Sleepy Koala Mascot", "Pastel Pancake Mascot"];
      return {
        adj: "stuck",
        mascot: mascots[index % mascots.length],
        action: "staring unblinkingly at a giant grey percentage battery bar showing '1%' with a tiny chubby hamster walking slowly on a running wheel inside of it",
        situation: "waiting patiently for their focus recharge cycle to kick in"
      };
    } else {
      const mascots = ["Struggling Student Boy", "Puzzled Designer Girl", "Unfocused Brain Mascot", "Blinking Laptop Screen"];
      return {
        adj: "frozen",
        mascot: mascots[index % mascots.length],
        action: "staring into blank space with a giant pink and green loading buffered icon spinning right above its head",
        situation: "stuck in waiting mode while the mental processor buffers"
      };
    }
  }

  // 8. Out of sight, out of mind, out of reality, object permanence
  if (norm.includes("out of sight") || norm.includes("object permanence") || norm.includes("permanence") || norm.includes("out of reality")) {
    if (isKawaii) {
      const mascots = ["Sloth Mascot", "Cute Coffee Mug", "Sleepy Baby Owl", "Sweet Donut Mascot"];
      return {
        adj: "absentminded",
        mascot: mascots[index % mascots.length],
        action: "waving a cheerful goodbye to a cute cartoon refrigerator with pastel angel wings slowly floating up into the pink clouds",
        situation: "respecting the absolute laws of ADHD object permanence in everyday life"
      };
    } else {
      const mascots = ["Forgetful Bookworm Girl", "Confused Gamer Boy", "Absentminded Brain Mascot", "Flying Key Mascot"];
      return {
        adj: "distracted",
        mascot: mascots[index % mascots.length],
        action: "searching frantically inside empty pockets as a pair of cute colorful keys float away under warm angel wings",
        situation: "dealing with items that instantly cease to exist when not in front of them"
      };
    }
  }

  // 9. Time is a social construct, calendar deadliness, Construct
  if (norm.includes("social construct") || norm.includes("construct") || norm.includes("time is")) {
    if (isKawaii) {
      const mascots = ["Capybara Mascot", "Lavender Cup", "Koala Mascot", "Fluffy Cupcake Mascot"];
      return {
        adj: "philosophical",
        mascot: mascots[index % mascots.length],
        action: "standing calmly next to a giant melting pocket-watch shaped like a warm pancake, holding a tiny chamomile teacup",
        situation: "treating calendar schedules and strict alarm deadlines as purely theoretical rules"
      };
    } else {
      const mascots = ["Philosophical Student Boy", "Calm Studio Artist Girl", "Wise Cartoon Brain", "Active Alarm Clock"];
      return {
        adj: "thoughtful",
        mascot: mascots[index % mascots.length],
        action: "sitting in cross-legged relaxation next to a melting surreal pocket-watch with clock hands shaped like funny spaghetti",
        situation: "viewing schedules as merely warm friendly hints rather than strict constraints"
      };
    }
  }

  // 10. 3 speeds, panic, deadline vibes, panic button, anxiety baking, anxiety level
  if (norm.includes("3 speeds") || norm.includes("panic") || norm.includes("dread") || norm.includes("emergency") || norm.includes("anxious") || norm.includes("anxiety")) {
    if (isKawaii) {
      const mascots = ["Golden Retriever Mascot", "Bunny Mascot", "Hedgehog Mascot", "Chubby Canary"];
      return {
        adj: "frenzied",
        mascot: mascots[index % mascots.length],
        action: "running in fast cartoon circles with its ears pinned back, leaving a hilarious trail of tiny red panic exclamation marks",
        situation: "shifting instantly between cozy sleep, hyperfocus, and full deadline emergency panic"
      };
    } else {
      const mascots = ["Panicked Exam Boy", "Stressed Freelancer Girl", "Trembling Brain Mascot", "Active Alarm Clock"];
      return {
        adj: "alarmed",
        mascot: mascots[index % mascots.length],
        action: "sprinting at high speed with sweat drops flying, carrying a huge bright red alarm clock showing 11:59 PM",
        situation: "unleashing emergency hyper-speed when a deadline is extremely close"
      };
    }
  }

  // 11. Side quest, sidequest, side-quest, multi-wandering
  if (norm.includes("side quest") || norm.includes("side-quest") || norm.includes("sidequest") || norm.includes("wandering")) {
    if (isKawaii) {
      const mascots = ["Fox Mascot", "Chubby Canary", "Lavender Cup", "Strawberry Waffle"];
      return {
        adj: "adventurous",
        mascot: mascots[index % mascots.length],
        action: "wearing a tiny brown explorer hat, inspecting a cute glowing yellow ladybug with a massive magnifying glass, ignoring a giant road sign labeled 'MAIN PORTAL'",
        situation: "getting entirely, beautifully sidetracked by a micro side-quest"
      };
    } else {
      const mascots = ["Explorer Boy Illustration", "Hobbyist Creator Girl", "Adventurous Cartoon Brain", "Compass Mascot"];
      return {
        adj: "distracted",
        mascot: mascots[index % mascots.length],
        action: "climbing a mountain of dense educational books with maps, backpacks, and compasses, completely away from their original math folder",
        situation: "discovering wonderful niche side quests while completing a daily chore"
      };
    }
  }

  // 12. Hyperfixating, hyperfixat, focus mode, projects
  if (norm.includes("hyperfixat") || norm.includes("focus mode") || norm.includes("projects") || norm.includes("hobbies") || norm.includes("hobby") || norm.includes("skill")) {
    if (isKawaii) {
      const mascots = ["Axolotl Mascot", "Bunny Mascot", "Pastel Teacup", "Fluffy Cupcake Mascot"];
      return {
        adj: "intensely focused",
        mascot: mascots[index % mascots.length],
        action: "intensely gluing together a tiny model castle or painting a miniature canvas with a heap of vibrant color tubes and gold star outlines",
        situation: "devoting 100% of their physical and spiritual energy to a brand new hyperfixation"
      };
    } else {
      const mascots = ["Crafty Creator Girl", "Gamer Tech Boy", "Hyperfocused Brain Mascot", "Cute Lightbulb Mascot"];
      return {
        adj: "hyperfocused",
        mascot: mascots[index % mascots.length],
        action: "sitting in absolute laser focus painting tiny model castle pieces, surrounded by reference magazines, crayons, and sparkling star particles",
        situation: "completely immersing themselves in an exciting new creative field for 24 hours"
      };
    }
  }

  // 13. Tabs, browser, chrome
  if (norm.includes("tab") || norm.includes("tabs") || norm.includes("browser") || norm.includes("chrome")) {
    if (isKawaii) {
      const mascots = ["Kitten Mascot", "Chubby Canary", "Coffee Mug Mascot", "Sweet Donut Mascot"];
      return {
        adj: "overwhelmed",
        mascot: mascots[index % mascots.length],
        action: "completely surrounded by 40 tiny glowing browser window frames with pink and green circular loading symbols hovering frantically around its ears",
        situation: "trying to navigate a chaotic digital workstation with dozens of ideas open at once"
      };
    } else {
      const mascots = ["Busy Home Office Girl", "Code Nerd Student Boy", "Overloaded Brain Mascot", "Blinking Laptop Screen"];
      return {
        adj: "overloaded",
        mascot: mascots[index % mascots.length],
        action: "frantically typing with dual keyboards as forty mini browser window drawings cascade from its head",
        situation: "keeping forty tabs open because closing them feels like discarding precious memories"
      };
    }
  }

  // 14. Untitled, sheet, spreadsheets, document, folders, files
  if (norm.includes("untitled") || norm.includes("sheet") || norm.includes("spreadsheet") || norm.includes("document") || norm.includes("folder") || norm.includes("file") || norm.includes("files")) {
    if (isKawaii) {
      const mascots = ["Panda Mascot", "Sleepy Baby Owl", "Lavender Cup", "Pastel Marshmallow"];
      return {
        adj: "digital-overloaded",
        mascot: mascots[index % mascots.length],
        action: "staring wide-eyed in mute cartoon terror at a giant glowing laptop screen filled with cascading 'Untitled-99' draft folders and red warning signs",
        situation: "being comically buried under a heavy, digital mountain of draft folders and document files"
      };
    } else {
      const mascots = ["Overwhelmed Student Girl", "Tired Writer Boy", "Stacked Brain Mascot", "Blinking Laptop Screen"];
      return {
        adj: "buried",
        mascot: mascots[index % mascots.length],
        action: "peeking out from under a comical heavy collapse of folder files marked 'Taxes', 'Ideas', and 'Untitled-99'",
        situation: "navigating the absolute stack of unfinished folders and spreadsheets in daily workspace files"
      };
    }
  }

  // 15. Coffee, lifeline, cup, mug, drink, beverage, tea, hydrate, water, boba
  if (norm.includes("coffee") || norm.includes("lifeline") || norm.includes("cup") || norm.includes("mug") || norm.includes("drink") || norm.includes("beverage") || norm.includes("tea") || norm.includes("hydrate") || norm.includes("water") || norm.includes("boba")) {
    if (isKawaii) {
      const mascots = ["Sloth Mascot", "Otter Mascot", "Lavender Cup", "Sweet Cupcake Mascot"];
      return {
        adj: "highly caffeinated",
        mascot: mascots[index % mascots.length],
        action: "hugging a massive steaming coffee mug like a plush sleeping bag, with tiny yellow heart outlines rising up in the warm steam",
        situation: "relying on high-octane liquid dopamine and warm tea as their absolute primary lifecycle lifeline"
      };
    } else {
      const mascots = ["Coffee Bar Gamer Boy", "Cozy Tech Hoodie Girl", "Steaming Brain Mascot", "Cool Lavender Cup"];
      return {
        adj: "caffeinated",
        mascot: mascots[index % mascots.length],
        action: "wearing big cute headphones and taking a deep happy sip from an enormous multi-gallon coffee cup labeled 'Fuel'",
        situation: "using warm tea and coffee as their primary power source to function"
      };
    }
  }

  // 16. Forgot, forget, keys, where, lost, mind-slip, door, room, pencil, glasses, remember
  if (norm.includes("forgot") || norm.includes("forget") || norm.includes("key") || norm.includes("keys") || norm.includes("where") || norm.includes("lost") || norm.includes("mind-slip") || norm.includes("door") || norm.includes("room") || norm.includes("pencil") || norm.includes("glasses") || norm.includes("remember")) {
    if (isKawaii) {
      const mascots = ["Corgi Mascot", "Koala Mascot", "Chubby Canary", "Pastel Teacup"];
      return {
        adj: "forgetful",
        mascot: mascots[index % mascots.length],
        action: "scratching its head in complete puzzlement with a giant glowing neon-yellow cartoon question-mark hovering above its ears as it stares at its empty hands",
        situation: "misplacing essential items or immediately forgetting exactly why they entered a cozy room"
      };
    } else {
      const mascots = ["Forgetful Studious Boy", "Absentminded Designer Girl", "Puzzled Brain Mascot", "Flying Key Mascot"];
      return {
        adj: "clueless",
        mascot: mascots[index % mascots.length],
        action: "staring into a brightly lit refrigerator in absolute confusion with zero thoughts floating overhead and glasses sitting on its forehead",
        situation: "misplacing essential items and forgetting why they entered a room the second they walked through"
      };
    }
  }

  // 17. Dopamine, hunt, scavenger, hunter-gatherer, stars, shiny, glitter, gold, coin, sugar, candy
  if (norm.includes("dopamine") || norm.includes("hunt") || norm.includes("scavenger") || norm.includes("hunter-gatherer") || norm.includes("stars") || norm.includes("glitter") || norm.includes("gold") || norm.includes("coin") || norm.includes("sugar") || norm.includes("candy")) {
    if (isKawaii) {
      const mascots = ["Golden Retriever Mascot", "Fox Mascot", "Hamster Mascot", "Sweet Donut Mascot"];
      return {
        adj: "dopamine-seeking",
        mascot: mascots[index % mascots.length],
        action: "proudly catching bright pastel star-sprinkles in mid-air with a tiny pink butterfly net, with huge gleaming cartoon anime eyes of pure joy",
        situation: "actively hunting down the next instant surge of essential brain dopamine and pretty shiny objects"
      };
    } else {
      const mascots = ["Rainbow-haired Creator Girl", "Joyful Gamer Boy", "Sparkly Cartoon Brain", "Cute Lightbulb Mascot"];
      return {
        adj: "thrilled",
        mascot: mascots[index % mascots.length],
        action: "diving into a treasure chest loaded with retro 16-bit gaming badges, glowing gold star icons, and sweet candy sprinkles",
        situation: "getting a pristine, magical rush of energy when a new fun concept clicks"
      };
    }
  }

  // 18. Alarm, snooze, clock, timer, late, midnight, hour, sleep, blanket, burrito, couch, bed, nap
  if (norm.includes("alarm") || norm.includes("snooze") || norm.includes("clock") || norm.includes("timer") || norm.includes("late") || norm.includes("midnight") || norm.includes("hour") || norm.includes("sleep") || norm.includes("blanket") || norm.includes("burrito") || norm.includes("couch") || norm.includes("bed") || norm.includes("nap")) {
    if (isKawaii) {
      const mascots = ["Sloth Mascot", "Capybara Mascot", "Panda Mascot", "Pastel Marshmallow"];
      return {
        adj: "cozy",
        mascot: mascots[index % mascots.length],
        action: "snuggling deeply inside a cozy fluffy blanket burrito, happily ignoring 10 vibrating cartoon alarms showing single-digit snooze bars",
        situation: "protecting their peaceful sleep bubble from active deadlines and scheduled clock notifications"
      };
    } else {
      const mascots = ["Snoozing Teen Boy", "Blanket Burrito Girl", "Sleepy Cartoon Brain", "Active Alarm Clock"];
      return {
        adj: "sleepy",
        mascot: mascots[index % mascots.length],
        action: "snuggling happily with a fluffy white pillow sleep mask, ignoring a giant vibrating retro clock that is ringing in panic",
        situation: "sleeping through another alarm to maintain basic biological warmth"
      };
    }
  }

  // 19. Pills, meds, medication, wellness, self-care, health, plant, plants, calm, silence, peace, breathe
  if (norm.includes("pill") || norm.includes("pills") || norm.includes("meds") || norm.includes("medication") || norm.includes("medicated") || norm.includes("wellness") || norm.includes("self-care") || norm.includes("health") || norm.includes("plant") || norm.includes("plants") || norm.includes("calm") || norm.includes("silence") || norm.includes("peace") || norm.includes("breathe")) {
    if (isKawaii) {
      const mascots = ["Bunny Mascot", "Panda Mascot", "Lavender Cup", "Sweet Donut Mascot"];
      return {
        adj: "mindful",
        mascot: mascots[index % mascots.length],
        action: "sitting in a tranquil cross-legged lotus pose with closed eyes, proudly balancing a giant smiling pastel medicine capsule on its head",
        situation: "prioritizing self-compassion, physical wellness, and quiet calming grounding exercises"
      };
    } else {
      const mascots = ["Healthy Creator Girl", "Cozy Mindful Boy", "Relaxing Pink Brain", "Cute Lightbulb Mascot"];
      return {
        adj: "grounded",
        mascot: mascots[index % mascots.length],
        action: "sitting in a relaxing zen pose surrounded by cute monstera green leaves, holding a water cup and a tiny, clean pastel daily pill dispenser box",
        situation: "taking care of their busy neurotype with proper care, structure, and peace"
      };
    }
  }

  // 20. List, plans, planning, checklist, hard, start, working, chores, laundry, tasks, home office, zoom, mic, keyboard, compil, bug, spacebars, task, doom
  if (norm.includes("list") || norm.includes("plans") || norm.includes("planning") || norm.includes("checklist") || norm.includes("hard") || norm.includes("start") || norm.includes("working") || norm.includes("chores") || norm.includes("laundry") || norm.includes("tasks") || norm.includes("home office") || norm.includes("zoom") || norm.includes("mic") || norm.includes("keyboard") || norm.includes("compil") || norm.includes("bug") || norm.includes("spacebars") || norm.includes("task") || norm.includes("doom") || norm.includes("procrastinat")) {
    if (isKawaii) {
      const mascots = ["Koala Mascot", "Hedgehog Mascot", "Coffee Mug Mascot", "Pastel Marshmallow"];
      return {
        adj: "overwhelmed",
        mascot: mascots[index % mascots.length],
        action: "frantically clinging to a giant white checklist where only 'Wake Up' is checked off, looking back at a massive pile of unwashed clothes",
        situation: "wrestling with the high starting friction of small administrative jobs"
      };
    } else {
      const mascots = ["Busy Planner Girl", "Homework Overwhelmed Boy", "Checklist-crazy Brain Mascot", "Active Alarm Clock"];
      return {
        adj: "paralyzed",
        mascot: mascots[index % mascots.length],
        action: "staring with a comically shocked look at a humongous whiteboard list covered in scribbled notes and pink sticky tags",
        situation: "spending four hours meticulously planning the work-flow instead of doing the task"
      };
    }
  }

  // 21. SQUIRREL!
  if (norm.includes("squirrel") || norm.includes("squirrel!")) {
    if (isKawaii) {
      const mascots = ["Corgi Mascot", "Kitten Mascot", "Chubby Canary", "Pastel Teacup"];
      return {
        adj: "instantly distracted",
        mascot: mascots[index % mascots.length],
        action: "having its head turned at a dramatic 90-degree whiplash angle, staring with enormous wide dilated glassy eyes at a tiny cartoon squirrel flying past a pink tree",
        situation: "being completely highjacked by a microsecond passing distraction"
      };
    } else {
      const mascots = ["Easily-distracted Gamer Boy", "Tech Geek Girl", "Fidgety Winged Brain Mascot", "Cute Lightbulb Mascot"];
      return {
        adj: "sidetracked",
        mascot: mascots[index % mascots.length],
        action: "staring wide-eyed as its attention is instantly pulled away by a funny neon cartoon butterfly fluttering across the screen margin",
        situation: "losing all momentum in an instant to an incredibly beautiful passing visual stimulus"
      };
    }
  }

  // 22. Brain, brain's, brain cells
  if (norm.includes("brain") || norm.includes("cell") || norm.includes("cells")) {
    if (isKawaii) {
      const mascots = ["Axolotl Mascot", "Chubby Canary", "Pink Mug Mascot", "Fluffy Cupcake Mascot"];
      return {
        adj: "fidgety",
        mascot: mascots[index % mascots.length],
        action: "wearing a spinning helicopter propeller hat and giant retro sneakers, bouncing happily on a pink trampoline in empty space",
        situation: "navigating an extremely high-energy brain space"
      };
    } else {
      const mascots = ["Cute Pink Cartoon Brain", "Hyper Creative Girl", "Enthusiastic Student Boy", "Blinking Laptop Screen"];
      return {
        adj: "bouncy",
        mascot: mascots[index % mascots.length],
        action: "bouncing on a mini trampoline in space while wearing a spinning multi-colored helicopter propeller cap and tiny green high-top sneakers",
        situation: "controlling an active, high-power thinking room with endless thoughts"
      };
    }
  }

  // 23. Survived today, survived, fine
  if (norm.includes("survived") || norm.includes("fine")) {
    if (isKawaii) {
      const mascots = ["Bunny Mascot", "Corgi Mascot", "Cute Canary Bird", "Pastel Cupcake Mascot"];
      return {
        adj: "triumphant",
        mascot: mascots[index % mascots.length],
        action: "crying happy cartoon tears while wearing a shiny gold medal and holding a big banner that says 'I survived today! 🏆'",
        situation: "celebrating getting through a highly chaotic and exhausting day"
      };
    } else {
      const mascots = ["Triumphant Study Girl", "Smiling Gamer Boy", "Victorious Cartoon Brain", "Active Alarm Clock"];
      return {
        adj: "victorious",
        mascot: mascots[index % mascots.length],
        action: "holding a big gold trophy with sparkling stars and a pastel banner declaring 'Survived Another Daily Grind!'",
        situation: "celebrating getting through a highly demanding and exhausting day"
      };
    }
  }

  // 24. Daydream, cloud, daydreaming
  if (norm.includes("daydream") || norm.includes("cloud") || norm.includes("space") || norm.includes("daydreaming")) {
    if (isKawaii) {
      const mascots = ["Bunny Mascot", "Sloth Mascot", "Chubby Canary", "Sweet Donut Mascot"];
      return {
        adj: "dreamy",
        mascot: mascots[index % mascots.length],
        action: "sleeping happily on its side on top of a giant fluffy pink cloud, blowing a small blue snoring bubble with tiny stars rising around",
        situation: "letting their mind wander through gorgeous imaginary galaxies"
      };
    } else {
      const mascots = ["Daydreaming Artist Girl", "Imagining Music Boy", "Floating Starry Brain", "Cute Lightbulb Mascot"];
      return {
        adj: "spacey",
        mascot: mascots[index % mascots.length],
        action: "gazing off out of a bedroom window at floating cartoon pastel planets, galaxies, and paper plane drawings in deep space",
        situation: "letting their imagination drift into beautiful dream realms during a lecture"
      };
    }
  }

  // 25. Understimulated, lazy
  if (norm.includes("understimulated") || norm.includes("lazy")) {
    if (isKawaii) {
      const mascots = ["Koala Mascot", "Panda Mascot", "Pastel Boba Cup", "Pastel Marshmallow"];
      return {
        adj: "understimulated",
        mascot: mascots[index % mascots.length],
        action: "lying completely flat on its back like a star-fish on a soft circular green rug, staring with heavy sleepy eyes at the ceiling",
        situation: "experiencing intense, heavy executive understimulation"
      };
    } else {
      const mascots = ["Bored Staring Boy", "Lazy Day Girl", "Static Pink Brain", "Blinking Laptop Screen"];
      return {
        adj: "inert",
        mascot: mascots[index % mascots.length],
        action: "lying completely flat on their back in an oversized baggy sweatshirt, letting their jaw slide into the floor as an empty pixel bar sits above",
        situation: "stuck in a state of intense sensory and developmental understimulation"
      };
    }
  }

  // 26. Procrastinate, procrastinating, active procrastination
  if (norm.includes("procrastinat") || norm.includes("procrastinating")) {
    if (isKawaii) {
      const mascots = ["Sloth Mascot", "Kitten Mascot", "Chubby Sparrow", "Sweet Cupcake Mascot"];
      return {
        adj: "procrastinating",
        mascot: mascots[index % mascots.length],
        action: "expertly playing a tiny guitar or stacking cookies to build a tower instead of cleaning up or doing any real work",
        situation: "turning avoiding active tasks into a spectacular high-performance sport"
      };
    } else {
      const mascots = ["Procrastinating Student Boy", "Sketching Artist Girl", "Multi-tasking Brain Mascot", "Cute Lightbulb Mascot"];
      return {
        adj: "creative",
        mascot: mascots[index % mascots.length],
        action: "artistically painting a complex watercolor masterpiece or tuning a mini retro synthesizer instead of doing their direct school chores",
        situation: "turning productive task avoidance into a spectacular fine arts division"
      };
    }
  }

  // 27. Homework, study, exam, reading, notebook, comments, comment
  if (norm.includes("homework") || norm.includes("study") || norm.includes("exam") || norm.includes("reading") || norm.includes("notebook") || norm.includes("comment") || norm.includes("comments") || norm.includes("facts")) {
    if (isKawaii) {
      const mascots = ["Sleepy Owl", "Chubby Canary", "Lavender Cup", "Pastel Pancake Mascot"];
      return {
        adj: "exhausted",
        mascot: mascots[index % mascots.length],
        action: "nestled inside a giant pile of half-colored post-it notes, holding a tiny glowing yellow highlighter marker in its wing",
        situation: "doing three hours of deep study research on a highly exciting but completely irrelevant history fact instead of exam review"
      };
    } else {
      const mascots = ["Enthusiastic Student Girl", "Overwhelmed Study Boy", "Academic Brain Mascot", "Busy Pen Mascot"];
      return {
        adj: "hyperfocused",
        mascot: mascots[index % mascots.length],
        action: "engaging in deep research index-card files regarding deep dinosaur mythology instead of preparing their active history quiz",
        situation: "doing three hours of deep-dive research on a highly exciting but irrelevant wikipedia topic"
      };
    }
  }

  // 28. Oops, oopsie, huh, what, did I, wait
  if (norm.includes("oops") || norm.includes("oopsie") || norm.includes("huh") || norm.includes("what") || norm.includes("did i") || norm.includes("wait")) {
    if (isKawaii) {
      const mascots = ["Corgi Mascot", "Hamster Mascot", "Chubby Canary", "Pastel Boba Cup"];
      return {
        adj: "startled",
        mascot: mascots[index % mascots.length],
        action: "staring with massive dilated cartoon eyes of pure alarm, with three red exclamation marks vibrating right above its ears",
        situation: "experiencing a sudden sudden realization of a forgotten task or keys left inside"
      };
    } else {
      const mascots = ["Surprised Boy Illustration", "Shocked Tech Girl", "Red-alert Brain Mascot", "Flying Key Mascot"];
      return {
        adj: "startled",
        mascot: mascots[index % mascots.length],
        action: "doing a funny cartoon facepalm with multiple glowing red exclamation warning symbols vibrating around their head",
        situation: "realizing they left their wallet at home or didn't hit send on that urgent email"
      };
    }
  }

  // Fallback default dynamic matching - procedurally generated with extreme variety to guarantee zero visual duplicates!
  if (isKawaii) {
    const cuteKawaiiMascots = [
      "Lazy Sloth Mascot", "Sleepy Panda Mascot", "Hyper Corgi Mascot", "Dozing Capybara Mascot", "Curious Axolotl Mascot",
      "Tiny Fluffy Kitten Mascot", "Floppy-eared Bunny Mascot", "Chubby Canary Mascot", "Chubby Baby Owl Mascot", "Mischief Fox Mascot",
      "Cozy Lavender Mug Mascot", "Smiling Happy Teapot Mascot", "Sweet Strawberry Mascot", "Fluffy Cupcake Mascot", "Sweet Cinnamon Bun Mascot",
      "Warm Croissant Mascot", "Happy Boba Tea Cup Mascot", "Pastel Marshmallow Bundle", "Wobbling Honey Jar Mascot", "Friendly Hamster Mascot",
      "Cute Hedgehog Mascot", "Sleepy Koala Bear Mascot", "Playful Otter Mascot", "Little Squirrel Mascot", "Tired Sheep Mascot"
    ];

    const cuteKawaiiAdjectives = [
      "adorably sleepy", "gorgeously distracted", "sweetly hyperactive", "wonderfully cozy", "softly confused",
      "cute fidgety", "pastel-colored dreamy", "playfully startled", "fluffy overwhelmed", "gently mindful",
      "sweetly disorganized", "comically exhausted", "brightly dopamine-seeking", "cutely side-questing", "gloriously spaced-out"
    ];

    const cuteKawaiiActions = [
      "nestled snugly in an oversized fluffy dark cloud sleeping bag while clutching a tiny glittering golden star, surrounded by sparkles",
      "gazing with enormous, shiny anime eyes of pure joy at a giant floating strawberry cupcake decorated with candy stars",
      "happily floating in empty pastel-pink cosmic space surrounded by tiny glittering yellow hearts and adorable milk-box cartons",
      "staring blankly with colossal, dilated cute cartoon eyes while a single glowing neon-yellow question-mark hovers above its ears",
      "expertly balancing a towering stack of rainbow macarons on its tiny wet nose while happily wiggling its fluffy paws",
      "hugging a giant, warm, steaming cup of lavender chamomile tea with steam curls forming cute miniature hearts and smiles",
      "looking comically shocked while being buried up to its whiskers under a massive mountain of colorful laundry socks and tiny books",
      "clinging tightly to a comical, vibrating pastel retro alarm clock with cute clock legs while wearing a soft white sleeping mask",
      "joyfully chasing three floating, glittery neon-colored bubbles across the clean sticker canvas with a wide tongue-out smile",
      "sitting cross-legged in a peaceful zen meditation pose while a tiny pink blossom flower rests perfectly on its forehead",
      "clutching a giant sparkling blue fountain pen like a sword, happily pretending to fight off three tiny flying paper planes",
      "snuggling inside a warm, fluffy croissant blanket burrito while sleeping peacefully with cute cartoon double Zzz indicators",
      "staring at a laptop screen showing dozens of tiny glowing cartoon web browser tab frames with a cute puzzled head tilt",
      "happily catching glowing yellow star sprinkles in mid-air with an adorable tiny pink butterfly net",
      "happily typing on a tiny pastel mechanical keyboard with custom keycaps shaped like cute strawberries and stars"
    ];

    const cuteKawaiiSituations = [
      "completely ignoring its structured chore list in favor of taking a warm, cozy afternoon nap",
      "experiencing a magical, instantaneous rush of pure joy from finding a tiny sparkling beautiful object on the floor",
      "wandering off into wonderful, comforting daydreaming adventures during study hours",
      "having a sudden adorable realization of a forgotten task but choosing to stay happy and comfy anyway",
      "navigating its wonderfully unique, creative, and highly active neurodivergent mind space with style",
      "finding an incredible burst of hyperfocus motivation on a cute but extremely minor side chore",
      "doing its absolute, starry-eyed best to stay happy and focused amidst a whirlwind of beautiful visual thoughts",
      "patiently waiting for its dopamine engine to boot up while surrounding itself with comforting cozy things"
    ];

    const mascot = cuteKawaiiMascots[randomizerIndex % cuteKawaiiMascots.length];
    const adj = cuteKawaiiAdjectives[(randomizerIndex + 3) % cuteKawaiiAdjectives.length];
    const action = cuteKawaiiActions[(randomizerIndex + 7) % cuteKawaiiActions.length];
    const situation = cuteKawaiiSituations[(randomizerIndex + 11) % cuteKawaiiSituations.length];

    return { adj, mascot, action, situation };
  } else {
    const genericMascots = [
      "Tech Developer Girl with a chic oversized hoodie", "Lazy Teenager Boy in an oversized baggy graphic tshirt",
      "Studious Artist Girl with colorful paint splatters on her cheeks", "Fidgety Gamer Boy wearing massive glowing neon headphones",
      "Pink Chibi Brain character walking in tiny retro sneakers", "Glowing Electric Brain with a spinning helicopter propeller cap",
      "Energetic Retro Alarm Clock with cute cartoon eyes and waving arms", "Messy Laptop Screen with funny error dialog frames",
      "Cute Lightbulb Mascot wearing tiny round vintage glasses", "A wobbly stack of colorful spiral Notebooks with cartoon smiles",
      "A happy Desk Fan blowing pink papers and stars everywhere", "A cute Pencil Sketch Mascot with a giant pink eraser hat",
      "A glowing golden Dopamine Coin with tiny cartoon angel wings", "An ambitious Calendar Notebook wearing a tiny sparkling crown",
      "A giant daily Pill Capsule holding a tiny glass water bottle"
    ];

    const genericAdjectives = [
      "comically paralyzed", "highly hyperfocused", "delightfully chaotic", "gloriously side-questing", "extremely wired",
      "wonderfully sidetracked", "hilariously overwhelmed", "completely spacey", "actively procrastinating", "beautifully unique",
      "cheerfully disorganized", "speedy but derailed", "highly caffeinated", "sweetly neurodivergent", "powerfully inspired"
    ];

    const genericActions = [
      "staring in absolute comedic bewilderment at a humongous whiteboard covered in neon sticky notes and arrows",
      "happily typing at a speed of 1000 keystrokes a minute on a split-layout dual mechanical keyboard with colorful RGB lighting",
      "lying completely flat on its back on a circular green rug like a starfish, letting its jaw slide open in funny exhaustion",
      "swimming around happily inside a giant steaming mug of hot dark coffee while holding a tiny retro spoon",
      "proudly carrying a massive gold trophy that has sparkling yellow stars and cartoon wings rising from its base",
      "looking wide-eyed and stunned while being encircled by forty floating browser tab window outlines",
      "frantically writing lines of compiler code on a giant floating notepad while bright green errors fly around",
      "happily painting an abstract splash of bright watercolors on a clean vertical canvas using an oversized brush",
      "sitting in waiting mode on top of a giant hourglass, staring off at floating paper planes and clock gears",
      "snuggling under a huge, heavy weighted blanket mask while ignoring an alarm clock that is ringing in wild cartoon lines",
      "meticulously polishing a single tiny keycap key while ignoring a towering mountain of homework papers and textbooks",
      "proudly holding a beautiful banner declaring 'I survived today!' with a funny gold medal pinned to its collar",
      "gazing up in pure adoration at a sparkling neon lightbulb that is releasing a flood of creative cartoon lightbeams",
      "running dynamically on a tiny hamster wheel that is wired to a glowing laptop screen with multiple loading bars",
      "doing a dramatic facepalm with three glowing red exclamation symbols vibrating right above its forehead"
    ];

    const genericSituations = [
      "spending five consecutive hours planning a flawless morning routine instead of starting any actual work",
      "hyperfixating on a brand new 3D mechanical puzzle while its scheduled deadlines fly quietly past",
      "navigating the brilliant, highly-spiced, and incredibly fast speed lanes of its custom cerebral engine",
      "disregarding major administrative tasks to pursue a highly exciting creative side mission",
      "doing three weeks of complex digital work in exactly three minutes of pure late-night panic productivity",
      "making peace with its organized chaos while keeping its spirit high and caffeinated",
      "taking care of its neurotype with deep-breathing self-care exercises and cute, structured medication schedules",
      "celebrating getting through a demanding academic day with standard, highly cozy personal rewards"
    ];

    const mascot = genericMascots[randomizerIndex % genericMascots.length];
    const adj = genericAdjectives[(randomizerIndex + 4) % genericAdjectives.length];
    const action = genericActions[(randomizerIndex + 8) % genericActions.length];
    const situation = genericSituations[(randomizerIndex + 12) % genericSituations.length];

    return { adj, mascot, action, situation };
  }
}

// ==========================================
// NEW 40-STYLE SEMANTIC-MATCHING ENGINE
// ==========================================
function detectQuoteMood(quote: string): "confused" | "hyperactive" | "overwhelmed" | "calm" | "procrastinate" {
  const norm = quote.toLowerCase();
  
  // Confused / Spaced out / Forgetful
  if (
    norm.includes("huh") || 
    norm.includes("what") || 
    norm.includes("forgot") || 
    norm.includes("where") || 
    norm.includes("lost") || 
    norm.includes("loading") || 
    norm.includes("empty") || 
    norm.includes("tab") || 
    norm.includes("untitled") || 
    norm.includes("error") || 
    norm.includes("fail") || 
    norm.includes("space") || 
    norm.includes("waiting") ||
    norm.includes("memory") ||
    norm.includes("perceive") ||
    norm.includes("stare") ||
    norm.includes("staring") ||
    norm.includes("noise") ||
    norm.includes("noisy") ||
    norm.includes("unread") ||
    norm.includes("dazed") ||
    norm.includes("clueless")
  ) {
    return "confused";
  }
  
  // Hyperactive / Wired / Excited / Shininess
  if (
    norm.includes("shiny") || 
    norm.includes("squirrel") || 
    norm.includes("dopamine") || 
    norm.includes("hunting") || 
    norm.includes("chase") || 
    norm.includes("wired") || 
    norm.includes("spicy") || 
    norm.includes("sparkle") || 
    norm.includes("speed") || 
    norm.includes("speeding") ||
    norm.includes("hyperfocus") || 
    norm.includes("magic") || 
    norm.includes("yay") ||
    norm.includes("star") ||
    norm.includes("stars") ||
    norm.includes("pinball") ||
    norm.includes("fast") ||
    norm.includes("bouncing") ||
    norm.includes("excited") ||
    norm.includes("high-energy")
  ) {
    return "hyperactive";
  }

  // Overwhelmed / Burnout / Exhausted / Anxious
  if (
    norm.includes("tired") || 
    norm.includes("exhaust") || 
    norm.includes("battery") || 
    norm.includes("paralysis") || 
    norm.includes("overwhelm") || 
    norm.includes("dread") || 
    norm.includes("trying") || 
    norm.includes("doom") || 
    norm.includes("anxious") || 
    norm.includes("anxiety") || 
    norm.includes("fragile") || 
    norm.includes("loud") || 
    norm.includes("deadline") ||
    norm.includes("deadlines") ||
    norm.includes("drowning") ||
    norm.includes("shhh") ||
    norm.includes("pain") ||
    norm.includes("burnout") ||
    norm.includes("panic")
  ) {
    return "overwhelmed";
  }

  // Calm / Quiet / Self-Care / Rest / Tea
  if (
    norm.includes("breathe") || 
    norm.includes("zen") || 
    norm.includes("peace") || 
    norm.includes("hydrate") || 
    norm.includes("water") || 
    norm.includes("rest") || 
    norm.includes("calm") || 
    norm.includes("soft") || 
    norm.includes("tea") || 
    norm.includes("cozy") || 
    norm.includes("burrito") || 
    norm.includes("gentle") || 
    norm.includes("nothing") || 
    norm.includes("slow") || 
    norm.includes("sleep") ||
    norm.includes("nap") ||
    norm.includes("comfort") ||
    norm.includes("shield") ||
    norm.includes("sunlight") ||
    norm.includes("mugs") ||
    norm.includes("blanket")
  ) {
    return "calm";
  }

  // Procrastination / Later / Side Quest / Sarcasm
  return "procrastinate";
}

function getDetailedStyle(styleId: number, mood: "confused" | "hyperactive" | "overwhelmed" | "calm" | "procrastinate", isKawaii: boolean, seedIndex: number) {
  // Kawaii mascot lists
  const kawaiiMascots = {
    confused: ["Sleepy Sloth Mascot", "Puzzled Panda Mascot", "Clueless Axolotl Mascot", "Confused Koala Mascot", "Dazed Hamster Mascot"],
    hyperactive: ["Hyper Corgi Mascot", "Bouncing Bunny Mascot", "Joyful Kitten Mascot", "Active Squirrel Mascot", "Chubby Sparrow Mascot"],
    overwhelmed: ["Exhausted Sheep Mascot", "Melting Capybara Mascot", "Overwhelmed Otter Mascot", "Tired Bunny Mascot", "Dripping Lavender Cup"],
    calm: ["Zen Capybara Mascot", "Cozy Sloth Mascot", "Peaceful Kitten Mascot", "Warm Tea Mug Mascot", "Sleeping Cloud Mascot"],
    procrastinate: ["Silly Kitten Mascot", "Distracted Corgi Mascot", "Cheeky Fox Mascot", "Playful Hamster Mascot", "Sweet Cinnamon Bun Mascot"]
  };

  // Human, brain, retro object mascot lists
  const genericMascots = {
    confused: ["Puzzled Brain Mascot", "Glitching Laptop Mascot", "Unfocused Lightbulb Mascot", "Clueless Alarm Clock"],
    hyperactive: ["Gamer Boy with massive RGB headphones", "Tech Developer Girl with a cute laptop", "Glow-spit Brain Mascot in sneakers", "Bouncing Dopamine Coin Mascot"],
    overwhelmed: ["Tired Student Boy face-down on a desk", "Weeping Artist Girl over unwashed brushes", "Overloaded CPU Server box Mascot", "Dead-tired Alarm Clock Mascot"],
    calm: ["Cozy Blanket Girl drinking tea", "Chill Programmer Boy listening to lo-fi", "Tranquil Cloud Mascot", "Meditating Brain Mascot on a lotus leaf"],
    procrastinate: ["Gaming Boy holding controller", "Procrastinating Designer Girl sipping mocktail", "Cute Gremlin Goblin Mascot", "Trash Panda Raccoon Mascot inside a garbage can"]
  };

  const pool = isKawaii ? kawaiiMascots[mood] : genericMascots[mood];
  const mascot = pool[seedIndex % pool.length];

  switch (styleId) {
    case 1: // Kawaii
      return {
        styleName: "Kawaii",
        adj: "adorably sweet",
        styleDetails: "designed in standard ultra-cute Japanese kawaii style, with huge glittering shiny eyes, soft pastel shades of pink and mint, sweet blushing cheeks, bubbly lines, minimal clean pastel details",
        action: mood === "confused" ? "staring blankly with colossal dilated eyes and a tiny pink question mark hovering above"
              : mood === "hyperactive" ? "happily clutching a glittering yellow star with custom facial sparkles"
              : mood === "overwhelmed" ? "snuggling deeply under a mountain of tiny pastel pillows, look of sweet fatigue"
              : mood === "calm" ? "smiling peacefully with closed curved eyes, drinking sweet boba tea from a small cup"
              : "gently playing with a tiny glowing star coin, ignoring a small pile of miniature folders",
        situation: "enjoying sweet comforting kawaii moments"
      };
    case 2: // Chibi/Anime
      return {
        styleName: "Chibi/Anime",
        adj: "dramatic chibi-anime",
        styleDetails: "designed in classic 90s/Y2K anime chibi style with a huge oversized head, tiny expressive body, exaggerated funny anime line detailing, expressive manga speed-lines",
        action: mood === "confused" ? "sweating with a giant white anime sweatdrop on its temple and spinning circle eyes"
              : mood === "hyperactive" ? "leaping high into the air with giant glittering anime determination starry eyes and dynamic motion strokes"
              : mood === "overwhelmed" ? "hilariously crying rivers of glowing blue chibi tears falling in comical fountain patterns"
              : mood === "calm" ? "resting with a classic anime snoozing bubble inflating and deflating slowly from its nose"
              : "looking cheeky with a big mischievous anime grin, hiding a homework sheet behind its back",
        situation: "over-dramatically reacting to everyday tasks"
      };
    case 3: // Cottagecore
      return {
        styleName: "Cottagecore",
        adj: "cozy forest cottagecore",
        styleDetails: "crafted in an organic forest-inspired cottagecore style, with whimsical nature details, earthy woodsy colors, tiny wildflowers, mushrooms, soft hand-drawn textures",
        action: mood === "confused" ? "sitting completely dissociated on a giant red spotted amanita mushroom, staring blankly at a ladybug"
              : mood === "hyperactive" ? "joyfully juggling three tiny glowing acorns under a canopy of oak leaves and yellow sparkles"
              : mood === "overwhelmed" ? "curled up tightly inside an oversized hollow walnut shell covered with dry maple leaves, feeling sleepy"
              : mood === "calm" ? "sitting in deep tranquil peace under a soft green clover sprout leaf, enjoying quiet nature vibes"
              : "slowly riding on the shell of a giant friendly garden snail, moving at a remarkably low speed",
        situation: "moving at their own natural wild pace"
      };
    case 4: // Pastel Goth
      return {
        styleName: "Pastel Goth",
        adj: "whimsically spooky pastel-goth",
        styleDetails: "designed in sweet pastel goth style, marrying creepy and cute elements with a soft palette of lavender, black, baby-pink, tiny cute spiderwebs, bat ears, and magical star outlines",
        action: mood === "confused" ? "staring blankly at a glowing crystal ball that displays a funny error symbol"
              : mood === "hyperactive" ? "joyfully riding a tiny flying pastel witch broom releasing cute starry pink sparkles"
              : mood === "overwhelmed" ? "melting hilariously into a pool of pastel lavender slime next to a friendly sleepy skull"
              : mood === "calm" ? "peacefully sleeping inside a cute baby-pink coffin box lined with soft cloud pillows"
              : "stirring a bubbling pink cauldron labeled 'Dopamine potion' while ignoring a recipe agenda book",
        situation: "blending sweet pastel vibes with cute spooky feelings"
      };
    case 5: // Retro 90s/Y2K
      return {
        styleName: "Retro 90s/Y2K",
        adj: "nostalgic 90s retro Y2K",
        styleDetails: "styled in pixelated retro Y2K aesthetic with vivid neon blues, hot pink highlights, bright yellow stars, CD holograph glows, classic computer popups, screen glitch strokes",
        action: mood === "confused" ? "peeking out from a pixelated vintage flat-gray operating system error window featuring a red 'X' warning icon"
              : mood === "hyperactive" ? "bouncing on a shiny holographic CD-ROM disc surrounded by glittering neon sparkles and cyber stars"
              : mood === "overwhelmed" ? "comically frozen inside a blue screen of death dialog frame with pixelated code snippets around its head"
              : mood === "calm" ? "reclining comfortably inside a bright yellow retro floppydisk cartridge decorated with a sweet smiley face sticker"
              : "cheekily surfing a classic 90s pixelated web browser sidebar, looking highly caffeinated",
        situation: "clashing beautiful Y2K computer systems with mental shutdowns"
      };
    case 6: // Vaporwave
      return {
        styleName: "Vaporwave",
        adj: "glitchy dream vaporwave",
        styleDetails: "styled in aesthetic 1980s vaporwave, with vibrant magenta and cyan gradients, classical Roman columns, palm tree silhouettes under a giant wireframe grid sun, fuzzy CRT lines",
        action: mood === "confused" ? "staring blankly behind a cracked classical marble bust statue wearing shutter shades, brain completely paused"
              : mood === "hyperactive" ? "surfing on a glowing wireframe internet grid wave under bright neon pink grids and palm trees"
              : mood === "overwhelmed" ? "partially dissolved into a digital error grid in front of a giant purple neon retro sunset disk"
              : mood === "calm" ? "floating peacefully in a warm turquoise pool of soft reflections with classical ambient grids"
              : "relaxing on a vintage pastel dolphin inflatable, totally spaced out during work hours",
        situation: "permanently pausing in a surreal pink grid sunset"
      };
    case 7: // Trash Panda/Raccoon
      return {
        styleName: "Trash Panda/Raccoon",
        adj: "mischievous trash-panda",
        styleDetails: "designed in funny raccoon style with elements of scrap-art, recycled stickers, messy details, trash can objects, cute banana peels, soda can drawings",
        action: mood === "confused" ? "sitting cluelessly inside a silver aluminum garbage can labeled 'Empty', claw on chin trying to remember why we are here"
              : mood === "hyperactive" ? "proudly holding a glowing, shiny soda can pop-tab as if it was a priceless giant gold diamond"
              : mood === "overwhelmed" ? "buried underneath an avalanche of cardboard boxes, old cables, and half-colored sketches, looking totally spent"
              : mood === "calm" ? "sleeping happily inside a cardboard box bed with a warm fuzzy blanket made of a clean napkin"
              : "proudly digging through a pile of colorful scrap gears, searching for the perfect shiny hyperfixation object",
        situation: "operating with full hyperfocus powered by scraps and trash"
      };
    case 8: // Gremlin/Goblincore
      return {
        styleName: "Gremlin/Goblincore",
        adj: "messy goblincore gremlin",
        styleDetails: "styled in organic messy hand-scribbled goblincore doodle, with tiny moss-clad pebbles, shiny copper buttons, pieces of yarn and thread, messy forest floor hues",
        action: mood === "confused" ? "staring cluelessly at an open journal with scribbles, completely lost in thoughts"
              : mood === "hyperactive" ? "running around wild hoarding three shiny glass beads, a copper key, and a green leaf as priceless treasure"
              : mood === "overwhelmed" ? "curled up into a tiny mossy ball underneath a tree root, completely overwhelmed by forest tasks"
              : mood === "calm" ? "happily nestled in a soft bed of green velvet moss, clutching a shiny brass button with a sweet smile"
              : "meticulously sorting a collection of 50 different colorful half-finished hobbies",
        situation: "hoarding and sorting miscellaneous side hobbies"
      };
    case 9: // Cyberpunk/Glitch Art
      return {
        styleName: "Cyberpunk/Glitch Art",
        adj: "high-tech cyberpunk glitch",
        styleDetails: "engineered in edgy futuristic cyberpunk style, rich with neon green terminal code overlays, high-voltage purple wires, glowing holographic glitches, neon flickering signs",
        action: mood === "confused" ? "staring with static terminal glitch lines over its eyes with a glowing pink 'SIGNAL LOST' indicator tag"
              : mood === "hyperactive" ? "connected to high-voltage neon cables while releasing bright electric sparks of pure creativity"
              : mood === "overwhelmed" ? "slumped with a glowing red flashing status screen showing 'CRITICAL ERROR: SYSTEM DEPLETED'"
              : mood === "calm" ? "floating in a quiet green holographic matrix field with cozy soft neon ambient light"
              : "hacking a cartoon computer console while surrounded by floating digital code lines, enjoying custom side-quests",
        situation: "handling losing their direct train of thought in high tech"
      };
    case 10: // Doodle/Line Art
      return {
        styleName: "Doodle/Line Art",
        adj: "minimalist notebook hand-drawn doodle",
        styleDetails: "crafted in a high-contrast minimalist black and white ink line art style, looking exactly like a charming hand-drawn sketch in the margin of a workbook, clean scribbled lines, white accents",
        action: mood === "confused" ? "scratching its head with a giant cartoon pencil scribbled around a big messy cloud of tangled string lines"
              : mood === "hyperactive" ? "drawn with active sketchy energy lines and exploding star doodles floating in high-contrast ink patterns"
              : mood === "overwhelmed" ? "rendered as a comically squashed scribbled blob at the bottom of the sticker canvas with funny dark sketch lines"
              : mood === "calm" ? "peacefully resting on a simple warm line-drawn crescent moon, looking relaxed and content"
              : "cheekily drawing a tiny funny stick figure instead of writing down spreadsheet records",
        situation: "drawing on notebook margins during boring study classes"
      };
    case 11: // Side Quest
      return {
        styleName: "Side Quest",
        adj: "RPG video-game adventurer",
        styleDetails: "styled in vintage roleplaying game UI design with 8-bit health bars, gold quest active checkmarks, retro inventory bags, glowing gold chests, pixel banners",
        action: mood === "confused" ? "holding a giant game map upside down with tiny pixelated question marks over its head, completely lost in the game world"
              : mood === "hyperactive" ? "proudly holding a glowing gold sword high under a pixelated quest banner reading 'NEW OPTIONAL MISSION DISCOVERED!'"
              : mood === "overwhelmed" ? "lying flat under a giant wooden sign reading 'QUEST FAILED: CHORE PARALYSIS', health bar completely red"
              : mood === "calm" ? "sitting cozy by a campfire resting its tiny adventurer backpack, eating a roasted pixel marshmallow"
              : "happily exploring a secret forest side door labeled 'FRIDGE CLEANING' instead of walking the main path",
        situation: "opening side quests to escape major real life duties"
      };
    case 12: // Loading Bar
      return {
        styleName: "Loading Bar",
        adj: "progressing load-stage",
        styleDetails: "designed in flat vector graphic style centering a funny progress load-bar schema with detailed status indicators (99% or 1%), soft color-block details",
        action: mood === "confused" ? "staring frozen behind a system loading progress bar stuck at '99% ... Processing Motivation ...'"
              : mood === "hyperactive" ? "running on top of a loading bar displaying '1000% speed overload' with fast spinning green action stars"
              : mood === "overwhelmed" ? "squashed underneath a giant gray progress bar stuck forever at '1% loading' with cute loading error tags"
              : mood === "calm" ? "lying back happily using a soft progress bar showing 'Recharging: 2%' as a cozy long pillow hammock"
              : "manually coloring in the loading bar slots with a yellow crayon to fake progress",
        situation: "waiting for their internal browser motivation processor to fully buffer"
      };
    case 13: // Caution Sign
      return {
        styleName: "Caution Sign",
        adj: "industrial warning caution",
        styleDetails: "designed in bright high-contrast emergency warning style, using hazard yellow and pitch black industrial warning diagonal stripes, caution sign triangle frame, bold letters",
        action: mood === "confused" ? "peeking over a bright yellow caution triangle saying 'WARNING: TOTAL SPACE OUT AREA'"
              : mood === "hyperactive" ? "boldly standing inside a yellow warning circle saying 'DANGER: EXTREME HYPERFIXATION ACTIVE'"
              : mood === "overwhelmed" ? "exhausted next to a warning construction cone displaying 'SYSTEM TEMPORARILY OUT OF ORDER'"
              : mood === "calm" ? "taking a cozy afternoon nap flat on top of a hazard stripe panel marked 'DO NOT DISTURB FOR SECURE CALM'"
              : "happily painting green stars over a warning sign card labeled 'PROCEED TO SIDE-QUEST'",
        situation: "warning others ahead of enter in a volatile focus zone"
      };
    case 14: // Vintage Postal Stamps
      return {
        styleName: "Vintage Postal Stamps",
        adj: "vintage postage-stamp",
        styleDetails: "styled as a beautiful vintage postage stamp with delicate serrated cut edges, aged warm-parchment cream background, retro ink stamps, traditional postmarks, faded classic colors",
        action: mood === "confused" ? "depicted as a print on a postage label looking around in confusion, titled 'MISSING KEYS DEPT. return to sender'"
              : mood === "hyperactive" ? "illustrated jumping for joy with a golden envelope, postmarked with stars, labeled 'FIRST CLASS DOPAMINE'"
              : mood === "overwhelmed" ? "represented slouched over an old typewriter looking spent, titled 'DUE YESTERDAY'"
              : mood === "calm" ? "shown snoozing beautifully on a branch under a postmark reading 'OFFLINE RECHARGING'"
              : "pictured cheekily sliding down a giant key shape labeled 'WHERE ARE WE SHIPPING MY MOTIVATION'",
        situation: "shipping lost thoughts back to sender"
      };
    case 15: // Checklist Failure
      return {
        styleName: "Checklist Failure",
        adj: "disorganized checklist notebook",
        styleDetails: "designed on a realistic miniature yellow line-pad notebook page, featuring checkboxes with colorful checkmarks, messy handwriting doodles, pencil scribbles",
        action: mood === "confused" ? "looking puzzled while pointing at a paper checklist where the only item checked is 'Forgetting Checklist'"
              : mood === "hyperactive" ? "leaping for pure joy after successfully checking off a single, minor task with a giant pink marker and stars"
              : mood === "overwhelmed" ? "lying collapsed across a huge list where every single line is violently scribbled over in giant black ink layers"
              : mood === "calm" ? "happily sleeping on a notebook page with checkboxes reading 'Task 1: Nap (Complete), Task 2: Nap (Pending)'"
              : "sitting cheekily crossing out the main task 'DO TAXES' and writing 'BUILD LEGO SET' with a happy face",
        situation: "violently scribbling over important lists to escape chores"
      };
    case 16: // Dopamine Chase
      return {
        styleName: "Dopamine Chase",
        adj: "dynamic cartoon dopamine-chaser",
        styleDetails: "styled in fast dynamic comic book action, with vibrant colorful speed strokes, cartoon action bubble outlines, racing clouds, glowing golden particles",
        action: mood === "confused" ? "sprinting fast in the complete wrong direction while clutching a retro compass with a silly puzzled face"
              : mood === "hyperactive" ? "running at top cartoon speed with arms outstretched, chasing a bouncing golden shiny ball labeled 'DOPAMINE'"
              : mood === "overwhelmed" ? "stumbled on the ground with funny swirls over its eyes as the glowing dopamine coin flies out of reach"
              : mood === "calm" ? "happily hugging the giant golden dopamine ball like a big comfortable bean bag with a blissful face"
              : "distracted by a tiny shiny ladybug while the giant dopamine ball bounces quietly behind them",
        situation: "frantically hunting the elusive dopamine coin to stimulate action"
      };
    case 17: // Golden Retriever Energy
      return {
        styleName: "Golden Retriever Energy",
        adj: "high-energy golden retriever",
        styleDetails: "rendered in warm friendly sun-yellow tones, with happy bouncing speed lines, cute dog paw prints, playful hearts, high energy dog accents",
        action: mood === "confused" ? "tilted head sideways with floppy ears looking incredibly confused at a giant clock hands"
              : mood === "hyperactive" ? "happily bouncing with huge smile, tongue out, surrounded by yellow sparkles of infinite raw excitement"
              : mood === "overwhelmed" ? "lying flat on the rug, panting exhaustion after 4 hours of pure chaotic play, big puppy-dog eyes"
              : mood === "calm" ? "smiling happily resting on its paws while a small glowing star settles on its wet warm nose"
              : "running down a slide to chase a flying butterfly instead of sitting on command",
        situation: "expressing raw hyperactive dog energy on high dopamine days"
      };
    case 18: // Sloth Mode
      return {
        styleName: "Sloth Mode",
        adj: "comfy sleepy sloth-mode",
        styleDetails: "crafted in soft cozy textures of knits, pillows, dreamy warm-brown and cream colors, soft floating Zzz letters, cozy clouds",
        action: mood === "confused" ? "clinging upside down to a branch, looking at his claws trying to count to three with a blank face"
              : mood === "hyperactive" ? "clinging to a retro coffee rocket, moving at a surprisingly comical fast speed with starry eyes"
              : mood === "overwhelmed" ? "completely wrapped in an oversized heavy knit weighted blanket burrito, looking cute and cocooned"
              : mood === "calm" ? "sleeping blissfully on a soft crescent cloud cradling an empty lavender coffee mug, looking totally at peace"
              : "staring at a big clock ticking, taking a five-hour break to admire a leaf",
        situation: "surrendering to ultra quiet slow cozy naps"
      };
    case 19: // Capybara Zen
      return {
        styleName: "Capybara Zen",
        adj: "perfectly calm capybara-zen",
        styleDetails: "styled in soft Japanese hot spring aesthetic, wooden tub panels, tiny steam curls, cherry blossom petals, calm river-stone shades",
        action: mood === "confused" ? "sitting clueless in a steaming tub of warm water with a green tea leaf floating right on its sleepy forehead"
              : mood === "hyperactive" ? "wearing a tiny hot-spring headband, balancing three spinning gold coins on its nose with high alignment"
              : mood === "overwhelmed" ? "resting with a small stack of unread emails cartoon letters on its flat head, ignoring them beautifully"
              : mood === "calm" ? "perfectly relaxed inside a wooden hot spring tub, small yuzu orange on its head, eyes closed in complete quiet"
              : "floating on its back with green bubbles, peacefully ignoring of all chore guidelines",
        situation: "enjoying rare moments of beautiful silent brain peace"
      };
    case 20: // Magpie/Crow
      return {
        styleName: "Magpie/Crow",
        adj: "shiny-obsessed crow-magpie",
        styleDetails: "designed in dark-charcoal grey and shiny metallic accents, with glittering gold star outlines, cute shiny keychains, tiny coins",
        action: mood === "confused" ? "staring blankly with colossal round eyes trying to grasp a mechanical shiny key, looking lost"
              : mood === "hyperactive" ? "clutching a glittering key, shiny coin, and yellow paperclip in its beak, shouting 'OOH SHINY!'"
              : mood === "overwhelmed" ? "exhausted inside a nest overflowing with 50 unorganized shiny things, looking cute and tired"
              : mood === "calm" ? "nestled cozy in its nest under a starry sky, resting head on a shiny silver button, look of pure comfort"
              : "hyperfixating intently on a pocketwatch, ignoring a list of academic goals nearby",
        situation: "hunting shiny things and unique objects to spark dopamine"
      };
    case 21: // Vintage Motel Keytags
      return {
        styleName: "Vintage Motel Keytags",
        adj: "retro motel keytag keychain",
        styleDetails: "styled as a retro 1970s diamond plastic motel keychain tag, earthy tones of manual and teal, gold lettering outline, metal keyring hook",
        action: mood === "confused" ? "depicted as a keychain tag with text 'ROOM 404: FOCUS NOT FOUND' with a funny confused eye cartoon doodle"
              : mood === "hyperactive" ? "keytag labeled 'DOPAMINE SUITE: MOTIVATED ONLY' releasing bright stars and retro key vectors"
              : mood === "overwhelmed" ? "keytag tag reading 'PROCRASTINATION CLUB MEMBER' with an alarm clock melting over the edges"
              : mood === "calm" ? "keytag styled with soft clouds saying 'SERENE CABIN: DOING ZERO CHORES' in complete peaceful letters"
              : "keychain fanning other keychains labeled 'SIDE-QUEST REGISTRATION OFFICE'",
        situation: "representing membership in the exclusive procrastination suite"
      };
    case 22: // Mid-Century Modern
      return {
        styleName: "Mid-Century Modern",
        adj: "retro mid-century modern",
        styleDetails: "designed in classic 1950s atomic geometric shapes, muted avocado-green and mustard tones, boomerang vectors, spinning orbital rings",
        action: mood === "confused" ? "an abstract brain with boomerang rings spinning around, cartoon eyes looking crossed in total overthink"
              : mood === "hyperactive" ? "character leaping between geometric atomic circles and retro starbursts of high mental activity"
              : mood === "overwhelmed" ? "slouching on a classic geometric lounge chair looking totally flat with starbursts fading"
              : mood === "calm" ? "sitting beautifully inside a retro organic egg chair, peaceful closed eyes, listening to retro speaker lines"
              : "arranging overlapping geometric triangles in a perfect neat grid instead of writing reports",
        situation: "living in structured atomic geometric abstractions"
      };
    case 23: // Psychedelic 70s
      return {
        styleName: "Psychedelic 70s",
        adj: "groovy psychedelic 70s",
        styleDetails: "crafted in melting groovy fonts, vivid rainbow colors, spinning sunbeams, retro daisies, flowy hand-lettering, liquid vibes",
        action: mood === "confused" ? "spinning around while its facial features and text 'WHERE AM I?' are literally melting in custom wavy lines"
              : mood === "hyperactive" ? "dancing on a retro flower starburst surrounded by happy floating daisies and rainbow waves"
              : mood === "overwhelmed" ? "lying flat under a melting quote banner 'EVERYTHING IS LOUD' with groovy liquid waves"
              : mood === "calm" ? "doing a peaceful happy dance inside a giant retro rainbow arch, surround by soft pastel hearts"
              : "happily staring at melting color bands, ignoring an official clock sticker nearby",
        situation: "melting away in groovy colors while tasks accumulate"
      };
    case 24: // Pop Art
      return {
        styleName: "Pop Art",
        adj: "bold pop-art comic-book",
        styleDetails: "styled in classic Roy Lichtenstein comic book panels, rich with retro Ben-day dot shader textures, thick ink brushlines, drama speech bubbles",
        action: mood === "confused" ? "looking in high-drama distress with a speech bubble reading 'I FORGOT WHAT I CAME DOWNSTAIRS FOR!'"
              : mood === "hyperactive" ? "gazing in wild comic excitement at a glowing lightbulb labeled 'BRILLIANT HYPERFIXATION INBOUND!'"
              : mood === "overwhelmed" ? "wiping tears in a classic dramatic comic panel with bubble reading 'TASK PARALYSIS WINS AGAIN!'"
              : mood === "calm" ? "smiling in calm bliss with a speech bubble saying 'A Cup of Tea and Complete Quiet... Ah!'"
              : "speaking with a bubble 'Supposed to be working, playing retro video games instead' with dot-shading details",
        situation: "acting out high-drama responses to tiny tasks"
      };
    case 25: // Tattoo Flash (Traditional)
      return {
        styleName: "Tattoo Flash (Traditional)",
        adj: "traditional tattoo-flash banner",
        styleDetails: "designed in bold vintage Sailor-Jerry tattoo flash style, rich navy-blue and red pigments, banner flags with beautiful cursive text, stars",
        action: mood === "confused" ? "a traditional cartoon brain with a scroll banner wrapping around reading 'SIGNAL SEARCHING'"
              : mood === "hyperactive" ? "a traditional dagger piercing a sparkling golden star, banner flag reading 'DOPAMINE RUSH'"
              : mood === "overwhelmed" ? "a traditional sword piercing a giant red heart, banner flag reading 'EXECUTIVE DYSFUNCTION'"
              : mood === "calm" ? "a beautiful traditional anchor resting on soft blue waves, banner scroll reading 'SECURED ZEN'"
              : "a vintage swallow bird carrying a banner reading 'TOMORROW IS FINE'",
        situation: "anchoring their identity in gorgeous tattoo scrolls"
      };
    case 26: // Low Battery
      return {
        styleName: "Low Battery",
        adj: "minimalist low-battery",
        styleDetails: "designed as a clean diagnostic phone battery cell, stark high-contrast warning outline, neon red bar indicator, lightning flash wire",
        action: mood === "confused" ? "staring out from behind a battery slot showing a flashing 1% warning red line with a big question mark"
              : mood === "hyperactive" ? "wearing a custom battery suit reading 'EXCESS OVERFLOW: 999%' releasing green spark particles"
              : mood === "overwhelmed" ? "clamped down under a massive red dead battery icon featuring a zero-charge warning banner"
              : mood === "calm" ? "peacefully resting resting on a plug adaptor with a low battery showing 'Cozy Re-charging' in cute letters"
              : "unplugging the charger to play with the wire knots, cartoon smile",
        situation: "running on final reserves of creative charge"
      };
    case 27: // Infinite Tabs
      return {
        styleName: "Infinite Tabs",
        adj: "overlapping internet browser-tabs",
        styleDetails: "designed as dozens of overlapping classic computer window tabs stack, mouse arrow pointers, scrollbars, file menu directories",
        action: mood === "confused" ? "looking wide-eyed and overwhelmed, surrounded by 40 tiny website tab boundaries labeled 'Untitled-99'"
              : mood === "hyperactive" ? "happily scrolling at lightning speeds through a giant browser folder menu, releasing yellow stars"
              : mood === "overwhelmed" ? "squished under a massive mountain of overlapping browser window frames showing loading status"
              : mood === "calm" ? "peacefully floating as a cute cloud in front of a completely clean single empty browser tab banner"
              : "using a virtual paintbrush to color various web tab tags with funny smiley faces",
        situation: "feeling their brain being permanently occupied by 40 open browser tabs"
      };
    case 28: // Vector Emoji Mashup
      return {
        styleName: "Vector Emoji Mashup",
        adj: "chaotic emoji mashup",
        styleDetails: "created in clean flat iconic emoji sticker vector art, combining distinct emoji expressions into a funny single emotional face, bright yellow skin details",
        action: mood === "confused" ? "combining a melting face emoji with giant spiral dazed overthink eyes, total confusion look"
              : mood === "hyperactive" ? "combining an exploding head emoji with happy stars, pink hearts, and retro sunglasses"
              : mood === "overwhelmed" ? "combining a sweating face, wide shocked eyes, and a streaming river-tear emoji, looking defeated"
              : mood === "calm" ? "combining a sweet sleeping face emoji with a tiny content halo of glittering stars, look of absolute quiet"
              : "combining a mischievous winking face emoji with a giant crossed-out notepad vector",
        situation: "expressing extreme visual emoji mashup chaos"
      };
    case 29: // Pixel Art
      return {
        styleName: "Pixel Art",
        adj: "8-bit retro pixel-art",
        styleDetails: "designed in classic retro 8-bit arcade game texture, block pixel lines, retro game grid coloring, cute pixelated game hearts, console aesthetics",
        action: mood === "confused" ? "an 8-bit blocky character standing in front of a giant question mark looking lost, pixelated sweat drops"
              : mood === "hyperactive" ? "an 8-bit character jumping high to grab a glowing floating pixel powerup coin with green sparkles"
              : mood === "overwhelmed" ? "an 8-bit character knocked flat on the retro tile screen with retro 'GAME OVER' letters floating above"
              : mood === "calm" ? "an 8-bit cute puppy curl-up asleep cozy on top of a warm pixel fireplace with tiny safe steam"
              : "an 8-bit player ignoring the glowing master door to collect random low-value shiny green grasses",
        situation: "navigating an 8-bit retro gaming universe with style"
      };
    case 30: // Synthwave
      return {
        styleName: "Synthwave",
        adj: "cyber synthwave grid sunset",
        styleDetails: "styled in premium retro 1980s synthwave style, neon purple landscape floors, giant electric orange sun wireframe disk, speed vectors",
        action: mood === "confused" ? "sitting at a retro futuristic dashboard looking cluelessly at speed dials marked 'Focus: 0'"
              : mood === "hyperactive" ? "cruising at the speed of anxiety down a neon violet road vector under glowing speed grids"
              : mood === "overwhelmed" ? "slumped with headlights fading down under a massive grid sun displaying a 'SYSTEM PAUSE' warning"
              : mood === "calm" ? "floating cozy in synth-sea watching grid vector sunset lines with look of total slow peace"
              : "running a digital detour path labeled 'SIDE-MISSION ZONE' on a neon digital GPS panel",
        situation: "cruising at the speed of anxiety along retro sunset lands"
      };
    case 31: // Hygge/Cozy
      return {
        styleName: "Hygge/Cozy",
        adj: "warm soft hygge-cozy",
        styleDetails: "crafted in soft Scandinavian comfort details, knitted fabric shaders, tiny fireplace smoke spirals, books with cute cats sleeping, warm-cream and coffee colors",
        action: mood === "confused" ? "nestled in wool socks looking cluelessly at a knitting book template with tangled yarn threads, cute face"
              : mood === "hyperactive" ? "wearing a knitted sweater happily juggling warm marshmallow cinnamon buns with tiny tea star drops"
              : mood === "overwhelmed" ? "buried cozily under three heavy warm patchwork quilts, letting their thoughts secure a tiny break"
              : mood === "calm" ? "clutching a steaming mug of cocoa closely, taking a warm deep breath surrounded by two sleeping kittens"
              : "sitting by a stack of books reading a comic page instead of studying the top exam paper",
        situation: "enjoying sweet comforting hygge warmth after sensory overload"
      };
    case 32: // Brutalist/Industrial
      return {
        styleName: "Brutalist/Industrial",
        adj: "stark high-contrast brutalist",
        styleDetails: "designed in heavy striking Swiss brutalist layout, concrete-textures patterns, absolute black and crisp white background, minimal harsh outlines, bold sans-serif lettering",
        action: mood === "confused" ? "staring blankly inside a heavy black border box with word 'ERROR_LOG' printed in high-contrast"
              : mood === "hyperactive" ? "surrounded by repeating bold words 'GO' and 'FOCUS' in bright custom neon pink and lime bars"
              : mood === "overwhelmed" ? "lying flat across heavy geometric lines under a solid bold label 'I AM TRYING SO HARD'"
              : mood === "calm" ? "sitting in precise quiet geometry next to a modern stark label 'COMPLETE INACTION' in perfect peace"
              : "crossing out a solid white checklist block and creating a custom abstract black circle doodle",
        situation: "making blunt industrial statements of raw effort"
      };
    case 33: // Tarot Cards
      return {
        styleName: "Tarot Cards",
        adj: "mystical ornate tarot-card",
        styleDetails: "designed as a beautiful ornate tarot card, gold stars border print, cosmic moon phases, detailed vintage frame lines",
        action: mood === "confused" ? "a tarot card titled 'THE CONFUSION' featuring the mascot staring blankly into empty star space"
              : mood === "hyperactive" ? "a tarot card titled 'THE DOPAMINE' featuring the mascot grabbing happy shooting stars with a giant laugh"
              : mood === "overwhelmed" ? "a tarot card titled 'THE TOWER' with the mascot buried under a towering laundry heap with stars"
              : mood === "calm" ? "a tarot card titled 'THE MAGICIAN' peacefully making their morning motivation disappear with a sleepy smile"
              : "a tarot card titled 'THE SIDE-QUESTER' cheekily walking through a flower meadow ignoring a golden key",
        situation: "unveiling mystical secrets of the daily calendar"
      };
    case 34: // Corporate Satire
      return {
        styleName: "Corporate Satire",
        adj: "official corporate HR satire",
        styleDetails: "styled as a realistic plastic clip-on corporate employee ID badge, clip hanger slots, funny barcode lines, security crest watermark",
        action: mood === "confused" ? "ID badge reading 'ROLE: HEAD OF SPACE-OUT DEPT' with a funny mugshot staring blankly, no idea"
              : mood === "hyperactive" ? "ID badge reading 'ROLE: CHIEF DOPAMINE SEEKER' with a profile photo surrounded by active star doodles"
              : mood === "overwhelmed" ? "ID badge listing 'CERTIFIED DOOM SCROLLER' with a cartoon watermark of an alarm clock on fire"
              : mood === "calm" ? "ID badge stating 'PERMANENTLY ON COFFEE BREAK' with a cute drawing of a mug sleeping peacefully"
              : "ID badge reading 'DIRECTOR OF PROCRASTINATION' with barcode numbers leading to funny game URLs",
        situation: "mocking official corporate structures with humorous roles"
      };
    case 35: // Grocery Label
      return {
        styleName: "Grocery Label",
        adj: "funny nutritional grocery-label",
        styleDetails: "designed as an official black-and-white supermarket nutritional facts label card, funny ingredient lists, daily value percentages, boxed frames",
        action: mood === "confused" ? "peeking through a nutritional label table showing 'Focus Value: 0% (Daily limit exceeded)' with a cute clueless look"
              : mood === "hyperactive" ? "leaping next to nutritional lines listing 'Hyperfixation Energy: 1500%, Coffee Intake: 400%' in active stars"
              : mood === "overwhelmed" ? "slumped below nutrition data highlighting 'Anxiety: 300% (Overloaded), Serotonin: 0.1%'"
              : mood === "calm" ? "resting on top of a label grid displaying 'Mental Quiet: 100% (Napping limit fully reached)' with Zzz indicators"
              : "drawing a small happy flower over ingredients labeled 'Responsibility' with a green pen",
        situation: "analyzing the scientific nutritional structure of stress and distractedness"
      };
    case 36: // Watercolor Splatter
      return {
        styleName: "Watercolor Splatter",
        adj: "artistic watercolor-splatter",
        styleDetails: "designed in gorgeous organic watercolor paint splatter details, colorful pigment gradients, splashing wet paper texture, artistic brush bleeding",
        action: mood === "confused" ? "formed by loose splashes of pastel cyan and purple forming a beautiful but highly unfocused brain with dazed eyes"
              : mood === "hyperactive" ? "splashed with deep magenta and golden paints, exploding in active starbursts and happy paint particles"
              : mood === "overwhelmed" ? "represented as a heavy blue and violet watercolor wash drooping down like funny heavy teardrops"
              : mood === "calm" ? "rendered as a single soft green and lavender paint bubble floating in perfect tranquil color space"
              : "splattering orange and pink ink spots onto a neat grey outline spreadsheet, smiling",
        situation: "dissolving thoughts into soft artistic water drops"
      };
    case 37: // Linocut/Block Print
      return {
        styleName: "Linocut/Block Print",
        adj: "rustic handmade linocut print",
        styleDetails: "designed in rustic handmade block-print style, warm texture ink layers, retro carved stamps, slightly uneven lines, organic hand-carved details",
        action: mood === "confused" ? "carved looking blankly at a book with loose flying letters flying everywhere, completely puzzled"
              : mood === "hyperactive" ? "carved as a jumping rocket surrounded by high-contrast ink stars and happy speed waves"
              : mood === "overwhelmed" ? "represented as a slumped block outline buried beneath heavy carved textbook textures"
              : mood === "calm" ? "shown in soft cozy stamp outline sleeping happily inside a giant mug of leaf tea in peaceful lines"
              : "carved chasing a small butterfly while walking away from an ink carved writing desk",
        situation: "carving cute handmade stamps of structured chaos"
      };
    case 38: // Maximalist Grid
      return {
        styleName: "Maximalist Grid",
        adj: "pattern-packed maximalist star-grid",
        styleDetails: "stuffed with intense patterns behind the character, checkerboards, floral dots, overlapping stars, colorful lines of pure sensory load",
        action: mood === "confused" ? "staring in total cartoon overthink against a dense backdrop of chaotic checkerboard lines and colorful spiral grids"
              : mood === "hyperactive" ? "bouncing amidst a high-voltage design of stars, orange dots, and lime green striping patches in pure joy"
              : mood === "overwhelmed" ? "melted flat against a colorful wall pattern, looking cute but comically overwhelmed by visual details"
              : mood === "calm" ? "sitting serene on a soft teal checkered pattern square, enjoying a moment of complete quiet comfort"
              : "manually pasting additional checkerboard flower stickers over a neat homework journal",
        situation: "living inside patterns representing absolute sensory overload"
      };
    case 39: // Celestial/Galaxy
      return {
        styleName: "Celestial/Galaxy",
        adj: "cosmic celestial galaxy",
        styleDetails: "designed in deep cosmic indigo and gold, showing beautiful nebulae, constellations lines, golden astronomical maps, glowing space dust",
        action: mood === "confused" ? "floating in deep dark space surrounded by galaxy dust and golden star maps, brain completely spaced out"
              : mood === "hyperactive" ? "riding a shooting star across purple cosmic clouds, releasing high-velocity golden dust trails"
              : mood === "overwhelmed" ? "lying tired on a small asteroid, cartoon Zzz letters forming a cute little constellation"
              : mood === "calm" ? "sitting cross-legged on a rings of a pastel planet, eyes closed in complete stargaze tranquility"
              : "using constellation lines to play a cosmic game of connect-the-dots instead of tracking orbit timetables",
        situation: "getting delightfully spaced out in the starry cosmos"
      };
    case 40: // Sticker-on-Sticker
      return {
        styleName: "Sticker-on-Sticker",
        adj: "layered sticker-on-sticker peel",
        styleDetails: "designed with a meta sticker-on-sticker peeling corner effect, realistic glossy white edge peeling back to reveal a hidden bright funny layer underneath",
        action: mood === "confused" ? "peeling back a boring blank sticker to reveal a colorful confused character face scratching its head underneath"
              : mood === "hyperactive" ? "peeling back a calendar sticker to reveal a high-energy star-bursting mascot jumping with sparks underneath"
              : mood === "overwhelmed" ? "peeling back a 'TO-DO' list sticker to find a lazy cartoon sloth sleeping happily underneath"
              : mood === "calm" ? "peeling back a noisy clock sticker to reveal a serene capybara soaking in a hot tub cozy and quiet"
              : "peeling back a work-badge sticker to reveal a secret gaming banner underneath",
        situation: "revealing a surprise layer of comedic behavior underneath the daily mask"
      };
  }

  return {
    styleName: "Kawaii Premium",
    adj: "kawaii cute",
    styleDetails: "premium cute kawaii style with thick outlines",
    action: "looking cute and engaging in a funny situation",
    situation: "simply trying their sweet little best"
  };
}

function getNewSandboxVibeForQuote(quote: string, index: number, category: string, seed: number = 0): { adj: string, mascot: string, action: string, situation: string } {
  const isKawaii = category === "Kawaii ADHD" || category.toLowerCase().includes("kawaii");
  
  // Detect mood based on quote text
  const mood = detectQuoteMood(quote);
  
  // Choose exact style ID cleanly without repeating:
  // There are exactly 40 specified premium styles. By using (index + seed) % 40, 
  // any batch of 25-30 generated items is guaranteed to have NO repeated styles!
  const styleId = ((index + seed) % 40) + 1;
  const design = getDetailedStyle(styleId, mood, isKawaii, index + seed);

  // Mapped mascots here in getNewSandboxVibeForQuote directly to keep it incredibly clean!
  const kawaiiMascots = {
    confused: ["Sleepy Sloth Mascot", "Puzzled Panda Mascot", "Clueless Axolotl Mascot", "Confused Koala Mascot", "Dazed Hamster Mascot"],
    hyperactive: ["Hyper Corgi Mascot", "Bouncing Bunny Mascot", "Joyful Kitten Mascot", "Active Squirrel Mascot", "Chubby Sparrow Mascot"],
    overwhelmed: ["Exhausted Sheep Mascot", "Melting Capybara Mascot", "Overwhelmed Otter Mascot", "Tired Bunny Mascot", "Dripping Lavender Cup"],
    calm: ["Zen Capybara Mascot", "Cozy Sloth Mascot", "Peaceful Kitten Mascot", "Warm Tea Mug Mascot", "Sleeping Cloud Mascot"],
    procrastinate: ["Silly Kitten Mascot", "Distracted Corgi Mascot", "Cheeky Fox Mascot", "Playful Hamster Mascot", "Sweet Cinnamon Bun Mascot"]
  };

  const genericMascots = {
    confused: ["Puzzled Brain Mascot", "Glitching Laptop Mascot", "Unfocused Lightbulb Mascot", "Clueless Alarm Clock"],
    hyperactive: ["Gamer Boy with massive RGB headphones", "Tech Developer Girl with a cute laptop", "Glow-spit Brain Mascot in sneakers", "Bouncing Dopamine Coin Mascot"],
    overwhelmed: ["Tired Student Boy face-down on a desk", "Weeping Artist Girl over unwashed brushes", "Overloaded CPU Server box Mascot", "Dead-tired Alarm Clock Mascot"],
    calm: ["Cozy Blanket Girl drinking tea", "Chill Programmer Boy listening to lo-fi", "Tranquil Cloud Mascot", "Meditating Brain Mascot on a lotus leaf"],
    procrastinate: ["Gaming Boy holding controller", "Procrastinating Designer Girl sipping mocktail", "Cute Gremlin Goblin Mascot", "Trash Panda Raccoon Mascot inside a garbage can"]
  };

  const pool = isKawaii ? kawaiiMascots[mood] : genericMascots[mood];
  const mascot = pool[(index + seed) % pool.length];

  // We craft the highly detailed action and situation fields to inject professional instructions
  const fullAction = `${design.action}, crafted in absolute '${design.styleName}' aesthetic (${design.styleDetails})`;
  const fullSituation = `the '${design.styleName}' theme, embodying ${design.situation}`;

  return {
    adj: design.adj,
    mascot,
    action: fullAction,
    situation: fullSituation
  };
}

// Helper to detect specific event, holiday or thematic requests from user inputs
function detectEventAndTheme(eventInput: string = "", customInput: string = "", categoryInput: string = ""): { event: string; isHoliday: boolean } {
  const text = `${eventInput} ${customInput} ${categoryInput}`.toLowerCase();
  
  if (text.includes("christma") || text.includes("xmas") || text.includes("santa") || text.includes("holiday") || text.includes("advent") || text.includes("gingerbread") || text.includes("reindeer") || text.includes("elf") || text.includes("winter")) {
    return { event: "Christmas", isHoliday: true };
  }
  if (text.includes("hallow") || text.includes("spook") || text.includes("ghost") || text.includes("witch") || text.includes("skeleton") || text.includes("pumpkin") || text.includes("vampire") || text.includes("zombie") || text.includes("cauldron") || text.includes("horror")) {
    return { event: "Halloween", isHoliday: true };
  }
  if (text.includes("dark humor") || text.includes("dark hummar") || text.includes("dark humour") || text.includes("dark") || text.includes("sarcas") || text.includes("cynic") || text.includes("existential") || text.includes("nihil") || text.includes("dumpster fire") || text.includes("spite") || text.includes("r.i.p") || text.includes("burnout")) {
    return { event: "Dark Humor & Sarcasm", isHoliday: false };
  }
  if (text.includes("new year") || text.includes("resolution") || text.includes("midnight countdown") || text.includes("jan 1")) {
    return { event: "New Year", isHoliday: true };
  }
  if (text.includes("valentin") || text.includes("romance") || text.includes("dating") || text.includes("cupid") || text.includes("crush")) {
    return { event: "Valentine's Day", isHoliday: true };
  }
  if (text.includes("back to school") || text.includes("school") || text.includes("study panic") || text.includes("semester") || text.includes("homework") || text.includes("syllabus") || text.includes("college")) {
    return { event: "Back to School", isHoliday: false };
  }
  if (text.includes("thanksgiving") || text.includes("turkey") || text.includes("autumn dinner") || text.includes("pumpkin pie")) {
    return { event: "Thanksgiving", isHoliday: true };
  }
  if (text.includes("summer") || text.includes("vacation") || text.includes("travel") || text.includes("airport") || text.includes("flight") || text.includes("beach")) {
    return { event: "Summer & Travel", isHoliday: false };
  }
  if (text.includes("office") || text.includes("corporate") || text.includes("meeting") || text.includes("slack") || text.includes("zoom") || text.includes("spreadsheet") || text.includes("work chaos")) {
    return { event: "Office & Work Chaos", isHoliday: false };
  }
  
  if (eventInput && eventInput !== "None" && eventInput !== "All") {
    return { event: eventInput, isHoliday: false };
  }
  
  return { event: "None", isHoliday: false };
}

// Dedicated Event & Holiday ADHD Quotes
const EVENT_QUOTES: Record<string, string[]> = {
  "Christmas": [
    "Panic wrapping at 2 AM Dec 24 🎁",
    "Tangled in Christmas lights for 3 hours 🎄",
    "Ate all 24 advent chocolates on Dec 1 🍫",
    "Forgot to buy Secret Santa gift!",
    "Hyperfixating on wrapping paper origami ✨",
    "Santa's sleigh has 40 browser tabs open",
    "Forgot where I hid the Christmas presents 🔍",
    "My Christmas list is 12 abandoned hobbies",
    "Decorated one branch, took a 4-hour break 🌟",
    "Holiday cheer? More like sensory overload!",
    "Elf on the shelf has executive dysfunction",
    "Gingerbread man running on pure caffeine ☕",
    "Burnt the holiday cookies while scrolling TikTok 🍪",
    "December 24: Time to start gift shopping 🏃",
    "Can't hear carols over my brain radio 🎶",
    "Christmas dinner: hiding with the dog 🐕",
    "Snowman with melting attention span ⛄",
    "Hyperfixated on untangling one ribbon 🎀",
    "Nutcracker stuck in mental freeze mode 🌰",
    "Holiday party social battery: 2% 🔋",
    "All I want for Christmas is dopamine 🎅",
    "Decorated the tree in mid-January 🌲",
    "Bought 5 planners as gifts, kept all 5 📓",
    "Re-gifting my own unfinished craft projects 🧶",
    "Listening to Jingle Bells on loop for 8 days 🔔",
    "Present still unwrapped in Amazon box 📦",
    "Holiday shopping cart abandoned at checkout 🛒",
    "Baking gingerbread while 3 alarms go off ⏰",
    "Santa forgot the North Pole GPS coordinates 🧭",
    "Festive burnout in full swing 🕯️",
    "Tangled ribbon champion 🎀",
    "Christmas Eve delivery prayer 🙏",
    "Forgot to write the gift tag names 🏷️",
    "Tree is crooked, focus is crooked 🌲",
    "Festive sugar rush into immediate nap 💤"
  ],
  "Halloween": [
    "Forgot what I floated in to haunt 👻",
    "Skeleton with 40 skull tabs open 💀",
    "Zombie craving iced coffee, not brains ☕",
    "Spooky, unmedicated & disoriented 🎃",
    "Witch brewing dopamine potion in cauldron 🧪",
    "Vampire lost count of bats at 3 🦇",
    "My costume is: Executive Dysfunction",
    "Sensory overload in the haunted house 🏚️",
    "Resting witch face with zero focus 🧙‍♀️",
    "Ghosting my to-do list like a pro 👻",
    "Black cat distracted by a dust particle 🐈‍⬛",
    "Jack-o'-lantern staring blankly into the void 🎃",
    "Mummy unwrapping itself out of boredom 🧻",
    "Forgot candy until trick-or-treaters knocked 🍬",
    "Haunted by yesterday's unfinished chores 🕸️",
    "Cauldron bubbling, mind buffering 🔮",
    "Spooky scary executive paralysis 🕷️",
    "Vampire with dopamine crash at dawn 🧛",
    "Bought 4 Halloween costumes, wore pajamas 🛌",
    "Witch flying broom into the wrong dimension 🧹",
    "Frankenstein wired on quadruple espresso ⚡",
    "Creepy doll staring at unread emails 👁️",
    "Grim Reaper procrastinating the reaping ⏳",
    "Candy corn hyperfixation activated 🍭",
    "Tombstone: R.I.P. My train of thought 🪦",
    "Boo! Did I startle your fragile focus? 🕯️",
    "Potion recipe: 90% caffeine, 10% panic 🧪",
    "Bat forgot which cave was home 🦇",
    "Werewolf howling at a shiny phone screen 🐺",
    "Gothic vibes, zero dopamine 🖤",
    "Ghoul wandering looking for misplaced keys 🗝️",
    "Spiders weaving unfinished webs 🕸️",
    "Haunted brain attic full of old hobbies 🏚️",
    "Vampire asleep during important meeting ⚰️",
    "Cauldron boiled over while I daydreamed 🍲"
  ],
  "Dark Humor & Sarcasm": [
    "My dopamine died in 2016 💀",
    "Running on pure panic, spite & caffeine ☕",
    "Here lies my motivation (R.I.P.) 🪦",
    "Existential dread, but make it aesthetic 🖤",
    "Error 500: Brain completely melted 🫠",
    "Mentally I am a dumpster fire 🔥",
    "Caffeine is my only personality trait ☕",
    "One minor inconvenience away from screaming 📉",
    "Paralyzed by the thought of sending an email ✉️",
    "My to-do list is a psychological horror novel 📖",
    "Executive dysfunction level: Catastrophic 💥",
    "Surviving purely to spite my alarm clock ⏰",
    "Overstimulated by the sound of my own thoughts 🧠",
    "I have 99 problems and all of them are today 🥀",
    "My therapist needs a vacation after my session 🛋️",
    "Brain: 0% serotonin, 100% intrusive hyperfixations",
    "Deadlines are just suggestions written in blood 🩸",
    "Not lazy, just spiritually exhausted ⚰️",
    "Burned out like a cheap candle in a hurricane 🕯️",
    "Smiling on the outside, 404 error inside 🙃",
    "Procrastinating until it becomes an emergency 🚨",
    "Medicated, caffeinated, and still devastated 💊",
    "My coping mechanism is dissociation & snacks 🍿",
    "I don't have a plan, I have adrenaline ⚡",
    "Pretending to understand adult life since 2010 🎭",
    "Everything is loud and I hate it here 🛑",
    "Tombstone: She meant to reply to your text 📱",
    "Memory wiped clean like a cheap burner phone 📵",
    "Brain factory recall: Defective focus chip ⚙️",
    "Functioning purely on last-minute doom energy 🌪️",
    "Living on borrowed dopamine and cold brew 🧋",
    "I came, I panicked, I went back to sleep 🛌",
    "Brain is buffering at 144p quality 📺",
    "Organized chaos? No, just chaos 🌪️",
    "Neurodivergent dumpster acrobat 🎪"
  ],
  "New Year": [
    "Jan 1: New Me! Jan 2: Exhausted 🎆",
    "Bought a 2026 planner (will use 1 day) 📓",
    "Midnight time-blindness hits different 🕛",
    "My resolution is to find where my keys are 🔑",
    "New Year, same 40 unfinished projects 🎊",
    "Gym membership activated... and never visited 🏋️",
    "Dropping resolutions faster than the ball 🎈",
    "Counting down from 10, lost count at 6 ⏰",
    "Resolution: Stop opening 50 tabs (Failed at 12:05) 💻",
    "Midnight party social battery: 0% 🪫",
    "New year, same unread inbox 📥",
    "Champagne with a side of overthinking 🥂",
    "Already hyperfixated on 2027 hobbies 🚀"
  ],
  "Valentine's Day": [
    "Hyperfixating on you 💘",
    "Forgot our anniversary (I still love you!) 💐",
    "My love language is sending 30 reels at 3 AM 📱",
    "Cupid missed because of time blindness 🏹",
    "I love you more than my current hyperfixation 💖",
    "ADHD romance: parallel play on our phones 🛋️",
    "Love letter lost in my messy room black hole 💌",
    "Heart full of love, head full of tabs 🧠",
    "Candy heart says: 'PLEASE FOCUS' 🍬",
    "Bought flowers, left them in the car trunk 🚗",
    "You are my favorite dopamine source 🌹"
  ],
  "Back to School": [
    "Cramming a 4-month syllabus in 2 hours 📚",
    "Lost in the backpack black hole 🎒",
    "Staring at textbook page 1 for 45 mins 📖",
    "Cleaned my whole dorm to avoid studying 🧹",
    "Bought 14 fancy highlighters, read zero pages 🖍️",
    "The assignment was due yesterday?! ⏰",
    "Hyperfocusing on font choices for 3 hours 🔤",
    "Doodling in margins during 9 AM lecture ✏️",
    "Syllabus week: false sense of security 🕶️",
    "Alarm set for 7:00, 7:05, 7:10, 7:15, 7:20 ⏰"
  ],
  "Thanksgiving": [
    "Hiding with the host's dog to avoid talking 🐕",
    "Burned the pie while researching a new hobby 🥧",
    "Overstimulated at the family dining table 🦃",
    "Escaped to the bathroom for 25 minutes of quiet 🚪",
    "Ate dinner, forgot what everyone said 🍽️",
    "Thanksgiving to-do list: Panic, Cook, Nap 🍗",
    "Family asking about my 15 unfinished goals 🙃",
    "Carbs and dissociation are a great side dish 🥔"
  ],
  "Summer & Travel": [
    "Packing 15 minutes before the airport flight ✈️",
    "Forgot passport in the kitchen freezer 🧊",
    "Packed 9 books I will definitely not open 📚",
    "Airport terminal sensory overload champion 🧳",
    "Vacation plan: Laying like a starfish on the beach 🏖️",
    "Lost sunglasses on my own head 🕶️",
    "Brought 4 outfits, wore the same hoodie twice 🧳",
    "Arrived at gate 3 minutes before closing 🏃"
  ],
  "Office & Work Chaos": [
    "This meeting could have been a daydream 💻",
    "Typing furiously so I look extremely busy ⌨️",
    "Unread inbox: 5,420 emails and counting 📥",
    "Per my last panic attack 📊",
    "Camera off during Zoom: Mental vacation 🏝️",
    "Doing 2 weeks of work in 12 minutes before 5 PM ⏱️",
    "Re-reading the same email 7 times 📧",
    "Drafted reply in my head, forgot to click send ✉️",
    "Spilled iced coffee on company spreadsheet ☕",
    "Muted microphone panic attack 🎙️"
  ]
};

// Helper to generate dynamic, event-aware, style-aware visual prompt specifications
function buildStickerPrompt(
  quote: string, 
  characterType: string, 
  action: string, 
  event: string, 
  artStyle: string, 
  customKeyword: string = ""
): { prompt: string; description: string } {
  let styleDescriptor = "vibrant vector illustration, clean bold outlines, rich colors, professional digital sticker art";
  let moodPrefix = "A premium die-cut sticker";

  if (artStyle === "Dark Gothic Grunge" || event === "Dark Humor & Sarcasm" || artStyle.toLowerCase().includes("goth")) {
    moodPrefix = "A dark humor sarcastic ADHD die-cut vinyl sticker";
    styleDescriptor = "striking gothic grunge aesthetic, high-contrast dark charcoal, obsidian black, muted crimson and neon acid-green accents, bold distressed ink outlines, deadpan dark comedy vibes";
  } else if (artStyle === "Retro 90s/Y2K" || artStyle.toLowerCase().includes("90s") || artStyle.toLowerCase().includes("y2k")) {
    moodPrefix = "A nostalgic 90s Y2K retro ADHD die-cut sticker";
    styleDescriptor = "pixelated retro OS window elements, electric neon magenta and cyan gradients, cyber stars, holographic foil reflections, bold clean outlines";
  } else if (artStyle === "Comic Pop Art" || artStyle.toLowerCase().includes("pop")) {
    moodPrefix = "A bold comic pop-art ADHD die-cut sticker";
    styleDescriptor = "Roy Lichtenstein style halftone Ben-Day dots, explosive comic action speech bubble, primary retro palette, bold graphic black ink brushlines";
  } else if (artStyle === "Minimalist Line Art" || artStyle.toLowerCase().includes("line") || artStyle.toLowerCase().includes("minimal")) {
    moodPrefix = "A minimalist modern line-art ADHD die-cut sticker";
    styleDescriptor = "clean high-contrast black ink doodle style, elegant monochrome lines with subtle accent highlights, notebook margin sketch aesthetic";
  } else if (artStyle === "8-Bit Pixel Art" || artStyle.toLowerCase().includes("pixel")) {
    moodPrefix = "A retro 8-bit arcade pixel-art ADHD die-cut sticker";
    styleDescriptor = "nostalgic 8-bit console game sprite styling, blocky pixel contour, retro game hearts and coin accessories, crisp pixel borders";
  } else if (artStyle === "Vintage Tattoo Flash" || artStyle.toLowerCase().includes("tattoo")) {
    moodPrefix = "A traditional vintage tattoo flash ADHD die-cut sticker";
    styleDescriptor = "bold Sailor Jerry tattoo styling, classic scroll banner, deep navy and ruby red inks, rich gold star accents, bold traditional linework";
  } else if (artStyle === "Cozy Hygge" || artStyle.toLowerCase().includes("hygge")) {
    moodPrefix = "A warm cozy hygge Scandinavian ADHD die-cut sticker";
    styleDescriptor = "textured soft knit patterns, gentle warm cream, terracotta, and sage green tones, cozy comforting hand-drawn vector details";
  } else if (artStyle === "Kawaii Pastel" || artStyle.toLowerCase().includes("kawaii")) {
    moodPrefix = "An ultra-cute kawaii ADHD die-cut sticker";
    styleDescriptor = "chibi Japanese kawaii aesthetic, soft blushing cheeks, oversized shimmering glass eyes, sweet pastel pink and mint color palette";
  }

  // Event specific props and staging
  let eventContext = "";
  if (event === "Christmas") {
    eventContext = "celebrating Christmas ADHD chaos with a red Santa hat, tangled in colorful glowing Christmas fairy lights, festive pine needles, holiday ornaments, and wrapped gift boxes with ribbons";
  } else if (event === "Halloween") {
    eventContext = "in a spooky Halloween ADHD scene featuring a glowing carved jack-o'-lantern pumpkin, tiny flying bats, spiderwebs, and a bubbling purple potion cauldron";
  } else if (event === "Dark Humor & Sarcasm") {
    eventContext = "displaying deadpan dark sarcastic ADHD exhaustion, next to a miniature sarcastic tombstone or a burning to-do list with smoke swirls";
  } else if (event === "New Year") {
    eventContext = "in a New Year celebration theme with a shiny gold party hat, clock ticking midnight, colorful confetti bursts, and an unopened 2026 planner";
  } else if (event === "Valentine's Day") {
    eventContext = "in a Valentine's Day ADHD theme surrounded by floating conversation candy hearts, tangled heart ribbons, and a pink cupid arrow";
  } else if (event === "Back to School") {
    eventContext = "in a chaotic back-to-school study panic with an overflowing messy backpack, unread textbook stacks, and loose highlighters";
  } else if (event === "Thanksgiving") {
    eventContext = "in a cozy Thanksgiving dinner theme with autumn maple leaves, pumpkin pie slice, hiding with a friendly dog under the table";
  } else if (event === "Summer & Travel") {
    eventContext = "in a stressful travel and vacation rush with an overpacked bursting suitcase, boarding pass, and airport terminal clock";
  } else if (event === "Office & Work Chaos") {
    eventContext = "in an office workday chaos scene with dozens of floating browser tabs, spreadsheet charts on fire, and three empty coffee mugs";
  } else if (customKeyword) {
    eventContext = `specifically customized around the '${customKeyword}' theme`;
  }

  const actionWithEvent = eventContext ? `${action}, ${eventContext}` : action;

  const prompt = `${moodPrefix} of an expressive ${characterType.toLowerCase()}, ${actionWithEvent}, designed in sticker format with a thick clean white die-cut contour border on a transparent background. ${styleDescriptor}, featured quote "${quote}".`;
  const description = `This ${characterType.toLowerCase()} perfectly depicts the ADHD experience of ${action} in ${event !== 'None' ? event : 'daily life'} with the quote '${quote}'!`;

  return { prompt, description };
}

// Helper to generate extremely high-quality creative ADHD stickers locally when the Gemini API is blocked, in sandbox, or offline
function generateSandboxStickers(
  category: string, 
  count: number, 
  customInstructions: string = "", 
  seed: number = Math.floor(Math.random() * 100000),
  eventInput: string = "None",
  artStyleInput: string = "Auto"
): Sticker[] {
  // Detect active event/holiday based on explicit parameter, custom prompt text, or category name
  const { event: detectedEvent } = detectEventAndTheme(eventInput, customInstructions, category);
  const activeEvent = detectedEvent !== "None" ? detectedEvent : (eventInput !== "None" ? eventInput : "None");

  const quotesByCategory: Record<string, string[]> = {
    "Funny ADHD": [
      "Oops, forgot!",
      "Let me overthink...",
      "SHINY! ✨",
      "SQUIRREL!",
      "Tomorrow, I swear!",
      "Wait, why was I here?",
      "3 speeds: Stop, Go, Panic",
      "Out of sight, out of mind 💨",
      "I came, I saw, I forgot",
      "Dopamine scavenger",
      "Error 451: Brain on fire",
      "Adulting hyperfixation",
      "Too many brain tabs open",
      "Side questing forever 🗺️",
      "Speeding in reverse",
      "Is procrastination a hobby?",
      "Open-world bedroom RPG",
      "Wait... did I lock it?",
      "Attention span refund?",
      "Wait, what day is today?",
      "Jumping to conclusions 🤸",
      "I had a masterplan...",
      "Procrastination peak",
      "Train of thought derailed 🚂",
      "New hyperfixation unlocked!",
      "Why am I holding this?",
      "I'm not lost, I'm side-questing",
      "Sit down? How?!",
      "Skimmed to the end 📖",
      "Memory leak warning",
      "I should be sleeping",
      "ADHD: Attention Deficit... Cake!",
      "Alarm? Ignored ⏰",
      "I'm in this and I hate it",
      "Expert at useless skills",
      "Hobbies of my hobbies",
      "Dopamine hunting 🏹",
      "Space turtles are cool",
      "Ignoring deadline vibes",
      "Wait, where are my keys?!"
    ],
    "Kawaii ADHD": [
      "Huh?",
      "Wait, what?",
      "Focusing... 1% 💤",
      "Wired & Tired",
      "Dopamine hunting 🌸",
      "Yay, stars!",
      "Brain goes beep boop 🤖",
      "Sweet dopamine 🍭",
      "Cloud watching ☁️",
      "Soft chaos inside",
      "Unfinished magic ✨",
      "Daydream bunny 🐰",
      "Cutie with zero focus",
      "Glitter brain mode",
      "Staring into space 🌠",
      "A pastel mess 🎨",
      "Doing my best-ish",
      "A little anxious but cute",
      "Sleepy little cloud",
      "Too much sparkle to focus",
      "Tiny step today is okay 🐾",
      "Oopsie daisy! 🌼",
      "Breathe in pink air",
      "Lost in daydream land",
      "Comfy in my nest",
      "Snack first, task later",
      "Blink blink... what?",
      "My cup is full of thoughts",
      "Floating in space 🪐",
      "Sweet distracted creature",
      "Is it cozy time yet?",
      "Happy star collector ⭐",
      "Chasing pastel ideas",
      "Nap enthusiast 🐑",
      "Brain on cute pause",
      "Fluffy but chaotic",
      "Panda-monium in head 🐼",
      "Glitter overflow",
      "Pills taken! Cute!",
      "Marshmallow brain 🍡"
    ],
    "ADHD Quotes": [
      "40 browser tabs open",
      "Brb, hyperfixating",
      "Chaos is my peace",
      "I survived today!",
      "Not lazy, understimulated",
      "My mind is space pinball 🚀",
      "Organized chaos is peace",
      "Object permanence is hard",
      "Time is a social construct",
      "Neurodivergent magic ✨",
      "I have a fast brain",
      "My favorite mode: Chaos",
      "Dopamine deficient diary",
      "Out of sight, out of reality",
      "Wait, let me start over",
      "Executive function sleeping",
      "Attention works differently",
      "I remember useless facts only",
      "Task paralysis champion 🏆",
      "Dopamine hunter-gatherer",
      "Thinking about 14 projects",
      "My thoughts have subtitles",
      "I am not slow, I'm detailed",
      "The task is small, the dread is big",
      "I process at 1000x speed",
      "Please write that down",
      "I heard you but I also didn't",
      "Multitasking? More like multi-wandering",
      "Understimulated & overwhelmed",
      "Memory cache duration: 2s",
      "Hyperfocus is my super power ⚡",
      "I need a blueprinted manual",
      "Executive dysfunctioning",
      "The quiet room is too noisy",
      "Wired uniquely 🧠",
      "I can feel the drafts",
      "Wait... what was the point?",
      "Doing 3-week tasks in 3 minutes",
      "My brain has an antenna",
      "Stuck in waiting mode ⏳"
    ],
    "Mental Health Humor": [
      "Dopamine collector",
      "Overwhelmed!",
      "Anxious but cute",
      "Be kind to your brain",
      "Medicated & dedicated",
      "Therapy approved ✅",
      "Anxiety level: Spilled coffee",
      "I'm fine, everything fine 🙃",
      "My thoughts are spicy 🌶️",
      "Slightly spicy neurotype",
      "Please handle with care",
      "Serotonin loading... 0%",
      "Brain cells left: 1.5",
      "Anxious overthink champion",
      "Social battery low 🪫",
      "My coping skills are cute",
      "Intrusive thoughts, shhh",
      "Just trying to exist today",
      "Crying but styling 💅",
      "I survived another overthink",
      "Self-care wizard 🧙‍♂️",
      "Medication vacation? No thanks",
      "My safety bubble 🫧",
      "Anxiety baking time 🧁",
      "Please do not perceive me",
      "I have feelings! Too many!",
      "Emotional roller coaster 🎢",
      "Fragile but functional",
      "Brain: let's worry. Me: sure!",
      "Everything is loud today",
      "Love my spicy brain 🌶️",
      "My therapist would love this",
      "Deep breathing or screaming?",
      "Mentally elsewhere",
      "Half a step at a time",
      "Anxiety in a cozy sweater",
      "Comfort food enthusiast",
      "Self-care means doing nothing",
      "My brain is a spicy meatball",
      "Cured anxiety! (Just kidding)"
    ],
    "Productivity Struggles": [
      "Unfinished pile",
      "Planner day 1",
      "To-do lists are hard",
      "Deadlines? Uh oh",
      "Later...",
      "Starting is the hardest part 🧩",
      "Cleaning instead of working",
      "Active procrastination expert",
      "I did 1 out of 19 tasks",
      "Staring at a blank document 📄",
      "Waiting for motivation... ⏳",
      "This could have been an email",
      "I'll do it in 5 mins (3h ago)",
      "Procrastinating procrastination",
      "The list of doom 📜",
      "Doing a side-quest first",
      "I plan, therefore I sit",
      "Tomorrow's problem",
      "My progress bar is frozen",
      "Wrote 'Wake up' just to cross it",
      "Lost in the planning stage",
      "Overplanning underperforming",
      "0 motivation, only snacks",
      "Stickers on empty planners",
      "Halfway done with 12 things",
      "This task has boss-level energy",
      "A quick 5-hour break 💤",
      "Clean desk, messy mind",
      "I'll do it tonight (I won't)",
      "Deadline is tomorrow, progress is 0",
      "Wrote 3 words, deserve movie 🎬",
      "Organizing is a real task",
      "Paralyzed by choices",
      "I lost the pencil",
      "I'll do it if there is tea 🍵",
      "Work hard, nap harder",
      "Planner shopper, not user",
      "Supposed to take 10 minutes",
      "To-Do: Think about tasks",
      "Distracted by the label maker"
    ],
    "Study & Work Chaos": [
      "Untitled-99.txt",
      "40 Open Tabs",
      "Focus is gone",
      "Busy doing nothing",
      "Coffee is my lifeline",
      "Did I send that email? 📧",
      "Drafts folder is my home",
      "Unread messages: 4578",
      "My stack is overflowing",
      "Compiler errors make me cozy",
      "I opened Chrome, forgot why",
      "Typing randomly to look busy",
      "Mute mic panic button 🎙️",
      "Camera off, pajamas on",
      "Code works, I don't know why",
      "Reviewing comments from 2024",
      "Cursor is blinking at me",
      "I have 14 untitled spreadsheets",
      "Will code for focus",
      "Drowning in post-it notes 📝",
      "Staring at wall during Zoom",
      "Inbox is an unslayable dragon",
      "3 notebooks for 1 project",
      "Deep coding or daydreaming?",
      "My desk is a cup museum",
      "Brain vacation mid-meeting 🏖️",
      "Wait, what is our sprint goal?",
      "Let's reschedule this thought",
      "Working from bed champion 🛏️",
      "Too many folders inside folders",
      "I lost the tab with the music",
      "Clicked 'remind me tomorrow' 12x",
      "Internet went down, thank god",
      "The spreadsheet has eyes",
      "Wrote script to avoid 2m work",
      "Doing the easy bug first",
      "Master of copy-paste",
      "Stack Overflow is my co-pilot",
      "Brain cell is on vacation",
      "Just typing spacebars..."
    ],
    "Self-Care & Wellness": [
      "Hydrate please",
      "Take your pills",
      "Just breathe",
      "Sleeping cloud",
      "Small wins count",
      "Gentle with myself 🕊️",
      "I rested today! Yay!",
      "Water first, coffee second 💧",
      "No is a full sentence",
      "Unplugged for a bit 🔌",
      "Sunlight collector ☀️",
      "Cozy blanket shield",
      "Warm bath for noisy brain",
      "I took my meds today!",
      "It is okay to do nothing",
      "Brain limits respected",
      "Rest is not earned, it's vital",
      "One breathe at a time",
      "Happy plants, happy head 🌿",
      "Tuned out the noise",
      "Wrapped in a cozy burrito 🌯",
      "Self-care is a real task",
      "Today, I choose peace",
      "My heart is full and tired",
      "Stretching my tiny legs",
      "Screen break coming... soon",
      "Nourish, don't punish",
      "Boundaries are pretty",
      "12h sleep is self-care",
      "Cleaned one cup, proud of me",
      "Walking in green grass 🌳",
      "A quiet mind is a luxury",
      "Be gentle with your gears ⚙️",
      "I survived the thoughts",
      "Soft vibes only",
      "Tea heals everything",
      "Said no to a meeting",
      "Cozy socks active",
      "Mental battery charging ⚡",
      "No rush, no stress 🐢"
    ],
    "Mixed Pack": [
      "Oops, forgot!", "SHINY! ✨", "Huh?", "Wait, what?", "Focusing... 1% 💤", 
      "Wired & Tired", "Let me overthink...", "New hyperfixation unlocked!", "40 browser tabs open",
      "Dopamine scavenger", "Take your pills", "Unfinished pile", "Deadlines? Uh oh", "Later...",
      "Just breathe", "Small wins count", "40 Open Tabs", "Untitled-99.txt", "Coffee is my lifeline"
    ]
  };

  // Select target quote pool: prioritizes explicit event or category
  let poolOfQuotes: string[] = [];
  if (activeEvent !== "None" && EVENT_QUOTES[activeEvent]) {
    poolOfQuotes = EVENT_QUOTES[activeEvent];
  } else if (category === "Mixed Pack") {
    const allCategories = Object.keys(quotesByCategory).filter(c => c !== "Mixed Pack");
    allCategories.forEach(cat => {
      poolOfQuotes.push(...quotesByCategory[cat]);
    });
  } else {
    poolOfQuotes = quotesByCategory[category] || quotesByCategory["Funny ADHD"] || quotesByCategory["Mixed Pack"];
  }

  // Load history to filter out quotes already generated in any pack in the current session
  const history = loadHistory();
  const existingQuotes = new Set<string>();
  if (history && history.packs) {
    history.packs.forEach(p => {
      if (p.stickers) {
        p.stickers.forEach(s => {
          if (s.stickerText) {
            existingQuotes.add(s.stickerText.toLowerCase().trim());
          }
        });
      }
    });
  }

  // Filter out any quotes that were already generated to avoid repeating the same quote
  const unusedQuotes = poolOfQuotes.filter(q => !existingQuotes.has(q.toLowerCase().trim()));
  
  let selectedQuotes: string[] = [];
  if (unusedQuotes.length >= count) {
    selectedQuotes = shuffleArray(unusedQuotes).slice(0, count);
  } else if (unusedQuotes.length > 0) {
    const needed = count - unusedQuotes.length;
    const usedQuotes = poolOfQuotes.filter(q => existingQuotes.has(q.toLowerCase().trim()));
    selectedQuotes = [
      ...shuffleArray(unusedQuotes),
      ...shuffleArray(usedQuotes).slice(0, needed)
    ];
  } else {
    selectedQuotes = shuffleArray(poolOfQuotes).slice(0, count);
  }

  const stickers: Sticker[] = [];

  // Dedicated Event Mascots & Actions
  const eventMascots: Record<string, string[]> = {
    "Christmas": [
      "Festive Sloth in Santa Hat", "Hyper Corgi in Fairy Lights", "Santa Claus with 40 Tabs", 
      "Gingerbread Brain Mascot", "Tired Elf with Unfinished Toys", "Sleepy Reindeer distracted by Snow", 
      "Overwhelmed Snowman with Planner", "Hot Cocoa Mug with Marshmallows", "Distracted Winter Kitten", 
      "Nutcracker in Mental Freeze Mode", "Candy Cane Squirrel", "Festive Axolotl in Earmuffs"
    ],
    "Halloween": [
      "Dazed Ghost Mascot", "Skeleton with 40 Skull Tabs", "Spooky Witch Cat with Cauldron", 
      "Vampire craving Iced Coffee", "Distracted Bat Mascot", "Jack-o'-Lantern Brain", 
      "Hyperactive Mummy Mascot", "Tired Grim Reaper Mascot", "Bewitched Coffee Cup", 
      "Overstimulated Black Kitten", "Zombie wandering for lost keys", "Gothic Owl with Pocketwatch"
    ],
    "Dark Humor & Sarcasm": [
      "Sarcastic Skull Mascot", "Exhausted Grim Reaper", "Glitching Brain in Crisis", 
      "Deadpan Coffee Mug", "Dumpster Fire Mascot", "Melting Battery Mascot", 
      "Cynical Developer with Eyebags", "Anxious Raccoon in Dark Hoodie", "Caffeine Gremlin Mascot", 
      "Ghost of Expired Motivation", "Existential Alarm Clock", "Tired Crow on a Broken Hourglass"
    ],
    "New Year": [
      "Party-hat Sloth Mascot", "Confetti Brain Mascot", "Overwhelmed Alarm Clock", 
      "Exhausted Kitten in Gold Glitter", "Empty Planner Book Mascot", "Countdown Turtle"
    ],
    "Valentine's Day": [
      "Blushing Axolotl Cupid", "Heart-shaped Brain Mascot", "Flustered Corgi with Rose", 
      "Sweet Boba Cup with Arrow", "Distracted Cupid with Lost Arrows", "Cuddly Sloth with Candy Heart"
    ],
    "Back to School": [
      "Overburdened Backpack Mascot", "Stressed Student Panda", "Highlighter Pen with Eyebags", 
      "Alarm Clock screaming at 7 AM", "Tangled Earphone Wire Mascot", "Coffee-fueled Owl Student"
    ],
    "Thanksgiving": [
      "Hiding Dog under Dining Table", "Overwhelmed Turkey Mascot", "Sleepy Pumpkin Pie Slice", 
      "Distracted Squirrel with Acorn Pie", "Exhausted Chef Kitten"
    ],
    "Summer & Travel": [
      "Bursting Suitcase Mascot", "Airport Gate Runner Corgi", "Sunburnt Starfish Mascot", 
      "Boarding Pass lost in Pocket", "Overheated Ice Cream Cone"
    ],
    "Office & Work Chaos": [
      "Spinning Desk Chair Mascot", "Flaming Spreadsheet Laptop", "Tower of 12 Coffee Mugs", 
      "Glitching Slack Notification Bell", "Zoom Call Loading Spinner Mascot", "Office Raccoon in Tie"
    ]
  };

  const eventActions: Record<string, string[]> = {
    "Christmas": [
      "frantically gift-wrapping a box at 2 AM with tape stuck to its forehead",
      "clumsily tangled in a giant knot of multicolored glowing Christmas tree lights",
      "eating the 24th advent calendar chocolate on December 1st with a sheepish grin",
      "staring in shock at a giant Christmas shopping list with zero items checked off",
      "hyperfixating on folding an intricate origami snowflake from wrapping paper",
      "peeking out from inside an oversized red Christmas stocking looking adorably confused",
      "hiding under the family dinner table petting a golden retriever to escape holiday noise",
      "running at high speed carrying a giant peppermint candy cane like a rocket booster",
      "sitting next to a decorated gingerbread house that collapsed from structural overthinking",
      "sipping hot cocoa by a glowing fireplace with marshmallows floating happily"
    ],
    "Halloween": [
      "staring blankly into empty air having completely forgotten what room it floated in to haunt",
      "clutching a glowing carved jack-o'-lantern pumpkin with eyes wide from dopamine overload",
      "stirring a bubbling purple potion cauldron with steam forming tiny floating stars",
      "unwrapping its mummy bandages because of sudden sensory fabric overload",
      "counting bats in the night sky and losing count repeatedly at three",
      "sitting in a pile of trick-or-treat candy wrappers in a cozy dopamine sugar rush",
      "holding a broomstick with a 'Check Engine' warning icon hovering above it",
      "wearing a name tag reading 'Hello My Costume Is Executive Dysfunction'",
      "peeking over a gravestone reading 'Here Lies My Train of Thought' with a bewildered look",
      "clutching a giant mug of iced black coffee under a full harvest moon"
    ],
    "Dark Humor & Sarcasm": [
      "sipping a giant iced black coffee with deadpan tired eyes while everything around it is cartoon fire",
      "leaning casually on a miniature tombstone engraved with 'Here Lies My Productivity'",
      "staring into the existential void as a digital progress bar displays 'Internal Crisis 100%'",
      "sitting inside a flaming cartoon dumpster giving a sarcastic thumbs up",
      "dramatically holding an unread email notice as if it were a radioactive weapon",
      "face-down on a pile of unopened self-help books with tiny sarcastic smoke puffs",
      "holding a battery cell that is violently flashing a dead skull symbol",
      "crossing out every item on a neat to-do list and writing 'Panic & Nap'",
      "glancing at an alarm clock ringing wildly while wearing noise-canceling headphones",
      "holding a receipt of 47 impulse purchases with zero regrets and zero money"
    ]
  };

  for (let i = 0; i < count; i++) {
    const quote = selectedQuotes[i % selectedQuotes.length] || "Focus is gone...";
    
    let characterType = "";
    let action = "";
    let conceptName = "";

    if (activeEvent !== "None" && eventMascots[activeEvent]) {
      const mascots = eventMascots[activeEvent];
      const actions = eventActions[activeEvent] || [
        `experiencing hilarious ADHD moments during ${activeEvent}`,
        `navigating executive dysfunction amidst festive ${activeEvent} preparations`
      ];
      characterType = mascots[(i + seed) % mascots.length];
      action = actions[(i + seed) % actions.length];
      conceptName = `${activeEvent}: ${characterType} - ${quote.replace(/[!✨\p{Emoji}]/gu, "").trim()}`.substring(0, 30);
    } else {
      // General categories use our 40-style non-repeating semantic system
      const vibe = getNewSandboxVibeForQuote(quote, i, category, seed);
      characterType = vibe.mascot;
      action = vibe.action;
      const titleCaseAdj = vibe.adj.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      conceptName = `${titleCaseAdj} ${vibe.mascot} ${quote.replace(/[!✨\p{Emoji}]/gu, "").trim()}`.substring(0, 30);
    }

    // Build the tailored prompt using event and art style
    const { prompt, description } = buildStickerPrompt(
      quote, 
      characterType, 
      action, 
      activeEvent, 
      artStyleInput, 
      customInstructions
    );

    stickers.push({
      prompt,
      concept: conceptName,
      stickerText: quote,
      description,
      characterType
    });
  }

  return stickers;
}

// 3. Generate stickers pack WITH automated fallback to Sandbox generator on key fail or permission denial
app.post("/api/generate", async (req, res) => {
  const { 
    category: rawCategory, 
    event = "None", 
    artStyle = "Auto", 
    count = 27, 
    customInstructions = "", 
    isSandbox = false 
  } = req.body;

  // Detect event and theme from all parameters
  const { event: resolvedEvent } = detectEventAndTheme(event, customInstructions, rawCategory || "");
  const targetEvent = resolvedEvent !== "None" ? resolvedEvent : (event !== "None" ? event : "None");
  const category = rawCategory || (targetEvent !== "None" ? `${targetEvent} ADHD` : "Funny ADHD");

  const stickCount = Math.min(Math.max(Number(count), 25), 30);
  const history = loadHistory();

  // If Sandbox Mode is explicitly requested, generate immediately without hitting the API
  if (isSandbox) {
    console.log(`Generating Sandbox Pack: Event=${targetEvent}, Style=${artStyle}, Category=${category}`);
    const sandboxStickers = generateSandboxStickers(category, stickCount, customInstructions, Math.floor(Math.random() * 100000), targetEvent, artStyle);
    
    // Save to history to allow full visual exploration, session saving, copy actions
    const newPack: Pack = {
      id: "sb_" + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      category: targetEvent !== "None" ? `${targetEvent} ADHD` : category,
      stickers: sandboxStickers
    };
    
    history.packs.unshift(newPack);
    const newConcepts = sandboxStickers.map(s => s.concept.trim()).filter(Boolean);
    const newPrompts = sandboxStickers.map(s => s.prompt.trim()).filter(Boolean);
    history.generated_concepts.push(...newConcepts);
    history.generated_prompts.push(...newPrompts);

    // Keep history trimmed
    if (history.generated_concepts.length > 800) history.generated_concepts = history.generated_concepts.slice(-800);
    if (history.generated_prompts.length > 800) history.generated_prompts = history.generated_prompts.slice(-800);
    if (history.packs.length > 20) history.packs = history.packs.slice(0, 20);

    saveHistory(history);

    return res.json({
      success: true,
      category: targetEvent !== "None" ? `${targetEvent} ADHD` : category,
      event: targetEvent,
      artStyle: artStyle,
      count: sandboxStickers.length,
      stickers: sandboxStickers,
      totalSavedConcepts: history.generated_concepts.length,
      wasSandbox: true,
      notice: "Event-tailored sticker pack generated successfully in sandbox mode."
    });
  }

  try {
    const ai = getAiClient();
    const previousBlacklist = history.generated_concepts || [];

    // Gather previously generated exact quotes/stickerText values to prevent repetition
    const previousQuotes = new Set<string>();
    if (history.packs) {
      history.packs.forEach(p => {
        if (p.stickers) {
          p.stickers.forEach(s => {
            if (s.stickerText) {
              previousQuotes.add(s.stickerText.trim());
            }
          });
        }
      });
    }

    const blacklistText = previousBlacklist.length > 0 
      ? `CRITICAL UNIQUE CONCEPT RULE: Do NOT generate anything similar to these previously created concepts:\n${previousBlacklist.map((c, i) => `${i + 1}. ${c}`).join("\n")}`
      : "No previously generated concepts in database. You can start fresh!";

    const blacklistQuotesText = previousQuotes.size > 0
      ? `CRITICAL NO-REPEAT QUOTE RULE: Do NOT reuse, repeat, or reference any of these exact text phrases/quotes under any circumstances:\n${Array.from(previousQuotes).map((q, i) => `${i + 1}. "${q}"`).join("\n")}`
      : "No previously generated quotes in database. You can invent any classic or creative quotes.";

    const keywordsList = ["whimsical", "bubbly", "nostalgic", "zesty", "chilled", "cosy", "fizzing", "electric", "dreamy", "sparkling", "mischievous", "silly", "glorious", "gilded", "rainbow", "pastel", "doodle", "comic", "quirky", "fidgety", "fluffy", "bouncy", "sleepy", "creative", "cheeky", "sarcastic", "gothic", "festive", "spooky", "ironic"];
    const shuffledKeywords = shuffleArray(keywordsList).slice(0, 5).join(", ");
    const uniqueSeed = Math.random().toString(36).substring(2, 10) + "_" + Date.now();

    // DYNAMIC SYSTEM INSTRUCTION THAT RESPECTS USER'S EVENT, TONE AND ART STYLE
    const isDarkHumor = targetEvent === "Dark Humor & Sarcasm" || category.toLowerCase().includes("dark") || customInstructions.toLowerCase().includes("dark");
    const isChristmas = targetEvent === "Christmas" || customInstructions.toLowerCase().includes("christma") || customInstructions.toLowerCase().includes("xmas");
    const isHalloween = targetEvent === "Halloween" || customInstructions.toLowerCase().includes("hallow") || customInstructions.toLowerCase().includes("spook");

    const systemInstruction = `You are an expert graphic designer and creator of Etsy-grade ADHD sticker packs.
Your assignment is to generate exactly ${stickCount} absolutely unique image-generation prompts for ADHD sticker packs.
Target Event / Occasion: "${targetEvent}"
Target Art Style: "${artStyle}"
Category Theme: "${category}"
${customInstructions ? `Special User Request: "${customInstructions}"` : ""}

### STRICT EVENT & THEME GROUNDING RULES (TOP PRIORITY):
${targetEvent !== "None" ? `
The user has specifically requested an ADHD sticker pack for the event/theme: "${targetEvent}".
EVERY SINGLE sticker quote ('stickerText') and character illustration prompt MUST directly unite ADHD traits (executive dysfunction, time blindness, hyperfixation, dopamine hunting, object permanence, sensory overload, paralysis) WITH "${targetEvent}"!
${isChristmas ? `
CHRISTMAS ADHD REQUIREMENTS:
- Quotes MUST be funny, relatable ADHD Christmas gags (e.g., 'Panic wrapping at 2 AM on Dec 24', 'Tangled in Christmas tree lights for 3 hours', 'Ate all 24 advent chocolates on Dec 1', 'Forgot to buy Secret Santa gift', 'Santa's sleigh has 40 browser tabs open', 'Hyperfixated on wrapping paper origami', 'My Christmas list is 12 abandoned hobbies', 'Gingerbread man running on pure caffeine', 'Holiday cheer? More like sensory overload!').
- Visual prompts MUST depict festive Christmas elements: Santa hats, red/green ribbons, tangled glowing fairy lights, pine needles, candy canes, gingerbread cookies, holiday gift boxes, hot cocoa mugs.
` : ""}${isHalloween ? `
HALLOWEEN ADHD REQUIREMENTS:
- Quotes MUST be funny, spooky ADHD Halloween gags (e.g., 'Forgot what room I floated in to haunt', 'Skeleton with 40 skull tabs open', 'Zombie craving iced coffee, not brains', 'Witch brewing dopamine potion in cauldron', 'Vampire lost count of bats at 3', 'My costume is Executive Dysfunction', 'Sensory overload in the haunted house', 'Ghosting my to-do list like a pro', 'Jack-o'-lantern staring blankly into space').
- Visual prompts MUST depict spooky Halloween elements: carved jack-o'-lantern pumpkins, ghost sheets, witch cauldrons, flying bats, spiderwebs, candy corn, gothic potion bottles, in purple, pumpkin orange, and midnight black.
` : ""}${isDarkHumor ? `
DARK HUMOR & SARCASTIC ADHD REQUIREMENTS:
- Quotes MUST be biting, cynical, dark humor about ADHD struggles and burnout (e.g., 'My dopamine died in 2016', 'Running on pure panic, spite & cold brew', 'Here lies my motivation (R.I.P.)', 'Mentally I am a dumpster fire', 'Error 500: Brain completely melted', 'Caffeine is my only personality trait', 'One minor inconvenience away from screaming', 'My to-do list is a horror novel', 'Executive dysfunction level: Catastrophic').
- Visual prompts MUST reflect dark sarcastic humor: exhausted characters, sarcastic tombstones, flaming dumpsters, melting batteries, deadpan tired coffee mugs, skull mascots, dark moody charcoal, crimson and obsidian colors with bold high-contrast graphic ink outlines. DO NOT MAKE THESE BUBBLEGUM OR CUTE PINK KAWAII!
` : ""}` : `
General ADHD theme: Create witty, relatable ADHD quotes and visual gags reflecting real neurodivergent experiences.
`}

### ART STYLE GUIDELINES:
- Thick White Die-Cut Border: EVERY prompt MUST specify a thick, clean white die-cut contour boundary around the illustration, isolated on a clean, solid transparent background.
- Art Style Adaptability:
  * If Art Style is 'Dark Gothic Grunge' or if Theme is Dark Humor: Specify dark, moody grunge aesthetic, charcoal/black/crimson palette, bold graphic distressed ink lines, deadpan expressions. (NO pastel pinks!).
  * If Art Style is 'Kawaii Pastel': Specify adorable chibi characters, large glass-reflective eyes, soft pastel blush colors, comforting rounded lines.
  * If Art Style is 'Retro 90s/Y2K': Specify pixelated vintage computer windows, neon magenta & cyan, CD holograph glows, cyber stars.
  * If Art Style is 'Comic Pop Art': Specify Roy Lichtenstein Ben-Day halftone dots, bold primary colors, action comic speech bubbles.
  * If Art Style is 'Minimalist Line Art': Specify clean high-contrast black ink doodle style, elegant notebook margin lines.
  * If Art Style is '8-Bit Pixel Art': Specify nostalgic 8-bit retro arcade game sprite styling, blocky pixel contour, retro game hearts.
  * If Art Style is 'Auto': Seamlessly select the visual style that matches the event (festive for Christmas, spooky for Halloween, dark grunge for Dark Humor).

### Semantic Matching & Direct Relevance:
The character, action, posture, and props MUST directly visualize the punchline of the 'stickerText'. Do not generate random characters doing disconnected things!

### Anti-Repetition Rule:
You must NEVER repeat, recycle, or formulate similar concepts or quotes that are already in the blacklist below or within this same batch of ${stickCount} stickers.

### Blacklist of previously generated concepts:
${blacklistText}

### Blacklist of exact previously generated quotes:
${blacklistQuotesText}`;

    const promptText = `Generate ${stickCount} non-repetitive ADHD sticker concepts specifically for Event: "${targetEvent}", Art Style: "${artStyle}", Category: "${category}".
${customInstructions ? `User Custom Focus: "${customInstructions}"` : ""}

[Randomizer Seed: ${uniqueSeed} | Creative Accents: ${shuffledKeywords}]
CRITICAL: If the user asked for Christmas, make Christmas ADHD stickers. If Halloween, make Halloween ADHD stickers. If Dark Humor, make sarcastic dark humor ADHD stickers. If another event, make that event.
Ensure every prompt explicitly includes: thick white die-cut border, transparent background, vector sticker art, and direct semantic illustration of the quote.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: promptText,
      config: {
        systemInstruction: systemInstruction,
        temperature: 1.0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            stickers: {
              type: Type.ARRAY,
              description: `A list of exactly ${stickCount} unique sticker objects`,
              items: {
                type: Type.OBJECT,
                properties: {
                  prompt: { 
                    type: Type.STRING, 
                    description: "DALL-E / Midjourney style image generation prompt with thick white die-cut border, transparent background, specified art style, character, action, props, and quote." 
                  },
                  concept: { 
                    type: Type.STRING, 
                    description: "A short 2-4 word concept summary for database avoidance blacklist (e.g. 'Tangled Christmas Lights', 'Halloween Skeleton Tabs', 'Sarcastic Tombstone Motivation')." 
                  },
                  stickerText: { 
                    type: Type.STRING, 
                    description: "Witty text quote featured on the sticker (e.g. 'Panic wrapping at 2 AM', 'Forgot what I came to haunt', 'My dopamine died in 2016')." 
                  },
                  description: { 
                    type: Type.STRING, 
                    description: "A 1-sentence funny explanation of how this captures the ADHD experience in this event/theme."
                  },
                  characterType: { 
                    type: Type.STRING, 
                    description: "Mascot or character (e.g. 'Santa with 40 tabs', 'Sarcastic Skull', 'Confused Ghost', 'Hyper Corgi')." 
                  }
                },
                required: ["prompt", "concept", "stickerText", "description", "characterType"]
              }
            }
          },
          required: ["stickers"]
        }
      }
    });

    const textOutput = response.text || "{}";
    const resultJson = JSON.parse(textOutput);

    if (!resultJson.stickers || !Array.isArray(resultJson.stickers)) {
      throw new Error("Invalid response format received from AI model.");
    }

    const newStickers: Sticker[] = resultJson.stickers;
    const newConcepts = newStickers.map(s => s.concept.trim()).filter(Boolean);
    const newPrompts = newStickers.map(s => s.prompt.trim()).filter(Boolean);

    history.generated_concepts.push(...newConcepts);
    history.generated_prompts.push(...newPrompts);

    const packCategoryName = targetEvent !== "None" ? `${targetEvent} ADHD` : category;
    const newPack: Pack = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      category: packCategoryName,
      stickers: newStickers
    };
    history.packs.unshift(newPack);

    if (history.generated_concepts.length > 800) history.generated_concepts = history.generated_concepts.slice(-800);
    if (history.generated_prompts.length > 800) history.generated_prompts = history.generated_prompts.slice(-800);
    if (history.packs.length > 20) history.packs = history.packs.slice(0, 20);

    saveHistory(history);

    res.json({
      success: true,
      category: packCategoryName,
      event: targetEvent,
      artStyle: artStyle,
      count: newStickers.length,
      stickers: newStickers,
      totalSavedConcepts: history.generated_concepts.length,
      wasSandbox: false
    });

  } catch (error: any) {
    console.log("Note: Activating high-fidelity offline sandbox generator matching requested event and style.");
    
    const errStr = (error.message || error.toString() || "").toLowerCase();
    const isPermissionDenied = errStr.includes("denied" ) || errStr.includes("403") || errStr.includes("permission_denied") || errStr.includes("not enabled");

    const sandboxStickers = generateSandboxStickers(
      category, 
      stickCount, 
      customInstructions, 
      Math.floor(Math.random() * 100000), 
      targetEvent, 
      artStyle
    );
    
    const fallbackPackCategory = targetEvent !== "None" ? `${targetEvent} ADHD` : category;
    const fallbackPack: Pack = {
      id: "fallback_" + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      category: fallbackPackCategory,
      stickers: sandboxStickers
    };
    history.packs.unshift(fallbackPack);
    const fallbackConcepts = sandboxStickers.map(s => s.concept.trim()).filter(Boolean);
    const fallbackPrompts = sandboxStickers.map(s => s.prompt.trim()).filter(Boolean);
    history.generated_concepts.push(...fallbackConcepts);
    history.generated_prompts.push(...fallbackPrompts);
    saveHistory(history);

    res.json({
      success: true,
      category: fallbackPackCategory,
      event: targetEvent,
      artStyle: artStyle,
      count: sandboxStickers.length,
      stickers: sandboxStickers,
      totalSavedConcepts: history.generated_concepts.length,
      wasSandbox: true,
      errorDetail: error.message || "An access restriction error occurred.",
      isPermissionDenied: isPermissionDenied
    });
  }
});

// 4. Generate Portable Agent Skill Package (for agents like Muse, Manus, Claude, OpenClaw, Custom GPTs)
function buildAgentSkillMarkdown(options?: {
  event?: string;
  artStyle?: string;
  category?: string;
  includeMemory?: boolean;
}): string {
  const targetEvent = options?.event && options.event !== "None" ? options.event : "Any Event / Dynamic User Request";
  const targetStyle = options?.artStyle && options.artStyle !== "Auto" ? options.artStyle : "Auto (Match Event & Mood)";
  const targetCategory = options?.category || "Funny ADHD";
  const history = loadHistory();
  const avoidedConcepts = options?.includeMemory ? (history.generated_concepts || []).slice(-60) : [];

  const memoryBlock = avoidedConcepts.length > 0
    ? `\n## Avoided Concepts Blacklist (Do NOT Repeat)\n${avoidedConcepts.map((c, i) => `${i + 1}. ${c}`).join("\n")}\n`
    : `\n## Anti-Repetition Memory Protocol\nMaintain a running list of previously generated \`concept\` summaries and \`stickerText\` quotes across turns. Never reuse the same mascot + prop + quote combination in the same pack or across consecutive packs.\n`;

  return `---
name: adhd-sticker-prompt-engine
description: >
  Generates Etsy-grade, zero-repetition die-cut ADHD sticker image prompts
  tailored to any user-specified event, holiday (Christmas, Halloween, New Year,
  Valentine's Day, Back to School, Thanksgiving, Summer/Travel, Office Chaos),
  or tone (Dark Humor & Sarcasm, Kawaii Pastel, Retro 90s/Y2K, Comic Pop Art,
  Minimalist Line Art, 8-Bit Pixel Art, Cozy Hygge, Vintage Tattoo Flash).
  Enforces literal semantic matching between every ADHD quote and its visual scene.
---

# ADHD Sticker Prompt Engine (Portable Agent Skill)

Use this skill whenever the user asks for ADHD sticker ideas, sticker pack prompts (Midjourney / DALL-E / Imagen / Ideogram), Etsy sticker packs, or event-specific neurodivergent humor stickers.

## Default / Active Configuration
- **Target Event / Holiday**: \`${targetEvent}\` (Override dynamically whenever the user names a specific day, holiday, or theme!)
- **Target Art Style**: \`${targetStyle}\`
- **Base Mood / Category**: \`${targetCategory}\`
- **Batch Size**: 25–30 completely unique stickers per pack (unless user specifies another count).

---

## Step 1: Event, Holiday & Tone Grounding (CRITICAL)
NEVER lock all stickers into a single generic "cute Kawaii" look when the user asks for a specific event, holiday, or dark tone.
Detect the requested occasion/language/tone from the user's message and ground **every single sticker** (both \`stickerText\` and \`prompt\`) in that theme:

- **Christmas / Holiday**: Panic gift-wrapping at 2 AM Dec 24, tangled in fairy lights for 3 hours, eating all 24 advent chocolates on Dec 1, Santa's sleigh with 40 browser tabs open, burnt holiday cookies while scrolling. Props: Santa hats, glowing fairy lights, pine needles, wrapping tape, cocoa mugs, gift boxes.
- **Halloween / Spooky**: Ghost who forgot what room it floated in to haunt, skeleton with 40 skull tabs open, zombie craving iced coffee instead of brains, witch brewing dopamine potion, vampire losing count of bats at 3. Props: carved jack-o'-lanterns, cauldrons, spiderwebs, bats, potion bottles (obsidian black, pumpkin orange, eerie purple).
- **Dark Humor & Sarcasm**: Cynical burnout & spite (*"My dopamine died in 2016"*, *"Running on pure panic, spite & cold brew"*, *"Here lies my motivation (R.I.P.)"*, *"Mentally I am a dumpster fire"*). Props: deadpan eyes, miniature tombstones, flaming dumpsters, melting 1% batteries. **DO NOT use pastel pink Kawaii aesthetics for Dark Humor.**
- **New Year**: Unused 2026 planner abandoned on Jan 2, midnight time-blindness, gym membership never visited.
- **Valentine's Day**: Hyperfixating on crush, love language = sending 30 reels at 3 AM, forgot anniversary.
- **Back to School**: Cramming 4-month syllabus in 2 hours, bought 14 highlighters and read 0 pages, black-hole backpack.
- **Thanksgiving**: Hiding with the host's dog, dinner table sensory overload, burned the pie researching a random hobby.
- **Summer & Travel**: Packing 15 mins before airport flight, forgot passport in freezer, packed 9 unread books.
- **Office & Work Chaos**: Meeting could have been a daydream, 5,420 unread emails, camera off on Zoom, typing fast to look busy.
- **Custom User Topic / Multilingual Input**: If the user asks in another language (e.g., Roman Urdu like *"Christmas k lia adhd stiker"* or *"dark hummar quate"*) or names a custom niche (e.g., *"gym ADHD"*, *"cat mom ADHD"*, *"coding burnout"*), adapt 100% of quotes and visual props to that niche.

---

## Step 2: Art Style & Non-Repeating 40-Style Variation Matrix
Apply the user's chosen **Art Style** (or match it automatically to the event):
1. **Dark Gothic Grunge**: Moody charcoal, obsidian black, muted crimson, neon acid-green accents, distressed ink lines, deadpan comedy.
2. **Kawaii Pastel**: Japanese chibi style, oversized glass-like shimmering eyes, soft blush cheeks, pastel pink/mint/lavender.
3. **Retro 90s / Y2K Cyber**: Pixelated OS error popups, neon magenta & cyan gradients, holographic CDs, cyber stars.
4. **Comic Pop-Art**: Roy Lichtenstein halftone Ben-Day dots, bold primary colors, dramatic comic speech bubbles.
5. **Minimalist Line Art**: High-contrast black ink notebook margin doodle, clean monochrome curves, subtle spot accent.
6. **8-Bit Pixel Art**: Arcade game sprite styling, blocky pixel contour, retro hearts and coins.
7. **Cozy Hygge Scandinavian**: Soft knit textures, terracotta, sage green, warm cream, comforting hand-drawn vector art.
8. **Vintage Tattoo Flash**: Sailor Jerry bold linework, scroll banners with cursive lettering, deep navy and ruby ink.

### Anti-Sameness Micro-Style Rotation (Cycle across a 25–30 sticker batch):
Vary the framing across stickers in the same pack so no two stickers look alike:
\`Kawaii Chibi\`, \`90s Anime Sweatdrop\`, \`Cottagecore Mushroom\`, \`Pastel Goth\`, \`Y2K Error Window\`, \`Vaporwave Marble Bust\`, \`Trash Panda Raccoon\`, \`Goblincore Moss\`, \`Cyberpunk Glitch\`, \`Margin Ink Doodle\`, \`RPG Side-Quest UI\`, \`99% Loading Bar\`, \`Hazard Caution Sign\`, \`Vintage Postage Stamp\`, \`Scribbled Checklist\`, \`Comic Dopamine Chase\`, \`Golden Retriever Energy\`, \`Sloth Weighted Blanket\`, \`Capybara Hot Spring\`, \`Shiny-Obsessed Magpie\`, \`Vintage Motel Keytag\`, \`Mid-Century Atomic\`, \`Psychedelic 70s Melting\`, \`Pop Art Halftone\`, \`Sailor Tattoo Banner\`, \`1% Low Battery\`, \`40 Overlapping Browser Tabs\`, \`Emoji Mashup\`, \`8-Bit Arcade\`, \`Synthwave Sunset Grid\`, \`Hygge Knit\`, \`Swiss Brutalist\`, \`Ornate Tarot Card\`, \`Corporate HR Badge\`, \`Grocery Nutrition Label\`, \`Watercolor Splatter\`, \`Linocut Block Print\`, \`Maximalist Checkerboard\`, \`Celestial Galaxy\`, \`Peeling Sticker-on-Sticker\`.

---

## Step 3: Character Partition & Mood Detection
Detect the quote's mood (**confused**, **hyperactive**, **overwhelmed**, **calm**, **procrastinate**) and choose characters accordingly:
- **When Style is Kawaii Pastel / Cute**: Use cute animals (sloth, corgi, axolotl, capybara, raccoon, black cat, frog), anthropomorphized drinks/pastries (boba cup, hot cocoa mug, cinnamon bun), or cozy clouds. Avoid generic human office workers unless requested.
- **When Style is General / Event / Dark Humor**: Use expressive thematic characters matching the event (Santa, elf, ghost, skeleton, witch, vampire, grim reaper, dumpster fire, sarcastic skull, glitching laptop, stressed developer, tired coffee mug, runaway alarm clock, chaotic cartoon brain).

---

## Step 4: Semantic Quote-to-Visual Matching (Bad vs Good)
Every image prompt MUST visually act out the literal punchline of \`stickerText\`:
- **BAD**: Text \`"Coffee is my lifeline"\` -> Visual: \`"A happy green dinosaur on a skateboard."\` *(Unrelated!)*
- **GOOD**: Text \`"Coffee is my lifeline"\` -> Visual: \`"A sleepy brown sloth clinging desperately to a giant steaming coffee mug like a life raft, wide tired eyes."\`
- **BAD**: Text \`"40 Open Tabs"\` -> Visual: \`"A cute bunny sniffing a flower."\` *(Zero connection to tabs!)*
- **GOOD**: Text \`"40 Open Tabs"\` -> Visual: \`"A wide-eyed skeleton surrounded by 40 floating retro browser windows orbiting its skull, labeled Untitled-99."\`
- **BAD**: Text \`"My dopamine died in 2016"\` -> Visual: \`"Pastel pink kitten smiling with hearts."\` *(Wrong tone!)*
- **GOOD**: Text \`"My dopamine died in 2016"\` -> Visual: \`"A dark gothic sarcastic skull leaning on a miniature tombstone reading 'R.I.P. Motivation', muted crimson and charcoal grunge ink lines."\`

---

## Step 5: Exact Image Prompt Formula
Every generated prompt MUST follow this structure:
> \`[Style & Mood Prefix] of an expressive [Character/Mascot], [Specific Semantic Action & Facial Expression illustrating the quote], [Event/Holiday Props & Environment], designed as a die-cut vinyl sticker with a thick clean white contour border isolated on a solid transparent background, [Art Style Technical Tokens: outlines, palette, shading], featuring the bold text "[stickerText]".\`
${memoryBlock}
---

## Step 6: Output Format
Support two clean output modes depending on what the user asks for:
1. **Raw Prompt List (Default for Midjourney/DALL-E bulk upload)**: Output **ONLY** the image-generation prompts, strictly **one complete prompt per line**, with NO numbering, NO markdown headers, and NO extra commentary.
2. **Structured JSON Pack (For Apps / Workflows / Visual Preview)**:
\`\`\`json
{
  "event": "${targetEvent}",
  "artStyle": "${targetStyle}",
  "stickers": [
    {
      "concept": "Short 2-4 word unique summary",
      "stickerText": "Punchy quote printed on sticker",
      "characterType": "Specific mascot or character",
      "description": "1-sentence explanation of the ADHD gag",
      "prompt": "Complete die-cut image-generation prompt..."
    }
  ]
}
\`\`\`
`;
}

function buildMuseSystemPrompt(options?: {
  event?: string;
  artStyle?: string;
  category?: string;
  includeMemory?: boolean;
}): string {
  const targetEvent = options?.event && options.event !== "None" ? options.event : "whatever event, holiday, or mood the user asks for";
  const targetStyle = options?.artStyle && options.artStyle !== "Auto" ? options.artStyle : "whichever art style best matches the event (or requested by the user)";
  const history = loadHistory();
  const avoidedConcepts = options?.includeMemory ? (history.generated_concepts || []).slice(-40) : [];

  return `You are Muse's specialized **ADHD Sticker Prompt Architect**. You have mastered the skill of generating Etsy-grade, zero-repetition, die-cut vinyl sticker prompts for Midjourney, DALL-E 3, and Imagen.

### YOUR CORE OPERATING RULES:
1. **Adapt to ANY Event, Holiday, or Tone**: Never default everything to generic pink Kawaii!
   - Current focus: **${targetEvent}** | Art Style: **${targetStyle}**.
   - If the user asks for **Christmas**, generate ADHD holiday chaos (tangled fairy lights, 2 AM Dec 24 panic wrapping, eating all advent chocolates on Day 1, Santa with 40 open tabs).
   - If the user asks for **Halloween**, generate spooky ADHD humor (skeleton with 40 skull tabs, ghost forgetting what room to haunt, vampire craving iced coffee).
   - If the user asks for **Dark Humor / Sarcasm**, switch to dark gothic grunge / deadpan comedy (burnout, spite, *"My dopamine died in 2016"*, flaming dumpsters, tombstones — NO pastel pink!).
   - If the user asks in another language (like Roman Urdu/Hindi) or requests a niche (school, office, New Year, Valentine, travel), tailor 100% of quotes and props to that exact request.

2. **Literal Semantic Visual Storytelling**:
   - The character, pose, expression, and props in the \`prompt\` MUST directly illustrate the punchline of \`stickerText\`. Never pair unrelated objects with a quote.

3. **Zero-Repetition Across the Pack (25–30 Stickers)**:
   - Rotate across diverse moods (confused, hyperactive, overwhelmed, calm, procrastinating), distinct mascots, and varied micro-styles (Pop Art, Retro 90s OS Window, Tarot Card, Caution Sign, Grocery Nutrition Label, 8-Bit Pixel, Tattoo Flash, Notebook Doodle, etc.).
${avoidedConcepts.length > 0 ? `\n4. **Strict Blacklist (Do NOT Reuse)**:\n   Avoid these previously generated concepts: ${avoidedConcepts.join(", ")}\n` : ""}
5. **Mandatory Die-Cut Technical Suffix**:
   - Every prompt must explicitly specify: *"thick clean white die-cut contour border isolated on a solid transparent background"* along with clear vector/illustration style tokens and the featured quote text.

6. **Clean Output**:
   - If the user wants copy-paste prompts, output ONLY one complete prompt per line with no numbers or extra chatter. If they ask for a pack breakdown, return structured JSON with \`concept\`, \`stickerText\`, \`characterType\`, \`description\`, and \`prompt\`.`;
}

function buildPortableSkillCode(baseUrl: string = "http://localhost:3000") {
  return `/**
 * Portable ADHD Sticker Prompt Engine Skill Module
 * Compatible with AI Agents (Muse, Manus, OpenClaw, LangChain, Custom MCP Tools)
 */

export interface StickerPromptRequest {
  event?: "None" | "Christmas" | "Halloween" | "Dark Humor & Sarcasm" | "New Year" | "Valentine's Day" | "Back to School" | "Thanksgiving" | "Summer & Travel" | "Office & Work Chaos" | string;
  artStyle?: "Auto" | "Dark Gothic Grunge" | "Kawaii Pastel" | "Retro 90s/Y2K" | "Comic Pop Art" | "Minimalist Line Art" | "8-Bit Pixel Art" | "Cozy Hygge" | "Vintage Tattoo Flash";
  category?: string;
  count?: number; // 25 - 30
  customInstructions?: string;
}

export const EVENT_THEMES = {
  "Christmas": ["Panic wrapping at 2 AM Dec 24", "Tangled in Christmas lights for 3 hours", "Ate all 24 advent chocolates on Dec 1", "Santa's sleigh has 40 browser tabs open"],
  "Halloween": ["Forgot what I floated in to haunt", "Skeleton with 40 skull tabs open", "Zombie craving iced coffee, not brains", "Witch brewing dopamine potion in cauldron"],
  "Dark Humor & Sarcasm": ["My dopamine died in 2016", "Running on pure panic, spite & caffeine", "Here lies my motivation (R.I.P.)", "Mentally I am a dumpster fire"],
  "New Year": ["Jan 1: New Me! Jan 2: Exhausted", "Bought a 2026 planner (will use 1 day)", "Midnight time-blindness hits different"],
  "Valentine's Day": ["Hyperfixating on you", "Love language: 30 reels at 3 AM", "Forgot our anniversary (I still love you!)"],
  "Back to School": ["Cramming a 4-month syllabus in 2 hours", "Lost in the backpack black hole", "Bought 14 highlighters, read zero pages"]
};

export async function generateAdhdStickerPack(params: StickerPromptRequest) {
  const response = await fetch("${baseUrl}/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      category: params.category || "Funny ADHD",
      event: params.event || "None",
      artStyle: params.artStyle || "Auto",
      count: params.count || 27,
      customInstructions: params.customInstructions || ""
    })
  });
  return response.json();
}
`;
}

// 4. Return complete Agent Skill Bundle for Muse / External AI Agents
app.get("/api/skill", (req, res) => {
  try {
    const event = String(req.query.event || "None");
    const artStyle = String(req.query.artStyle || "Auto");
    const category = String(req.query.category || "Funny ADHD");
    const includeMemory = req.query.includeMemory === "true";
    const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
    const host = req.get("host") || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;

    const skillMarkdown = buildAgentSkillMarkdown({ event, artStyle, category, includeMemory });
    const systemPrompt = buildMuseSystemPrompt({ event, artStyle, category, includeMemory });
    const portableCode = buildPortableSkillCode(baseUrl);
    const skillJson = {
      name: "adhd-sticker-prompt-engine",
      version: "2.5.0",
      compatibleAgents: ["Muse", "Manus", "Claude Code", "Gemini CLI", "OpenClaw", "Custom GPT"],
      apiEndpoint: `${baseUrl}/api/generate`,
      supportedEvents: Object.keys(EVENT_QUOTES),
      supportedArtStyles: [
        "Auto",
        "Dark Gothic Grunge",
        "Kawaii Pastel",
        "Retro 90s/Y2K",
        "Comic Pop Art",
        "Minimalist Line Art",
        "8-Bit Pixel Art",
        "Cozy Hygge",
        "Vintage Tattoo Flash"
      ],
      sampleEventQuotes: EVENT_QUOTES,
      systemPrompt,
      skillMarkdown
    };

    res.json({
      success: true,
      skillMarkdown,
      systemPrompt,
      portableCode,
      skillJson
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Direct file download endpoint for SKILL.md / JSON / System Prompt / TS Code
app.get("/api/skill/download", (req, res) => {
  try {
    const format = String(req.query.format || "md").toLowerCase();
    const event = String(req.query.event || "None");
    const artStyle = String(req.query.artStyle || "Auto");
    const category = String(req.query.category || "Funny ADHD");
    const includeMemory = req.query.includeMemory === "true";
    const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
    const host = req.get("host") || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;

    if (format === "json") {
      const payload = {
        name: "adhd-sticker-prompt-engine",
        version: "2.5.0",
        compatibleAgents: ["Muse", "Manus", "Claude", "Gemini", "OpenClaw"],
        systemPrompt: buildMuseSystemPrompt({ event, artStyle, category, includeMemory }),
        skillMarkdown: buildAgentSkillMarkdown({ event, artStyle, category, includeMemory }),
        supportedEvents: Object.keys(EVENT_QUOTES),
        eventQuotes: EVENT_QUOTES
      };
      res.setHeader("Content-Disposition", 'attachment; filename="adhd-sticker-skill.json"');
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.send(JSON.stringify(payload, null, 2));
    }

    if (format === "txt") {
      res.setHeader("Content-Disposition", 'attachment; filename="muse-agent-prompt.txt"');
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.send(buildMuseSystemPrompt({ event, artStyle, category, includeMemory }));
    }

    if (format === "ts") {
      res.setHeader("Content-Disposition", 'attachment; filename="adhd-sticker-skill.ts"');
      res.setHeader("Content-Type", "text/typescript; charset=utf-8");
      return res.send(buildPortableSkillCode(baseUrl));
    }

    res.setHeader("Content-Disposition", 'attachment; filename="SKILL.md"');
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    return res.send(buildAgentSkillMarkdown({ event, artStyle, category, includeMemory }));
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Setup Vite & static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server powered by Gemini running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
