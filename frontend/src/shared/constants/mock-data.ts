import { Product, Program, UpdatePost, SubscriptionTier, Certificate, AppNotification, Tournament, MatchResult, ForumPost, VideoCourse, ConsultancyRequest, Referral, LeaderboardEntry, AnalyticsData, Workshop, VexTeam, VexRobot, VexAward, VexNotebookEntry, VexMatchRecord } from '@/src/shared/types';

import progImg1 from '@/assets/0M6A6519.00_36_58_18.Still042.jpg';
import progImg2 from '@/assets/0M6A6519.00_57_00_00.Still045.jpg';
import progImg3 from '@/assets/0M6A6519.01_05_10_03.Still044.jpg';

import prodImg4 from '@/assets/shop/products/esp32_iot_pack.png';
import prodImg5 from '@/assets/shop/products/lidar_sensor.png';
import prodImg6 from '@/assets/shop/products/hexapod_crawler.png';

import shopPencils from '@/assets/shop/accesories/photo_2026-06-15_20-24-22.jpg';
import shopBottle1 from '@/assets/shop/accesories/photo_2026-06-15_20-24-56.jpg';
import shopBottle2 from '@/assets/shop/accesories/photo_2026-06-15_20-25-02.jpg';
import shopBackpack1 from '@/assets/shop/accesories/photo_2026-06-15_20-25-08.jpg';
import shopBackpack2 from '@/assets/shop/accesories/photo_2026-06-15_20-25-15.jpg';
import shopLaptop from '@/assets/shop/accesories/photo_2026-06-15_20-25-22.jpg';
import shopGeometrySet from '@/assets/shop/accesories/photo_2026-06-15_20-25-27.jpg';

export const ROBOTICS_PRODUCTS: Product[] = [
  // ── Accessories ──
  {
    id: 'prod-esp32-iot',
    name: 'EthioRobotics IoT STEM Explorer Pack',
    description: 'An advanced microcontroller sensor pack built around the dual-core ESP32 chip (Wi-Fi + Bluetooth). Allows kids to measure environments and stream telemetry directly to mobile dashboards.',
    price: 5400,
    image: prodImg4,
    category: 'Microcontrollers',
    rating: 4.5,
    reviewsCount: 45,
    features: [
      'ESP32 Development Node with integrated antenna',
      'Includes DHT11 (temp & humidity), LDR, and OLED screen',
      'Build remote web servers and weather tracking systems',
      'Directly connects to Adafruit IO or Firebase dashboards'
    ]
  },
  {
    id: 'prod-sonar',
    name: 'High-Precision Laser LiDAR Sweep Sensor',
    description: 'Advanced scanning distance module supporting a 360-degree radius obstacle map. Perfect for building custom autonomous robotic navigation systems (SLAM).',
    price: 11400,
    image: prodImg5,
    category: 'Sensors',
    rating: 4.7,
    reviewsCount: 31,
    features: [
      '12-meter scanning radius with 8000 samples/sec frequency',
      '360-degree opto-magnetic physical rotation',
      'USB/UART serial communication interface',
      'Fully compatible with ROS (Robot Operating System) structures'
    ]
  },
  {
    id: 'prod-crawler',
    name: 'Hexapod Mechanical Crawler Platform',
    description: 'A terrifyingly elegant 18-servo biomimetic robot insect frame design. Challenges students to write complex gait interpolation and balance calculation algorithms.',
    price: 25200,
    image: prodImg6,
    category: 'Accessories',
    rating: 4.7,
    reviewsCount: 19,
    features: [
      'Lightweight fiberglass plate structure',
      'Supports 18 digital metal-micro servos',
      'Dynamic posture calculation demos in Python',
      'Recommended for advanced high-school and university cohorts'
    ]
  },

  // ── Apparel & Bags ──
  {
    id: 'prod-backpack-classic',
    name: 'EthioRobotics Classic Campus Backpack',
    description: 'A sleek all-black minimalist backpack designed for robotics students on the go. Features a padded laptop sleeve, water-resistant nylon shell, and front zip organizer pocket.',
    price: 4600,
    image: shopBackpack1,
    category: 'Apparel & Bags',
    rating: 4.6,
    reviewsCount: 87,
    features: [
      'Water-resistant 600D nylon exterior',
      'Padded 15.6" laptop compartment',
      'Dual side pockets for bottles & accessories',
      'Adjustable ergonomic shoulder straps'
    ]
  },
  {
    id: 'prod-backpack-pro',
    name: 'EthioRobotics Pro Multi-Pocket Backpack',
    description: 'The ultimate tech-ready backpack with multiple compartments, reflective safety strips, and premium buckle closures. Perfect for carrying tools, laptops, and project hardware.',
    price: 6500,
    image: shopBackpack2,
    category: 'Apparel & Bags',
    rating: 4.8,
    reviewsCount: 63,
    features: [
      'Multi-compartment organizer design',
      'Reflective safety strips for visibility',
      'Premium buckle & keychain accessories included',
      'Fits up to 17" laptops with tablet sleeve'
    ]
  },
  {
    id: 'prod-bottle-sport',
    name: 'Insulated Stainless Steel Sports Bottle',
    description: 'Double-wall vacuum insulated water bottle that keeps drinks cold for 24 hours or hot for 12 hours. Leak-proof flip-top lid with ergonomic carry handle.',
    price: 2200,
    image: shopBottle1,
    category: 'Accessories',
    rating: 4.5,
    reviewsCount: 142,
    features: [
      'Double-wall vacuum insulation',
      '24-hour cold / 12-hour hot retention',
      'BPA-free stainless steel 304 grade',
      'Leak-proof flip-top sports cap'
    ]
  },
  {
    id: 'prod-bottle-matte',
    name: 'Matte Black Hydration Bottle — 750ml',
    description: 'Lightweight, durable matte-finish aluminum alloy water bottle with a clip-on carry cap. Ideal for workshops, labs, and outdoor STEM field trips.',
    price: 1800,
    image: shopBottle2,
    category: 'Accessories',
    rating: 4.3,
    reviewsCount: 98,
    features: [
      'Lightweight aluminum alloy body',
      'Clip-on carry cap for easy attachment',
      '750ml capacity — perfect for all-day labs',
      'Matte-finish powder coating, scratch-resistant'
    ]
  },

  // ── Stationery ──
  {
    id: 'prod-pencils',
    name: 'Premium Black Wood Pencil Set (5-Pack)',
    description: 'Professional-grade Ardium black wood HB pencils with ultra-smooth graphite cores. Perfect for engineering notebook sketches, technical diagrams, and design brainstorming.',
    price: 1000,
    image: shopPencils,
    category: 'Stationery',
    rating: 4.4,
    reviewsCount: 215,
    features: [
      'Smooth HB graphite core for consistent lines',
      'Eco-friendly sustainable black wood barrel',
      'Pre-sharpened and ready to use',
      '5 pencils per premium gift box'
    ]
  },
  {
    id: 'prod-geometry-set',
    name: 'Engineering Geometry & Compass Kit',
    description: 'Complete precision drafting set with compass, protractor, ruler, mechanical pencil, and eraser. Essential for engineering design notebooks, CAD prep, and technical drawings.',
    price: 1500,
    image: shopGeometrySet,
    category: 'Stationery',
    rating: 4.6,
    reviewsCount: 176,
    features: [
      'Precision metal compass with locking joint',
      '0.7mm mechanical pencil included',
      '180° protractor + 15cm ruler set',
      'Compact protective carry case'
    ]
  },
  {
    id: 'prod-laptop',
    name: 'Student Coding Laptop — Refurbished',
    description: 'Budget-friendly refurbished laptop pre-loaded with VEXcode, Arduino IDE, Python, and all essential robotics development tools. Great for students who need a dedicated programming machine.',
    price: 34500,
    image: shopLaptop,
    category: 'Accessories',
    rating: 4.2,
    reviewsCount: 34,
    features: [
      'Pre-installed: VEXcode, Arduino IDE, VS Code, Python 3',
      '13.3" display, 8GB RAM, 256GB SSD',
      '90-day warranty on all refurbished units',
      'Lightweight and portable for lab sessions'
    ]
  },

  // ── Robotics Kits ──
  {
    id: 'prod-vex-v5-starter',
    name: 'VEX V5 Competition Starter Kit',
    description: 'Official VEX V5 robotics competition kit with Cortex smart motor controller, 4 smart motors, bump switch, and V5 inertial sensor. Ready for competitive engineering.',
    price: 28500,
    image: prodImg6,
    category: 'Robotics Kits',
    rating: 4.9,
    reviewsCount: 56,
    features: [
      'V5 Robot Brain with Cortex processor',
      '4x V5 Smart Motors with integrated encoders',
      'V5 Inertial Sensor (gyro + accelerometer)',
      'Bump switch, limit switch, and wiring kit included',
      'Fully competition-legal for VEX tournaments'
    ]
  },
  {
    id: 'prod-arduino-bundle',
    name: 'Arduino Advanced Robotics Bundle',
    description: 'The ultimate Arduino robotics learning bundle with an Arduino Mega, servo shield, HC-SR04 sonar, 4 DC motors, wheels, and acrylic chassis frame.',
    price: 8900,
    image: prodImg4,
    category: 'Robotics Kits',
    rating: 4.8,
    reviewsCount: 112,
    features: [
      'Arduino Mega 2560 + motor driver shield',
      '4x high-torque DC motors + 65mm wheels',
      'HC-SR04 ultrasonic sensor + servo pan kit',
      'Laser-cut acrylic robot chassis frame',
      'Bluetooth HC-05 module for wireless control'
    ]
  },
  {
    id: 'prod-raspberry-ai',
    name: 'Raspberry Pi AI Vision Kit',
    description: 'Build intelligent robots with a Raspberry Pi 4, Pi Camera v3, and Google Coral Edge TPU. Real-time object detection, face recognition, and lane tracking.',
    price: 19500,
    image: shopLaptop,
    category: 'Robotics Kits',
    rating: 4.7,
    reviewsCount: 38,
    features: [
      'Raspberry Pi 4 (4GB) with pre-installed SD card',
      'Pi Camera v3 with auto-focus (12MP)',
      'Google Coral USB Edge TPU accelerator',
      'Robot chassis with 2x encoder motors',
      'Python AI demos: object detection + face recognition'
    ]
  },
  {
    id: 'prod-vex-iq-super',
    name: 'VEX IQ Super Kit — Advanced',
    description: 'The premium VEX IQ building set with 850+ snap-together parts, four smart sensors, and a programmable brain for advanced robotics learning.',
    price: 15800,
    image: shopBackpack1,
    category: 'Robotics Kits',
    rating: 4.6,
    reviewsCount: 74,
    features: [
      '850+ structural and motion components',
      'Robot brain with 12 auto-sensor ports',
      'Bumper, distance, color, and gyro sensors',
      'Smart motor quad pack with encoders',
      'Curriculum guide for 24 project-based lessons'
    ]
  },
  {
    id: 'prod-servo-pack',
    name: 'Pro Servo Motor Pack (6-Pack)',
    description: 'Premium 20kg digital servo motors with metal gears for building robotic arms, hexapod walkers, and heavy-lift mechanisms.',
    price: 7500,
    image: prodImg6,
    category: 'Sensors',
    rating: 4.5,
    reviewsCount: 93,
    features: [
      '6x 20kg high-torque digital servos',
      'Metal gears with dual ball bearings',
      'Operating voltage 4.8-7.4V (2S LiPo ready)',
      'Includes servo horns, screws, and extension cables'
    ]
  },
  {
    id: 'prod-robot-arm-kit',
    name: 'DIY Robotic Arm Kit (6-DOF)',
    description: 'A fully articulated 6-degree-of-freedom robotic arm kit made from aluminum alloy. Perfect for learning inverse kinematics and pick-and-place automation.',
    price: 18700,
    image: shopGeometrySet,
    category: 'Robotics Kits',
    rating: 4.4,
    reviewsCount: 27,
    features: [
      'Aluminum alloy arm frame with 6 DOF',
      '6x MG996R servo motors included',
      'Arduino Uno + servo driver board',
      'Inverse kinematics Python library',
      'Payload capacity up to 400g at full extension'
    ]
  },
  {
    id: 'prod-battery-lipo',
    name: '2S LiPo Battery Pack (7.4V 2200mAh)',
    description: 'High-discharge 2-cell lithium polymer battery designed for robotics competitions. XT60 connector with balance charging lead.',
    price: 3200,
    image: shopBottle1,
    category: 'Accessories',
    rating: 4.6,
    reviewsCount: 201,
    features: [
      '7.4V 2200mAh with 30C continuous discharge',
      'XT60 connector + JST balance lead',
      'Includes protective silicone jacket',
      'Compatible with VEX, Arduino, and custom bots'
    ]
  },
  {
    id: 'prod-motor-driver',
    name: 'Dual H-Bridge Motor Driver (L298N)',
    description: 'Robust dual-channel motor driver module capable of driving 2 DC motors or 1 stepper motor. Overcurrent protection and heat sink included.',
    price: 1200,
    image: shopPencils,
    category: 'Sensors',
    rating: 4.3,
    reviewsCount: 178,
    features: [
      'Drives 2x DC motors (up to 2A per channel)',
      'Operates 5V-35V logic and motor voltage',
      'On-board 5V regulator output',
      'Screw terminals for easy wiring'
    ]
  },
];

