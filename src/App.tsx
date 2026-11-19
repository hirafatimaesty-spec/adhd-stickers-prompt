import React, { useState, useEffect, useMemo } from "react";
import { 
  Sparkles, 
  Trash2, 
  Copy, 
  Check, 
  Database, 
  Layers, 
  Sliders, 
  History, 
  Eye, 
  FileText, 
  HelpCircle, 
  ArrowRight, 
  X, 
  Download, 
  Search, 
  AlertCircle,
  RefreshCw,
  Heart,
  Smile,
  Zap,
  Clock,
  BookOpen,
  Coffee,
  Frown,
  Brain,
  MessageSquare,
  Ghost,
  Skull,
  Gift,
  Flame,
  Calendar,
  Palette,
  Tag,
  Bot,
  Code2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Sticker, Pack, CategoryInfo, EventInfo, ArtStyleInfo, GeneratorConfig, DatabaseStatus } from "./types";

// Events & Holiday Occasions for ADHD Themes
const EVENTS: EventInfo[] = [
  {
    id: "None",
    name: "General ADHD",
    emoji: "🌟",
    badge: "Everyday",
    description: "Daily relatable neurodivergent moments, brain tabs, dopamine hunts, and classic ADHD humor.",
    sampleIdeas: ["40 browser tabs open", "Cleaned kitchen instead of emailing", "Squirrel!"]
  },
  {
    id: "Christmas",
    name: "Christmas & Holiday",
    emoji: "🎄",
    badge: "Holiday Chaos",
    description: "Holiday executive dysfunction, panic gift wrapping at 2 AM on Dec 24, tangled fairy lights, burnt cookies.",
    sampleIdeas: ["Tangled in Christmas lights for 3 hours", "Ate all 24 advent chocolates on Dec 1", "Forgot Secret Santa gift!"]
  },
  {
    id: "Halloween",
    name: "Halloween & Spooky",
    emoji: "🎃",
    badge: "Spooky ADHD",
    description: "Spooky neurodivergent vibes, skeletons with 40 skull tabs, ghosts who forgot what room to haunt, caffeine-deprived vampires.",
    sampleIdeas: ["Forgot what I floated in to haunt", "Skeleton with 40 skull tabs open", "Zombie craving iced coffee, not brains"]
  },
  {
    id: "Dark Humor & Sarcasm",
    name: "Dark Humor & Sarcasm",
    emoji: "💀",
    badge: "Cynical Wit",
    description: "Biting, dry, existential ADHD humor. Burnout, spite, existential dread, sarcastic tombstones, dumpster fires.",
    sampleIdeas: ["My dopamine died in 2016", "Running on pure panic, spite & cold brew", "Here lies my motivation (R.I.P.)"]
  },
  {
    id: "New Year",
    name: "New Year & Resolutions",
    emoji: "🎉",
    badge: "Jan 1 Panic",
    description: "Ambitious resolutions abandoned by Jan 2, untouched shiny 2026 planners, midnight time-blindness.",
    sampleIdeas: ["Jan 1: New Me! Jan 2: Exhausted", "Bought a 2026 planner (will use 1 day)", "Midnight time-blindness hits different"]
  },
  {
    id: "Valentine's Day",
    name: "Valentine & Romance",
    emoji: "💘",
    badge: "Hyperfixation Love",
    description: "Dating with ADHD, hyperfixation crushes, forgetting anniversary dates, love language is sharing 30 reels at 3 AM.",
    sampleIdeas: ["Hyperfixating on you", "Forgot our anniversary (I still love you!)", "Love language: 30 reels at 3 AM"]
  },
  {
    id: "Back to School",
    name: "Back to School & Study",
    emoji: "🎒",
    badge: "Cramming Panic",
    description: "Syllabus shock, cramming 4 months into 2 hours, black hole backpacks, bought 14 highlighters and read 0 pages.",
    sampleIdeas: ["Cramming a 4-month syllabus in 2 hours", "Lost in the backpack black hole", "Staring at page 1 for 45 mins"]
  },
  {
    id: "Thanksgiving",
    name: "Thanksgiving & Dinner",
    emoji: "🦃",
    badge: "Sensory Dinner",
    description: "Family dinner sensory overload, hiding with the host's dog, burning the pie because you found a shiny rock outside.",
    sampleIdeas: ["Hiding with the host's dog to avoid talking", "Burned the pie while researching a new hobby", "Table sensory overload"]
  },
  {
    id: "Summer & Travel",
    name: "Summer & Travel Panic",
    emoji: "🏖️",
    badge: "Airport Rush",
    description: "Packing 15 minutes before the flight, forgot passport in the freezer, packed 9 books you will definitely not open.",
    sampleIdeas: ["Packing 15 minutes before the airport flight", "Forgot passport in the kitchen freezer", "Airport sensory overload champion"]
  },
  {
    id: "Office & Work Chaos",
    name: "Office & Work Chaos",
    emoji: "💼",
    badge: "Meeting Daydream",
    description: "Meeting could have been an email, typing fast to look busy, 5,000 unread emails, camera off during Zoom.",
    sampleIdeas: ["This meeting could have been a daydream", "Typing furiously so I look extremely busy", "Unread inbox: 5,420 emails"]
  }
];

// Art Styles & Visual Aesthetics (Beyond just Kawaii!)
const ART_STYLES: ArtStyleInfo[] = [
  {
    id: "Auto",
    name: "Auto (Matches Mood)",
    emoji: "🎨",
    description: "Automatically matches the visual style to the event and tone (festive for Christmas, spooky for Halloween, dark grunge for Dark Humor).",
    previewClass: "from-blue-500/20 to-purple-500/20 text-blue-200 border-blue-400/30"
  },
  {
    id: "Dark Gothic Grunge",
    name: "Dark Gothic Grunge",
    emoji: "💀",
    description: "Moody charcoal, deep crimson, obsidian blacks, distressed vinyl sticker texture, sarcastic deadpan look.",
    previewClass: "from-zinc-900/60 to-red-950/40 text-red-200 border-red-500/30"
  },
  {
    id: "Kawaii Pastel",
    name: "Cute Kawaii & Pastel",
    emoji: "🌸",
    description: "Adorable Japanese chibi aesthetic, soft pink & mint pastels, glossy reflective eyes, blushing cheeks.",
    previewClass: "from-pink-500/20 to-rose-500/20 text-pink-200 border-pink-400/30"
  },
  {
    id: "Retro 90s/Y2K",
    name: "Retro 90s / Y2K Cyber",
    emoji: "📼",
    description: "Pixelated vintage computer OS popups, bright neon magenta & cyan gradients, cyber stars, holographic foil.",
    previewClass: "from-cyan-500/20 to-fuchsia-500/20 text-cyan-200 border-cyan-400/30"
  },
  {
    id: "Comic Pop Art",
    name: "Comic Pop-Art",
    emoji: "💥",
    description: "Roy Lichtenstein halftone Ben-Day dots, bold primary colors, action comic burst speech bubbles, graphic black ink.",
    previewClass: "from-yellow-500/20 to-red-500/20 text-amber-200 border-yellow-400/30"
  },
  {
    id: "Minimalist Line Art",
    name: "Minimalist Line Art",
    emoji: "🖋️",
    description: "High-contrast clean black ink notebook margin doodle, elegant monochrome curves, subtle accent highlights.",
    previewClass: "from-slate-800/40 to-slate-700/40 text-slate-200 border-slate-500/30"
  },
  {
    id: "8-Bit Pixel Art",
    name: "8-Bit Retro Pixel Art",
    emoji: "🎮",
    description: "Nostalgic arcade console sprites, blocky pixel contour, retro game hearts, 80s gamer vibe.",
    previewClass: "from-emerald-500/20 to-green-500/20 text-emerald-200 border-emerald-400/30"
  },
  {
    id: "Cozy Hygge",
    name: "Cozy Hygge Scandinavian",
    emoji: "☕",
    description: "Soft textured knit patterns, warm terracotta, sage green and cream tones, gentle comfort hand-drawn vector art.",
    previewClass: "from-amber-600/20 to-orange-500/20 text-amber-200 border-amber-500/30"
  },
  {
    id: "Vintage Tattoo Flash",
    name: "Vintage Tattoo Flash",
    emoji: "🃏",
    description: "Sailor Jerry bold traditional tattoo flash, scroll banners with cursive lettering, deep navy and ruby ink.",
    previewClass: "from-indigo-900/40 to-amber-900/30 text-amber-100 border-amber-600/30"
  }
];

