<!DOCTYPE html>
<html lang="en">
<head>

    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Phase 1: Community Engagement Platform - Project Scope & Proposal</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #f8fafc; /* Tailwind gray-50 */
        }
        .card {
            background-color: white;
            border-radius: 0.75rem;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
            transition: all 0.3s ease-in-out;
            border: 1px solid #e5e7eb; /* Tailwind gray-200 */
        }
        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.1);
        }
        .card-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1rem 1.5rem;
            border-bottom: 1px solid #e5e7eb;
        }
        .card-title {
            font-size: 1.125rem;
            font-weight: 600;
            color: #111827; /* Tailwind gray-900 */
        }
        .card-content {
            padding: 1.5rem;
        }
        .timeline-item {
            position: relative;
            padding-left: 2.5rem;
            padding-bottom: 2rem;
            border-left: 2px solid #e5e7eb;
        }
        .timeline-item:last-child {
            border-left: 2px solid transparent;
            padding-bottom: 0;
        }
        .timeline-marker {
            position: absolute;
            left: -0.6rem;
            top: 0.1rem;
            width: 1.1rem;
            height: 1.1rem;
            background-color: #3b82f6; /* Tailwind blue-500 */
            border-radius: 9999px;
            border: 2px solid white;
        }
        .icon {
            color: #3b82f6; /* Tailwind blue-500 */
        }
    </style>