export const ROBOTICS_PROGRAMS: Program[] = [
  {
    id: 'prog-vex-iq',
    title: 'Junior Innovators: VEX IQ Robotics League',
    category: 'VEX IQ',
    description: 'Designed for elementary and middle schoolers to learn mechanical assembly, gear ratios, and computational logic using intuitive snap-together components.',
    detailedDescription: 'This comprehensive pathway introduces young learners to the thrilling world of competitive educational robotics. Students assemble modular, high-durability snap systems, configure smart brains with color sensors, and learn Blockly-based logical command constructs. The program culminates in a group-wide mock VEX IQ challenge where teams compete to gather tokens and cross obstacles.',
    level: 'Beginner',
    ageGroup: 'Ages 8 - 14',
    duration: '12 Weeks (Weekly 4-Hour Labs)',
    syllabus: [
      'Introduction to Mechanical Principles & Assembly',
      'Gears, Pulley Systems, and Mechanical Advantage',
      'Smart Sensors (Gyro, Sound, Ultrasonic, Optical)',
      'Block-Based Logic: Loops, Conditionals, & Events',
      'Group Collaboration: Designing a Ball Collector Bot',
      'VEX IQ National Competition Mock Trial'
    ],
    skillsGained: [
      'Basic Algorithmic Problem Solving',
      'Mechanical Assembly Competency',
      'Collaborative Team Dynamics',
      'Introductory Physics & Gravity Concepts'
    ],
    image: progImg1
  },
  {
    id: 'prog-vex-v5',
    title: 'VEX V5 Competitive Engineering Academy',
    category: 'VEX V5',
    description: 'A structural, dual-semester preparation program focusing on professional metallic builds, high-speed custom sensor feedback, and modern Python/C++ logic integrations.',
    detailedDescription: 'The elite pathway for secondary school students aiming for standard engineering careers or national robotic contests. Students utilize structural aluminum beams, chain drives, high-torque industrial style Smart Motors, and complex dual-wheel flywheel launchers. Learn to code smart autonomous paths utilizing odometry, gyroscopes, and vision camera tracking.',
    level: 'Advanced',
    ageGroup: 'Ages 14 - 19',
    duration: '24 Weeks (Dual Semester Labs)',
    syllabus: [
      'Structural Steel & Aluminum Fastening Protocols',
      'Pneumatic Actuators & High-Pressure Systems',
      'PID Control Loops for Precise Motor Position Tracking',
      'Odometry: Tracking Real-Time X/Y Coordinates on Field',
      'Sensory-Driven Autonomous Mapping & Navigation',
      'Engineering Design Notebooking & Presentation Skills'
    ],
    skillsGained: [
      'Text-Based Coding (Python & C++)',
      'Advanced Kinematics & PID Tunings',
      'CAD Drafting & Structural Assembly Design',
      'Critical Technical Writing & Notebooking'
    ],
    image: progImg2
  },
  {
    id: 'prog-enjoy-ai',
    title: 'Enjoy AI: Autonomous Driving & Vision Systems',
    category: 'Enjoy AI',
    description: 'Specialized course centering around autonomous vehicles, machine learning, and onboard camera OpenCV lane detection.',
    detailedDescription: 'Step into the futuristic workspace of automated systems. In this immersive course, students build an automated micro-vehicle equipped with a Raspberry Pi and a camera module. They write image filter pipelines to detect road boundaries, read traffic sign shapes, and use computer vision techniques to keep vehicles safely centered on test courses.',
    level: 'Intermediate',
    ageGroup: 'Ages 12 - 18',
    duration: '16 Weeks (Regular Practical Workshops)',
    syllabus: [
      'Embedded Linux & Raspberry Pi Essentials',
      'Camera Frame Acquisition & Image Slices',
      'Color Masking & OpenCV Feature Selection',
      'PWM Steering & Auto-braking Algorithms',
      'Simulated Obstacle Avoidance under Multi-Sensor grids',
      'Autonomous Course Timing Race'
    ],
    skillsGained: [
      'Python Programming Fluency',
      'Computer Vision Basics (Edge & Color)',
      'Signal Processing & Feedback',
      'Embedded OS Administration'
    ],
    image: progImg3
  }
];