// Quick Click Suggestions
const QUICK_PROMPT_CHIPS = [
  { label: "🎄 Christmas Chaos", event: "Christmas", style: "Auto", text: "Christmas ADHD holiday chaos, tangled fairy lights, panic gift wrapping at 2 AM Dec 24" },
  { label: "🎃 Spooky Halloween", event: "Halloween", style: "Dark Gothic Grunge", text: "Halloween spooky ADHD, skeleton with 40 skull tabs, ghosts who forgot why they floated in" },
  { label: "💀 Dark Humor & Sarcasm", event: "Dark Humor & Sarcasm", style: "Dark Gothic Grunge", text: "Dark sarcastic ADHD humor, burnout, spite, 'My dopamine died in 2016', existential dread" },
  { label: "🎉 New Year Resolutions", event: "New Year", style: "Auto", text: "New Year failed resolutions, bought 2026 planner used for 1 day, midnight time-blindness" },
  { label: "💘 Valentine Hyperfixation", event: "Valentine's Day", style: "Kawaii Pastel", text: "Valentine's Day ADHD romance, hyperfixating on crush, love language is 30 reels at 3 AM" },
  { label: "🎒 Back-to-School Panic", event: "Back to School", style: "Comic Pop Art", text: "Back to school cramming panic, lost in backpack black hole, 4-month syllabus in 2 hours" },
  { label: "☕ Doomscroll & Iced Coffee", event: "Office & Work Chaos", style: "Retro 90s/Y2K", text: "Late night doomscrolling, running on iced coffee and panic, 50 open tabs" },
  { label: "🌸 Cute Pastel Wellness", event: "None", style: "Kawaii Pastel", text: "Kawaii pastel self-care reminders, gentle cloud, hydrate and take meds" },
];

// Category Data aligned to prompt rules
const CATEGORIES: CategoryInfo[] = [
  {
    id: "Funny ADHD",
    name: "Funny ADHD",
    emoji: "🤪",
    description: "Self-deprecating humor, relatable daily bloopers, and chaotic ADHD situations rendered beautifully.",
    sampleIdeas: ["Forgetting what you went upstairs for", "Cleaned whole kitchen instead of emailing", "Squirrel!"]
  },
  {
    id: "Kawaii ADHD",
    name: "Kawaii ADHD",
    emoji: "🌸",
    description: "Hyper-cute animal companions, smiling household items, and lovely pastel ADHD metaphors.",
    sampleIdeas: ["Tired boba tea with sad shiny eyes", "Happy strawberry with 10 tabs open", "Cute blushing brain with a tiny bow"]
  },
  {
    id: "ADHD Quotes",
    name: "ADHD Quotes",
    emoji: "💬",
    description: "Witty stickers combining powerful typography with small complementary doodles.",
    sampleIdeas: ["'My brain has 47 tabs open'", "'Brb, hyperfixating'", "'I'm not late, I'm on ADHD time'"]
  },
  {
    id: "Mental Health Humor",
    name: "Mental Health Humor",
    emoji: "🧠",
    description: "Gentle comic relief about sensory overload, executive dysfunction, therapy jokes, and dopamine hunting.",
    sampleIdeas: ["Dopamine collector jar with sparkles", "Anxious brain doing yoga unsuccessfully", "Overwhelmed alarm clock"]
  },
  {
    id: "Productivity Struggles",
    name: "Productivity Struggles",
    emoji: "⏳",
    description: "Hilarious references to to-do lists, alarm clocks, calendars, deadlines, and the art of putting things off.",
    sampleIdeas: ["A laundry pile that has its own ecosystem", "A shiny planner that was used for exactly 1 day", "Calendar on fire"]
  },
  {
    id: "Study & Work Chaos",
    name: "Study & Work Chaos",
    emoji: "💻",
    description: "The ultimate survival pack for exams, home office, distraction loops, and browser tab overload.",
    sampleIdeas: ["Desktop screen with 'Untitled-99.txt'", "A coffee cup drinking coffee to wake up", "Staring at page 1 forever"]
  },
  {
    id: "Self-Care & Wellness",
    name: "Self-Care & Wellness",
    emoji: "🍵",
    description: "Sweet, mindful reminders to hydrate, take meds, self-soothe, celebrate small wins, and sleep.",
    sampleIdeas: ["Water bottle saying 'Please drink me'", "A cute pill bottle wearing a tiny wizard hat", "Sleeping cloud"]
  },
  {
    id: "Mixed Pack",
    name: "Mixed Pack",
    emoji: "🎒",
    description: "A customized variety pack pulling concepts and gags across all categories for ultimate variety.",
    sampleIdeas: ["Glittery brain", "Unfinished puzzle", "Wobbly alarm clock", "Corgi distracted by a bug"]
  }
];