</head>
<body>
    <div class="container mx-auto p-4 sm:p-6 lg:p-8">
        <!-- Header -->
        <div class="text-center mb-12">
            <h1 class="text-4xl font-bold text-gray-800">Community Engagement Platform - Phase 1 Proposal</h1>
            <p class="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">A detailed scope and investment overview for a bespoke content-driven platform with advanced administrative controls.</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Left Column / Main Content -->
            <div class="lg:col-span-2 space-y-8">
                
                <!-- Platform Features -->
                <div class="card">
                    <div class="card-header">
                        <i data-lucide="layout-grid" class="icon"></i>
                        <h2 class="card-title">Platform Features & Functionality</h2>
                    </div>
                    <div class="card-content divide-y divide-gray-200">
                        <div class="py-4">
                            <h3 class="font-semibold text-lg text-gray-800 mb-2">Administrator Control Panel</h3>
                            <p class="text-gray-600">A powerful backend giving you complete control over all aspects of the platform.</p>
                            <ul class="mt-4 space-y-3 text-gray-600">
                                <li class="flex items-start"><i data-lucide="clapperboard" class="w-5 h-5 mr-3 mt-1 text-sky-500 flex-shrink-0"></i><span><strong>Rich Media Content Management:</strong> Upload, preview, and publish both <strong class="text-gray-700">video and image</strong> content as engaging posts for your community.</span></li>
                                <li class="flex items-start"><i data-lucide="megaphone" class="w-5 h-5 mr-3 mt-1 text-sky-500 flex-shrink-0"></i><span><strong>Advanced Advertisement System:</strong> Manage and schedule video/image ads, including a swapping top banner and in-stream ads for videos.</span></li>
                                <li class="flex items-start"><i data-lucide="user-plus" class="w-5 h-5 mr-3 mt-1 text-sky-500 flex-shrink-0"></i><span><strong>Direct User Creation:</strong> Manually add new users by creating an ID and password for them directly from the admin panel, ideal for controlled onboarding.</span></li>
                                <li class="flex items-start"><i data-lucide="bar-chart-3" class="w-5 h-5 mr-3 mt-1 text-sky-500 flex-shrink-0"></i><span><strong>Analytics & Reporting:</strong> Monitor content performance, user engagement metrics (reactions, shares), and ad campaign effectiveness.</span></li>
                            </ul>
                        </div>
                        <div class="pt-4">
                            <h3 class="font-semibold text-lg text-gray-800 mb-2">Engaging User & Community Portal</h3>
                             <p class="text-gray-600">A modern, media-rich frontend designed to captivate and engage your user base.</p>
                             <ul class="mt-4 space-y-3 text-gray-600">
                                <li class="flex items-start"><i data-lucide="film" class="w-5 h-5 mr-3 mt-1 text-teal-500 flex-shrink-0"></i><span><strong>Dynamic Video & Image Feed:</strong> Users can browse a central feed of content, with support for standard posts and a vertical, reels-style video viewing experience.</span></li>
                                <li class="flex items-start"><i data-lucide="layout-list" class="w-5 h-5 mr-3 mt-1 text-teal-500 flex-shrink-0"></i><span><strong>Seamless Ad Integration:</strong> An auto-swapping ad banner at the top of the feed and in-stream video ads that play during content.</span></li>
                                <li class="flex items-start"><i data-lucide="thumbs-up" class="w-5 h-5 mr-3 mt-1 text-teal-500 flex-shrink-0"></i><span><strong>Social Interaction Tools:</strong> Users can react to and share posts, fostering a sense of community and increasing content reach.</span></li>
                                <li class="flex items-start"><i data-lucide="user-cog" class="w-5 h-5 mr-3 mt-1 text-teal-500 flex-shrink-0"></i><span><strong>Personalized Profile Management:</strong> A dedicated space for users to manage their personal information, view their activity, and set preferences.</span></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Implementation Timeline -->
                <div class="card">
                    <div class="card-header">
                        <i data-lucide="calendar-days" class="icon"></i>
                        <h2 class="card-title">12-Week Project Roadmap</h2>
                    </div>
                    <div class="card-content">
                        <div class="timeline-item">
                            <div class="timeline-marker"></div>
                            <h4 class="font-semibold text-gray-700">Weeks 1-2: Discovery & Planning</h4>
                            <p class="text-gray-500 text-sm">Detailed requirement analysis, system architecture design, and database schema for media content.</p>
                        </div>
                        <div class="timeline-item">
                            <div class="timeline-marker"></div>
                            <h4 class="font-semibold text-gray-700">Weeks 3-4: Foundation & Backend Setup</h4>
                            <p class="text-gray-500 text-sm">Core API development for video/image uploads, authentication, and user management.</p>
                        </div>
                        <div class="timeline-item">
                            <div class="timeline-marker"></div>
                            <h4 class="font-semibold text-gray-700">Weeks 5-6: Admin Panel Development</h4>
                            <p class="text-gray-500 text-sm">Building interfaces for content publishing, ad scheduling, and direct user creation.</p>
                        </div>
                        <div class="timeline-item">
                            <div class="timeline-marker"></div>
                            <h4 class="font-semibold text-gray-700">Weeks 7-8: User Portal Frontend Development</h4>
                            <p class="text-gray-500 text-sm">Creating the media feed, reels viewer, profile pages, and integrating ad displays.</p>
                        </div>
                         <div class="timeline-item">
                            <div class="timeline-marker"></div>
                            <h4 class="font-semibold text-gray-700">Weeks 9-10: Feature Integration & Refinement</h4>
                            <p class="text-gray-500 text-sm">Connecting all APIs with the frontend, implementing reaction/share logic, and analytics.</p>
                        </div>
                        <div class="timeline-item">
                            <div class="timeline-marker"></div>
                            <h4 class="font-semibold text-gray-700">Weeks 11-12: Testing, Deployment & Handover</h4>
                            <p class="text-gray-500 text-sm">User acceptance testing, bug fixing, performance optimization, and final production deployment.</p>
                        </div>
                    </div>
                </div>

                <!-- System Workflow -->
                <div class="card">
                    <div class="card-header">
                         <i data-lucide="network" class="icon"></i>
                         <h2 class="card-title">System Workflow & Architecture</h2>
                    </div>
                    <div class="card-content">
                        <p class="text-gray-600 mb-4">This diagram illustrates the flow of data and user interactions, from initial access to database operations, for both Admin and User roles.</p>
                        <img src="https://storage.googleapis.com/gemini-prod/v1/d4b/f51/image_3ff04a.png" alt="System Workflow Diagram" class="rounded-lg border border-gray-200">
                    </div>
                </div>
            </div>

            <!-- Right Column / Financials -->
            <div class="space-y-8">
                
                <!-- Detailed Investment Breakdown -->
                <div class="card">
                    <div class="card-header">
                        <i data-lucide="piggy-bank" class="icon"></i>
                        <h2 class="card-title">Detailed Investment Breakdown</h2>
                    </div>
                    <div class="card-content">
                        <h3 class="font-semibold text-gray-700 mb-3">Phase 1 Development Cost</h3>
                        <p class="text-sm text-gray-500 mb-3">Realistic pricing for the Coimbatore market, reflecting the complexity of video handling and custom features.</p>
                        <div class="space-y-2 text-gray-600">
                            <div class="flex justify-between"><span>Frontend Development (UI/UX)</span> <span class="font-medium">₹30,000 - ₹35,000</span></div>
                            <div class="flex justify-between"><span>Backend & API Development</span> <span class="font-medium">₹35,000 - ₹40,000</span></div>
                            <div class="flex justify-between"><span>Database & Storage Architecture</span> <span class="font-medium">₹10,000 - ₹12,000</span></div>
                            <div class="flex justify-between"><span>Testing, Deployment & CDN Setup</span> <span class="font-medium">₹5,000 - ₹8,000</span></div>
                        </div>
                        <div class="border-t mt-4 pt-4">
                            <div class="flex justify-between font-bold text-gray-800">
                                <span>Total Phase 1 Development</span>
                                <span class="text-blue-600 text-lg">₹98,000</span>
                            </div>
                             <p class="text-right text-sm text-gray-500">(Includes buffer for revisions)</p>
                        </div>
                        
                        <h3 class="font-semibold text-gray-700 mb-3 mt-6">Monthly Operating Costs</h3>
                         <div class="space-y-2 text-gray-600">
                            <div class="font-medium text-gray-700">Hosting & Infrastructure:</div>
                            <div class="flex justify-between pl-4"><span>Web Hosting (VPS)</span> <span class="font-medium">₹1,500 - ₹2,500</span></div>
                            <div class="flex justify-between pl-4"><span>Database Hosting</span> <span class="font-medium">₹800 - ₹1,200</span></div>
                            <div class="flex justify-between pl-4"><span>Video/Image Storage & CDN</span> <span class="font-medium">₹1,200 - ₹2,000</span></div>
                            <div class="flex justify-between pl-4"><span>Domain & SSL</span> <span class="font-medium">₹200 - ₹300</span></div>
                            <div class="font-medium text-gray-700 mt-2">Maintenance & Support:</div>
                            <div class="flex justify-between pl-4"><span>Technical Maintenance</span> <span class="font-medium">₹1,500 - ₹2,000</span></div>
                            <div class="flex justify-between pl-4"><span>Support (Admin & User)</span> <span class="font-medium">₹1,800 - ₹2,700</span></div>
                        </div>
                        <div class="border-t mt-4 pt-4">
                            <div class="flex justify-between font-bold text-gray-800">
                                <span>Total Monthly Cost</span>
                                <span>₹7,000 - ₹10,700</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                 <!-- Payment Structure -->
                <div class="card">
                    <div class="card-header">
                        <i data-lucide="landmark" class="icon"></i>
                        <h2 class="card-title">Payment Structure</h2>
                    </div>
                    <div class="card-content">
                        <h3 class="font-semibold text-gray-700 mb-3">Development Milestones</h3>
                        <ul class="space-y-3 text-gray-600">
                            <li class="flex justify-between items-center"><span><strong class="text-blue-600">25%</strong> Advance (Initiation)</span> <span class="font-medium">₹24,500</span></li>
                            <li class="flex justify-between items-center"><span><strong class="text-blue-600">50%</strong> Milestone (Week 6)</span> <span class="font-medium">₹49,000</span></li>
                            <li class="flex justify-between items-center"><span><strong class="text-blue-600">25%</strong> Final (Deployment)</span> <span class="font-medium">₹24,500</span></li>
                        </ul>
                        <div class="border-t pt-4 mt-4">
                            <h3 class="font-semibold text-gray-700 mb-2">Monthly Billing</h3>
                            <p class="text-gray-600 text-sm">Maintenance and support are billed monthly, while hosting costs are billed quarterly for convenience.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <script>
        lucide.createIcons();
    </script>
</body>
</html>

