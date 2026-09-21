// All site copy lives here. Sourced from the resume (resume (3).pdf) — edit freely.

export const profile = {
  name: 'Himank Singhvi',
  firstName: 'Himank',
  lastName: 'Singhvi',
  email: 'himank.singhvi@students.iiit.ac.in',
  github: 'https://github.com/manian1909',
  linkedin: 'https://www.linkedin.com/in/Himank-Singhvi',
  resume: '/Himank-Singhvi-Resume.pdf',
  intro:
    'CS student at IIIT Hyderabad. I build backend systems, ML models and autonomous robots, and I like writing the hard parts from scratch so I actually understand how they work.',
  offline: 'Away from the keyboard: singing, math, physics, cooking and gardening.',
  // Shown as a pill in the hero. Set to '' to hide it.
  availability: 'Open to internships and full-time roles from 2027',
}

export const status = [
  { k: 'Just finished', v: 'SDE intern at Chubb', sub: 'Jun – Jul 2026' },
  { k: 'Currently', v: 'Leading an autonomous drone project', sub: 'ROS2 · Gazebo · RL' },
  { k: 'Graduating', v: 'B.Tech CSE, IIIT Hyderabad', sub: 'Class of 2027' },
]

// Diagram kinds are rendered by components/Diagrams.jsx.
export const featured = [
  {
    id: 'chubb',
    kind: 'Internship',
    org: 'Chubb',
    when: 'Jun – Jul 2026',
    title: 'Rebuilding a legacy Java app for the cloud',
    summary:
      'Chubb’s “Third Party” application was an older Java application. I modernized it into a Spring Boot microservice and set it up to deploy on Azure Kubernetes Service (AKS), with an automated release pipeline in front of it.',
    points: [
      'Rebuilt the app as a Spring Boot microservice that deploys on AKS.',
      'Built a Jenkins CI/CD pipeline that runs build, test and deploy automatically, cutting the manual work of a release.',
      'Configured Dynaflow to orchestrate the pipeline build, making data flow between services more reliable.',
    ],
    stack: ['Java', 'Spring Boot', 'Jenkins', 'Kubernetes (AKS)', 'Dynaflow'],
    diagram: { type: 'pipeline' },
  },
  {
    id: 'zigsaw',
    kind: 'Collaboration',
    org: 'Zigsaw',
    when: '2026',
    href: 'https://zigsaw.in/',
    title: 'Picking the top 10 candidates from a huge pool',
    summary:
      'Recruiters can’t read every resume. I designed a retrieval-augmented pipeline that narrows a large pile of candidates down to a short list worth reading, in two passes: a fast search, then a careful one.',
    points: [
      'Semantic search over vector embeddings pulls the 100 resumes closest in meaning to a job description.',
      'An LLM reranking agent then reads that shortlist together, weighs the finer details, and picks the top 10.',
    ],
    stack: ['RAG', 'Vector embeddings', 'Semantic search', 'LLM reranking'],
    diagram: { type: 'zigsaw' },
  },
  {
    id: 'drone',
    kind: 'Project lead',
    org: 'under Harikumar Kandath',
    when: '2026 – now',
    title: 'A drone that chases another drone',
    summary:
      'I lead a team building a drone that uses LiDAR, a camera and radar to find a moving target drone and autonomously chase it. Right now it runs in a ROS2 / Gazebo simulation with two drones.',
    points: [
      'Vision-based target detection to find the other drone.',
      'A reinforcement-learning pursuit policy that learns how to chase a moving target.',
      'I also manage project logistics, component integration and system planning.',
    ],
    stack: ['ROS2', 'Gazebo', 'Reinforcement learning', 'LiDAR', 'Computer vision'],
    diagram: {
      type: 'flow',
      steps: [
        { title: 'Sensors', items: ['LiDAR', 'Camera', 'Radar'] },
        { title: 'Target detection', sub: 'vision-based' },
        { title: 'Pursuit policy', sub: 'reinforcement learning' },
        { title: 'Chaser drone', sub: 'simulated in ROS2 + Gazebo', accent: true },
      ],
    },
  },
  {
    id: 'transformer',
    kind: 'Project',
    org: 'Python · NumPy · PyTorch',
    when: '',
    title: 'A Transformer, built from scratch',
    summary:
      'The Transformer is the architecture behind modern language models. I wrote the core pieces by hand, including the engine that computes gradients, instead of calling a library, to understand how it really learns.',
    points: [
      'Multi-head self-attention, positional encoding and layer normalization, implemented from first principles into an encoder–decoder model.',
      'A custom automatic differentiation engine and training loop, with gradients checked for correctness.',
      'Confirmed it converges on a sequence-to-sequence task.',
    ],
    stack: ['Python', 'NumPy', 'PyTorch'],
    diagram: { type: 'attention' },
  },
  {
    id: 'nfs',
    kind: 'Project',
    org: 'C · Networking · Concurrency',
    when: '',
    title: 'A network file system',
    summary:
      'A distributed file system: many clients read and write files stored across machines. It handles file and metadata operations and is built to keep working when parts fail.',
    points: [
      'Concurrency control so only one writer touches a file at a time, using mutex locks.',
      'Tries, an LRU cache, asynchronous writes and logging.',
      'Real-time audio streaming.',
    ],
    stack: ['C', 'Networking', 'Concurrency', 'Git'],
    diagram: { type: 'nfs' },
  },
]