// Helper to assign a fitting icon representation for visual previews
const getMascotIcon = (charType: string, stickerText: string) => {
  const char = charType.toLowerCase();
  const text = stickerText.toLowerCase();
  
  if (char.includes("ghost") || text.includes("ghost") || text.includes("haunt") || text.includes("boo")) {
    return <Ghost className="w-10 h-10 text-purple-400" />;
  }
  if (char.includes("skull") || char.includes("skeleton") || char.includes("reaper") || char.includes("grave") || text.includes("died") || text.includes("r.i.p") || text.includes("skull")) {
    return <Skull className="w-10 h-10 text-rose-400" />;
  }
  if (char.includes("santa") || char.includes("xmas") || char.includes("christmas") || char.includes("elf") || char.includes("reindeer") || char.includes("holiday") || text.includes("christmas") || text.includes("advent") || text.includes("gift")) {
    return <Gift className="w-10 h-10 text-emerald-400" />;
  }
  if (char.includes("fire") || char.includes("dumpster") || text.includes("fire") || text.includes("melt")) {
    return <Flame className="w-10 h-10 text-amber-500" />;
  }
  if (char.includes("coffee") || char.includes("mug") || char.includes("cup") || char.includes("drink") || text.includes("tea") || text.includes("boba") || text.includes("caffeine") || text.includes("espresso")) {
    return <Coffee className="w-10 h-10 text-amber-500" />;
  }
  if (char.includes("brain") || char.includes("mind") || text.includes("brain")) {
    return <Brain className="w-10 h-10 text-pink-400" />;
  }
  if (char.includes("clock") || char.includes("timer") || char.includes("alarm") || text.includes("time") || text.includes("late") || text.includes("midnight")) {
    return <Clock className="w-10 h-10 text-indigo-500" />;
  }
  if (char.includes("book") || char.includes("planner") || char.includes("study") || char.includes("list") || text.includes("todo") || text.includes("work") || text.includes("syllabus")) {
    return <BookOpen className="w-10 h-10 text-emerald-500" />;
  }
  if (char.includes("cloud") || char.includes("sleep") || char.includes("bed") || text.includes("nap") || text.includes("rest")) {
    return <Frown className="w-10 h-10 text-sky-400" style={{ transform: "rotate(180deg)" }} />;
  }
  if (char.includes("star") || char.includes("sparkle") || char.includes("magic") || text.includes("shiny") || text.includes("dopamine")) {
    return <Sparkles className="w-10 h-10 text-amber-300" />;
  }
  if (char.includes("heart") || char.includes("cupid") || char.includes("love") || text.includes("love") || text.includes("romance")) {
    return <Heart className="w-10 h-10 text-rose-400" />;
  }
  if (char.includes("smile") || char.includes("cheer") || text.includes("yay") || text.includes("happy")) {
    return <Smile className="w-10 h-10 text-amber-400" />;
  }
  return <Zap className="w-10 h-10 text-purple-400" />;
};

// Pastel backgrounds for decorative stickers
const STICKER_COLORS = [
  "bg-pink-100 border-pink-300 text-pink-700",
  "bg-purple-100 border-purple-300 text-purple-700",
  "bg-blue-100 border-blue-300 text-blue-700",
  "bg-teal-100 border-teal-300 text-teal-700",
  "bg-amber-100 border-amber-300 text-amber-700",
  "bg-rose-100 border-rose-300 text-rose-700",
  "bg-violet-100 border-violet-300 text-violet-700",
  "bg-indigo-100 border-indigo-300 text-indigo-700",
];