export const UPDATE_POSTS: UpdatePost[] = [
  {
    id: 'upd-1',
    title: 'New VEX Competition: Register by June 30th',
    date: 'June 12, 2026',
    category: 'Competition',
    excerpt: 'The national Ethio Robotics VEX League qualifiers have been formally announced. Teams must lock in their chassis designs and register rosters.',
    content: `We are thrilled to officially announce the registration timeline for the upcoming Ethio Robotics VEX Qualifier (VEX IQ & VEX v5 classes). This year over 200 high schools and academy teams from Addis Ababa, Hawassa, and Dire Dawa will compete for the ultimate championship cup.

Key Deadlines:
• Team Roster Submission: June 30th, 2026
• Engineering Notebook Pretest: July 15th, 2026
• Live Division Matches: August 5th - 8th, 2026

How to participate:
1. Ensure your team captain has updated your robot spec log in your user dashboard.
2. Sign up on the registration page to secure your arena workspace pit.
3. Keep your autonomous algorithms calibrated — autonomous scoring is worth double points this season!`,
    iconType: 'calendar'
  },
  {
    id: 'upd-2',
    title: 'Summer Camp Registration Open for 2024',
    date: 'June 10, 2026',
    category: 'Summer Camp',
    excerpt: 'Enrollment has officially launched for our action-packed, 4-week robotics summer experience. Limited slots available for active student rosters.',
    content: `Our widely acclaimed Ethio Robotics Summer Tech Camps are back! Running throughout the entire month of July 2026, students will participate in intensive daily workshops spanning mechanical engineering design, micro-controller programming, and intelligent computer vision.

Program Tracks:
• Rookie Explorer (Ages 8-12): Fun mechanical logic and interactive tablet coding.
• Advanced Builder (Ages 13-18): Metal robot assemblies, Python API controls, and Bluetooth remote apps.

Campers receive a custom Ethio Robotics explorer badge pack, full workbook guides, and keep their introductory motor-powered crawler creations at camp completion!`,
    iconType: 'camping'
  },
  {
    id: 'upd-3',
    title: 'Safety Seminar Date Announced',
    date: 'June 05, 2026',
    category: 'Safety & Seminar',
    excerpt: 'All registered workshop students and lab assistants must attend the upcoming safety session covering lithium batteries and motor handling.',
    content: `Safety is our highest engineering directive block at Ethio Robotics. In preparation for high-power competitive builders starting their dual-semester sessions, we will host our required Laboratory Safety Seminar.

Agenda Topics:
• Lithium Polymer (LiPo) battery charge limits and safe container storage.
• Preventing high-torque motor gear pinch points.
• Basic soldering iron safety, exhaust ventilation, and emergency fire drills.
• Proper safety glasses rules during custom metal drilling and grinding.

Attendance:
Participation is strictly mandatory for all competitive team members, coaches, and workshop helpers. Zoom link and in-person registration options are available in your Active Dashboard panel.`,
    iconType: 'security'
  }
];

// ── Subscription Tiers ──
export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'free', name: 'Free Explorer', price: 0, period: 'forever',
    description: 'Get started with basic access to explore our platform.',
    features: ['Browse all program catalogs', '1 simulator session per day', 'Community forum access', 'Public event calendar'],
  },
  {
    id: 'explorer', name: 'Explorer', price: 1500, period: '/month',
    description: 'Perfect for students beginning their STEM journey.',
    features: ['Unlimited simulator access', 'Full learning resource library', 'Basic progress tracking', 'Monthly challenge participation', 'Email support'],
    badge: 'Popular'
  },
  {
    id: 'pro', name: 'Pro Student', price: 3000, period: '/month',
    description: 'For serious competitors and advanced learners.',
    features: ['Everything in Explorer', 'AI Tutor assistant (unlimited)', 'Digital certificates on completion', 'Competition registration included', 'Video course library access', 'Priority support', 'Referral rewards program'],
    highlighted: true, badge: 'Best Value'
  },
  {
    id: 'school', name: 'School License', price: 15000, period: '/month',
    description: 'Enterprise solution for schools and institutions.',
    features: ['Up to 30 student seats', 'Teacher dashboard & analytics', 'Bulk enrollment management', 'Custom branding options', 'Lab consultancy discount (20%)', 'Dedicated account manager', 'API access for LMS integration', 'Quarterly business reviews'],
    maxStudents: 30, badge: 'Enterprise'
  },
];

// ── Certificates ──
export const MOCK_CERTIFICATES: Certificate[] = [
  {
    id: 'cert-001', studentName: 'Abebe Kebede', programTitle: 'VEX V5 Competitive Engineering Academy',
    category: 'VEX V5', issueDate: 'May 28, 2026', type: 'completion',
    verificationCode: 'ER-2026-VEX5-00142', hoursCompleted: 96,
  },
  {
    id: 'cert-002', studentName: 'Abebe Kebede', programTitle: 'National VEX Qualifier 2026',
    category: 'Competition', issueDate: 'Jun 08, 2026', type: 'competition',
    verificationCode: 'ER-2026-COMP-00089', rank: '2nd Place', eventName: 'VEX National Qualifier — Addis Ababa',
  },
  {
    id: 'cert-003', studentName: 'Abebe Kebede', programTitle: '100 Hours of Robotics',
    category: 'Milestone', issueDate: 'Jun 15, 2026', type: 'milestone',
    verificationCode: 'ER-2026-MILE-00215', hoursCompleted: 100,
  },
  // ── Award Certificates (Event Command Center) ──
  {
    id: 'cert-004', studentName: 'Tekle Mariam', programTitle: 'Bole Prep Friendly Scrimmage',
    category: 'Award', issueDate: 'Jun 18, 2026', type: 'award',
    verificationCode: 'ER-2026-AWRD-00001', eventName: 'Bole Prep Friendly Scrimmage',
    awardCategory: 'Excellence Award', teamName: 'Robo Lions', schoolName: 'Bole Prep',
    eventId: 'evt-1',
  },
  {
    id: 'cert-005', studentName: 'Selam Tesfaye', programTitle: 'Bole Prep Friendly Scrimmage',
    category: 'Award', issueDate: 'Jun 18, 2026', type: 'award',
    verificationCode: 'ER-2026-AWRD-00002', eventName: 'Bole Prep Friendly Scrimmage',
    awardCategory: 'Tournament Champions', teamName: 'Tech Titans', schoolName: 'Sandalwood Academy',
    eventId: 'evt-1',
  },
  {
    id: 'cert-006', studentName: 'Henok Desta', programTitle: 'Addis Ababa VEX Qualifier',
    category: 'Award', issueDate: 'Jun 20, 2026', type: 'award',
    verificationCode: 'ER-2026-AWRD-00003', eventName: 'Addis Ababa VEX Qualifier',
    awardCategory: 'Design Award', teamName: 'Iron Eagles', schoolName: 'AASTU',
    eventId: 'evt-2',
  },
  {
    id: 'cert-007', studentName: 'Bethelehem Alemu', programTitle: 'Addis Ababa VEX Qualifier',
    category: 'Award', issueDate: 'Jun 20, 2026', type: 'award',
    verificationCode: 'ER-2026-AWRD-00004', eventName: 'Addis Ababa VEX Qualifier',
    awardCategory: 'Judges Award', teamName: 'Circuit Breakers', schoolName: 'Bahr Dar Prep',
    eventId: 'evt-2',
  },
  {
    id: 'cert-008', studentName: 'Meron Wondimu', programTitle: 'Bole Prep Friendly Scrimmage',
    category: 'Award', issueDate: 'Jun 18, 2026', type: 'award',
    verificationCode: 'ER-2026-AWRD-00005', eventName: 'Bole Prep Friendly Scrimmage',
    awardCategory: 'Sportsmanship Award', teamName: 'Mech Warriors', schoolName: 'Gondar U',
    eventId: 'evt-1',
  },
  {
    id: 'cert-009', studentName: 'Yonas Tadesse', programTitle: 'Ethiopian VEX National Championship',
    category: 'Award', issueDate: 'Jun 25, 2026', type: 'award',
    verificationCode: 'ER-2026-AWRD-00006', eventName: 'Ethiopian VEX National Championship',
    awardCategory: 'Excellence Award', teamName: 'Robo Lions', schoolName: 'Bole Prep',
    eventId: 'evt-3',
  },
  {
    id: 'cert-010', studentName: 'Hiwot Eshetu', programTitle: 'Ethiopian VEX National Championship',
    category: 'Award', issueDate: 'Jun 25, 2026', type: 'award',
    verificationCode: 'ER-2026-AWRD-00007', eventName: 'Ethiopian VEX National Championship',
    awardCategory: 'Engineering Notebook Award', teamName: 'Bot Builders', schoolName: 'Lideta School',
    eventId: 'evt-3',
  },
  {
    id: 'cert-011', studentName: 'Dawit Melaku', programTitle: 'African Robotics Championship',
    category: 'Award', issueDate: 'Jan 20, 2027', type: 'award',
    verificationCode: 'ER-2026-AWRD-00008', eventName: 'African Robotics Championship 2026',
    awardCategory: 'Tournament Champions', teamName: 'Iron Eagles', schoolName: 'AASTU',
    eventId: 'evt-4',
  },
  {
    id: 'cert-012', studentName: 'Frehiwot Gebre', programTitle: 'African Robotics Championship',
    category: 'Award', issueDate: 'Jan 20, 2027', type: 'award',
    verificationCode: 'ER-2026-AWRD-00009', eventName: 'African Robotics Championship 2026',
    awardCategory: 'Judges Award', teamName: 'Tech Titans', schoolName: 'Sandalwood Academy',
    eventId: 'evt-4',
  },
];

