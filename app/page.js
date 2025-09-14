"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart,
  BrainCircuit,
  Database,
  LogIn,
  Mail,
  Users,
} from "lucide-react";

// === Landing Page ===
export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-800">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <AISection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}

// === Header ===
const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-lg border-b border-slate-200"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-blue-700">Xeno</span>
            <span className="text-black">CRM</span>
          </h1>
          <Button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Sign in with Google
          </Button>
        </div>
      </div>
    </header>
  );
};

// === Animation Variants ===
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};
const slideInLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
};
const slideInRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
};

// === Hero ===
const HeroSection = () => {
  const router = useRouter();
  return (
    <section className="bg-gradient-to-b from-blue-50 to-white pt-20 pb-32 text-center">
      <motion.div
        className="max-w-4xl mx-auto px-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        <h2 className="text-5xl md:text-7xl font-extrabold tracking-tighter">
          <span className="text-blue-700">Build Smarter</span>{" "}
          <span className="text-black">Customer Relationships</span>
        </h2>
        <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-slate-600">
          A lightweight CRM to manage customers, track orders, and launch AI-assisted campaigns — all in one place.
        </p>
        <Button
          size="lg"
          className="mt-10 h-12 px-10 text-lg bg-blue-600 hover:bg-blue-700 shadow-lg"
          onClick={() => router.push("/get-started")}
        >
          <LogIn className="mr-3 h-6 w-6" />
          Get Started
        </Button>
      </motion.div>
    </section>
  );
};

// === Features ===
const features = [
  {
    icon: Database,
    title: "Customer & Order Management",
    description: "Easily add, view, and manage customers and their orders through secure APIs.",
  },
  {
    icon: Users,
    title: "Segmentation",
    description: "Filter and group customers dynamically with flexible rule-based queries.",
  },
  {
    icon: Mail,
    title: "Campaigns",
    description: "Send targeted campaigns and track delivery status for every customer.",
  },
  {
    icon: BarChart,
    title: "Insights",
    description: "Get clean dashboards and AI-generated summaries of your campaigns.",
  },
];

const FeaturesSection = () => (
  <section className="py-24 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        className="text-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        <h3 className="text-base font-semibold text-blue-600 uppercase tracking-wider">
          Core Features
        </h3>
        <p className="mt-2 text-4xl font-extrabold text-slate-900">
          Built for Modern Marketing
        </p>
      </motion.div>
      <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            variants={i % 2 === 0 ? slideInLeft : slideInRight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <Card className="h-full hover:shadow-lg transition">
              <CardHeader>
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white mb-4">
                  <f.icon className="h-6 w-6" />
                </div>
                <CardTitle>{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">{f.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

// === AI Section ===
const AISection = () => (
  <section className="py-24 bg-slate-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-16 items-center">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={slideInLeft}>
        <h3 className="text-base font-semibold text-blue-600 uppercase tracking-wider">
          AI-Powered
        </h3>
        <p className="mt-2 text-4xl font-extrabold text-slate-900">
          Smarter Campaigns
        </p>
        <p className="mt-4 text-xl text-slate-500">
          Use AI to generate compelling message suggestions and performance summaries instantly.
        </p>
        <ul className="mt-8 space-y-4 text-slate-600">
          <li className="flex items-start">
            <BrainCircuit className="h-6 w-6 text-blue-500 mr-3 mt-1" />
            <span>
              <strong>Message Suggestions:</strong> Provide a campaign goal, get
              2-3 ready-to-send messages.
            </span>
          </li>
          <li className="flex items-start">
            <BarChart className="h-6 w-6 text-blue-500 mr-3 mt-1" />
            <span>
              <strong>Performance Summaries:</strong> Turn raw stats into
              human-readable insights.
            </span>
          </li>
        </ul>
      </motion.div>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={slideInRight}
        className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl text-white shadow-xl"
      >
        <p className="text-green-400 font-mono">&gt; Campaign Summary</p>
        <p className="mt-2">
          "Your campaign reached 1,284 users. 1,140 messages were delivered. High-value customers had a 95% delivery rate."
        </p>
      </motion.div>
    </div>
  </section>
);

// === CTA ===
const CtaSection = () => (
  <section className="bg-blue-600">
    <motion.div
      className="max-w-4xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeInUp}
    >
      <h2 className="text-4xl font-extrabold text-white">
        Ready to Launch Smarter Campaigns?
      </h2>
      <p className="mt-4 text-lg text-blue-100">
        Sign in and create your first campaign in minutes.
      </p>
      <Button
        size="lg"
        className="mt-8 h-14 px-10 text-lg bg-white text-blue-600 hover:bg-blue-50 shadow-lg"
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      >
        Get Started for Free
        <ArrowRight className="ml-3 h-5 w-5" />
      </Button>
    </motion.div>
  </section>
);

// === Footer ===
const Footer = () => (
  <footer className="bg-slate-900 text-slate-400">
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-sm font-semibold text-slate-300 uppercase">Solutions</h3>
          <ul className="mt-4 space-y-2">
            <li>Customers</li>
            <li>Orders</li>
            <li>Campaigns</li>
            <li>Insights</li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-300 uppercase">Support</h3>
          <ul className="mt-4 space-y-2">
            <li>Documentation</li>
            <li>API Status</li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-300 uppercase">Company</h3>
          <ul className="mt-4 space-y-2">
            <li>About</li>
            <li>Careers</li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-300 uppercase">Legal</h3>
          <ul className="mt-4 space-y-2">
            <li>Privacy</li>
            <li>Terms</li>
          </ul>
        </div>
      </div>
      <div className="mt-12 border-t border-slate-800 pt-8 text-center">
        <p>&copy; 2025 XenoCRM</p>
      </div>
    </div>
  </footer>
);
