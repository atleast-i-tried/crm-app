"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  ArrowRight,
  BarChart,
  BrainCircuit,
  Component,
  Database,
  LogIn,
  Mail,
  MousePointerClick,
  Users,
} from "lucide-react";

// Main Landing Page Component
export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-800">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <AISection />
        <HowItWorksSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}

// Sub-components for better organization

const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Sign in immediately when header button clicked
  const handleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

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
          {/* Brand — Xeno in blue, CRM in black */}
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-blue-700">Xeno</span>
            <span className="text-black">CRM</span>
          </h1>
          <nav className="flex items-center space-x-2">
            {/* single Sign in with Google button */}
            <Button
              onClick={handleSignIn}
              className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transform hover:scale-101 transition"
            >
              Sign in with Google
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};

const AnimatedSection = ({ children, className }) => {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  const variants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.2,
      },
    },
  };

  return (
    <motion.section
      ref={ref}
      animate={controls}
      initial="hidden"
      variants={variants}
      className={className}
    >
      {children}
    </motion.section>
  );
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const HeroSection = () => {
  const router = useRouter();

  const goToGetStarted = () => {
    router.push("/get-started");
  };

  return (
    <section className="relative bg-gradient-to-b from-blue-50 to-white pt-20 pb-32 text-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.2 } },
          }}
        >
          {/* Hero headline — "Build Intelligent" in blue, rest in black */}
          <motion.h2
            variants={itemVariants}
            className="text-5xl md:text-7xl font-extrabold tracking-tighter"
          >
            <span className="text-blue-700">Build Intelligent</span>{" "}
            <span className="text-black">Customer Relationships</span>
          </motion.h2>

          <motion.p
            variants={itemVariants}
            className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-slate-600"
          >
            The mini-CRM that unifies your data, automates segmentation, and
            delivers hyper-personalized campaigns to delight your customers.
          </motion.p>
          <motion.div variants={itemVariants} className="mt-10">
            {/* Main hero button routes to /get-started */}
            <Button
              size="lg"
              className="h-12 px-10 text-lg bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 cursor-pointer transform hover:scale-101 transition"
              onClick={goToGetStarted}
            >
              <LogIn className="mr-3 h-6 w-6" />
              Get Started
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const features = [
  {
    icon: Database,
    title: "Data Ingestion APIs",
    description:
      "Secure and scalable REST APIs to easily ingest customer and order data from any source.",
  },
  {
    icon: Users,
    title: "Audience Segmentation",
    description:
      "Create dynamic audience segments using a flexible rule builder with AND/OR logic.",
  },
  {
    icon: Mail,
    title: "Campaign Delivery",
    description:
      "Send personalized messages and track delivery status with detailed communication logs.",
  },
  {
    icon: BarChart,
    title: "Intelligent Insights",
    description:
      "Leverage AI to get human-readable summaries of campaign performance and audience behavior.",
  },
];