// ── Notifications ──
const now = Date.now();
const ms = (h: number) => h * 3600000;
const ISO = (hoursAgo: number) => new Date(now - ms(hoursAgo)).toISOString();

export const MOCK_NOTIFICATIONS: AppNotification[] = [];

// ── Workshops ──
export const MOCK_WORKSHOPS: Workshop[] = [
  {
    id: 'wksp-001',
    title: 'VEX IQ Build & Design Bootcamp',
    description: 'Hands-on workshop where students build a clawbot from scratch and learn gear ratios, drivetrains, and basic block coding.',
    detailedDescription: 'In this intensive 2-day bootcamp, students will assemble a complete VEX IQ Clawbot, learning mechanical design principles like gear ratios, torque vs speed, and drivetrain configurations. They will then program their robots using VEXcode IQ Blocks to complete a series of challenges including object manipulation and autonomous navigation.',
    date: 'July 12-13, 2026',
    time: '9:00 AM — 4:00 PM',
    duration: '2 Days (14 hours)',
    instructor: 'Nebil Mohammed',
    instructorRole: 'Lead Hardware Fabricator',
    instructorImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    location: 'Ethio Robotics Lab — Bole, Addis Ababa',
    category: 'VEX IQ',
    level: 'Beginner',
    capacity: 20,
    enrolled: 14,
    price: 2500,
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800',
    topics: [
      'Clawbot mechanical assembly',
      'Gear ratio fundamentals (speed vs torque)',
      'Drivetrain configurations (tank, H-drive)',
      'VEXcode IQ Blocks programming',
      'Autonomous challenge course navigation',
      'Object manipulation with claws & arms'
    ],
    requirements: ['No prior experience needed', 'Laptop (Windows/Mac)'],
    status: 'upcoming',
  },
  {
    id: 'wksp-002',
    title: 'VEX V5 C++ Programming Intensive',
    description: 'Deep dive into VEX V5 PROS/ C++ programming — PID control, odometry, and autonomous routines for competitive robotics.',
    detailedDescription: 'This intermediate workshop takes students from basic VEX V5 programming to advanced autonomous routines. Learn to implement PID control for precise movement, build odometry-based navigation systems, and write competition-ready autonomous programs. Perfect for teams preparing for national and international VEX competitions.',
    date: 'July 20-22, 2026',
    time: '10:00 AM — 5:00 PM',
    duration: '3 Days (18 hours)',
    instructor: 'Dr. Kidus Gidey',
    instructorRole: 'Chief Engineering Mentor',
    instructorImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    location: 'Ethio Robotics Lab — Bole, Addis Ababa',
    category: 'VEX V5',
    level: 'Intermediate',
    capacity: 15,
    enrolled: 12,
    price: 4000,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800',
    topics: [
      'VEX V5 PROS / C++ setup & workflow',
      'PID control theory & implementation',
      'Odometry and pose tracking',
      'Autonomous routine development',
      'Motor characterization & tuning',
      'Competition strategy & debugging'
    ],
    requirements: ['Completed VEX V5 Fundamentals', 'Laptop with VEXcode PROS installed'],
    status: 'upcoming',
  },
  {
    id: 'wksp-003',
    title: 'Enjoy AI Vision & Autonomous Driving',
    description: 'Build and program an AI-powered autonomous vehicle using OpenCV, PID steering, and real-time object detection.',
    detailedDescription: 'Dive into the world of autonomous vehicles with our Enjoy AI platform. Students will build a micro autonomous car, calibrate cameras, write OpenCV pipelines for lane detection, implement PID-based steering control, and train simple object detection models. The workshop culminates in a head-to-head autonomous race challenge.',
    date: 'August 2, 2026',
    time: '9:00 AM — 6:00 PM',
    duration: '1 Day (8 hours)',
    instructor: 'Selam Berhe',
    instructorRole: 'Director of Curriculum',
    instructorImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
    location: 'AAiT Smart Lab, Addis Ababa University',
    category: 'Enjoy AI',
    level: 'Advanced',
    capacity: 12,
    enrolled: 8,
    price: 3500,
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=800',
    topics: [
      'Autonomous vehicle hardware assembly',
      'Camera calibration & image preprocessing',
      'OpenCV lane detection algorithms',
      'PID steering control implementation',
      'Traffic sign recognition with ML',
      'Head-to-head autonomous race challenge'
    ],
    requirements: ['Python programming experience', 'Basic understanding of AI/ML concepts'],
    status: 'upcoming',
  },
  {
    id: 'wksp-004',
    title: 'Arduino IoT & Electronics Lab',
    description: 'Learn electronics fundamentals and build IoT projects with Arduino Uno, sensors, actuators, and ESP32 connectivity.',
    detailedDescription: 'A comprehensive hands-on workshop covering electronics fundamentals and IoT application development. Starting with basic circuits and Arduino programming, participants will progress to building connected IoT devices using ESP32 modules. Projects include a weather station, smart irrigation controller, and a Bluetooth-controlled robot car.',
    date: 'August 10-12, 2026',
    time: '10:00 AM — 4:00 PM',
    duration: '3 Days (15 hours)',
    instructor: 'Nebil Mohammed',
    instructorRole: 'Lead Hardware Fabricator',
    instructorImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    location: 'Ethio Robotics Lab — Bole, Addis Ababa',
    category: 'Arduino',
    level: 'Beginner',
    capacity: 18,
    enrolled: 18,
    price: 2000,
    image: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?auto=format&fit=crop&q=80&w=800',
    topics: [
      'Electronics fundamentals (Ohm\'s law, circuits)',
      'Arduino IDE & programming basics',
      'Sensor interfacing (ultrasonic, temperature, light)',
      'Actuator control (servos, DC motors, relays)',
      'ESP32 Wi-Fi & Bluetooth connectivity',
      'IoT dashboard development (Blynk / MQTT)'
    ],
    requirements: ['No prior experience needed', 'Laptop (any OS)'],
    status: 'upcoming',
  },
  {
    id: 'wksp-005',
    title: 'STEM Foundations: Robotics for Ages 6-10',
    description: 'Introductory workshop using block-based programming and snap-together robotics kits for young learners.',
    detailedDescription: 'Designed specifically for young learners aged 6-10, this fun and engaging workshop introduces fundamental STEM concepts through play. Using VEX 123 and VEX GO kits, children will learn sequencing, cause-and-effect, simple machines, and basic programming concepts through hands-on building activities and guided challenges.',
    date: 'August 5, 2026',
    time: '9:00 AM — 12:00 PM',
    duration: 'Half Day (3 hours)',
    instructor: 'Selam Berhe',
    instructorRole: 'Director of Curriculum',
    instructorImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
    location: 'Ethio Robotics Lab — Bole, Addis Ababa',
    category: 'STEM',
    level: 'Beginner',
    capacity: 16,
    enrolled: 10,
    price: 800,
    image: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&q=80&w=800',
    topics: [
      'Introduction to robotics & STEM careers',
      'Building with VEX 123 / GO kits',
      'Sequencing & pattern recognition',
      'Simple machines (gears, pulleys, levers)',
      'Block-based programming fundamentals',
      'Mini challenge: robot obstacle course'
    ],
    requirements: ['Age 6-10', 'No prior experience needed', 'Parent/guardian must be present for ages 6-7'],
    status: 'upcoming',
  },
  {
    id: 'wksp-006',
    title: 'Advanced PID & Sensor Fusion Masterclass',
    description: 'Master advanced control systems: cascading PID, sensor fusion with Kalman filters, and state estimation for competitive robots.',
    detailedDescription: 'This masterclass pushes beyond basic PID into advanced control theory. Learn cascading PID loops for complex mechanisms, sensor fusion using Kalman filters for accurate state estimation, and trajectory planning for autonomous movement. Hands-on exercises use VEX V5 hardware and real-time data visualization.',
    date: 'August 17-19, 2026',
    time: '10:00 AM — 5:00 PM',
    duration: '3 Days (18 hours)',
    instructor: 'Dr. Kidus Gidey',
    instructorRole: 'Chief Engineering Mentor',
    instructorImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    location: 'AAiT Smart Lab, Addis Ababa University',
    category: 'VEX V5',
    level: 'Advanced',
    capacity: 10,
    enrolled: 3,
    price: 5000,
    image: 'https://images.unsplash.com/photo-1581090121488-32d4c3f31afb?auto=format&fit=crop&q=80&w=800',
    topics: [
      'Cascading PID control loops',
      'Feedforward control & gain scheduling',
      'Kalman filter implementation for sensor fusion',
      'State estimation with IMU & encoders',
      'Trajectory generation & motion profiling',
      'Real-time data visualization & tuning'
    ],
    requirements: ['VEX V5 C++ Programming Intensive or equivalent', 'Strong math background (algebra + trigonometry)'],
    status: 'upcoming',
  },
];