export default function App() {
  // App Config States
  const [selectedEvent, setSelectedEvent] = useState<string>("None");
  const [selectedArtStyle, setSelectedArtStyle] = useState<string>("Auto");
  const [selectedCategory, setSelectedCategory] = useState<string>("Funny ADHD");
  const [stickerCount, setStickerCount] = useState<number>(27);
  const [customInstructions, setCustomInstructions] = useState<string>("");
  
  // App Runtime States
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activePack, setActivePack] = useState<Pack | null>(null);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [viewMode, setViewMode] = useState<"visual" | "raw">("visual");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sandboxNotice, setSandboxNotice] = useState<string | null>(null);
  const [forceSandbox, setForceSandbox] = useState<boolean>(false);
  
  // UI Interaction States
  const [copiedStickerIndex, setCopiedStickerIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info' | 'error'} | null>(null);
  const [showMemoryModal, setShowMemoryModal] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [showSkillModal, setShowSkillModal] = useState<boolean>(false);
  const [skillTab, setSkillTab] = useState<"skillmd" | "muse" | "code">("skillmd");
  const [skillIncludeMemory, setSkillIncludeMemory] = useState<boolean>(true);
  const [skillLoading, setSkillLoading] = useState<boolean>(false);
  const [copiedSkill, setCopiedSkill] = useState<boolean>(false);
  const [skillBundle, setSkillBundle] = useState<{
    skillMarkdown: string;
    systemPrompt: string;
    portableCode: string;
    skillJson: any;
  } | null>(null);

  // Fetch Database memory / status on mount
  const fetchDbStatus = async () => {
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      if (data.success) {
        setDbStatus({
          conceptsCount: data.conceptsCount,
          promptsCount: data.promptsCount,
          packsCount: data.packsCount,
          concepts: data.concepts,
          packs: data.packs
        });
        // Set first pack as active initially if none exists
        if (data.packs && data.packs.length > 0 && !activePack) {
          setActivePack(data.packs[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch database status:", error);
    }
  };

  useEffect(() => {
    fetchDbStatus();
  }, []);

  // Display ephemeral feedback toast
  const triggerToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Fetch portable Agent Skill bundle (SKILL.md, Muse System Prompt, Portable Code & JSON)
  const fetchSkillBundle = async (includeMem: boolean = skillIncludeMemory) => {
    setSkillLoading(true);
    try {
      const params = new URLSearchParams({
        event: selectedEvent,
        artStyle: selectedArtStyle,
        category: selectedCategory,
        includeMemory: String(includeMem)
      });
      const res = await fetch(`/api/skill?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setSkillBundle({
          skillMarkdown: data.skillMarkdown,
          systemPrompt: data.systemPrompt,
          portableCode: data.portableCode,
          skillJson: data.skillJson
        });
      }
    } catch (error) {
      triggerToast("Failed to load Agent Skill bundle.", "error");
    } finally {
      setSkillLoading(false);
    }
  };

  const handleOpenSkillModal = () => {
    setShowSkillModal(true);
    fetchSkillBundle(skillIncludeMemory);
  };

  const handleCopySkillContent = () => {
    if (!skillBundle) return;
    const textToCopy =
      skillTab === "skillmd"
        ? skillBundle.skillMarkdown
        : skillTab === "muse"
        ? skillBundle.systemPrompt
        : skillBundle.portableCode;
    navigator.clipboard.writeText(textToCopy);
    setCopiedSkill(true);
    triggerToast("Agent skill copied! Paste directly into Muse or any AI agent.", "success");
    setTimeout(() => setCopiedSkill(false), 2000);
  };

  const handleDownloadSkill = (format: "md" | "txt" | "json" | "ts") => {
    const params = new URLSearchParams({
      format,
      event: selectedEvent,
      artStyle: selectedArtStyle,
      category: selectedCategory,
      includeMemory: String(skillIncludeMemory)
    });
    const link = document.createElement("a");
    link.href = `/api/skill/download?${params.toString()}`;
    link.download =
      format === "md"
        ? "SKILL.md"
        : format === "txt"
        ? "muse-agent-prompt.txt"
        : format === "json"
        ? "adhd-sticker-skill.json"
        : "adhd-sticker-skill.ts";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast(`Downloading ${link.download}...`, "success");
  };

  // Apply preset quick suggestion chip
  const handleApplyChip = (chip: { label: string; event: string; style: string; text: string }) => {
    setSelectedEvent(chip.event);
    setSelectedArtStyle(chip.style);
    setCustomInstructions(chip.text);
    triggerToast(`Applied "${chip.label}" preset! Click Generate or edit the prompt.`, "info");
  };

  // Generate pack request
  const handleGeneratePack = async () => {
    setIsGenerating(true);
    const targetLabel = selectedEvent !== "None" ? selectedEvent : selectedCategory;
    triggerToast(forceSandbox ? `Generating ${targetLabel} Sandbox simulation pack...` : `Contacting Gemini Prompter... Creating non-repetitive ${targetLabel} ADHD stickers...`, "info");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selectedCategory,
          event: selectedEvent,
          artStyle: selectedArtStyle,
          count: stickerCount,
          customInstructions: customInstructions,
          isSandbox: forceSandbox
        })
      });
      const data = await res.json();
      if (data.success) {
        const packCategory = data.category || (selectedEvent !== "None" ? `${selectedEvent} ADHD` : selectedCategory);
        const newPack: Pack = {
          id: (data.wasSandbox ? "sb_" : "pk_") + Math.random().toString(36).substring(2, 9),
          timestamp: new Date().toISOString(),
          category: packCategory,
          event: data.event || selectedEvent,
          artStyle: data.artStyle || selectedArtStyle,
          stickers: data.stickers
        };
        setActivePack(newPack);
        fetchDbStatus(); // Update blacklist count and past packs
        
        if (data.wasSandbox) {
          setSandboxNotice(
            data.isPermissionDenied 
              ? `Workspace Access Restrained (403): Your domain lacks permission key clearance. StickerSpark automatically activated a gorgeous event-tailored offline sandbox pack simulation so you can continue testing all features!`
              : `Local Sandbox Simulation: Displaying custom generated offline mock sticker templates tailored to ${newPack.category}.`
          );
          triggerToast(`Activated offline sandbox for ${newPack.category}.`, "info");
        } else {
          setSandboxNotice(null);
          triggerToast(`Successfully generated ${data.count} creative, 100% unique ${newPack.category} stickers!`, "success");
        }
      } else {
        triggerToast(data.error || "Generation failed. Please try again.", "error");
      }
    } catch (error: any) {
      triggerToast(error.message || "Connection error to Gemini AI server.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // Clear Database Memory list
  const handleClearMemory = async () => {
    if (!confirm("Are you absolutely sure you want to clear the avoidance concept history? Future generations will restart without their historical memory of what was already designed!")) {
      return;
    }
    try {
      const res = await fetch("/api/history/clear", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        triggerToast("Memory cleared! Gemini will now generate brand new packs starting from scratch.", "success");
        fetchDbStatus();
        setActivePack(null);
      }
    } catch (err) {
      triggerToast("Error resetting memory database.", "error");
    }
  };

  // Raw prompts formatter for copy paste that strictly follows user Output Rules:
  // - Output ONLY image-generation prompts.
  // - No explanations. No numbering. No markdown. No category titles. No extra text.
  // - One complete image prompt per sticker.
  const rawPromptsText = useMemo(() => {
    if (!activePack) return "";
    return activePack.stickers.map(s => s.prompt.trim()).join("\n");
  }, [activePack]);

  const handleCopyAllPrompts = () => {
    if (!rawPromptsText) return;
    navigator.clipboard.writeText(rawPromptsText);
    setCopiedAll(true);
    triggerToast("All prompts copied! Paste directly into Midjourney, DALL-E, or Imagen.", "success");
    setTimeout(() => {
      setCopiedAll(false);
    }, 2000);
  };

  const handleCopySinglePrompt = (prompt: string, idx: number) => {
    navigator.clipboard.writeText(prompt);
    setCopiedStickerIndex(idx);
    triggerToast(`Sticker Prompt #${idx + 1} copied!`, "success");
    setTimeout(() => {
      setCopiedStickerIndex(null);
    }, 2000);
  };

  // Filter stickers in the visual album
  const filteredStickers = useMemo(() => {
    if (!activePack) return [];
    if (!searchQuery) return activePack.stickers;
    const query = searchQuery.toLowerCase();
    return activePack.stickers.filter(s => 
      s.concept.toLowerCase().includes(query) ||
      s.characterType.toLowerCase().includes(query) ||
      s.stickerText.toLowerCase().includes(query) ||
      s.description.toLowerCase().includes(query) ||
      s.prompt.toLowerCase().includes(query)
    );
  }, [activePack, searchQuery]);

  return (
    <div id="adhd-sticker-studio" className="min-h-screen bg-[#0f172a] text-slate-100 font-sans antialiased pb-16 relative overflow-x-hidden">
      
      {/* Gradient Background Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/15 rounded-full blur-[120px]"></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-pink-600/15 rounded-full blur-[100px]"></div>
      </div>

      {/* Top Beautiful Header */}
      <header className="relative z-40 border-b border-white/10 backdrop-blur-md bg-white/5 sticky top-0 transition-all shadow-lg shadow-black/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-pink-500 to-violet-500 text-white p-2.5 rounded-2xl shadow-lg shadow-pink-500/20 rotate-[-3deg] hover:rotate-[3deg] transition-transform cursor-pointer">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300 flex items-center gap-2">
                StickerSpark ADHD <span className="text-xs bg-white/10 text-slate-300 px-2.5 py-0.5 rounded-full font-semibold border border-white/10">PROMPT ENGINE v2.5</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">Infinite, zero-repetition image prompts for creators & planners</p>
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex px-4 py-2 bg-white/5 rounded-full text-xs font-semibold items-center border border-white/10 text-slate-300">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 shadow-[0_0_8px_rgba(74,222,128,0.6)] animate-pulse"></span>
              ANTIREPETITION ACTIVE
            </div>

            <button 
              onClick={handleOpenSkillModal}
              className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold border border-emerald-500/35 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              id="export-agent-skill-btn"
            >
              <Bot className="w-3.5 h-3.5 text-emerald-400" />
              <span>Agent Skill (Muse)</span>
            </button>

            <button 
              onClick={() => setShowGuideModal(true)}
              className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5 text-sm font-medium flex items-center gap-1.5 cursor-pointer"
              id="guide-btn"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">How It Works</span>
            </button>

            <button 
              onClick={() => setShowMemoryModal(true)}
              className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-200 px-3 py-1.5 rounded-xl text-xs font-semibold border border-purple-500/30 flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              id="history-memory-info"
            >
              <Database className="w-3.5 h-3.5 text-purple-400" />
              <span>Memory: <strong className="text-white">{dbStatus?.conceptsCount || 0}</strong> avoided</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Toast Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`fixed top-16 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 rounded-2xl border shadow-xl ${
                notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                notification.type === 'info' ? 'bg-sky-50 border-sky-200 text-sky-800' :
                'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {notification.type === 'success' && <Check className="w-5 h-5 text-emerald-600 shrink-0" />}
              {notification.type === 'info' && <RefreshCw className="w-5 h-5 text-sky-600 shrink-0 animate-spin" />}
              {notification.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
              <span className="text-sm font-bold">{notification.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Controls & Creator Studio Settings (5 spans) */}
          <section className="lg:col-span-5 space-y-6 relative z-10">
            
            {/* Control Panel Card */}
            <div className="bg-white/5 rounded-3xl p-6 border border-white/10 backdrop-blur-xl shadow-2xl space-y-6">
              
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="font-bold text-slate-200 text-base flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-pink-400" />
                  Creator Settings
                </h3>
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Gemini Powered</span>
              </div>

              {/* 1. Event & Holiday Occasion Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-pink-400" />
                    <span>1. Target Event / Holiday (Customizable)</span>
                  </label>
                  {selectedEvent !== "None" && (
                    <button 
                      onClick={() => setSelectedEvent("None")}
                      className="text-[10px] text-pink-400 hover:text-pink-300 underline cursor-pointer"
                    >
                      Reset to General
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                  {EVENTS.map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => {
                        setSelectedEvent(ev.id);
                        // Auto adapt art style if Dark Humor
                        if (ev.id === "Dark Humor & Sarcasm" && selectedArtStyle === "Auto") {
                          setSelectedArtStyle("Dark Gothic Grunge");
                        }
                      }}
                      className={`relative p-2.5 rounded-2xl border text-left transition-all overflow-hidden cursor-pointer ${
                        selectedEvent === ev.id
                          ? "bg-gradient-to-r from-pink-500/30 to-violet-500/30 border-pink-500/50 text-white font-bold shadow-lg shadow-pink-500/10"
                          : "bg-white/5 border-white/5 hover:bg-white/10 text-slate-300"
                      }`}
                      id={`event-btn-${ev.id.replace(/\s+/g, '-').toLowerCase()}`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-xl shrink-0">{ev.emoji}</span>
                        <div className="min-w-0">
                          <span className="block text-xs leading-tight truncate">{ev.name}</span>
                          <span className="text-[9px] text-slate-400 font-normal">{ev.badge}</span>
                        </div>
                      </div>
                      {selectedEvent === ev.id && (
                        <div className="absolute right-1.5 top-1.5 bg-gradient-to-tr from-pink-500 to-violet-500 text-white rounded-full p-0.5 animate-pulse">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Active Event Tip Bubble */}
                {selectedEvent !== "None" && (
                  <div className="bg-pink-950/20 border border-pink-500/20 rounded-2xl p-3 text-xs text-pink-200">
                    <div className="flex items-center gap-1.5 font-bold text-white mb-1">
                      <span>{EVENTS.find(e => e.id === selectedEvent)?.emoji}</span>
                      <span>{EVENTS.find(e => e.id === selectedEvent)?.name} Active</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {EVENTS.find(e => e.id === selectedEvent)?.description}
                    </p>
                  </div>
                )}
              </div>

              {/* 2. Visual Art Style / Aesthetic (Not just Kawaii!) */}
              <div className="space-y-3">
                <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-violet-400" />
                  <span>2. Art Style & Aesthetic (Beyond Kawaii!)</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {ART_STYLES.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setSelectedArtStyle(st.id)}
                      className={`relative p-2 rounded-xl border text-left transition-all overflow-hidden cursor-pointer ${
                        selectedArtStyle === st.id
                          ? "bg-gradient-to-r from-violet-500/30 to-indigo-500/30 border-violet-500/50 text-white font-bold shadow-md shadow-violet-500/10"
                          : "bg-white/5 border-white/5 hover:bg-white/10 text-slate-300"
                      }`}
                      id={`style-btn-${st.id.replace(/\s+/g, '-').toLowerCase()}`}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span className="text-base shrink-0">{st.emoji}</span>
                        <span className="text-[11px] leading-tight truncate">{st.name}</span>
                      </div>
                      {selectedArtStyle === st.id && (
                        <div className="absolute right-1 top-1 bg-violet-400 text-slate-900 rounded-full p-0.5">
                          <Check className="w-2 h-2" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                {selectedArtStyle !== "Auto" && (
                  <p className="text-[10px] text-slate-400 italic">
                    {ART_STYLES.find(s => s.id === selectedArtStyle)?.description}
                  </p>
                )}
              </div>

              {/* 3. Custom Event / Topic Prompt & Quick Chips */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-400" />
                    <span>3. Custom Event, Holiday, or Specific Prompt</span>
                  </label>
                  {customInstructions && (
                    <button 
                      onClick={() => setCustomInstructions("")}
                      className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Instant Quick-Click Suggestion Chips */}
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {QUICK_PROMPT_CHIPS.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleApplyChip(chip)}
                      className="text-[10px] bg-white/5 hover:bg-white/15 border border-white/10 hover:border-pink-500/40 text-slate-300 hover:text-white px-2 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>{chip.label}</span>
                    </button>
                  ))}
                </div>

                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g. Christmas k lia adhd stiker, Halloween spooky quotes, dark humor quotes about burnout, cyberpunk cat, coffee addiction..."
                  className="w-full text-xs p-3 rounded-2xl bg-black/30 border border-white/10 focus:border-pink-500 outline-none h-20 resize-none hover:bg-black/40 transition-colors placeholder-slate-500 text-slate-100"
                  id="custom-instructions-input"
                ></textarea>
                <p className="text-[10px] text-slate-400 leading-tight">
                  💡 Type any holiday, event, language request (Roman Urdu, English, etc.), or tone. Prompts and quotes will be strictly generated around your request!
                </p>
              </div>

              {/* 4. Category Tone (Optional Secondary Fine-Tuning) */}
              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                  4. General Tone / Mood
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`p-2 rounded-xl border text-center transition-all overflow-hidden cursor-pointer ${
                        selectedCategory === cat.name
                          ? "bg-white/15 border-white/30 text-white font-bold"
                          : "bg-white/5 border-white/5 hover:bg-white/10 text-slate-400"
                      }`}
                      id={`category-btn-${cat.id.replace(/\s+/g, '-').toLowerCase()}`}
                    >
                      <span className="text-base block">{cat.emoji}</span>
                      <span className="text-[9px] block truncate">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Number of stickers inside pack */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                    5. Stickers Per Pack
                  </label>
                  <span className="bg-pink-500/20 text-pink-300 border border-pink-500/30 font-mono text-sm px-3 py-0.5 rounded-full">
                    {stickerCount} Stickers
                  </span>
                </div>
                <input
                  type="range"
                  min="25"
                  max="30"
                  step="1"
                  value={stickerCount}
                  onChange={(e) => setStickerCount(Number(e.target.value))}
                  className="w-full h-1.5 rounded-lg bg-white/10 appearance-none cursor-pointer accent-pink-500 focus:outline-none"
                  id="sticker-count-slider"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-bold font-mono px-1">
                  <span>25 min</span>
                  <span>27 avg</span>
                  <span>30 max</span>
                </div>
              </div>

              {/* Failsafe Local Sandbox Toggle */}
              <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${forceSandbox ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
                    <span className="text-xs font-bold text-slate-200">
                      {forceSandbox ? "Sandbox Mode Active" : "Gemini API Active"}
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      setForceSandbox(!forceSandbox);
                      triggerToast(
                        !forceSandbox 
                          ? "Sandbox Mode turned ON. Next generation will execute instantly offline." 
                          : "Gemini API Mode turned ON. Will connect to live server models.", 
                        "info"
                      );
                    }}
                    className={`text-[10px] px-2.5 py-1 rounded-full font-extrabold border transition-all cursor-pointer ${
                      forceSandbox 
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/35 hover:bg-amber-500/30" 
                        : "bg-white/10 text-slate-300 border-white/15 hover:bg-white/20"
                    }`}
                  >
                    {forceSandbox ? "USE GEMINI" : "USE SANDBOX"}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {forceSandbox 
                    ? "Generating complete event-tailored sticker sets instantly offline from local templates."
                    : "Connects to live Gemini 3.8 Flash model. Auto-fallbacks to sandbox mode if needed."}
                </p>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleGeneratePack}
                disabled={isGenerating}
                className={`w-full py-4 px-6 rounded-2xl text-white font-extrabold text-sm tracking-wide shadow-2xl transition-all flex items-center justify-center space-x-2 border border-transparent ${
                  isGenerating 
                    ? "bg-white/10 text-slate-400 cursor-not-allowed" 
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-xl shadow-blue-500/20 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                }`}
                id="generate-sticker-pack-btn"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Generating {selectedEvent !== "None" ? selectedEvent : selectedCategory} Pack...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>GENERATE {selectedEvent !== "None" ? selectedEvent.toUpperCase() : selectedCategory.toUpperCase()} PACK ({stickerCount} STICKERS)</span>
                  </>
                )}
              </button>

              {/* Database Anti-Repetition Assurance Panel */}
              <div className="bg-gradient-to-tr from-purple-950/40 to-pink-950/40 text-pink-100 rounded-2xl p-4 space-y-3.5 shadow-sm overflow-hidden relative border border-white/5">
                <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
                  <Database className="w-32 h-32" />
                </div>
                <div className="flex items-start space-x-2.5 z-10 relative">
                  <div className="bg-pink-500/20 text-pink-300 p-2 rounded-xl mt-0.5">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-white">Event Grounding & Anti-Repetition</h4>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      Whatever event you specify (Christmas, Halloween, Dark Humor, or custom), the engine builds ADHD quotes and visual vectors strictly matching that event with zero concept recycling!
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Past Packs Navigation list sidebar */}
            <div className="bg-white/5 rounded-3xl p-6 border border-white/10 backdrop-blur-xl shadow-2xl space-y-4">
              <h4 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-400" />
                Sticker Packs Session Library
              </h4>
              
              {!dbStatus || dbStatus.packsCount === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs italic">
                  No previous sticker packs generated yet. Launch your first creative pack!
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-none">
                  {dbStatus.packs.map((pack, idx) => (
                    <button
                      key={pack.id}
                      onClick={() => {
                        setActivePack(pack);
                        triggerToast(`Loaded Pack from ${new Date(pack.timestamp).toLocaleTimeString()}`, "info");
                      }}
                      className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between text-xs cursor-pointer ${
                        activePack?.id === pack.id
                          ? "bg-gradient-to-r from-pink-500/30 to-violet-500/30 border border-pink-400/30 text-white font-bold"
                          : "bg-white/5 border border-white/5 hover:border-white/10 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">
                          {CATEGORIES.find(c => c.name === pack.category)?.emoji || "🎒"}
                        </span>
                        <div>
                          <p className="font-bold truncate max-w-[140px] leading-tight">{pack.category}</p>
                          <span className="text-[9px] opacity-60 font-normal">
                            {new Date(pack.timestamp).toLocaleTimeString()} · {pack.stickers.length} stickers
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 opacity-65 text-slate-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>

          </section>

          {/* RIGHT COLUMN: Output Preview & Sticker list workspace (7 spans) */}
          <section className="lg:col-span-7 space-y-6 relative z-10">
            
            {activePack ? (
              <div className="space-y-6">
                
                {sandboxNotice && (
                  <div className="bg-gradient-to-r from-amber-950/40 via-red-950/30 to-amber-950/40 rounded-3xl p-5 border border-amber-500/20 shadow-xl flex items-start space-x-4 relative overflow-hidden backdrop-blur-md animate-fade-in">
                    <div className="bg-amber-500/20 text-amber-300 p-2.5 rounded-2xl relative z-10 shrink-0">
                      <AlertCircle className="w-5 h-5 animate-bounce" />
                    </div>
                    <div className="space-y-1 relative z-10">
                      <h4 className="text-xs font-extrabold text-amber-300 uppercase tracking-widest flex items-center gap-2">
                        API Warning &amp; Sandbox Fallback
                      </h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {sandboxNotice}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        💡 <span className="font-bold text-slate-300">How to fix?</span> Access credentials are cloud-managed in the workspace **Settings &gt; Secrets** panel.
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Visual Workspace Bar */}
                <div className="bg-white/10 rounded-[40px] p-6 border border-white/10 backdrop-blur-2xl shadow-2xl space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-5">
                    
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-3xl">
                          {EVENTS.find(e => e.id === activePack.event)?.emoji || CATEGORIES.find(c => c.name === activePack.category)?.emoji || "🎒"}
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-bold text-white">
                              Current Batch: <span className="text-pink-400">"{activePack.category}"</span>
                            </h2>
                            {activePack.event && activePack.event !== "None" && (
                              <span className="text-[10px] bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                                <span>{EVENTS.find(e => e.id === activePack.event)?.emoji || "✨"}</span>
                                <span>{activePack.event}</span>
                              </span>
                            )}
                            {activePack.artStyle && activePack.artStyle !== "Auto" && (
                              <span className="text-[10px] bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full font-semibold">
                                {activePack.artStyle}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">
                            Theme: <strong className="text-slate-200">{activePack.category}</strong> · Style: <strong className="text-slate-200">{activePack.artStyle || "Vector Sticker"}</strong> · {activePack.stickers.length} unique prompts
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* View mode toggle */}
                    <div className="flex items-center bg-black/30 p-1 rounded-2xl self-start sm:self-auto border border-white/10">
                      <button
                        onClick={() => setViewMode("visual")}
                        className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          viewMode === "visual"
                            ? "bg-white/10 text-white shadow-sm border border-white/10"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                        id="view-visual-btn"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Visual Album</span>
                      </button>
                      <button
                        onClick={() => setViewMode("raw")}
                        className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          viewMode === "raw"
                            ? "bg-white/10 text-white shadow-sm border border-white/10"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                        id="view-raw-btn"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Raw Prompts</span>
                      </button>
                    </div>

                  </div>

                  {/* Visual Album Mode render */}
                  {viewMode === "visual" && (
                    <div className="space-y-5">
                      
                      {/* Search / Filter Sub Bar */}
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="relative w-full">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search concepts, characters, or text..."
                            className="w-full text-xs pl-10 pr-4 py-3 rounded-2xl bg-black/20 border border-white/10 outline-none focus:border-pink-500 transition-colors text-white placeholder-slate-400"
                            id="search-sticker-query"
                          />
                          {searchQuery && (
                            <button 
                              onClick={() => setSearchQuery("")}
                              className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            onClick={handleCopyAllPrompts}
                            className={`flex items-center space-x-2 px-5 py-3 rounded-2xl text-xs font-bold bg-white/10 text-white border border-white/10 hover:bg-white/20 shadow-sm transition-all cursor-pointer ${copiedAll ? "bg-emerald-600 hover:bg-emerald-600 border-transparent" : ""}`}
                            id="copy-all-prompts-btn"
                          >
                            {copiedAll ? (
                              <>
                                <Check className="w-4 h-4 text-white" />
                                <span>COPY ALL UNIQUE PROMPTS</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 text-pink-400" />
                                <span>COPY ALL PROMPTS</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Display grid of Kawaii Stickers */}
                      {filteredStickers.length === 0 ? (
                        <div className="text-center py-16 border-2 border-dashed border-white/10 bg-white/5 rounded-3xl text-xs text-slate-400 italic">
                          No sticker designs matched "{searchQuery}" in this pack. Try searching for other mascot types!
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {filteredStickers.map((sticker, idx) => {
                            const colorIndex = idx % STICKER_COLORS.length;
                            const isCopied = copiedStickerIndex === idx;

                            return (
                              <div 
                                key={idx}
                                className="border border-white/5 rounded-[24px] p-4 bg-black/25 flex flex-col justify-between hover:border-pink-500/30 hover:bg-black/35 transition-all shadow-md group"
                              >
                                
                                {/* Kawaii Design Header Preview */}
                                <div className="flex items-start space-x-3.5">
                                  
                                  {/* Adorable Mock Die-Cut Sticker Shape wrapper */}
                                  <div className="relative shrink-0 flex items-center justify-center">
                                    <div className="absolute inset-0 bg-white rounded-full scale-[1.22] filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)] border border-slate-100"></div>
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center relative z-10 border ${STICKER_COLORS[colorIndex]}`}>
                                      {getMascotIcon(sticker.characterType, sticker.stickerText)}
                                    </div>
                                    {/* Text quote mockup overlay */}
                                    {sticker.stickerText && (
                                      <div className="absolute -bottom-1 z-20 bg-slate-900 text-white rounded-md text-[7px] font-black px-1.5 py-0.5 border border-white tracking-wide uppercase rotate-[4deg] shadow-lg max-w-[65px] truncate">
                                        {sticker.stickerText}
                                      </div>
                                    )}
                                  </div>

                                  <div className="space-y-1 flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <span className="font-extrabold text-xs text-slate-100 truncate flex items-center gap-1.5">
                                        {sticker.concept}
                                      </span>
                                      <span className="text-[9px] uppercase font-bold text-pink-300 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-md">
                                        {sticker.characterType}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 leading-normal font-medium">
                                      {sticker.description}
                                    </p>
                                  </div>

                                </div>

                                {/* Prompt copy drawer */}
                                <div className="mt-4 bg-black/30 border border-white/5 rounded-2xl p-3 space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold font-mono">PROMPT DETAILED DETECTORS</span>
                                    <span className="px-2 py-0.5 rounded-md bg-pink-500/15 text-[8px] text-pink-300 font-mono border border-pink-500/10">UNIQUE DETECTED</span>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <p className="text-[10px] text-slate-300 leading-relaxed max-h-16 overflow-y-auto font-mono scrollbar-none select-all flex-1 italic p-0.5">
                                      "{sticker.prompt}"
                                    </p>
                                    <button
                                      onClick={() => handleCopySinglePrompt(sticker.prompt, idx)}
                                      className={`p-1.5 rounded-lg border hover:bg-white/10 text-slate-400 hover:text-pink-400 transition-all shrink-0 cursor-pointer ${
                                        isCopied ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300" : "bg-white/5 border-white/10"
                                      }`}
                                      title="Copy image prompt"
                                    >
                                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                  </div>
                                </div>

                              </div>
                            );
                          })}
                        </div>
                      )}

                    </div>
                  )}

                  {/* Raw Text prompt mode render (Extremely strict output adhering to user requirements) */}
                  {viewMode === "raw" && (
                    <div className="space-y-4">
                      
                      <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl text-xs text-amber-300">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Strict Batch Proximity:</span> This raw output matches your strict generator guidelines precisely: <strong>ONLY flat prompts, no markdown block structures, no indices, one pristine prompt per line</strong>. Best suited for copy-pasting directly.
                          </div>
                        </div>
                      </div>

                      <div className="relative">
                        <textarea
                          readOnly
                          value={rawPromptsText}
                          className="w-full h-96 p-4 font-mono text-[11px] text-slate-300 bg-black/40 border border-white/10 rounded-2xl focus:ring-0 select-all leading-relaxed whitespace-pre"
                          placeholder="Generated prompts will appear here..."
                          id="raw-prompts-textarea"
                        ></textarea>

                        <button
                          onClick={handleCopyAllPrompts}
                          className="absolute right-4 bottom-4 bg-white/10 hover:bg-white/20 text-white border border-white/10 font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                        >
                          {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-pink-400" />}
                          {copiedAll ? "Copied!" : "Copy Raw Prompts"}
                        </button>
                      </div>

                    </div>
                  )}

                </div>

              </div>
            ) : (
              /* State when no pack generated yet (Empty state) */
              <div className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[40px] p-12 text-center space-y-6">
                
                {/* Visual Graphic representation */}
                <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 bg-pink-500/10 text-pink-500 rounded-full animate-ping opacity-25"></div>
                  <div className="absolute inset-2 bg-purple-500/10 text-purple-500 rounded-full animate-pulse"></div>
                  <div className="w-24 h-24 bg-[#0f172a]/80 text-white rounded-3xl border-2 border-white/10 shadow-2xl flex items-center justify-center relative rotate-[6deg] hover:rotate-0 transition-transform backdrop-blur-xs">
                    <Sparkles className="w-12 h-12 text-pink-400" />
                  </div>
                </div>

                <div className="space-y-2 max-w-sm mx-auto">
                  <h3 className="text-xl font-bold text-white">Infinite ADHD Sticker Prompts</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                    Select a curated design format or aesthetic style on the left, then trigger the creative prompter engine to invent perfectly distinct stickpack prompts.
                  </p>
                </div>

                <div className="pt-2 flex justify-center">
                  <button
                    onClick={() => {
                      setSelectedCategory("Kawaii ADHD");
                      handleGeneratePack();
                    }}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-550 hover:to-indigo-550 text-white text-xs font-bold px-6 py-3 rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-pink-300" />
                    <span>LAUNCH DEFAULTS (27 Kawaii ADHD Prompts)</span>
                  </button>
                </div>

              </div>
            )}

            {/* Stats Widget Row styled in frosted glass theme */}
            <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl py-6 px-4 flex items-center justify-around text-center shadow-xl relative z-10">
              <div>
                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">TOTAL PACKS CAPTURED</p>
                <p className="text-xl font-mono text-white font-black mt-1">{(dbStatus?.packsCount || 0) + 14}</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">REPETITION FREQUENCY</p>
                <p className="text-xl font-mono text-emerald-400 font-black mt-1">0.00%</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">AVOIDED CONCEPTS</p>
                <p className="text-xl font-mono text-pink-400 font-bold mt-1">{dbStatus?.conceptsCount || 42}</p>
              </div>
            </div>

            {/* Quick Prompters Guide / Best Practices cards */}
            <div className="bg-white/5 border border-white/10 backdrop-blur-xl text-slate-300 rounded-[32px] p-6 space-y-4 shadow-2xl relative z-10">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-400" />
                Prompt Parameters Handled
              </h4>
              <p className="text-xs text-slate-400 leading-normal">
                To guarantee you output premium Etsy-grade stickers, the prompter engine wraps every idea with optimal visual constraints:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1.5">
                {[
                  { title: "Kawaii Aesthetic Style", desc: "Embeds tags for cute shining eyes, expressive faces, lovely outline geometries, and soft, endearing body scales." },
                  { title: "Professional Die-Cut", desc: "Forces thick white border trims and transparent negative spaces to enable immediate clean cutting." },
                  { title: "Vibrant Vector Lineart", desc: "Enforces neat curves, clear contours, and vibrant flat tones tailored for silkscreen printing." },
                  { title: "Strict Dup Avoidance", desc: "Queries a deep server avoidance module to block previously designed concepts from ever recurring!" }
                ].map((item, idx) => (
                  <div key={idx} className="bg-black/20 border border-white/5 p-3 rounded-2xl space-y-1">
                    <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-pink-500 rounded-full"></span>
                      {item.title}
                    </span>
                    <p className="text-[10px] text-slate-400 leading-normal">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </section>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="relative z-10 px-8 py-6 mt-16 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 tracking-widest max-w-7xl mx-auto gap-4">
        <p>© 2026 STICKERSPARK AI ENGINE // CORE-SYSTEM-V2.5</p>
        <div className="flex space-x-6">
          <button onClick={() => setShowMemoryModal(true)} className="hover:text-pink-400 transition-colors uppercase cursor-pointer bg-transparent border-none">MEMORY SETTINGS</button>
          <span className="opacity-40">/</span>
          <button onClick={() => setShowGuideModal(true)} className="hover:text-pink-400 transition-colors uppercase cursor-pointer bg-transparent border-none">SYSTEM STATUS: OPTIMAL</button>
        </div>
      </footer>

      {/* MODAL 1: SYSTEM BLACKLIST MEMORY */}
      {showMemoryModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0f172a]/90 backdrop-blur-2xl rounded-3xl p-6 max-w-xl w-full border border-white/10 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white text-base">Server Avoidance Concept Memory</h3>
              </div>
              <button 
                onClick={() => setShowMemoryModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-white/5 cursor-pointer bg-transparent border-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                The database stores a persistent list of <strong>concepts and quotes</strong> generated in past sessions. These are fed back into Gemini's context as cold parameters to prevent repetitive designs.
              </p>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Currently Avoided Gags ({dbStatus?.conceptsCount || 0})</span>
                <div className="bg-black/30 rounded-2xl p-4 border border-white/5 max-h-40 overflow-y-auto flex flex-wrap gap-1.5 text-[10px] scrollbar-none">
                  {!dbStatus || dbStatus.conceptsCount === 0 ? (
                    <span className="text-slate-500 italic">No concepts logged in avoidance database yet. Keep generating!</span>
                  ) : (
                    dbStatus.concepts.map((concept, i) => (
                      <span key={i} className="bg-white/5 border border-white/5 px-2.5 py-0.5 rounded-full text-slate-300 font-medium">
                        {concept}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-rose-500/10 border border-rose-500/25 rounded-2xl p-3.5 text-[11px] text-rose-300 flex items-start space-x-2">
                <Trash2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white">Reset Memory: </span>
                  Clearing memory allows you to repeat past visual themes and ideas. Use this button below only if you want to reuse themes, quotes, or mascots.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleClearMemory}
                className="text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                id="clear-db-btn"
              >
                DANGER: Clear Avoidance Vault
              </button>
              <button
                onClick={() => setShowMemoryModal(false)}
                className="bg-white/10 text-white hover:bg-white/15 border border-white/5 font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Close View
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL 2: USER GUIDE */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0f172a]/90 backdrop-blur-2xl rounded-3xl p-6 max-w-xl w-full border border-white/10 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-bold text-white text-base">How to use ADHD Sticker Studio</h3>
              <button 
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-white/5 cursor-pointer bg-transparent border-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="space-y-2">
                <span className="font-bold text-white">1. Generating Sticker Packs</span>
                <p>
                  Choose from 8 curated categories tailored to the ADHD lifestyle, specify your target quantity (25–30 stickers), and hit generate. Gemini AI checks previously generated themes, ensuring every new pack contains entirely novel jokes, objects, animals, and situations.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-white">2. Using Visual Album vs. Raw Text</span>
                <p>
                  Use the <strong>Visual Album</strong> to browse, catalog, and read the funny situations or quotes behind each vector sticker design. Toggle to the <strong>Raw Prompts</strong> view to get clean, unnumbered, line-by-line prompt texts. This raw style matches the exact guidelines for direct bulk upload to your AI image generator of choice.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-white">3. Infinite Avoidance Blacklist</span>
                <p>
                  Each concept labeled in a sticker gets logged into the persistent database. These concepts are treated as banned phrases in subsequent generations. This produces near-infinite variety across runs!
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowGuideModal(false)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
              >
                Got It, Thanks!
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL 3: PORTABLE AGENT SKILL EXPORTER (MUSE / MANUS / CLAUDE / CUSTOM AGENTS) */}
      {showSkillModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0f172a]/95 backdrop-blur-2xl rounded-3xl p-6 max-w-3xl w-full border border-emerald-500/20 shadow-2xl space-y-5 max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="bg-emerald-500/20 text-emerald-400 p-2 rounded-xl border border-emerald-500/30">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Teach This Skill to Any AI Agent (Muse, Manus, Claude, GPT)</h3>
                  <p className="text-[11px] text-slate-400">
                    Give this <code className="text-emerald-300">SKILL.md</code>, System Prompt, or TypeScript/JSON bundle to Muse so it learns this exact ADHD Sticker Engine.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSkillModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-white/5 cursor-pointer bg-transparent border-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs & Options Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center bg-black/40 p-1 rounded-2xl border border-white/10">
                <button
                  onClick={() => setSkillTab("skillmd")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    skillTab === "skillmd"
                      ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>SKILL.md (Agent Skill)</span>
                </button>
                <button
                  onClick={() => setSkillTab("muse")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    skillTab === "muse"
                      ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Muse System Prompt</span>
                </button>
                <button
                  onClick={() => setSkillTab("code")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    skillTab === "code"
                      ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Portable Code &amp; API</span>
                </button>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                <input
                  type="checkbox"
                  checked={skillIncludeMemory}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSkillIncludeMemory(checked);
                    fetchSkillBundle(checked);
                  }}
                  className="accent-emerald-500 rounded cursor-pointer"
                />
                <span>Include Avoided Memory ({dbStatus?.conceptsCount || 0})</span>
              </label>
            </div>

            {/* Content Area */}
            <div className="relative flex-1 min-h-0 overflow-hidden flex flex-col">
              {skillLoading || !skillBundle ? (
                <div className="h-72 flex items-center justify-center text-xs text-slate-400 gap-2 bg-black/30 rounded-2xl border border-white/10">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Compiling Agent Skill package...</span>
                </div>
              ) : (
                <textarea
                  readOnly
                  value={
                    skillTab === "skillmd"
                      ? skillBundle.skillMarkdown
                      : skillTab === "muse"
                      ? skillBundle.systemPrompt
                      : skillBundle.portableCode
                  }
                  className="w-full h-80 p-4 font-mono text-[11px] text-slate-200 bg-black/40 border border-white/10 rounded-2xl focus:outline-none select-all leading-relaxed resize-none"
                />
              )}
            </div>

            {/* Action Buttons Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleDownloadSkill("md")}
                  className="bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>SKILL.md</span>
                </button>
                <button
                  onClick={() => handleDownloadSkill("txt")}
                  className="bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  <span>Muse Prompt (.txt)</span>
                </button>
                <button
                  onClick={() => handleDownloadSkill("json")}
                  className="bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-purple-400" />
                  <span>Skill JSON</span>
                </button>
                <button
                  onClick={() => handleDownloadSkill("ts")}
                  className="bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Code (.ts)</span>
                </button>
              </div>

              <button
                onClick={handleCopySkillContent}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg flex items-center gap-2"
              >
                {copiedSkill ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSkill ? "Copied to Clipboard!" : "Copy Active Tab"}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
