/* ========================================
   HUNDREDXMIND ULTRA RESPONSIVE DESIGN SYSTEM
   Version: 3.0.0
   ======================================== */

@import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Primary Colors */
  --primary-50: #eef2ff;
  --primary-100: #e0e7ff;
  --primary-200: #c7d2fe;
  --primary-300: #a5b4fc;
  --primary-400: #818cf8;
  --primary-500: #6366f1;
  --primary-600: #4f46e5;
  --primary-700: #4338ca;
  --primary-800: #3730a3;
  --primary-900: #312e81;
  
  /* Neutral Colors */
  --white: #ffffff;
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
  
  /* Semantic Colors */
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
  
  /* Typography */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'SF Mono', 'Fira Code', monospace;
  
  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-20: 5rem;
  --space-24: 6rem;
  
  /* Border Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;
  --radius-3xl: 2rem;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
  --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
  
  /* Animations */
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  
  /* Layout */
  --sidebar-width: 280px;
  --sidebar-width-collapsed: 80px;
  --header-height: 64px;
  --container-max: 1280px;
  --container-padding: 1.5rem;
}

/* Reset & Base */
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

body {
  font-family: var(--font-sans);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: var(--gray-800);
  min-height: 100vh;
  overflow-x: hidden;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--gray-100);
  border-radius: var(--radius-full);
}

::-webkit-scrollbar-thumb {
  background: var(--primary-400);
  border-radius: var(--radius-full);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--primary-600);
}

/* Glassmorphism Effects */
.glass {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.glass-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: var(--shadow-lg);
}

/* Typography */
h1, .h1 {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.2;
}

h2, .h2 {
  font-size: 2rem;
  font-weight: 600;
  line-height: 1.3;
}

h3, .h3 {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.4;
}

h4, .h4 {
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.4;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  font-weight: 500;
  border-radius: var(--radius-lg);
  transition: all 0.2s var(--ease-in-out);
  cursor: pointer;
  border: none;
  font-family: inherit;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-600), var(--primary-700));
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-secondary {
  background: var(--gray-100);
  color: var(--gray-700);
}

.btn-secondary:hover {
  background: var(--gray-200);
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--gray-300);
  color: var(--gray-700);
}

.btn-outline:hover {
  border-color: var(--primary-500);
  color: var(--primary-500);
}

/* Inputs */
.input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  font-family: inherit;
  font-size: 0.875rem;
  transition: all 0.2s var(--ease-in-out);
  background: var(--white);
}

.input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

/* Cards */
.card {
  background: var(--white);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s var(--ease-in-out);
  overflow: hidden;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

/* Sidebar Styles */
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: var(--sidebar-width);
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  z-index: 50;
  transition: transform 0.3s var(--ease-in-out);
  overflow-y: auto;
}

.sidebar-header {
  padding: var(--space-6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-nav {
  padding: var(--space-4);
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-1);
  border-radius: var(--radius-lg);
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.2s var(--ease-in-out);
  cursor: pointer;
}

.sidebar-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  transform: translateX(4px);
}

.sidebar-item.active {
  background: linear-gradient(135deg, var(--primary-600), var(--primary-700));
  color: white;
  box-shadow: var(--shadow-md);
}

/* Main Content */
.main-content {
  margin-left: var(--sidebar-width);
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

/* Chat Messages */
.chat-messages {
  max-width: 900px;
  margin: 0 auto;
  padding: var(--space-6);
}

.message {
  display: flex;
  margin-bottom: var(--space-4);
  animation: fadeInUp 0.3s var(--ease-out);
}

.message-user {
  justify-content: flex-end;
}

.message-ai {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 75%;
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-2xl);
  font-size: 0.9375rem;
  line-height: 1.5;
  position: relative;
}

.message-bubble.user {
  background: linear-gradient(135deg, var(--primary-600), var(--primary-700));
  color: white;
  border-bottom-right-radius: var(--radius-sm);
}

.message-bubble.ai {
  background: var(--white);
  color: var(--gray-700);
  border-bottom-left-radius: var(--radius-sm);
  box-shadow: var(--shadow-sm);
}

/* Avatar */
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
  flex-shrink: 0;
}

.avatar-user {
  background: linear-gradient(135deg, var(--primary-600), var(--primary-700));
  color: white;
  margin-left: var(--space-3);
}

.avatar-ai {
  background: var(--white);
  color: var(--primary-600);
  margin-right: var(--space-3);
  box-shadow: var(--shadow-sm);
}

/* Input Area */
.input-container {
  background: var(--white);
  border-radius: var(--radius-2xl);
  padding: var(--space-2) var(--space-4);
  margin: var(--space-4);
  box-shadow: var(--shadow-lg);
  transition: all 0.2s var(--ease-in-out);
}

.input-container:focus-within {
  box-shadow: var(--shadow-xl);
  transform: translateY(-2px);
}

/* Welcome Screen */
.welcome-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - var(--header-height));
  text-align: center;
  padding: var(--space-6);
}