// ── Tournaments ──
export const MOCK_TOURNAMENTS: Tournament[] = [
  {
    id: 'trn-001', name: 'VEX National Qualifier 2026', date: 'August 5-8, 2026',
    location: 'Addis Ababa Convention Center', status: 'upcoming', category: 'VEX V5',
    maxTeams: 64, registrationDeadline: 'June 30, 2026', prizePool: '250,000 ETB',
    description: 'The premier national qualifier for VEX V5 competitive robotics. Top 8 teams advance to the African Robotics Championship.',
    teams: [
      { id: 't1', name: 'Robo Lions', school: 'Bole Academy', members: 5, wins: 8, losses: 1, score: 1840, rank: 1 },
      { id: 't2', name: 'Byte Warriors', school: 'Lideta STEM Lab', members: 4, wins: 7, losses: 2, score: 1720, rank: 2 },
      { id: 't3', name: 'Circuit Breakers', school: 'Hawassa Tech', members: 5, wins: 6, losses: 3, score: 1650, rank: 3 },
      { id: 't4', name: 'Gear Titans', school: 'Dire Dawa Academy', members: 4, wins: 6, losses: 3, score: 1610, rank: 4 },
      { id: 't5', name: 'Iron Eagles', school: 'Gondar STEM', members: 5, wins: 5, losses: 4, score: 1540, rank: 5 },
      { id: 't6', name: 'Phoenix Bots', school: 'Adama University', members: 6, wins: 5, losses: 4, score: 1510, rank: 6 },
    ],
  },
  {
    id: 'trn-002', name: '3rd African Robotics Championship', date: 'September 20-22, 2026',
    location: 'African Union Hall, Addis Ababa', status: 'upcoming', category: 'VEX V5',
    maxTeams: 128, registrationDeadline: 'August 15, 2026', prizePool: '1,000,000 ETB',
    description: 'The largest robotics competition in Africa. Teams from 15+ countries compete for continental glory.',
    teams: [
      { id: 't7', name: 'Robo Lions', school: 'Bole Academy', members: 5, wins: 0, losses: 0, score: 0 },
      { id: 't8', name: 'Lagos Legends', school: 'Nigeria STEM Hub', members: 5, wins: 0, losses: 0, score: 0 },
    ],
  },
  {
    id: 'trn-003', name: 'Enjoy AI Regional Cup', date: 'May 15, 2026',
    location: 'Ethio Robotics Lab — Bole', status: 'completed', category: 'Enjoy AI',
    maxTeams: 32, registrationDeadline: 'April 30, 2026', prizePool: '80,000 ETB',
    description: 'Autonomous vehicle driving challenge using the Enjoy AI platform. Teams race to complete obstacle courses.',
    streamUrl: 'https://youtube.com/live/example',
    teams: [
      { id: 't9', name: 'Auto Pilots', school: 'CMC Branch', members: 4, wins: 5, losses: 0, score: 2100, rank: 1 },
      { id: 't10', name: 'Vision Squad', school: 'Bole Branch', members: 3, wins: 4, losses: 1, score: 1900, rank: 2 },
      { id: 't11', name: 'Lane Trackers', school: 'Hawassa Lab', members: 4, wins: 3, losses: 2, score: 1650, rank: 3 },
    ],
  },
  {
    id: 'trn-004', name: 'VEX V5 Live Championship — Day 2', date: 'June 19, 2026',
    location: 'Bole Convention Hall, Addis Ababa', status: 'live', category: 'VEX V5',
    maxTeams: 24, registrationDeadline: 'June 10, 2026', prizePool: '150,000 ETB',
    description: 'The second day of the VEX V5 Live Championship. Elimination rounds and grand finals happening now! Catch the live stream.',
    streamUrl: 'https://youtube.com/live/vex-live-day2',
    teams: [
      { id: 't12', name: 'Nebula Bots', school: 'Bole STEM Center', members: 5, wins: 9, losses: 1, score: 2100, rank: 1 },
      { id: 't13', name: 'Titan Robotics', school: 'AASTU University', members: 4, wins: 8, losses: 2, score: 1980, rank: 2 },
      { id: 't14', name: 'Quantum Coders', school: 'Lideta Academy', members: 5, wins: 7, losses: 3, score: 1840, rank: 3 },
      { id: 't15', name: 'Volt Vipers', school: 'CMC Tech Lab', members: 4, wins: 7, losses: 3, score: 1810, rank: 4 },
      { id: 't16', name: 'Mech Mavericks', school: 'Hawassa University', members: 5, wins: 6, losses: 4, score: 1720, rank: 5 },
      { id: 't17', name: 'Cyber Knights', school: 'Gondar STEM Institute', members: 4, wins: 5, losses: 5, score: 1600, rank: 6 },
    ],
  },
];

