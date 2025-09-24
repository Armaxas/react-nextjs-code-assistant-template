"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image"; // Import Next.js Image component
import {
  ChevronLeft,
  ChevronRight,
  LinkedinIcon,
  GithubIcon,
  TwitterIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Define interface for team member links
interface TeamMemberLink {
  icon: React.ReactNode;
  url: string;
}

// Define interface for team member
interface TeamMember {
  id: number;
  name: string;
  role: string;
  photo: string;
  bio: string;
  links: TeamMemberLink[];
  expertise: string[];
}

// Define props for TeamMemberCard component
interface TeamMemberCardProps {
  member: TeamMember;
  index: number;
}

const TeamSection: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [hoveredMember, setHoveredMember] = useState<number | null>(null);
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(true);
  const [direction, setDirection] = useState<number>(0);

  const team: TeamMember[] = [
    {
      id: 1,
      name: "Sarah Wilson",
      role: "Lead AI Engineer",
      photo: "/api/placeholder/200/200",
      bio: "Expert in IBM WatsonX and LLM architectures with 8+ years of experience in AI development.",
      links: [
        { icon: <LinkedinIcon className="w-5 h-5" />, url: "#" },
        { icon: <GithubIcon className="w-5 h-5" />, url: "#" },
        { icon: <TwitterIcon className="w-5 h-5" />, url: "#" },
      ],
      expertise: ["IBM WatsonX", "LLM Architecture", "AI Development"],
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Salesforce Architect",
      photo: "/api/placeholder/200/200",
      bio: "Certified Salesforce Technical Architect with expertise in enterprise integrations.",
      links: [
        { icon: <LinkedinIcon className="w-5 h-5" />, url: "#" },
        { icon: <GithubIcon className="w-5 h-5" />, url: "#" },
        { icon: <TwitterIcon className="w-5 h-5" />, url: "#" },
      ],
      expertise: [
        "Salesforce Development",
        "System Architecture",
        "Enterprise Integration",
      ],
    },
    {
      id: 3,
      name: "Emily Rodriguez",
      role: "Product Lead",
      photo: "/api/placeholder/200/200",
      bio: "Product strategist focused on AI-powered developer tools and enterprise solutions.",
      links: [
        { icon: <LinkedinIcon className="w-5 h-5" />, url: "#" },
        { icon: <GithubIcon className="w-5 h-5" />, url: "#" },
        { icon: <TwitterIcon className="w-5 h-5" />, url: "#" },
      ],
      expertise: ["Product Strategy", "UX Design", "Agile Leadership"],
    },
  ];

  const itemsPerPage = 3;
  const totalPages = Math.ceil(team.length / itemsPerPage);

  // Use useCallback to memoize the nextSlide function
  const nextSlide = useCallback(() => {
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % totalPages);
  }, [totalPages]);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setActiveIndex((prev) => (prev - 1 + totalPages) % totalPages);
  }, [totalPages]);

  useEffect(() => {
    if (!isAutoPlay) return;

    const timer = setInterval(() => {
      setDirection(1);
      nextSlide();
    }, 5000);

    return () => clearInterval(timer);
  }, [activeIndex, isAutoPlay, nextSlide]); // Added nextSlide to dependency array

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ member, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="relative group w-full"
      onHoverStart={() => {
        setHoveredMember(member.id);
        setIsAutoPlay(false);
      }}
      onHoverEnd={() => {
        setHoveredMember(null);
        setIsAutoPlay(true);
      }}
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="relative overflow-hidden rounded-xl"
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          initial={false}
          animate={{
            scale: hoveredMember === member.id ? 1.05 : 1,
            opacity: hoveredMember === member.id ? 1 : 0,
          }}
        />

        <div className="relative bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-gray-800 hover:border-blue-500/50 transition-colors duration-300">
          <div className="flex flex-col items-center">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="relative w-32 h-32 rounded-full mb-4 overflow-hidden border-2 border-blue-500/50"
            >
              {/* Replace img with Next.js Image component */}
              <div className="relative w-full h-full">
                <Image
                  src={member.photo}
                  alt={member.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 128px"
                />
              </div>
            </motion.div>

            <motion.h3
              className="text-xl font-bold text-white mb-2"
              whileHover={{ scale: 1.05 }}
            >
              {member.name}
            </motion.h3>
            <motion.p
              className="text-blue-400 mb-4"
              whileHover={{ scale: 1.05 }}
            >
              {member.role}
            </motion.p>

            <AnimatePresence>
              {hoveredMember === member.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="text-center"
                >
                  <p className="text-gray-300 mb-4">{member.bio}</p>
                  <motion.div
                    className="flex flex-wrap justify-center gap-2 mb-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {member.expertise.map((skill: string, idx: number) => (
                      <motion.span
                        key={`${member.id}-${idx}`}
                        className="px-3 py-1 text-sm bg-blue-500/20 rounded-full text-blue-300 hover:bg-blue-500/30 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * idx }}
                      >
                        {skill}
                      </motion.span>
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              className="flex space-x-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {member.links.map((link: TeamMemberLink, linkIndex: number) => (
                <motion.a
                  key={`${member.id}-link-${linkIndex}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {link.icon}
                </motion.a>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="mb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <motion.h2
          className="text-4xl font-bold text-white mb-4"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          Meet Our Team
        </motion.h2>
        <motion.p
          className="text-gray-400 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Our diverse team of experts brings together deep knowledge in AI,
          Salesforce development, and enterprise solutions to deliver
          exceptional results.
        </motion.p>
      </motion.div>

      <div className="relative max-w-6xl mx-auto px-4">
        <div className="absolute left-0 right-0 flex justify-between items-center top-1/2 -translate-y-1/2 z-10">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              onClick={prevSlide}
              variant="outline"
              className="border-gray-700 hover:bg-gray-800 transition-all duration-300 -translate-x-1/2 hover:border-blue-500"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              onClick={nextSlide}
              variant="outline"
              className="border-gray-700 hover:bg-gray-800 transition-all duration-300 translate-x-1/2 hover:border-blue-500"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>

        <div className="overflow-hidden">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={activeIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = swipePower(offset.x, velocity.x);

                if (swipe < -swipeConfidenceThreshold) {
                  nextSlide();
                } else if (swipe > swipeConfidenceThreshold) {
                  prevSlide();
                }
              }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4"
            >
              {team
                .slice(
                  activeIndex * itemsPerPage,
                  (activeIndex + 1) * itemsPerPage
                )
                .map((member, index) => (
                  <TeamMemberCard
                    key={member.id}
                    member={member}
                    index={index}
                  />
                ))}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-center mt-8 space-x-2">
          {Array.from({ length: totalPages }).map((_, index) => (
            <motion.button
              key={`indicator-${index}`}
              onClick={() => setActiveIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                activeIndex === index ? "bg-blue-500 w-6" : "bg-gray-600 w-2"
              }`}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamSection;