const FeaturesSection = () => {
  return (
    <AnimatedSection className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={itemVariants} className="text-center">
          <h3 className="text-base font-semibold text-blue-600 tracking-wider uppercase">
            Core Features
          </h3>
          <p className="mt-2 text-4xl font-extrabold text-slate-900 tracking-tight">
            Everything You Need to Grow
          </p>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-500">
            A powerful suite of tools designed for modern marketing teams.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <motion.div key={feature.title} variants={itemVariants}>
              <Card className="h-full hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white mb-4">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
};

const AISection = () => {
  return (
    <AnimatedSection className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div variants={itemVariants}>
            <h3 className="text-base font-semibold text-blue-600 tracking-wider uppercase">
              AI-Powered
            </h3>
            <p className="mt-2 text-4xl font-extrabold text-slate-900 tracking-tight">
              Work Smarter, Not Harder
            </p>
            <p className="mt-4 text-xl text-slate-500">
              Our integrated AI assistant supercharges your workflow. From
              converting natural language into complex audience rules to
              suggesting the perfect message copy, XenoCRM helps you achieve
              more in less time.
            </p>
            <ul className="mt-8 space-y-4 text-slate-600">
              <li className="flex items-start">
                <BrainCircuit className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0 mt-1" />
                <span>
                  <strong className="text-slate-800">
                    Natural Language to Rules:
                  </strong>{" "}
                  Type "users who spent over $500" and let AI build the segment.
                </span>
              </li>
              <li className="flex items-start">
                <Component className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0 mt-1" />
                <span>
                  <strong className="text-slate-800">AI Message Suggestions:</strong>{" "}
                  Generate compelling, on-brand message variants for any campaign objective.
                </span>
              </li>
            </ul>
          </motion.div>
          <motion.div
            variants={itemVariants}
            className="p-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-2xl shadow-blue-500/40"
          >
            <div className="text-white font-mono text-sm p-6 bg-slate-900/50 rounded-lg backdrop-blur-sm border border-white/20">
              <p className="text-green-400">&gt; CREATE SEGMENT</p>
              <p className="mt-2 text-slate-300">
                "Customers who bought 'sneakers' in the last 30 days and have not visited in the last week"
              </p>
              <p className="mt-4 text-green-400">&gt; GENERATING RULES...</p>
              <div className="mt-4 p-4 border border-slate-600 rounded bg-slate-800">
                <p>(<span className="text-cyan-400">last_purchase_category</span> == <span className="text-yellow-400">"sneakers"</span>)</p>
                <p>&nbsp;&nbsp;AND (<span className="text-cyan-400">last_purchase_date</span> &gt; <span className="text-yellow-400">30d_ago</span>)</p>
                <p>&nbsp;&nbsp;AND (<span className="text-cyan-400">last_visit_date</span> &lt; <span className="text-yellow-400">7d_ago</span>)</p>
              </div>
              <p className="mt-4 text-green-400 animate-pulse">&gt; _</p>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatedSection>
  );
};

const HowItWorksSection = () => {
  const steps = [
    {
      number: "01",
      title: "Connect Your Data",
      description:
        "Use our simple APIs to ingest all your customer and order information into one central place.",
    },
    {
      number: "02",
      title: "Build Your Audience",
      description:
        "Visually construct powerful segments with our dynamic rule builder or simply ask the AI.",
    },
    {
      number: "03",
      title: "Launch & Analyze",
      description:
        "Deploy personalized campaigns, monitor delivery, and gain insights to optimize for the future.",
    },
  ];

  return (
    <AnimatedSection className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={itemVariants} className="text-center">
          <h3 className="text-base font-semibold text-blue-600 tracking-wider uppercase">
            How It Works
          </h3>
          <p className="mt-2 text-4xl font-extrabold text-slate-900 tracking-tight">
            Get Started in 3 Simple Steps
          </p>
        </motion.div>

        <div className="mt-16 grid md:grid-cols-3 gap-12 relative">
          {/* Dashed line connector for desktop */}
          <div
            className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-slate-200"
            style={{ transform: "translateY(-50%)" }}
          ></div>

          {steps.map((step, index) => (
            <motion.div key={index} variants={itemVariants} className="relative z-10 text-center">
              <div className="flex items-center justify-center w-20 h-20 mx-auto bg-white border-2 border-slate-200 rounded-full shadow-md">
                <span className="text-2xl font-bold text-blue-600">{step.number}</span>
              </div>
              <h4 className="mt-6 text-2xl font-bold text-slate-900">{step.title}</h4>
              <p className="mt-2 text-slate-600">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
};

const CtaSection = () => {
  return (
    <AnimatedSection className="bg-blue-600">
      <div className="max-w-4xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
        <motion.h2 variants={itemVariants} className="text-4xl font-extrabold text-white sm:text-5xl">
          Ready to Delight Your Customers?
        </motion.h2>
        <motion.p variants={itemVariants} className="mt-4 text-lg text-blue-100">
          Start building better relationships today. Create your first campaign in minutes.
        </motion.p>
        <motion.div variants={itemVariants} className="mt-8">
          <Button
            size="lg"
            className="h-14 px-10 text-lg bg-white text-blue-600 hover:bg-blue-50 shadow-lg cursor-pointer transform hover:scale-105 transition"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          >
            Get Started for Free
            <ArrowRight className="ml-3 h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </AnimatedSection>
  );
};

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-slate-300 tracking-wider uppercase">Solutions</h3>
            <ul className="mt-4 space-y-2">
              <li><a href="#" className="hover:text-white cursor-pointer">Segmentation</a></li>
              <li><a href="#" className="hover:text-white cursor-pointer">Campaigns</a></li>
              <li><a href="#" className="hover:text-white cursor-pointer">Insights</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-300 tracking-wider uppercase">Support</h3>
            <ul className="mt-4 space-y-2">
              <li><a href="#" className="hover:text-white cursor-pointer">Documentation</a></li>
              <li><a href="#" className="hover:text-white cursor-pointer">API Status</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-300 tracking-wider uppercase">Company</h3>
            <ul className="mt-4 space-y-2">
              <li><a href="#" className="hover:text-white cursor-pointer">About</a></li>
              <li><a href="#" className="hover:text-white cursor-pointer">Careers</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-300 tracking-wider uppercase">Legal</h3>
            <ul className="mt-4 space-y-2">
              <li><a href="#" className="hover:text-white cursor-pointer">Privacy</a></li>
              <li><a href="#" className="hover:text-white cursor-pointer">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-slate-800 pt-8 text-center">
          <p>&copy; 2025 XenoCRM. SDE Internship Assignment.</p>
        </div>
      </div>
    </footer>
  );
};