export const MOCK_MATCHES: MatchResult[] = [
  { id: 'm1', tournamentId: 'trn-003', round: 'Final', team1: 'Auto Pilots', team2: 'Vision Squad', score1: 245, score2: 210, status: 'completed', time: '3:30 PM' },
  { id: 'm2', tournamentId: 'trn-003', round: 'Semi-Final 1', team1: 'Auto Pilots', team2: 'Lane Trackers', score1: 280, score2: 195, status: 'completed', time: '2:00 PM' },
  { id: 'm3', tournamentId: 'trn-003', round: 'Semi-Final 2', team1: 'Vision Squad', team2: 'Speed Demons', score1: 230, score2: 180, status: 'completed', time: '2:30 PM' },
  { id: 'm4', tournamentId: 'trn-001', round: 'Quarter-Final 1', team1: 'Robo Lions', team2: 'Iron Eagles', score1: 0, score2: 0, status: 'scheduled', time: '10:00 AM' },
  { id: 'm5', tournamentId: 'trn-001', round: 'Quarter-Final 2', team1: 'Byte Warriors', team2: 'Phoenix Bots', score1: 0, score2: 0, status: 'scheduled', time: '10:30 AM' },
  { id: 'm6', tournamentId: 'trn-004', round: 'Quarter-Final 1', team1: 'Nebula Bots', team2: 'Cyber Knights', score1: 182, score2: 145, status: 'completed', time: '10:00 AM' },
  { id: 'm7', tournamentId: 'trn-004', round: 'Quarter-Final 2', team1: 'Titan Robotics', team2: 'Mech Mavericks', score1: 195, score2: 170, status: 'completed', time: '10:30 AM' },
  { id: 'm8', tournamentId: 'trn-004', round: 'Semi-Final 1', team1: 'Nebula Bots', team2: 'Volt Vipers', score1: 210, score2: 188, status: 'completed', time: '1:00 PM' },
  { id: 'm9', tournamentId: 'trn-004', round: 'Semi-Final 2', team1: 'Titan Robotics', team2: 'Quantum Coders', score1: 0, score2: 0, status: 'live', time: '2:30 PM' },
  { id: 'm10', tournamentId: 'trn-004', round: 'Grand Final', team1: 'TBD', team2: 'TBD', score1: 0, score2: 0, status: 'scheduled', time: '4:00 PM' },
];

// ── Community Forum ──
export const MOCK_FORUM_POSTS: ForumPost[] = [
  {
    id: 'fp1', author: 'Selam B.', authorRole: 'Pro Student', avatar: '🤖',
    title: 'How to tune PID for straight-line driving on VEX V5?',
    content: 'I\'ve been struggling with my robot drifting left during autonomous. My P value is 0.5 and D is 0.1. Any suggestions for better tuning? The field surface seems to affect it a lot.',
    category: 'Help', timestamp: '3 hours ago', likes: 12,
    tags: ['VEX V5', 'PID', 'Autonomous'],
    replies: [
      { id: 'r1', author: 'Coach Nebil', authorRole: 'Instructor', content: 'Try increasing your D value to 0.3 and adding a small I term (0.01). Also make sure your wheel encoders are calibrated — uneven wheel sizes cause drift.', timestamp: '2 hours ago', likes: 8 },
      { id: 'r2', author: 'Abebe K.', authorRole: 'Student', content: 'I had the same issue! Calibrating the inertial sensor helped me a lot. Also check if your motors have similar friction.', timestamp: '1 hour ago', likes: 4 },
    ],
  },
  {
    id: 'fp2', author: 'Coach Nebil', authorRole: 'Instructor', avatar: '👨‍🏫',
    title: '📢 VEX National Qualifier: Team Registration Guide',
    content: 'All teams planning to compete in the August National Qualifier — here\'s a step-by-step guide for registration, notebook submission, and pit setup requirements. Please read carefully and submit your rosters by June 30th.',
    category: 'Competition', timestamp: '1 day ago', likes: 34, pinned: true,
    tags: ['Competition', 'VEX', 'Registration'],
    replies: [
      { id: 'r3', author: 'Dawit T.', authorRole: 'Student', content: 'Can teams from outside Addis Ababa register online? We\'re a team from Hawassa.', timestamp: '20 hours ago', likes: 2 },
    ],
  },
  {
    id: 'fp3', author: 'Hana M.', authorRole: 'Student', avatar: '⭐',
    title: 'My first robot build — Enjoy AI line follower! 🎉',
    content: 'After 8 weeks in the Enjoy AI program, I finally got my autonomous car to follow the entire track without errors! Used OpenCV color masking and PID steering. So proud of this achievement!',
    category: 'Showcase', timestamp: '2 days ago', likes: 45,
    tags: ['Enjoy AI', 'Showcase', 'OpenCV'],
    replies: [
      { id: 'r4', author: 'Selam B.', authorRole: 'Student', content: 'This is amazing Hana! 🎉 Would love to see a video of it in action!', timestamp: '1 day ago', likes: 6 },
      { id: 'r5', author: 'Dr. Kidus', authorRole: 'Instructor', content: 'Excellent work! You should consider entering the Regional Cup next season.', timestamp: '1 day ago', likes: 9 },
    ],
  },
  {
    id: 'fp4', author: 'Yonas D.', authorRole: 'Student', avatar: '💡',
    title: 'Tutorial: Setting up Arduino with VEX sensors',
    content: 'I wrote a tutorial on how to interface VEX distance sensors with an Arduino Mega using I2C. This is great for custom projects outside the VEX ecosystem. Full code included in the post.',
    category: 'Tutorial', timestamp: '4 days ago', likes: 28,
    tags: ['Arduino', 'Tutorial', 'Sensors'],
    replies: [],
  },
];

// ── Video Courses ──
export const MOCK_VIDEO_COURSES: VideoCourse[] = [
  {
    id: 'vc1', title: 'VEX V5 Competitive Masterclass', description: 'Complete guide to building championship-winning VEX V5 robots.',
    instructor: 'Coach Nebil Mohammed', thumbnail: progImg2, duration: '12 hours',
    category: 'VEX V5', level: 'Advanced', completionPct: 65, rating: 4.8, enrolled: 142,
    lessons: [
      { id: 'l1', title: 'Introduction & Tournament Overview', duration: '25 min', completed: true, locked: false },
      { id: 'l2', title: 'Structural Chassis Design Principles', duration: '40 min', completed: true, locked: false },
      { id: 'l3', title: 'Drivetrain Selection: Tank vs. X-Drive', duration: '35 min', completed: true, locked: false },
      { id: 'l4', title: 'Smart Motor Configuration & Gearing', duration: '45 min', completed: true, locked: false },
      { id: 'l5', title: 'PID Control Loops Deep Dive', duration: '55 min', completed: false, locked: false },
      { id: 'l6', title: 'Odometry & Field Positioning', duration: '50 min', completed: false, locked: false },
      { id: 'l7', title: 'Autonomous Routine Programming', duration: '60 min', completed: false, locked: true },
      { id: 'l8', title: 'Competition Strategy & Alliance Selection', duration: '30 min', completed: false, locked: true },
    ],
  },
  {
    id: 'vc2', title: 'Python for Robotics Beginners', description: 'Learn Python programming through hands-on robotics projects.',
    instructor: 'Selam Berhe', thumbnail: progImg3, duration: '8 hours',
    category: 'Programming', level: 'Beginner', completionPct: 30, rating: 4.6, enrolled: 289,
    lessons: [
      { id: 'l9', title: 'Why Python for Robotics?', duration: '15 min', completed: true, locked: false },
      { id: 'l10', title: 'Variables, Loops & Functions', duration: '40 min', completed: true, locked: false },
      { id: 'l11', title: 'Reading Sensor Data with Python', duration: '35 min', completed: false, locked: false },
      { id: 'l12', title: 'Motor Control Basics', duration: '30 min', completed: false, locked: false },
      { id: 'l13', title: 'Building a Line Follower', duration: '45 min', completed: false, locked: true },
    ],
  },
  {
    id: 'vc3', title: 'Enjoy AI: Computer Vision Essentials', description: 'Master camera-based autonomous driving with OpenCV.',
    instructor: 'Dr. Kidus Gidey', thumbnail: progImg1, duration: '10 hours',
    category: 'Enjoy AI', level: 'Intermediate', completionPct: 0, rating: 4.9, enrolled: 87,
    lessons: [
      { id: 'l14', title: 'Camera Setup & Frame Acquisition', duration: '30 min', completed: false, locked: false },
      { id: 'l15', title: 'Color Space Conversion (HSV)', duration: '35 min', completed: false, locked: false },
      { id: 'l16', title: 'Edge Detection & Contours', duration: '45 min', completed: false, locked: true },
      { id: 'l17', title: 'Lane Detection Algorithm', duration: '55 min', completed: false, locked: true },
      { id: 'l18', title: 'Steering with PID + Vision', duration: '50 min', completed: false, locked: true },
    ],
  },
];

