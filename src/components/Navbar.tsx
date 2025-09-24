"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { signInW3id, signOutFormAction } from "@/app/(auth)/actions";
import { Session } from "next-auth";

const NavLink = ({
  href,
  children,
  icon: Icon,
  onClick,
}: {
  href?: string;
  children: React.ReactNode;
  icon?: React.ElementType;
  onClick?: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    }
  };

  return (
    <motion.div
      className="relative"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <a className="text-gray-300 hover:text-white transition-colors px-4 py-2 text-sm cursor-pointer flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        {children}
      </a>
      {isHovered && (
        <motion.div
          className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-400 to-purple-400"
          layoutId="underline"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </motion.div>
  );
};

const GradientButton = ({
  children,
  primary = false,
  onClick,
  className,
  type = "button",
}: {
  children: React.ReactNode;
  primary?: boolean;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
}) => (
  <button
    type={type}
    onClick={onClick}
    className={cn(
      "relative group px-4 py-2 rounded-lg transition-all duration-200 ease-in-out",
      "hover:scale-105 active:scale-95",
      primary
        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
        : "bg-gray-900 text-gray-300 hover:text-white",
      "hover:shadow-lg hover:shadow-blue-500/25",
      "before:absolute before:inset-0 before:rounded-lg",
      "before:bg-gradient-to-r before:from-blue-600/50 before:to-purple-600/50",
      "before:opacity-0 hover:before:opacity-100 before:transition-opacity",
      "overflow-hidden",
      className
    )}
  >
    <span className="relative z-10 text-sm font-medium">{children}</span>
  </button>
);
export const Navbar = ({
  session,
  // setShowArchitecture = null,
}: {
  session: Session | null;
  showArchitecture?: boolean;
  setShowArchitecture?: ((show: boolean) => void) | null;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const user = session?.user;

  // Function to handle architecture navigation/toggle
  // const handleArchitectureClick = () => {
  //   // If we're on the architecture page (setShowArchitecture is provided)
  //   if (setShowArchitecture) {
  //     // Toggle the architecture diagram
  //     setShowArchitecture(true);
  //   } else {
  //     // Navigate to the architecture page
  //     router.push("/architecture");
  //   }
  //   // Close mobile menu if open
  //   setIsOpen(false);
  // };

  const navigation: {
    name: string;
    href?: string;
    onClick?: () => void;
    icon?: React.ElementType;
  }[] = [
    // Navigation items removed - Dashboard moved to sidebar for admin users only
    // {
    //   name: "Features",
    //   href: "/features",
    // },
    // {
    //   name: "Documentation",
    //   href: "/docs",
    // },
    // {
    //   name: "Architecture",
    //   onClick: handleArchitectureClick,
    // },
    // {
    //   name: "About",
    //   href: "/about",
    // },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-b border-gray-800/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <motion.div
            className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            onClick={() => router.push("/")}
          >
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-200" />
              <motion.div
                className="relative p-2 bg-black rounded-full"
                animate={{
                  rotate: [0, 5, 0, -5, 0],
                  scale: [1, 1.1, 1, 1.1, 1],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  repeatType: "loop",
                }}
              >
                <Sparkles className="w-6 h-6 text-blue-400" />
              </motion.div>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              ISC-CodeConnect
            </span>
          </motion.div>

          {/* Desktop Navigation - moved to top left */}
          <div className="hidden md:flex items-center space-x-4 ml-8">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                onClick={item.onClick}
                href={item.href}
                icon={item.icon}
              >
                {item.name}
              </NavLink>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <form action={signOutFormAction}>
                <GradientButton type="submit" primary>
                  Sign out
                </GradientButton>
              </form>
            ) : (
              <form action={signInW3id}>
                <GradientButton type="submit" primary>
                  Sign in with IBM Github
                </GradientButton>
              </form>
            )}
          </div>

          {/* Mobile menu button */}
          <motion.button
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white focus:outline-none"
            onClick={() => setIsOpen(!isOpen)}
            whileTap={{ scale: 0.95 }}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </motion.button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <motion.div
        className={cn(
          "md:hidden bg-black/90 backdrop-blur-lg border-b border-gray-800/50",
          isOpen ? "block" : "hidden"
        )}
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: isOpen ? 1 : 0, height: isOpen ? "auto" : 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="px-4 py-3 space-y-1">
          {navigation.map((item) => (
            <a
              key={item.name}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors flex items-center gap-2 cursor-pointer"
              onClick={
                item.onClick
                  ? item.onClick
                  : () => {
                      if (item.href) {
                        router.push(item.href);
                      }
                      setIsOpen(false);
                    }
              }
            >
              {item.icon && <item.icon className="w-4 h-4" />}
              {item.name}
            </a>
          ))}
          <div className="pt-4 space-y-3">
            {user ? (
              <form action={signOutFormAction}>
                <GradientButton className="w-full" type="submit" primary>
                  Sign out
                </GradientButton>
              </form>
            ) : (
              <form action={signInW3id}>
                <GradientButton className="w-full" type="submit" primary>
                  Sign in with IBM w3Id
                </GradientButton>
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </nav>
  );
};

export default Navbar;