.welcome-icon {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, var(--primary-600), var(--primary-700));
  border-radius: var(--radius-3xl);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-8);
  box-shadow: var(--shadow-2xl);
  animation: float 3s ease-in-out infinite;
}

/* Agent Grid */
.agent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--space-4);
  max-width: 800px;
  margin-top: var(--space-8);
}

.agent-card {
  background: var(--white);
  padding: var(--space-4);
  border-radius: var(--radius-xl);
  text-align: center;
  cursor: pointer;
  transition: all 0.3s var(--ease-in-out);
  box-shadow: var(--shadow-sm);
}

.agent-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

/* Suggestions Grid */
.suggestions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-4);
  max-width: 800px;
  margin-top: var(--space-8);
}

.suggestion-card {
  background: var(--white);
  padding: var(--space-5);
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition: all 0.3s var(--ease-in-out);
  box-shadow: var(--shadow-sm);
  text-align: left;
  border-left: 3px solid transparent;
}

.suggestion-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-left-color: var(--primary-500);
}

/* Typing Indicator */
.typing-indicator {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  background: var(--white);
  border-radius: var(--radius-2xl);
  width: fit-content;
  box-shadow: var(--shadow-sm);
}

.typing-dot {
  width: 8px;
  height: 8px;
  background: var(--gray-400);
  border-radius: 50%;
  animation: typingBounce 1.2s ease-in-out infinite;
}

.typing-dot:nth-child(1) { animation-delay: 0s; }
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

/* Mobile Responsive Breakpoints */
@media (max-width: 640px) {
  :root {
    --container-padding: 1rem;
    --sidebar-width: 280px;
  }
  
  .sidebar {
    transform: translateX(-100%);
  }
  
  .sidebar.open {
    transform: translateX(0);
  }
  
  .main-content {
    margin-left: 0;
  }
  
  .message-bubble {
    max-width: 90%;
  }
  
  .agent-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-3);
  }
  
  .suggestions-grid {
    grid-template-columns: 1fr;
  }
  
  h1, .h1 {
    font-size: 1.75rem;
  }
  
  h2, .h2 {
    font-size: 1.5rem;
  }
  
  .chat-messages {
    padding: var(--space-4);
  }
  
  .btn, .input, .sidebar-item {
    min-height: 44px;
  }
}

/* Tablet Breakpoints */
@media (min-width: 641px) and (max-width: 1024px) {
  .sidebar {
    width: 260px;
  }
  
  .main-content {
    margin-left: 260px;
  }
  
  .message-bubble {
    max-width: 80%;
  }
  
  .agent-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Laptop Breakpoints */
@media (min-width: 1025px) and (max-width: 1366px) {
  .chat-messages {
    max-width: 800px;
  }
  
  .agent-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Desktop Breakpoints */
@media (min-width: 1367px) and (max-width: 1920px) {
  .chat-messages {
    max-width: 900px;
  }
  
  .agent-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* 4K Breakpoints */
@media (min-width: 1921px) {
  :root {
    --container-max: 1600px;
  }
  
  .chat-messages {
    max-width: 1200px;
  }
  
  body {
    font-size: 18px;
  }
  
  .message-bubble {
    font-size: 1rem;
  }
}

/* Landscape Mode */
@media (orientation: landscape) and (max-height: 600px) {
  .welcome-screen {
    min-height: auto;
    padding: var(--space-8);
  }
  
  .sidebar {
    overflow-y: auto;
  }
  
  .message-bubble {
    max-width: 70%;
  }
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  .message-bubble.user {
    background: var(--primary-900);
  }
  
  .sidebar-item.active {
    background: var(--primary-800);
  }
  
  .btn-primary {
    background: var(--primary-800);
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .welcome-icon {
    animation: none;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  body {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  }
  
  .card {
    background: var(--gray-800);
  }
  
  .suggestion-card,
  .agent-card {
    background: var(--gray-800);
    color: var(--gray-200);
  }
  
  .input {
    background: var(--gray-800);
    border-color: var(--gray-700);
    color: var(--gray-200);
  }
  
  .message-bubble.ai {
    background: var(--gray-800);
    color: var(--gray-200);
  }
}

/* Print Styles */
@media print {
  .sidebar,
  .input-container,
  button {
    display: none;
  }
  
  .main-content {
    margin-left: 0;
  }
  
  .message-bubble {
    box-shadow: none;
    border: 1px solid var(--gray-300);
  }
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes typingBounce {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Utility Classes */
.animate-fadeIn {
  animation: fadeIn 0.3s var(--ease-out);
}

.animate-fadeInUp {
  animation: fadeInUp 0.4s var(--ease-out);
}

.animate-slideInLeft {
  animation: slideInLeft 0.3s var(--ease-out);
}

.animate-slideInRight {
  animation: slideInRight 0.3s var(--ease-out);
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

.animate-pulse {
  animation: pulse 2s ease-in-out infinite;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Gradient Text */
.gradient-text {
  background: linear-gradient(135deg, var(--primary-600), var(--primary-700));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* Focus Visible Accessibility */
*:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}