// ── Lab Consultancy ──
export const MOCK_CONSULTANCY_REQUESTS: ConsultancyRequest[] = [
  { id: 'cq1', schoolName: 'Harmony Academy', contactName: 'Ato Bekele T.', email: 'bekele@harmony.edu.et', phone: '+251-911-234-567', labType: 'robotics', budget: '200,000 - 500,000 ETB', studentCapacity: '20-30 students', status: 'in-review', submittedDate: 'Jun 10, 2026', notes: 'Interested in VEX IQ lab setup for middle school program.' },
  { id: 'cq2', schoolName: 'Addis International School', contactName: 'Mrs. Sara W.', email: 'sara@ais.edu.et', phone: '+251-922-345-678', labType: 'full-stem', budget: '500,000+ ETB', studentCapacity: '40+ students', status: 'approved', submittedDate: 'May 25, 2026', notes: 'Full STEM lab with robotics, coding stations, and 3D printing.' },
  { id: 'cq3', schoolName: 'Gondar Technical College', contactName: 'Dr. Mulugeta A.', email: 'mulugeta@gtc.edu.et', phone: '+251-933-456-789', labType: 'electronics', budget: '100,000 - 200,000 ETB', studentCapacity: '15-20 students', status: 'pending', submittedDate: 'Jun 16, 2026', notes: 'Arduino and basic electronics lab for vocational students.' },
];

// ── Referrals ──
export const MOCK_REFERRALS: Referral[] = [
  { id: 'ref1', referrerCode: 'ABEBE-2026', refereeName: 'Selam Berhe', refereeEmail: 'selam@email.com', status: 'rewarded', date: 'Jun 01, 2026', reward: '500 XP + 10% discount' },
  { id: 'ref2', referrerCode: 'ABEBE-2026', refereeName: 'Dawit Tesfaye', refereeEmail: 'dawit@email.com', status: 'enrolled', date: 'Jun 10, 2026', reward: '500 XP + 10% discount' },
  { id: 'ref3', referrerCode: 'ABEBE-2026', refereeName: 'Hana Muluken', refereeEmail: 'hana@email.com', status: 'pending', date: 'Jun 18, 2026', reward: '500 XP + 10% discount' },
];

// ── Leaderboard ──
export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: 'Radiom J.', school: 'Bole Academy', xp: 4850, badges: 12, streak: 28, avatar: '🥇', trend: 'same', program: 'VEX V5' },
  { rank: 2, name: 'Selam B.', school: 'CMC Branch', xp: 4200, badges: 10, streak: 21, avatar: '🥈', trend: 'up', program: 'Enjoy AI' },
  { rank: 3, name: 'Abebe K.', school: 'Bole Branch', xp: 3900, badges: 8, streak: 12, avatar: '🥉', trend: 'up', program: 'VEX V5' },
  { rank: 4, name: 'Yonas D.', school: 'Lideta Lab', xp: 3650, badges: 9, streak: 15, avatar: '🏅', trend: 'down', program: 'Arduino' },
  { rank: 5, name: 'Hana M.', school: 'Hawassa Lab', xp: 3400, badges: 7, streak: 18, avatar: '🏅', trend: 'up', program: 'Enjoy AI' },
  { rank: 6, name: 'Kidus G.', school: 'Dire Dawa', xp: 3100, badges: 6, streak: 9, avatar: '🏅', trend: 'same', program: 'VEX IQ' },
  { rank: 7, name: 'Tigist A.', school: 'Bole Academy', xp: 2850, badges: 5, streak: 7, avatar: '🏅', trend: 'up', program: 'VEX V5' },
  { rank: 8, name: 'Nebil M.', school: 'CMC Branch', xp: 2600, badges: 6, streak: 14, avatar: '🏅', trend: 'down', program: 'VEX V5' },
  { rank: 9, name: 'Samuel T.', school: 'Adama Uni', xp: 2400, badges: 4, streak: 5, avatar: '🏅', trend: 'same', program: 'Arduino' },
  { rank: 10, name: 'Meron F.', school: 'Gondar STEM', xp: 2200, badges: 4, streak: 10, avatar: '🏅', trend: 'up', program: 'VEX IQ' },
];

// ── VEX Competition Portal ──
export const MOCK_VEX_TEAM: VexTeam = {
  id: 'vex-team-user',
  name: 'Robo Lions',
  number: '8899A',
  school: 'Bole Academy',
  location: 'Addis Ababa, Ethiopia',
  members: ['Melkamu A.', 'Abebe K.', 'Selam B.', 'Yonas D.', 'Hana M.'],
  coach: 'Coach Nebil Mohammed',
  bio: 'We are a passionate VEX V5 competitive team from Bole Academy, Addis Ababa. Our team specializes in building fast, reliable robots with advanced autonomous capabilities. We believe in "Encouraging creativity through Competition."',
  established: '2024',
  avatar: '🦁',
  color: '#ed1c24',
};

export const MOCK_VEX_ROBOTS: VexRobot[] = [
  {
    id: 'robot-1',
    name: 'MechWarrior X',
    competition: 'VEX V5 Rapid Relay',
    season: '2025-2026',
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800',
    description: 'Our flagship competition robot built for the Rapid Relay season. Features a high-speed intake, precision flywheel launcher, and an autonomous odometry system.',
    specs: ['High-torque 4-motor X-Drive', 'Flywheel launcher with PID control', 'Inertial sensor odometry', 'Pneumatic expansion system', 'Vision tracking camera'],
    achievements: ['2nd Place — VEX National Qualifier', 'Design Award — Addis Ababa Qualifier'],
    status: 'active',
    drivetrain: 'X-Drive (4 motors)',
    brain: 'V5 Robot Brain',
    weight: '14.2 kg',
  },
  {
    id: 'robot-2',
    name: 'ClawBot Prime',
    competition: 'VEX V5 Over Under',
    season: '2024-2025',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800',
    description: 'A sturdy tank-drive robot built for the Over Under season. Designed for precise triball control with a pneumatically actuated claw and an elevated intake system.',
    specs: ['Tank drive with gear ratio optimization', 'Pneumatic claw with 30 PSI', 'Elevated conveyor intake', 'Autonomous preload scoring', 'LED status indicators'],
    achievements: ['Tournament Champions — Bole Scrimmage', 'Excellence Award — African Robotics Championship'],
    status: 'retired',
    drivetrain: 'Tank Drive (6 motors)',
    brain: 'V5 Robot Brain',
    weight: '13.8 kg',
  },
  {
    id: 'robot-3',
    name: 'Mini Lion',
    competition: 'VEX IQ Slapshot',
    season: '2025-2026',
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=800',
    description: 'Our VEX IQ demonstration robot used for mentoring younger students. Built to showcase gear ratios and basic autonomous programming.',
    specs: ['Snap-together IQ frame', '4-wheel chain drive', 'Gear ratio: 5:1', 'Color sensor line following', 'Block-based autonomous'],
    achievements: ['Mentor Showcase — STEM Fair 2025'],
    status: 'active',
    drivetrain: 'Chain Drive',
    brain: 'IQ Brain',
    weight: '2.1 kg',
  },
];