export const more = [
  {
    title: 'A Unix-like shell',
    meta: 'C · POSIX API',
    text: 'A command-line shell written in C: built-in commands, aliases, I/O redirection, foreground and background processes, and man pages fetched online.',
  },
  {
    title: 'BoardGameiac',
    meta: 'Internship · 2025',
    text: 'Full-stack web app: frontend, admin page, backend APIs and user permissions. Runs on AWS (EC2 server, RDS PostgreSQL) and integrates with the Pet Pooja app.',
  },
  {
    title: 'Future Leaders',
    meta: 'Internship · 2024',
    text: 'Designed the frontend (admin page, feed, gamification) and built the backend APIs and database schema for user management and content delivery.',
  },
]

export const experience = [
  {
    when: 'Jun – Jul 2026',
    org: 'Chubb',
    role: 'Software Development Engineering Intern',
    note: 'Legacy Java app → Spring Boot on AKS, Jenkins CI/CD.',
    target: 'chubb',
  },
  {
    when: '2026 – now',
    org: 'Student Alumni Connect Cell',
    role: 'Head of Logistics',
    note: 'Run the logistics for talks and networking sessions between startup founders and students.',
  },
  {
    when: '2026',
    org: 'Zigsaw',
    role: 'Collaborator, under Vaibhav Chouhan',
    note: 'RAG pipeline that shortlists candidates from resumes.',
    target: 'zigsaw',
  },
  {
    when: '2025',
    org: 'BoardGameiac',
    role: 'Software Developer Intern, under Kartik Sanghavi',
    note: 'Full-stack app on AWS, integrated with Pet Pooja.',
  },
  {
    when: '2024',
    org: 'Future Leaders',
    role: 'Software Developer Intern, under Aparna Renganathan',
    note: 'Admin page, feed, gamification and backend APIs.',
  },
]

export const education = {
  school: 'IIIT Hyderabad',
  degree: 'B.Tech in Computer Science Engineering',
  when: '2023 – 2027',
  gpa: '7.58',
  courses: [
    'Operating Systems & Networks',
    'Data Structures & Algorithms',
    'Computer Systems Organization',
    'Design & Analysis of Software Systems',
    'Statistical Methods in AI',
    'Machine, Data & Learning',
    'Data & Applications',
    'Computer Programming',
  ],
}

export const ncsc = {
  title: 'National-level Gold Medal',
  org: 'National Children’s Science Congress (NCSC)',
  text: 'NCSC is India’s national science programme for children aged 10 to 17, run by the Department of Science and Technology since 1993. Young scientists take a science project on a local problem through district and state rounds, and the best go on to the national congress. I won a gold medal at the national level.',
  link: 'https://www.n-csc.in/',
}

export const awards = [
  { figure: '426', label: 'JEE Main', detail: 'All India Rank' },
  { figure: '2717', label: 'JEE Advanced', detail: 'All India Rank' },
  { figure: '8', label: 'STSE Class 12', detail: 'Rank' },
  { figure: '95', label: 'STSE Class 10', detail: 'Rank' },
  { figure: 'Dean’s List', label: 'Spring 2026', detail: 'IIIT Hyderabad', word: true },
]

export const skills = [
  { group: 'Languages', items: ['C', 'C++', 'Java', 'Python', 'JavaScript', 'Shell scripting', 'SQL', 'HTML', 'CSS'] },
  {
    group: 'Frameworks & libraries',
    items: ['Spring Boot', 'React Native', 'Next.js', 'Node.js', 'Tailwind CSS', 'Flask', 'NumPy', 'PyTorch'],
  },
  {
    group: 'Databases & tools',
    items: ['MongoDB', 'MySQL', 'PostgreSQL', 'Kafka', 'Jenkins', 'Kubernetes', 'Git', 'n8n', 'RAG'],
  },
]

export const hobbies = [
  { id: 'singing', title: 'Singing', text: 'Voice on, world off. My favorite way to reset.' },
  { id: 'math', title: 'Math', text: 'Patterns, proofs and the satisfaction of a clean solution.' },
  { id: 'physics', title: 'Physics', text: 'Why things move, orbit and glow. The original first-principles thinking.' },
  { id: 'cooking', title: 'Cooking', text: 'Ingredients in, something good out. Debugging happens with a spoon.' },
  { id: 'gardening', title: 'Gardening', text: 'Slow, patient systems that reward you with something alive.' },
]