export const MOCK_VEX_AWARDS: VexAward[] = [
  {
    id: 'award-1',
    name: 'Excellence Award',
    event: 'African Robotics Championship 2026',
    date: 'January 20, 2027',
    category: 'VEX V5',
    description: 'Awarded to the team that exemplifies overall excellence in building a high-quality robotics program.',
    icon: '🏆',
    color: 'from-yellow-400 to-yellow-600',
  },
  {
    id: 'award-2',
    name: 'Tournament Champions',
    event: 'Bole Prep Friendly Scrimmage',
    date: 'June 18, 2026',
    category: 'VEX V5',
    description: 'Won the alliance elimination bracket as tournament champions.',
    icon: '🥇',
    color: 'from-amber-400 to-amber-600',
  },
  {
    id: 'award-3',
    name: 'Design Award',
    event: 'Addis Ababa VEX Qualifier',
    date: 'June 20, 2026',
    category: 'VEX V5',
    description: 'Recognizes a robust and creative robot design process, clearly documented in an engineering notebook.',
    icon: '📐',
    color: 'from-blue-400 to-blue-600',
  },
  {
    id: 'award-4',
    name: 'Robot Skills Champion',
    event: 'VEX National Qualifier 2026',
    date: 'August 5-8, 2026',
    category: 'VEX V5',
    description: 'Highest autonomous and driver skills score combined.',
    icon: '⚡',
    color: 'from-purple-400 to-purple-600',
    upcoming: true,
  },
  {
    id: 'award-5',
    name: 'Sportsmanship Award',
    event: 'Bole Prep Friendly Scrimmage',
    date: 'June 18, 2026',
    category: 'VEX V5',
    description: 'Awarded to the team that demonstrates exemplary attitude, respect, and helpfulness.',
    icon: '🤝',
    color: 'from-green-400 to-green-600',
  },
];

export const MOCK_VEX_NOTEBOOK: VexNotebookEntry[] = [
  {
    id: 'nb-1',
    title: 'Week 1: Chassis Design & Drivetrain Selection',
    date: 'September 5, 2025',
    author: 'Melkamu A.',
    content: 'This week we finalized the chassis design for MechWarrior X. After testing multiple drivetrain configurations, we decided on an X-Drive system for superior maneuverability. The X-Drive allows us to strafe quickly during autonomous periods while maintaining stability during high-speed scoring runs.',
    drawings: [],
    tags: ['Chassis', 'Drivetrain', 'Design'],
  },
  {
    id: 'nb-2',
    title: 'Week 3: Flywheel Prototype v1 Testing',
    date: 'September 19, 2025',
    author: 'Abebe K.',
    content: 'Built the first prototype of the flywheel launcher using a single 200 RPM motor. Initial tests show inconsistent velocity — the triballs are veering left. We need to add a hood angle adjustment mechanism and possibly upgrade to dual flywheels for better stability.',
    drawings: [],
    tags: ['Flywheel', 'Prototype', 'Testing'],
  },
  {
    id: 'nb-3',
    title: 'Week 6: PID Tuning for Autonomous',
    date: 'October 10, 2025',
    author: 'Yonas D.',
    content: 'Spent this week tuning the PID constants for our autonomous routines. P: 0.45, I: 0.02, D: 0.12 gave us the best straight-line performance. We also integrated the inertial sensor for drift correction. The robot can now consistently score 3 triballs in autonomous.',
    drawings: [],
    tags: ['PID', 'Autonomous', 'Programming'],
  },
  {
    id: 'nb-4',
    title: 'Week 10: Competition Prep & Strategy',
    date: 'November 7, 2025',
    author: 'Coach Nebil',
    content: 'Final week before the National Qualifier. We optimized our autonomous routine to score 5 preloads + 2 floor triballs. Alliance strategy focuses on defensive play in the first 15 seconds then switching to scoring in the last 45. Robot weight is 14.2kg — well within limit.',
    drawings: [],
    tags: ['Strategy', 'Competition', 'Optimization'],
  },
];

export const MOCK_VEX_MATCHES: VexMatchRecord[] = [
  {
    id: 'vm-1',
    event: 'Bole Prep Friendly Scrimmage',
    date: 'June 18, 2026',
    round: 'Qualification',
    opponent: 'Tech Titans (Sandalwood Academy)',
    score: '142 - 118',
    result: 'win',
    notes: 'Strong autonomous routine secured early lead. Alliance coordination was excellent.',
  },
  {
    id: 'vm-2',
    event: 'Bole Prep Friendly Scrimmage',
    date: 'June 18, 2026',
    round: 'Semi-Final',
    opponent: 'Mech Warriors (Gondar U)',
    score: '156 - 132',
    result: 'win',
    notes: 'Clutch defensive play in final 10 seconds prevented opponent from tying.',
  },
  {
    id: 'vm-3',
    event: 'Bole Prep Friendly Scrimmage',
    date: 'June 18, 2026',
    round: 'Final',
    opponent: 'Circuit Breakers (Bahr Dar Prep)',
    score: '178 - 165',
    result: 'win',
    notes: 'Tournament Champions! Season-best score. Flywheel performed flawlessly.',
  },
  {
    id: 'vm-4',
    event: 'Addis Ababa VEX Qualifier',
    date: 'May 10, 2026',
    round: 'Qualification',
    opponent: 'Byte Warriors (Lideta STEM)',
    score: '98 - 105',
    result: 'loss',
    notes: 'Autonomous routine failed due to sensor calibration issue. Will recalibrate before next match.',
  },
  {
    id: 'vm-5',
    event: 'Addis Ababa VEX Qualifier',
    date: 'May 10, 2026',
    round: 'Qualification',
    opponent: 'Iron Eagles (AASTU)',
    score: '134 - 120',
    result: 'win',
    notes: 'Good recovery after morning loss. Inertial sensor recalibration fixed drift issue.',
  },
  {
    id: 'vm-6',
    event: 'Addis Ababa VEX Qualifier',
    date: 'May 10, 2026',
    round: 'Quarter-Final',
    opponent: 'Nebula Bots (Bole STEM)',
    score: '112 - 128',
    result: 'loss',
    notes: 'Eliminated in quarter-finals. Need to improve expansion mechanism reliability.',
  },
  {
    id: 'vm-7',
    event: 'VEX National Qualifier 2026',
    date: 'August 5, 2026',
    round: 'Qualification',
    opponent: 'Robo Lions (Bole Academy)',
    score: '0 - 0',
    result: 'upcoming',
    notes: 'First match of Nationals. Robot has been fully rebuilt and tested.',
  },
];

// ── Analytics ──
export const MOCK_ANALYTICS: AnalyticsData = {
  monthlyRevenue: [
    { month: 'Jan', amount: 420000 }, { month: 'Feb', amount: 510000 }, { month: 'Mar', amount: 580000 },
    { month: 'Apr', amount: 650000 }, { month: 'May', amount: 720000 }, { month: 'Jun', amount: 890000 },
  ],
  enrollmentTrend: [
    { month: 'Jan', count: 45 }, { month: 'Feb', count: 62 }, { month: 'Mar', count: 78 },
    { month: 'Apr', count: 95 }, { month: 'May', count: 112 }, { month: 'Jun', count: 148 },
  ],
  programDistribution: [
    { program: 'VEX V5', count: 85, color: '#2563EB' }, { program: 'VEX IQ', count: 120, color: '#10b981' },
    { program: 'Enjoy AI', count: 65, color: '#f59e0b' }, { program: 'Python', count: 95, color: '#8b5cf6' },
    { program: 'C++', count: 40, color: '#ef4444' }, { program: 'Web Dev', count: 55, color: '#06b6d4' },
  ],
  topMetrics: [
    { label: 'Monthly Revenue', value: '890,000 ETB', change: '+23.6%', trend: 'up' },
    { label: 'Active Students', value: '460', change: '+32.1%', trend: 'up' },
    { label: 'Retention Rate', value: '87.5%', change: '+4.2%', trend: 'up' },
    { label: 'Avg. Revenue / Student', value: '3,420 ETB', change: '-1.8%', trend: 'down' },
  ],
  recentTransactions: [
    { id: 'tx1', student: 'Selam B.', amount: 3500, type: 'Course Enrollment', date: 'Jun 18, 2026', status: 'completed' },
    { id: 'tx2', student: 'Yonas D.', amount: 6500, type: 'Store Purchase', date: 'Jun 17, 2026', status: 'completed' },
    { id: 'tx3', student: 'Hana M.', amount: 3000, type: 'Subscription — Pro', date: 'Jun 17, 2026', status: 'completed' },
    { id: 'tx4', student: 'Harmony Academy', amount: 250000, type: 'Lab Consultancy', date: 'Jun 15, 2026', status: 'pending' },
    { id: 'tx5', student: 'Dawit T.', amount: 4000, type: 'Competition Fee', date: 'Jun 14, 2026', status: 'completed' },
    { id: 'tx6', student: 'Kidus G.', amount: 1500, type: 'Subscription — Explorer', date: 'Jun 13, 2026', status: 'completed' },
  ],
};
